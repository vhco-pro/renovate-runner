import { appendFileSync } from 'node:fs';

const shaPattern = /^[a-f0-9]{40}$/;

export function releaseDecision({ event, ref, sourceSha, currentMainSha, enabled, dryRun, expectedSha }) {
  if (!['push', 'workflow_dispatch'].includes(event) || ref !== 'refs/heads/main'
    || !shaPattern.test(sourceSha) || !shaPattern.test(currentMainSha)) {
    throw new Error('Unsupported release context');
  }
  if (currentMainSha !== sourceSha) throw new Error('Release source moved from current main');
  if (!['', 'true', 'false'].includes(dryRun)) throw new Error('Invalid release mode');

  const effectiveDryRun = enabled !== 'true' || (event === 'workflow_dispatch' && dryRun !== 'false');
  if (!effectiveDryRun && event === 'workflow_dispatch'
    && (!shaPattern.test(expectedSha) || expectedSha !== sourceSha)) {
    throw new Error('Release candidate does not match approval');
  }
  return { dryRun: effectiveDryRun };
}

if (import.meta.main) {
  try {
    const repository = process.env.GITHUB_REPOSITORY;
    const token = process.env.GITHUB_TOKEN;
    if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository) || !token || !process.env.GITHUB_OUTPUT) {
      throw new Error('Missing release context');
    }
    const response = await fetch(`https://api.github.com/repos/${repository}/git/ref/heads/main`, {
      headers: {
        authorization: `Bearer ${token}`,
        accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2026-03-10',
      },
      redirect: 'error',
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new Error('Main readback failed');
    const current = await response.json();
    const decision = releaseDecision({
      event: process.env.GITHUB_EVENT_NAME,
      ref: process.env.GITHUB_REF,
      sourceSha: process.env.GITHUB_SHA,
      currentMainSha: current.object?.sha,
      enabled: process.env.RELEASE_ENABLED ?? '',
      dryRun: process.env.RELEASE_DRY_RUN ?? '',
      expectedSha: process.env.RELEASE_EXPECTED_SHA ?? '',
    });
    appendFileSync(process.env.GITHUB_OUTPUT, `dry-run=${decision.dryRun}\n`);
    console.log('✓ Passed: release source preflight');
  } catch {
    console.error('✗ Failed: release source preflight; inspect current main and the approved candidate');
    process.exitCode = 1;
  }
}
