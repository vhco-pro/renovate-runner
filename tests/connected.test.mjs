import { expect, test } from 'bun:test';
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { createFixturePlan, verifyPublicRun } from '../scripts/verify-connected.mjs';

const sourceSha = 'a'.repeat(40);

test('the credential-free plan is limited to the three owned fixtures and an immutable source', () => {
  const plan = createFixturePlan(sourceSha);
  expect(plan.sourceSha).toBe(sourceSha);
  expect(plan.repositories).toEqual([
    { name: 'vhco-pro/renovate-fixture-a', visibility: 'private' },
    { name: 'vhco-pro/renovate-fixture-b', visibility: 'private' },
    { name: 'vhco-pro/renovate-caller-fixture', visibility: 'public' },
  ]);
  expect(plan.productionAccess).toBe(false);
  expect(plan.permissions.actions).toBeUndefined();
  expect(plan.permissions.workflows).toBe('write');
  expect(plan.workflow).toContain(`renovate.yml@${sourceSha}`);
  expect(plan.workflow).not.toContain('schedule:');
  expect(plan.workflow).not.toContain('FULL_COMMIT_SHA');
});

test.each(['main', 'v0.1.0', 'A'.repeat(40), `${sourceSha};echo bad`])('plan refuses mutable/invalid source %s', (value) => {
  expect(() => createFixturePlan(value)).toThrow();
});

const validRun = () => ({
  id: 123, head_sha: sourceSha, event: 'workflow_dispatch', head_branch: 'main',
  status: 'completed', conclusion: 'success', display_title: 'fixture-proof-1',
  repository: { full_name: 'vhco-pro/renovate-caller-fixture', private: false },
  referenced_workflows: [{ path: `vhco-pro/renovate-runner/.github/workflows/renovate.yml@${sourceSha}`, sha: sourceSha }],
});
const validJobs = () => [{ run_id: 123, status: 'completed', conclusion: 'success',
  labels: ['ubuntu-24.04'], steps: [{ name: 'Run the official Renovate container', conclusion: 'success' }] }];

test('readback proves only the selected completed public run and permitted public output', () => {
  const result = verifyPublicRun({ run: validRun(), jobs: validJobs(), artifacts: [],
    logs: '✓ Passed: runner preflight\nRenovate process finished', canaries: ['invented-private-value'],
    expected: { runId: 123, callerSha: sourceSha, implementationSha: sourceSha, proofId: 'proof-1', conclusion: 'success' } });
  expect(result).toEqual({ runId: 123, conclusion: 'success', standardLinuxRunner: true,
    canariesAbsent: true, artifactsAbsent: true });
});

test.each(['wrong-repository', 'wrong-sha', 'wrong-implementation', 'unfinished', 'wrong-case', 'wrong-event', 'private', 'canary', 'artifact', 'wrong-runner', 'missing-entrypoint'])(
  'readback refuses %s evidence', (scenario) => {
    const input = { run: validRun(), jobs: validJobs(), artifacts: [], logs: 'safe', canaries: ['invented-private-value'],
      expected: { runId: 123, callerSha: sourceSha, implementationSha: sourceSha, proofId: 'proof-1', conclusion: 'success' } };
    if (scenario === 'wrong-repository') input.run.repository.full_name = 'example-org/unrelated';
    if (scenario === 'wrong-sha') input.run.head_sha = 'b'.repeat(40);
    if (scenario === 'wrong-implementation') input.run.referenced_workflows[0].sha = 'b'.repeat(40);
    if (scenario === 'unfinished') input.run.status = 'in_progress';
    if (scenario === 'wrong-case') input.run.display_title = 'fixture-other';
    if (scenario === 'wrong-event') input.run.event = 'push';
    if (scenario === 'private') input.run.repository.private = true;
    if (scenario === 'canary') input.logs = 'error: invented-private-value';
    if (scenario === 'artifact') input.artifacts = [{ id: 1 }];
    if (scenario === 'wrong-runner') input.jobs[0].labels = ['self-hosted'];
    if (scenario === 'missing-entrypoint') input.jobs[0].steps = [];
    expect(() => verifyPublicRun(input)).toThrow();
  },
);

test('a failing native run can be checked without turning it into successful implementation proof', () => {
  const run = validRun(); run.conclusion = 'failure';
  const jobs = validJobs(); jobs[0].conclusion = 'failure'; jobs[0].steps[0].conclusion = 'failure';
  const result = verifyPublicRun({ run, jobs, artifacts: [], logs: 'fixed failure', canaries: ['invented-private-value'],
    expected: { runId: 123, callerSha: sourceSha, implementationSha: sourceSha, proofId: 'proof-1', conclusion: 'failure' } });
  expect(result.conclusion).toBe('failure');
});

test.each(['success', 'private-log', 'private-check-output', 'incomplete-jobs', 'api-failure'])(
  'the actual read-only CLI handles %s without rendering private diagnostics', (scenario) => {
    const directory = mkdtempSync(resolve(tmpdir(), 'vhco-connected-cli-'));
    const canary = 'invented-private-canary-92813';
    try {
      const write = (suffix, value) => writeFileSync(resolve(directory, `gh.${suffix}`), JSON.stringify(value));
      const run = validRun(); run.run_attempt = 1;
      const jobs = validJobs(); jobs[0].id = 1;
      jobs[0].check_run_url = 'https://api.github.com/repos/vhco-pro/renovate-caller-fixture/check-runs/1';
      write('run', run);
      write('jobs', [{ total_count: scenario === 'incomplete-jobs' ? 2 : 1, jobs }]);
      write('artifacts', [{ total_count: 0, artifacts: [] }]);
      write('check', { output: { summary: scenario === 'private-check-output' ? canary : '' } });
      writeFileSync(resolve(directory, 'gh.logs'), scenario === 'private-log' ? canary : 'safe public output');
      const wrapper = resolve(directory, 'gh');
      writeFileSync(wrapper, `#!/bin/sh
${scenario === 'api-failure' ? `printf '${canary}\\n' >&2; exit 1` : ''}
if [ "$1" = run ] && [ "$2" = view ]; then cat "$0.logs"; exit 0; fi
if [ "$1" != api ]; then exit 99; fi
for argument in "$@"; do
  case "$argument" in
    */attempts/1/jobs*) cat "$0.jobs"; exit 0;;
    */artifacts*) cat "$0.artifacts"; exit 0;;
    */check-runs/1) cat "$0.check"; exit 0;;
    */actions/runs/123) cat "$0.run"; exit 0;;
  esac
done
exit 99
`);
      chmodSync(wrapper, 0o700);
      const canaries = resolve(directory, 'canaries.json');
      writeFileSync(canaries, JSON.stringify([canary]), { mode: 0o600 });
      const result = Bun.spawnSync([process.execPath, 'scripts/verify-connected.mjs', '--verify-run', '123',
        '--caller-sha', sourceSha, '--source-sha', sourceSha, '--proof-id', 'proof-1',
        '--conclusion', 'success', '--canary-file', canaries], {
        env: { PATH: `${directory}:/usr/bin:/bin`, HOME: directory }, stdout: 'pipe', stderr: 'pipe',
      });
      expect(`${result.stdout}${result.stderr}`).not.toContain(canary);
      if (scenario === 'success') expect(JSON.parse(result.stdout.toString()).runId).toBe(123);
      else {
        expect(result.exitCode).not.toBe(0);
        expect(result.stdout.toString()).toBe('');
      }
    } finally {
      rmSync(directory, { recursive: true });
    }
  },
);
