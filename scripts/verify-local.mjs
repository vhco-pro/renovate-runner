import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { createRunPlan } from '../.github/actions/renovate/scripts/policy.mjs';
import { prepareStorage } from '../.github/actions/renovate/scripts/storage.mjs';

function nativeImage() {
  const path = resolve(import.meta.dir, '../.github/actions/renovate/action.yml');
  const action = Bun.YAML.parse(readFileSync(path, 'utf8'));
  const image = action.runs.steps.find((step) => step.uses?.startsWith('renovatebot/github-action@')).with['renovate-image'];
  if (!/^ghcr\.io\/renovatebot\/renovate:\d+\.\d+\.\d+-full@sha256:[a-f0-9]{64}$/.test(image)) {
    throw new Error('Expected the pinned official full image');
  }
  return image;
}

/** Native fixture verification. It never receives a GitHub token or mounts real repositories. */
export function verifyLocal() {
  const engine = process.env.CONTAINER_ENGINE ?? 'docker';
  if (!['docker', 'podman'].includes(engine)) throw new Error('Use a local Docker or Podman engine');
  const engineCommand = engine === 'podman' ? ['podman', '--remote=false'] : ['docker'];
  const childEnv = { PATH: process.env.PATH, HOME: process.env.HOME, LANG: 'C.UTF-8' };
  const execute = (command, env = childEnv) => {
    const result = Bun.spawnSync(command, { env, stdout: 'pipe', stderr: 'pipe', timeout: 120_000 });
    if (result.error) throw result.error;
    return { code: result.exitCode, signal: result.signalCode, stdout: result.stdout.toString(), stderr: result.stderr.toString() };
  };
  const checked = (command, env) => {
    const result = execute(command, env);
    if (result.code !== 0) throw new Error(`Native fixture command failed\n${result.stdout}\n${result.stderr}`);
    return result.stdout.trim();
  };

  const root = resolve(import.meta.dir, '..');
  const image = nativeImage();
  const digestReference = image.replace(/:[^/:]+(?=@sha256:)/, '');
  checked([...engineCommand, 'image', 'inspect', digestReference]);
  const run = (args) => checked([...engineCommand, 'run', '--rm', '--network', 'none', ...args]);
  const uid = Number(run(['--entrypoint', 'id', digestReference, '-u']));
  const gid = Number(run(['--entrypoint', 'id', digestReference, '-g']));
  if (!Number.isSafeInteger(uid) || uid <= 0 || !Number.isSafeInteger(gid) || gid < 0) {
    throw new Error('Pinned image must supply a non-root runtime identity');
  }

  const directory = mkdtempSync(resolve(tmpdir(), 'vhco-renovate-native-'));
  let privateData, globalFile;
  const initialize = () => {
    ({workDirectory: privateData, configFile: globalFile} = prepareStorage(directory, {}));
    const fixture = resolve(privateData, 'fixture');
    cpSync(resolve(root, 'tests/fixtures/native/repository'), fixture, { recursive: true });
    mkdirSync(resolve(fixture, '.github/actions/renovate'), { recursive: true });
    mkdirSync(resolve(fixture, 'scripts'));
    cpSync(resolve(root, '.github/actions/renovate/action.yml'), resolve(fixture, '.github/actions/renovate/action.yml'));
    cpSync(resolve(root, 'scripts/check-workflows.mjs'), resolve(fixture, 'scripts/check-workflows.mjs'));
    const fixtureConfig = JSON.parse(readFileSync(resolve(fixture, 'renovate.json'), 'utf8'));
    const repositoryConfig = JSON.parse(readFileSync(resolve(root, 'renovate.json'), 'utf8'));
    fixtureConfig.customManagers.push(...repositoryConfig.customManagers);
    writeFileSync(resolve(fixture, 'renovate.json'), JSON.stringify(fixtureConfig));
    cpSync(resolve(root, 'tests/fixtures/native/inventory.mjs'), resolve(privateData, 'inventory.mjs'));
    cpSync(resolve(root, '.github/actions/renovate/scripts/renovate-command.sh'), resolve(privateData, 'renovate-command.sh'));
    cpSync(resolve(root, 'renovate.json'), resolve(privateData, 'self-renovate.json'));
    const gitEnv = {
      PATH: process.env.PATH, HOME: directory, LANG: 'C.UTF-8',
      GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1', GIT_TERMINAL_PROMPT: '0',
    };
    checked(['git', 'init', '--initial-branch=main', fixture], gitEnv);
    checked(['git', '-C', fixture, 'add', '.'], gitEnv);
    checked(['git', '-C', fixture, '-c', 'user.name=Synthetic Fixture', '-c', 'user.email=fixture@example.invalid',
      'commit', '-m', 'Synthetic extraction fixture'], gitEnv);

    const sha = 'a'.repeat(40);
    const global = createRunPlan({
      policy: { organization: 'example-org', repositories: ['example-org/fixture'] },
      context: {
        callerRepository: 'example-org/caller', callerRef: 'refs/heads/main', callerSha: sha,
        callerWorkflowRef: 'example-org/caller/.github/workflows/manual.yml@refs/heads/main',
        event: 'workflow_dispatch', implementationRepository: 'vhco-pro/renovate-runner',
        implementationWorkflow: '.github/workflows/renovate.yml', implementationSha: sha,
        implementationHead: sha, policyHead: sha,
      },
    }).config;
    writeFileSync(globalFile, JSON.stringify(global), { mode: 0o600 });
    writeFileSync(resolve(privateData, 'invalid.json'), JSON.stringify({ badOption: true }), { mode: 0o600 });
  };
  const ownedNames = new Set();
  let ownershipChanged = false;
  const container = (entrypoint, args, env = {}) => {
    const name = `vhco-renovate-native-${randomUUID()}`;
    const flags = [...engineCommand, 'run', '--rm', '--name', name,
      '--label', 'vhco.verification=renovate-native', '--network', 'none', '--user', `${uid}:${gid}`];
    // Podman's :U changes only this owned fixture volume. A custom keep-id
    // mapping can require a copy of the entire full image's filesystem.
    if (engine === 'podman') flags.push('--security-opt', 'label=disable');
    flags.push('--volume', `${privateData}:/work:${engine === 'podman' ? 'rw,U' : 'rw'}`,
      '--volume', `${globalFile}:/global.json:ro`, '--workdir', '/work/fixture',
      '--env', 'NO_COLOR=1', '--env', 'CHECKPOINT_DISABLE=1');
    for (const [key, value] of Object.entries(env)) flags.push('--env', `${key}=${value}`);
    flags.push('--entrypoint', entrypoint, digestReference, ...args);
    ownedNames.add(name);
    const result = execute(flags);
    // A normal --rm run has completed removal before returning. On abnormal
    // termination, retain the name for the owned cleanup in finally.
    if (!result.signal && result.code !== null && result.code !== undefined) ownedNames.delete(name);
    return result;
  };

  try {
    initialize();
    if (engine === 'docker') {
      ownershipChanged = true;
      checked(['sudo', 'chown', '-R', '--no-dereference', `${uid}:${gid}`, '--', privateData, globalFile]);
    } else {
      checked([...engineCommand, 'unshare', 'chown', `${uid}:${gid}`, '--', globalFile]);
    }
    const inventory = container('node', ['/work/inventory.mjs']);
    if (inventory.code !== 0) throw new Error(`Inventory failed\n${inventory.stderr}`);
    const report = JSON.parse(inventory.stdout.trim());
    // The official action stats its config on the host before binding it.
    // The image-owned child reproduces the old EACCES boundary as a control.
    let oldError;
    try { statSync(resolve(privateData, 'self-renovate.json')); } catch (error) { oldError = error.code; }
    report.oldConfigParentRejected = oldError === 'EACCES';
    report.hostConfigStat = statSync(globalFile).isFile();
    const configRead = container('node', ['-e', 'const c=JSON.parse(require("fs").readFileSync("/global.json","utf8")); process.exit(c.platform === "github" ? 0 : 1)']);
    report.imageConfigRead = configRead.code === 0;
    const valid = container('renovate-config-validator', ['--strict', '/global.json']);
    const invalid = container('renovate-config-validator', ['--strict', '/work/invalid.json']);
    report.validConfiguration = valid.code === 0 && valid.stdout.includes('Config validated successfully');
    report.invalidConfigurationRejected = invalid.code !== 0 && `${invalid.stdout}${invalid.stderr}`.includes('badOption');
    if (!report.validConfiguration) throw new Error(`Native configuration rejected\n${valid.stdout}\n${valid.stderr}`);
    const selfConfiguration = container('renovate-config-validator', ['--strict', '--no-global', '/work/self-renovate.json']);
    report.selfConfigurationValid = selfConfiguration.code === 0;
    if (!report.selfConfigurationValid) throw new Error(`Repository update policy rejected\n${selfConfiguration.stdout}\n${selfConfiguration.stderr}`);

    const extraction = container('renovate', ['--platform=local', '--dry-run=extract'], {
      LOG_FORMAT: 'json', LOG_LEVEL: 'info', RENOVATE_BINARY_SOURCE: 'global', RENOVATE_EXIT_CODE_FOR_ERRORS: 'true',
    });
    if (extraction.code !== 0) throw new Error(`Extraction failed\n${extraction.stdout}\n${extraction.stderr}`);
    const records = extraction.stdout.split('\n').filter((line) => line.startsWith('{')).map((line) => JSON.parse(line));
    report.extraction = records.find((record) => record.msg === 'Dependency extraction complete')?.stats;
    if (!report.extraction) throw new Error(`Native extraction stats missing\n${extraction.stdout}`);

    const direct = container('renovate', ['--platform=invalid-fixture']);
    const quiet = container('/work/renovate-command.sh', ['--platform=invalid-fixture']);
    report.nativeOutputSuppressed = direct.code !== 0 && direct.stdout.length + direct.stderr.length > 0
      && quiet.code === direct.code && quiet.stdout === '' && quiet.stderr === '';
    report.image = image;
    return report;
  } finally {
    for (const name of ownedNames) checked([...engineCommand, 'rm', '--force', name]);
    if (ownershipChanged) checked(['sudo', 'chown', '-R', '--no-dereference', `${process.getuid()}:${process.getgid()}`, '--', privateData, globalFile]);
    if (engine === 'podman' && existsSync(directory)) {
      checked([...engineCommand, 'unshare', 'chown', '-R', '--no-dereference', '0:0', '--', directory]);
    }
    rmSync(directory, { recursive: true });
  }
}

if (import.meta.main) {
  try {
    if (process.argv.length === 3 && process.argv[2] === '--pull-only') {
      const engine = process.env.CONTAINER_ENGINE ?? 'docker';
      if (!['docker', 'podman'].includes(engine)) throw new Error('Use a local Docker or Podman engine');
      console.error('› Checking: downloading the pinned native verification image');
      const command = engine === 'podman' ? ['podman', '--remote=false'] : ['docker'];
      const result = Bun.spawnSync([...command, 'pull', nativeImage()], {
        env: { PATH: process.env.PATH, HOME: process.env.HOME, LANG: 'C.UTF-8' },
        stdout: 'inherit', stderr: 'inherit', timeout: 900_000,
      });
      if (result.exitCode !== 0 || result.signalCode) throw new Error('Native image download failed');
    } else if (process.argv.length === 2) {
      console.log(JSON.stringify(verifyLocal(), null, 2));
    } else {
      throw new Error('Usage: verify-local.mjs [--pull-only]');
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
