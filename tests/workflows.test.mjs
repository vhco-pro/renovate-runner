import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';

const read = (path) => Bun.YAML.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));
const pinned = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_./-]+)?@[a-f0-9]{40}$/;

describe('central callers', () => {
  test('scheduled and manual entries call the same reviewed reusable workflow', () => {
    const scheduled = read('.github/workflows/schedule.yml');
    const manual = read('.github/workflows/manual.yml');
    for (const caller of [scheduled, manual]) {
      expect(caller.permissions).toEqual({ contents: 'read' });
      expect(caller.jobs.renovate.uses).toBe('./.github/workflows/renovate.yml');
      expect(caller.jobs.renovate.with.environment).toBe('renovate');
      expect(caller.jobs.renovate.with['client-id']).toBe('${{ vars.RENOVATE_APP_CLIENT_ID }}');
    }
    expect(scheduled.jobs.renovate.if).toBe("${{ vars.RENOVATE_ENABLED == 'true' }}");
    expect(scheduled.jobs.renovate.with.mode).toBe('write');
    expect(scheduled.on.schedule).toHaveLength(1);
    expect(scheduled.on.schedule[0].cron).toBe('23 5,17 * * *');
    expect(manual.on.workflow_dispatch.inputs.mode.options).toEqual(['full', 'write']);
    expect(manual.on.workflow_dispatch.inputs.mode.default).toBe('full');
  });
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
    expect(run.with['docker-volumes']).toBe('${{ steps.prepare.outputs.private-dir }}:/tmp');
    expect(run.with['env-regex']).toBe('^(LOG_LEVEL|NO_COLOR)$');
    expect(run.with['additional-env-list']).toBeUndefined();
    expect(run.with['docker-cmd-file']).toBe('${{ github.action_path }}/scripts/renovate-command.sh');
    expect(run.env.LOG_LEVEL).toBe('info');
  });
});
