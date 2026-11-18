import { describe, expect, test } from 'bun:test';
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

const read = (path) => Bun.YAML.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));
const pinned = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_./-]+)?@[a-f0-9]{40}$/;

test('workflow checking refuses a mismatched installed actionlint before accepting its result', () => {
  const directory = mkdtempSync(resolve(tmpdir(), 'vhco-actionlint-version-'));
  try {
    const command = resolve(directory, 'actionlint');
    writeFileSync(command, '#!/bin/sh\nprintf "v0.0.0\\n"\n');
    chmodSync(command, 0o700);
    const result = Bun.spawnSync([process.execPath, 'scripts/check-workflows.mjs'], {
      env: { PATH: `${directory}:/usr/bin:/bin`, HOME: directory }, stdout: 'pipe', stderr: 'pipe',
    });
    expect(result.exitCode).not.toBe(0);
    expect(result.stderr.toString()).toContain('matching the pinned workflow-check image');
  } finally {
    rmSync(directory, { recursive: true });
  }
});

describe('central callers', () => {
  test('scheduled and manual entries call the same reviewed reusable workflow', () => {
    const scheduled = read('.github/workflows/schedule.yml');
    const manual = read('.github/workflows/manual.yml');
    for (const caller of [scheduled, manual]) {
      expect(caller.permissions).toEqual({ contents: 'read' });
      expect(caller.jobs.renovate.uses).toBe('./.github/workflows/renovate.yml');
      expect(caller.jobs.renovate.with.environment).toBe('renovate');
      expect(caller.jobs.renovate.with['client-id']).toBe('${{ vars.RENOVATE_APP_CLIENT_ID }}');
      expect(caller.jobs.renovate.secrets).toEqual({
        RENOVATE_APP_PRIVATE_KEY: '${{ secrets.RENOVATE_APP_PRIVATE_KEY }}',
      });
    }
    expect(scheduled.jobs.renovate.if).toBe("${{ vars.RENOVATE_ENABLED == 'true' }}");
    expect(scheduled.jobs.renovate.with.mode).toBe('write');
    expect(scheduled.on.schedule).toHaveLength(1);
    expect(scheduled.on.schedule[0].cron).toBe('23 5,17 * * *');
    expect(manual.on.workflow_dispatch.inputs.mode.options).toEqual(['full', 'write']);
    expect(manual.on.workflow_dispatch.inputs.mode.default).toBe('full');
  });
});

test('the generic external example matches the reusable workflow interface', () => {
  const example = read('examples/external/renovate.yml');
  const workflow = read('.github/workflows/renovate.yml');
  const caller = example.jobs.renovate;
  expect(caller.uses).toBe('vhco-pro/renovate-runner/.github/workflows/renovate.yml@FULL_COMMIT_SHA');
  expect(example.permissions).toEqual({ contents: 'read' });
  expect(example.on).toHaveProperty('workflow_dispatch');
  for (const [name, value] of Object.entries(caller.with)) {
    expect(workflow.on.workflow_call.inputs).toHaveProperty(name);
    expect(typeof value).toBe(workflow.on.workflow_call.inputs[name].type);
  }
  for (const [name, input] of Object.entries(workflow.on.workflow_call.inputs)) {
    if (input.required) expect(caller.with).toHaveProperty(name);
  }
  expect(caller.with.mode).toBe('full');
  expect(caller.secrets).toEqual({
    RENOVATE_APP_PRIVATE_KEY: '${{ secrets.RENOVATE_APP_PRIVATE_KEY }}',
  });
  expect(workflow.on.workflow_call.secrets).toEqual({
    RENOVATE_APP_PRIVATE_KEY: {
      description: 'App key supplied by the main-only environment.',
      required: true,
    },
  });
  const policy = JSON.parse(readFileSync(new URL('../examples/external/config/targets.json', import.meta.url), 'utf8'));
  expect(policy).toEqual({ organization: 'example-org', repositories: ['example-org/example-repository'] });
});

describe('defining workflow source and credential boundary', () => {
  test('checks caller and implementation heads immediately before the local helper', () => {
    const workflow = read('.github/workflows/renovate.yml');
    expect(workflow.permissions).toEqual({ contents: 'read' });
    const job = workflow.jobs.renovate;
    expect(job['runs-on']).toBe('ubuntu-24.04');
    expect(job['timeout-minutes']).toBeLessThan(60);
    expect(job.environment).toBe('${{ inputs.environment }}');
    expect(job.concurrency).toEqual({
      group: 'renovate-${{ github.repository_owner }}',
      queue: 'max',
      'cancel-in-progress': false,
    });
    const checkouts = job.steps.filter((step) => step.uses?.startsWith('actions/checkout@'));
    expect(checkouts).toHaveLength(2);
    expect(checkouts[0].with).toMatchObject({
      repository: '${{ github.repository }}', ref: '${{ github.sha }}',
      path: '_vhco-policy', 'persist-credentials': false,
    });
    expect(checkouts[1].with).toMatchObject({
      repository: '${{ job.workflow_repository }}', ref: '${{ job.workflow_sha }}',
      path: '_vhco-runner', 'persist-credentials': false,
    });
    const helperIndex = job.steps.findIndex((step) => step.uses === './_vhco-runner/.github/actions/renovate');
    expect(helperIndex).toBeGreaterThan(0);
    const guard = job.steps[helperIndex - 1];
    expect(guard.run).toContain('git -C _vhco-policy rev-parse HEAD');
    expect(guard.run).toContain('git -C _vhco-runner rev-parse HEAD');
    expect(guard.env).toEqual({
      CALLER_SHA: '${{ github.sha }}', IMPLEMENTATION_SHA: '${{ job.workflow_sha }}',
    });
    expect(job.steps[helperIndex].with['private-key']).toBe('${{ secrets.RENOVATE_APP_PRIVATE_KEY }}');
  });

  test('validates selection and debug mode before requesting an explicitly scoped token', () => {
    const action = read('.github/actions/renovate/action.yml');
    expect(action.runs.using).toBe('composite');
    const steps = action.runs.steps;
    const tokenIndex = steps.findIndex((step) => step.uses?.startsWith('actions/create-github-app-token@'));
    expect(tokenIndex).toBeGreaterThan(0);
    expect(steps.slice(0, tokenIndex).some((step) => step.run?.includes('prepare.mjs'))).toBe(true);
    expect(steps[tokenIndex].with).toMatchObject({
      owner: '${{ steps.prepare.outputs.organization }}',
      repositories: '${{ steps.prepare.outputs.repositories }}',
      'permission-administration': 'read',
      'permission-vulnerability-alerts': 'read',
      'permission-checks': 'write',
      'permission-statuses': 'write',
      'permission-contents': 'write',
      'permission-issues': 'write',
      'permission-pull-requests': 'write',
      'permission-workflows': 'write',
      'permission-members': 'read',
      'skip-token-revoke': 'false',
    });
    expect(steps[tokenIndex].with).not.toHaveProperty('permission-actions');
    for (const step of steps) {
      if (step.uses) expect(step.uses).toMatch(pinned);
      if (step.run?.includes('.mjs')) expect(step.run).toContain('ACTION_PATH');
    }
  });

  test('the official container action receives only the selected runtime environment and private mount', () => {
    const steps = read('.github/actions/renovate/action.yml').runs.steps;
    const run = steps.find((step) => step.uses?.startsWith('renovatebot/github-action@'));
    expect(run.with['renovate-image']).toMatch(/^ghcr\.io\/renovatebot\/renovate:\d+\.\d+\.\d+-full@sha256:[a-f0-9]{64}$/);
    expect(run.with['mount-docker-socket']).toBe('false');
    expect(run.with['docker-user']).toBe('${{ steps.prepare.outputs.docker-user }}');
    expect(run.with['docker-volumes']).toBe('${{ steps.prepare.outputs.work-dir }}:/tmp');
    expect(run.with.configurationFile).toBe('${{ steps.prepare.outputs.config-file }}');
    const cleanup = steps.find(step => step.name === 'Remove private working data');
    expect(cleanup.env.PRIVATE_DIRECTORY).toBe('${{ steps.prepare.outputs.private-dir }}');
    expect(run.with['env-regex']).toBe('^(LOG_LEVEL|NO_COLOR)$');
    expect(run.with['additional-env-list']).toBeUndefined();
    expect(run.with['docker-cmd-file']).toBe('${{ github.action_path }}/scripts/renovate-command.sh');
    expect(run.env.LOG_LEVEL).toBe('info');
  });
});

// Exercise the real preparer without root, a network connection or App credentials.
test('preparation keeps the config parent host-owned and limits image ownership to config and work', () => {
  const directory = mkdtempSync(resolve(tmpdir(), 'vhco-prepare-test-'));
  try {
    const workspace = resolve(directory, 'workspace');
    const bin = resolve(directory, 'bin');
    const runnerTemp = resolve(directory, 'runner-temp');
    for (const path of [workspace, bin, runnerTemp]) mkdirSync(path, { mode: 0o700 });
    const gitEnv = { PATH: process.env.PATH, HOME: directory, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1' };
    const git = (...args) => {
      const r = Bun.spawnSync(['git', ...args], { env: gitEnv, stdout: 'pipe', stderr: 'pipe' });
      if (r.exitCode) throw new Error(r.stderr.toString());
      return r.stdout.toString().trim();
    };
    const heads = [];
    for (const name of ['_vhco-policy', '_vhco-runner']) {
      const path = resolve(workspace, name);
      mkdirSync(resolve(path, 'config'), { recursive: true });
      writeFileSync(resolve(path, 'config/targets.json'), JSON.stringify({ organization: 'example-org', repositories: ['example-org/fixture'] }));
      git('init', '--initial-branch=main', path);
      git('-C', path, 'add', '.');
      git('-C', path, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-m', 'Invented fixture');
      heads.push(git('-C', path, 'rev-parse', 'HEAD'));
    }
    writeFileSync(resolve(bin, 'docker'), '#!/bin/sh\ncase "$*" in *-u) echo 12021;; *-g) echo 0;; *) exit 90;; esac\n');
    writeFileSync(resolve(bin, 'sudo'), '#!/bin/sh\nprintf "%s\\n" "$@" >> "$HOME/chown-args"\n');
    for (const name of ['docker', 'sudo']) chmodSync(resolve(bin, name), 0o700);
    const output = resolve(directory, 'outputs');
    writeFileSync(output, '');
    const result = Bun.spawnSync([process.execPath, '.github/actions/renovate/scripts/prepare.mjs'], {
      cwd: resolve(import.meta.dir, '..'),
      env: { ...gitEnv, PATH: `${bin}:${process.env.PATH}`, RUNNER_TEMP: runnerTemp, GITHUB_WORKSPACE: workspace, GITHUB_OUTPUT: output,
        CALLER_REPOSITORY: 'example-org/caller', CALLER_REF: 'refs/heads/main', CALLER_SHA: heads[0],
        CALLER_WORKFLOW_REF: 'example-org/caller/.github/workflows/manual.yml@refs/heads/main', CALLER_EVENT: 'workflow_dispatch',
        IMPLEMENTATION_REPOSITORY: 'vhco-pro/renovate-runner', IMPLEMENTATION_SHA: heads[1], IMPLEMENTATION_WORKFLOW: '.github/workflows/renovate.yml' },
      stdout: 'pipe', stderr: 'pipe',
    });
    expect(result.exitCode).toBe(0);
    const values = Object.fromEntries(readFileSync(output, 'utf8').trim().split('\n').map(line => line.split('=')));
    expect(values['work-dir']).toBe(resolve(values['private-dir'], 'work'));
    expect(values['config-file']).toBe(resolve(values['private-dir'], 'renovate.json'));
    expect(statSync(values['private-dir']).mode & 0o777).toBe(0o700);
    expect(statSync(values['work-dir']).mode & 0o777).toBe(0o700);
    expect(statSync(values['config-file']).mode & 0o777).toBe(0o600);
    const chown = readFileSync(resolve(directory, 'chown-args'), 'utf8').trim().split('\n');
    expect(chown).toEqual(['chown', '-R', '--no-dereference', '12021:0', '--', values['work-dir'], values['config-file']]);
    expect(JSON.parse(readFileSync(values['config-file'], 'utf8')).repositories).toEqual(['example-org/fixture']);
  } finally {
    rmSync(directory, { recursive: true });
  }
});
