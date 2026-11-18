import { expect, test } from 'bun:test';
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';

const bash = Bun.which('bash');
const jq = Bun.which('jq');
if (!bash || !jq) throw new Error('Operations tests require Bash and jq on PATH');
const fixturePath = directory => `${directory}:${dirname(jq)}:/usr/bin:/bin`;

const root = resolve(import.meta.dir, '..');
const read = (name) => readFileSync(resolve(root, name), 'utf8');
const section = (source, title) => source.split(`## ${title}\n`)[1]?.split('\n## ')[0] ?? '';
const ordered = (source, values) => {
  let offset = -1;
  for (const value of values) {
    const next = source.indexOf(value, offset + 1);
    expect(next, `Missing or out-of-order procedure: ${value}`).toBeGreaterThan(offset);
    offset = next;
  }
};

test('the first-publication procedure holds main before reading state and enables only a completed queue', () => {
  const first = section(read('docs/operations.md'), 'First publication');
  ordered(first, ['Hold main pushes and merges', 'git/ref/heads/main',
    '--paginate --slurp', 'all(.workflow_runs[]; .status == "completed")',
    'gh variable set RELEASE_ENABLED --body true', 'gh workflow run release.yml --ref main',
    '-f expected-sha="$RELEASE_SHA"', 'gh run watch "$RUN_ID"', 'Initial publication readback']);
  expect(first).toContain('Any failed or incomplete API read stops this sequence');
});

test('delivery readback binds tag and run to the reviewed source and covers every release input', () => {
  const source = read('docs/operations.md');
  const identity = section(source, 'Release identity');
  for (const command of ['merge-base --is-ancestor "$REVIEW_SHA" "$INTEGRATION_SHA"',
    'merge-base --is-ancestor "$INTEGRATION_SHA" "$RELEASE_SHA"',
    'git diff --exit-code "$REVIEW_SHA" "$RELEASE_SHA" --',
    '"refs/tags/${TAG}^{}"', 'test "$TAG_SHA" = "$RELEASE_SHA"',
    'test "$RUN_SHA" = "$RELEASE_SHA"']) {
    expect(identity).toContain(command);
  }
  const spec = read('docs/specs/shared-renovate-runner.md');
  const covers = Bun.YAML.parse(spec.split('---')[1]).covers;
  const paths = identity.match(/git diff --exit-code[^\n]+ -- (.+)/)[1].trim().split(/\s+/);
  expect(paths).toEqual(covers);

});

test('the single smoke is isolated from cron and stops before repair or real adoption', () => {
  const smoke = section(read('docs/operations.md'), 'Single integration smoke');
  ordered(smoke, ['target Actions disabled', 'if not disabled, stop without writing', 'Seed one npm', 'RENOVATE_ENABLED=false',
    'disable schedule.yml and manual.yml', 'Enable only manual.yml',
    'read back target Actions disabled again', 'if not disabled, stop without writing',
    'read back schedule.yml disabled', 'RENOVATE_ENABLED=true',
    'On success or failure', 'reset RENOVATE_ENABLED=false', 'disable both entries',
    'cancel/drain', 'Remove fixture App access', 'A failed check holds real-target adoption', 'repeat the entire smoke setup']);
  expect(smoke).toContain('Retain the test repository/PR with Actions disabled');
  expect(smoke).toContain('valid one-target placeholder');
  expect(smoke).toContain('Every retry begins by repeating step 1');
  ordered(section(read('docs/operations.md'), 'Stop and recover dependency runs'), [
    'reset RENOVATE_ENABLED=false', 'read back false', 'disabling schedule.yml and manual.yml',
    'Read back both disabled', 'cancel/drain',
  ]);
  const activation = section(read('docs/operations.md'), 'Real-target activation');
  ordered(activation, ['Grant production access', 'RENOVATE_ENABLED=false', 'full dry-run',
    'enables schedule.yml and manual.yml', 'RENOVATE_ENABLED=true last',
    'On a failed pilot', 'reset the flag', 'drain their runs', 'restoring the recorded predecessor']);
});

test('failed initial publication has a disable-before-repair path and preserves abandoned tags', () => {
  const failure = section(read('docs/operations.md'), 'Failed initial publication');
  ordered(failure, ['gh variable set RELEASE_ENABLED --body false',
    'gh run watch "$RUN_ID"', 'Read the exact tag and release state',
    'Verify publication is disabled', 'Lift the main hold']);
  for (const phrase of ['abandoned, undelivered', 'Lab delivery record and component issue #1',
    'next version calculated by shared GitVersion', 'repaired candidate', 'Never move, delete or reuse']) {
    expect(failure).toContain(phrase);
  }
});

test('health commands include inactive scheduling, stale success and native cancellations', () => {
  const health = section(read('docs/operations.md'), 'Scheduler health');
  for (const phrase of ['.state == "active"', '259200', '.event == "schedule"',
    '.conclusion == "success"', '.conclusion == "cancelled"',
    'gh workflow enable schedule.yml', 'notification recipient']) expect(health).toContain(phrase);
});

test('documentation separates local source proof and the future integration smoke', () => {
  const source = read('docs/operations.md');
  for (const phrase of ['trusted workflow author', 'operational pause', 'no App credentials',
    'single integration smoke', 'Rootless Podman', 'no Terraform or OpenTofu CLI']) expect(source).toContain(phrase);
  expect(read('README.md')).toContain('```mermaid');
  expect(read('LICENSE')).toContain('Apache License');
  expect(read('LICENSE')).toContain('VH & Co BV');
  expect(JSON.parse(read('renovate.json')).automerge).toBe(false);
});

test.each(['healthy', 'inactive', 'stale', 'no-success', 'api-failure', 'malformed'])(
  'documented native health commands classify %s scheduling', (scenario) => {
    const directory = mkdtempSync(resolve(tmpdir(), 'vhco-renovate-health-'));
    try {
      const source = section(read('docs/operations.md'), 'Scheduler health');
      const script = source.match(/```bash\n([\s\S]*?)\n```/)[1];
      const wrapper = resolve(directory, 'gh');
      writeFileSync(wrapper, '#!/bin/sh\nfor argument in "$@"; do\n case "$argument" in repos/*) endpoint="$argument";; esac\ndone\ncase "$endpoint" in\n */schedule.yml/runs*) test "$HEALTH_SCENARIO" != api-failure || exit 1; cat "$HEALTH_RUNS";;\n */manual.yml/runs*) printf "[]\\n";;\n *) cat "$HEALTH_WORKFLOW";;\nesac\n');
      chmodSync(wrapper, 0o700);
      writeFileSync(resolve(directory, 'workflow.json'), JSON.stringify({ state: scenario === 'inactive' ? 'disabled_manually' : 'active' }));
      const age = scenario === 'stale' ? 96 : 1;
      const runs = [{ workflow_runs: [{ event: 'schedule', conclusion: scenario === 'no-success' ? 'failure' : 'success',
        updated_at: new Date(Date.now() - age * 3600_000).toISOString().replace(/\.\d+Z$/, 'Z') }] }];
      writeFileSync(resolve(directory, 'runs.json'), scenario === 'malformed' ? 'not-json' : JSON.stringify(runs));
      const result = Bun.spawnSync([bash, '-c', script], {
        cwd: directory, env: { PATH: fixturePath(directory), HOME: directory, TMPDIR: directory,
          HEALTH_SCENARIO: scenario, HEALTH_RUNS: resolve(directory, 'runs.json'),
          HEALTH_WORKFLOW: resolve(directory, 'workflow.json') }, stdout: 'pipe', stderr: 'pipe',
      });
      if (scenario === 'healthy') expect(result.exitCode, result.stderr.toString()).toBe(0);
      else {
        if (scenario === 'malformed') {
          expect([4, 5], result.stderr.toString()).toContain(result.exitCode);
          expect(result.stderr.toString()).not.toBe('');
        } else expect(result.exitCode, result.stderr.toString()).toBe(scenario === 'no-success' ? 4 : 1);
        expect(result.stdout.toString().trim()).toBe(scenario === 'inactive' ? 'false' : scenario === 'stale' ? 'true\nfalse' : 'true');
      }
    } finally {
      rmSync(directory, { recursive: true });
    }
  },
);

test.each(['completed', 'requested', 'waiting', 'pending', 'queued', 'in_progress', 'unknown', 'incomplete', 'failed-read'])(
  'the documented first-enable check holds before writes for %s run state', (state) => {
    const directory = mkdtempSync(resolve(tmpdir(), 'vhco-renovate-enable-'));
    try {
      const script = section(read('docs/operations.md'), 'First publication').match(/```bash\n([\s\S]*?)\n```/)[1];
      const wrapper = resolve(directory, 'gh');
      writeFileSync(wrapper, `#!/bin/sh
if [ "$1" = api ]; then
  for argument in "$@"; do
    case "$argument" in
      */git/ref/heads/main) printf '%s\\n' "$RELEASE_SHA"; exit 0;;
      */release.yml/runs*) if test "$FIXTURE_STATE" = failed-read; then echo "Fixture API read failed" >&2; exit 1; fi; cat "$FIXTURE_RUNS"; exit 0;;
    esac
  done
  exit 99
fi
printf '%s\\n' "$*" >> "$FIXTURE_WRITES"
`);
      chmodSync(wrapper, 0o700);
      writeFileSync(resolve(directory, 'runs.json'), JSON.stringify([{ total_count: state === 'incomplete' ? 2 : 1,
        workflow_runs: [{ id: 1, status: state === 'incomplete' ? 'completed' : state }] }]));
      const writes = resolve(directory, 'writes');
      writeFileSync(writes, '');
      const result = Bun.spawnSync([bash, '-c', script], {
        cwd: directory, env: { PATH: fixturePath(directory), HOME: directory, TMPDIR: directory,
          REPOSITORY: 'example-org/runner', RELEASE_SHA: 'a'.repeat(40), FIXTURE_STATE: state,
          FIXTURE_RUNS: resolve(directory, 'runs.json'), FIXTURE_WRITES: writes }, stdout: 'pipe', stderr: 'pipe',
      });
      if (state === 'completed') {
        expect(result.exitCode, result.stderr.toString()).toBe(0);
        const commands = readFileSync(writes, 'utf8');
        expect(commands).toContain('variable set RELEASE_ENABLED --body true');
        expect(commands).toContain(`workflow run release.yml --ref main -f dry-run=false -f expected-sha=${'a'.repeat(40)}`);
      } else {
        expect(result.exitCode, result.stderr.toString()).toBe(1);
        if (state === 'failed-read') expect(result.stderr.toString()).toContain('Fixture API read failed');
        else expect(result.stdout.toString().trim()).toBe('false');
        expect(readFileSync(writes, 'utf8')).toBe('');
      }
    } finally {
      rmSync(directory, { recursive: true });
    }
  },
);
