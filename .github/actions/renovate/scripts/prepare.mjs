import { execFileSync } from 'node:child_process';
import { appendFileSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRunPlan } from './policy.mjs';

const commandEnv = {
  PATH: process.env.PATH,
  HOME: process.env.HOME,
  LANG: 'C.UTF-8',
  GIT_CONFIG_GLOBAL: '/dev/null',
  GIT_CONFIG_NOSYSTEM: '1',
  GIT_TERMINAL_PROMPT: '0',
};
const run = (command, args) => execFileSync(command, args, {
  env: commandEnv, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
}).trim();

try {
  const action = Bun.YAML.parse(readFileSync(resolve(import.meta.dir, '../action.yml'), 'utf8'));
  const image = action.runs.steps.find((step) => step.uses?.startsWith('renovatebot/github-action@'))?.with?.['renovate-image'];
  if (!/^ghcr\.io\/renovatebot\/renovate:\d+\.\d+\.\d+-full@sha256:[a-f0-9]{64}$/.test(image)) {
    throw new Error('Invalid pinned runtime');
  }
  const workspace = process.env.GITHUB_WORKSPACE;
  const runnerTemp = process.env.RUNNER_TEMP;
  const output = process.env.GITHUB_OUTPUT;
  if (!workspace || !runnerTemp || !output) throw new Error('Missing runner context');
  const policyDirectory = resolve(workspace, '_vhco-policy');
  const implementationDirectory = resolve(workspace, '_vhco-runner');
  const plan = createRunPlan({
    policy: JSON.parse(readFileSync(resolve(policyDirectory, 'config/targets.json'), 'utf8')),
    selected: process.env.SELECTED_REPOSITORIES ?? '',
    mode: process.env.RUN_MODE ?? 'full',
    context: {
      callerRepository: process.env.CALLER_REPOSITORY,
      callerRef: process.env.CALLER_REF,
      callerSha: process.env.CALLER_SHA,
      callerWorkflowRef: process.env.CALLER_WORKFLOW_REF,
      event: process.env.CALLER_EVENT,
      implementationRepository: process.env.IMPLEMENTATION_REPOSITORY,
      implementationWorkflow: process.env.IMPLEMENTATION_WORKFLOW,
      implementationSha: process.env.IMPLEMENTATION_SHA,
      policyHead: run('git', ['-C', policyDirectory, 'rev-parse', 'HEAD']),
      implementationHead: run('git', ['-C', implementationDirectory, 'rev-parse', 'HEAD']),
      debug: process.env.RUNNER_DEBUG ?? '',
      stepDebug: process.env.ACTIONS_STEP_DEBUG ?? '',
    },
  });

  const uid = run('docker', ['run', '--rm', '--network', 'none', '--entrypoint', 'id', image, '-u']);
  const gid = run('docker', ['run', '--rm', '--network', 'none', '--entrypoint', 'id', image, '-g']);
  if (!/^[1-9][0-9]*$/.test(uid) || !/^[0-9]+$/.test(gid)) throw new Error('Invalid non-root image identity');
  const directory = mkdtempSync(resolve(runnerTemp, 'vhco-renovate-'));
  appendFileSync(output, `private-dir=${directory}\n`);
  const configFile = resolve(directory, 'renovate.json');
  writeFileSync(configFile, `${JSON.stringify(plan.config, null, 2)}\n`, { mode: 0o600 });
  run('chmod', ['0700', directory]);
  run('sudo', ['chown', '-R', '--no-dereference', `${uid}:${gid}`, '--', directory]);
  appendFileSync(output, [
    `organization=${plan.organization}`,
    `repositories=${plan.repositoryNames.join(',')}`,
    `config-file=${configFile}`,
    `docker-user=${uid}:${gid}`,
    '',
  ].join('\n'));
  console.log('✓ Passed: runner preflight');
} catch {
  console.error('✗ Failed: runner preflight');
  process.exitCode = 1;
}
