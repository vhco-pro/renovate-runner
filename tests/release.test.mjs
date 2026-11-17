import { expect, test } from 'bun:test';
import { releaseDecision } from '../.github/actions/renovate/scripts/release-preflight.mjs';

const sha = 'a'.repeat(40);
const newer = 'b'.repeat(40);
const request = () => ({
  event: 'workflow_dispatch', ref: 'refs/heads/main', sourceSha: sha,
  currentMainSha: sha, enabled: 'true', dryRun: 'false', expectedSha: sha,
});

test('only a publishing manual run requires its approved exact candidate', () => {
  expect(releaseDecision(request())).toEqual({ dryRun: false });
  for (const expectedSha of ['', 'main', newer, 'A'.repeat(40)]) {
    expect(() => releaseDecision({ ...request(), expectedSha })).toThrow();
  }
});

test('an enabled automatic main push publishes without dispatch inputs', () => {
  expect(releaseDecision({ ...request(), event: 'push', dryRun: '', expectedSha: '' }))
    .toEqual({ dryRun: false });
});

test.each(['', 'malformed', newer])('effective dry-run ignores expected-sha %s', (expectedSha) => {
  expect(releaseDecision({ ...request(), dryRun: 'true', expectedSha })).toEqual({ dryRun: true });
  expect(releaseDecision({ ...request(), enabled: '', dryRun: 'false', expectedSha }))
    .toEqual({ dryRun: true });
});

test.each(['unpublished main', 'failed main', 'published main', 'skip-CI documentation main'])(
  'a superseded source cannot invoke publication after %s', () => {
    let writes = 0;
    const publish = () => { writes++; };
    expect(() => {
      const decision = releaseDecision({ ...request(), currentMainSha: newer });
      if (!decision.dryRun) publish();
    }).toThrow();
    expect(writes).toBe(0);
  },
);

test.each([
  { currentMainSha: undefined },
  { currentMainSha: 'main' },
  { sourceSha: 'invalid' },
  { event: 'pull_request' },
  { ref: 'refs/heads/feature' },
  { dryRun: 'PRIVATE-CANARY' },
])('missing or invalid native source state refuses publication', (changes) => {
  expect(() => releaseDecision({ ...request(), ...changes })).toThrow();
});
