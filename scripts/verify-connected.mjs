import { execFileSync } from 'node:child_process';
import { readFileSync, realpathSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const caller = 'vhco-pro/renovate-caller-fixture';
const shaPattern = /^[a-f0-9]{40}$/;
const commandEnv = { PATH: process.env.PATH, HOME: process.env.HOME, LANG: 'C.UTF-8',
  ...(process.env.GH_CONFIG_DIR ? { GH_CONFIG_DIR: process.env.GH_CONFIG_DIR } : {}) };
const command = (name, args) => execFileSync(name, args, {
  env: commandEnv, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 60_000, maxBuffer: 64 * 1024 * 1024,
});

/** Print a reviewable setup plan. This function performs no network or write operation. */
export function createFixturePlan(sourceSha) {
  if (!shaPattern.test(sourceSha)) throw new Error('Expected an immutable source commit');
  const template = readFileSync(resolve(import.meta.dir, '../examples/connected/integration.yml'), 'utf8');
  return {
    sourceSha,
    authority: 'Separate owner approval is required before any App, credential, repository or dispatch write.',
    productionAccess: false,
    app: 'vhco-renovate (fixture-only during this session)',
    repositories: [
      { name: 'vhco-pro/renovate-fixture-a', visibility: 'private' },
      { name: 'vhco-pro/renovate-fixture-b', visibility: 'private' },
      { name: caller, visibility: 'public' },
    ],
    permissions: {
      administration: 'read', vulnerability_alerts: 'read', metadata: 'read',
      checks: 'write', statuses: 'write', contents: 'write', issues: 'write',
      pull_requests: 'write', workflows: 'write', members: 'read',
    },
    environment: { repository: caller, name: 'renovate', allowedBranches: ['main'],
      secret: 'RENOVATE_APP_PRIVATE_KEY', mainUpdateBypass: 'trusted owner-admin only; App excluded' },
    workflow: template.replaceAll('FULL_COMMIT_SHA', sourceSha),
    checks: [
      'Read back repository visibility, main rules, main-only environment, selected installation and permissions before supplying a key.',
      'Observe full dry-run and real update PRs for two invented targets; validate every resulting manifest and lockfile.',
      'Prove per-repository rate limits, forced schedule, token scope/revocation, debug and non-main refusal, and App direct-main denial.',
      'Dispatch three correlated overlapping manual runs through this same caller; inspect native queue, retry, interrupted PR reuse and timeout recovery.',
      'Inspect successful and failed public logs, check output, artifacts and browser summaries for protected invented canaries.',
      'Exercise native health commands, verify owner notification delivery and run the shared release fixture with dry-run fixed true.',
      'Retire the active fixture key, prove JWT rejection, delete the retained secret and installation access; record replacement-key fingerprint and PEM removal.',
    ],
    commands: {
      dispatchFull: ['gh', 'workflow', 'run', 'integration.yml', '--repo', caller, '--ref', 'main',
        '-f', 'mode=full', '-f', 'proof-id=OWNER_UNIQUE_CASE'],
      dispatchWrite: ['gh', 'workflow', 'run', 'integration.yml', '--repo', caller, '--ref', 'main',
        '-f', 'mode=write', '-f', 'proof-id=OWNER_UNIQUE_CASE'],
      correlate: ['gh', 'run', 'list', '--repo', caller, '--workflow', 'integration.yml', '--event', 'workflow_dispatch',
        '--json', 'databaseId,displayTitle,headSha,status,conclusion,url'],
      verify: ['bun', 'scripts/verify-connected.mjs', '--verify-run', 'RUN_ID', '--caller-sha', 'CALLER_COMMIT',
        '--source-sha', sourceSha, '--proof-id', 'OWNER_UNIQUE_CASE', '--conclusion', 'success', '--canary-file', '/PROTECTED/OUTSIDE/GIT/canaries.json'],
    },
    limits: 'This plan and its local tests prove no connected criterion. Follow the case matrix and retain actual native readbacks.',
  };
}

/** Assess captured public metadata without returning raw output or target content. */
export function verifyPublicRun({ run, jobs, artifacts, logs, canaries, expected }) {
  if (!expected || !Number.isSafeInteger(expected.runId) || expected.runId <= 0
    || !shaPattern.test(expected.callerSha) || !shaPattern.test(expected.implementationSha)
    || !/^[A-Za-z0-9_-]{1,80}$/.test(expected.proofId)
    || !['success', 'failure', 'timed_out', 'cancelled'].includes(expected.conclusion)
    || run?.id !== expected.runId || run.repository?.full_name !== caller || run.repository?.private !== false
    || run.head_sha !== expected.callerSha || run.head_branch !== 'main' || run.event !== 'workflow_dispatch'
    || run.display_title !== `fixture-${expected.proofId}` || run.status !== 'completed'
    || run.conclusion !== expected.conclusion
    || !run.referenced_workflows?.some((workflow) => workflow.sha === expected.implementationSha
      && workflow.path === `vhco-pro/renovate-runner/.github/workflows/renovate.yml@${expected.implementationSha}`)) {
    throw new Error('Run identity or result does not match the selected case');
  }
  if (!Array.isArray(jobs) || jobs.length === 0 || jobs.some((job) => job.run_id !== run.id
    || job.status !== 'completed' || !Array.isArray(job.labels) || job.labels.includes('self-hosted')
    || !job.labels.includes('ubuntu-24.04'))
    || !jobs.some((job) => job.steps?.some((step) => step.name === 'Run the official Renovate container'
      && step.conclusion !== 'skipped'))) throw new Error('Native standard-runner or entry-point evidence is missing');
  if (!Array.isArray(artifacts) || artifacts.length !== 0) throw new Error('Unexpected public artifacts');
  if (typeof logs !== 'string' || !Array.isArray(canaries) || canaries.length === 0
    || canaries.some((value) => typeof value !== 'string' || value.length < 8 || logs.includes(value))) {
    throw new Error('Public-output boundary was not established');
  }
  return { runId: run.id, conclusion: run.conclusion, standardLinuxRunner: true,
    canariesAbsent: true, artifactsAbsent: true };
}

function pages(endpoint, property) {
  const responses = JSON.parse(command('gh', ['api', '--paginate', '--slurp', endpoint]));
  const total = responses[0]?.total_count;
  if (!Array.isArray(responses) || !Number.isSafeInteger(total) || total < 0
    || responses.some((response) => response.total_count !== total || !Array.isArray(response[property]))) {
    throw new Error('Incomplete native API read');
  }
  const records = responses.flatMap((response) => response[property]);
  if (records.length !== total || new Set(records.map((record) => record.id)).size !== total) {
    throw new Error('Incomplete native API read');
  }
  return records;
}

if (import.meta.main) {
  try {
    const args = process.argv.slice(2);
    if (args[0] === '--plan' && args.length <= 2) {
      const sourceSha = args[1] ?? command('git', ['rev-parse', 'HEAD']).trim();
      if (!shaPattern.test(sourceSha)) throw new Error('Invalid source');
      command('git', ['cat-file', '-e', `${sourceSha}^{commit}`]);
      console.log(JSON.stringify(createFixturePlan(sourceSha), null, 2));
    } else {
      const names = ['--verify-run', '--caller-sha', '--source-sha', '--proof-id', '--conclusion', '--canary-file'];
      if (args.length !== 12 || names.some((name, index) => args[index * 2] !== name)) throw new Error('Invalid command');
      const [runId, callerSha, implementationSha, proofId, conclusion, canaryFile] = names.map((_, index) => args[index * 2 + 1]);
      if (!/^[1-9][0-9]*$/.test(runId)) throw new Error('Invalid run');
      const file = statSync(canaryFile);
      if (!file.isFile() || file.uid !== process.getuid() || (file.mode & 0o077) !== 0) throw new Error('Canaries need an owner-only file outside Git');
      const root = realpathSync(resolve(import.meta.dir, '..'));
      if (realpathSync(canaryFile).startsWith(`${root}/`)) throw new Error('Canaries must be outside the component checkout');
      const run = JSON.parse(command('gh', ['api', `repos/${caller}/actions/runs/${runId}`]));
      const jobs = pages(`repos/${caller}/actions/runs/${runId}/attempts/${run.run_attempt}/jobs?per_page=100`, 'jobs');
      const artifacts = pages(`repos/${caller}/actions/runs/${runId}/artifacts?per_page=100`, 'artifacts');
      let logs = command('gh', ['run', 'view', runId, '--repo', caller, '--attempt', String(run.run_attempt), '--log']);
      for (const job of jobs) {
        const prefix = `https://api.github.com/repos/${caller}/check-runs/`;
        if (!job.check_run_url?.startsWith(prefix) || !/^[1-9][0-9]*$/.test(job.check_run_url.slice(prefix.length))) {
          throw new Error('Missing native check-output identity');
        }
        const check = JSON.parse(command('gh', ['api', job.check_run_url.slice('https://api.github.com/'.length)]));
        logs += JSON.stringify(check.output);
      }
      const result = verifyPublicRun({ run, jobs, artifacts, logs,
        canaries: JSON.parse(readFileSync(canaryFile, 'utf8')),
        expected: { runId: Number(runId), callerSha, implementationSha, proofId, conclusion } });
      console.log(JSON.stringify({ ...result, scope: 'Public logs/check output/artifacts only; browser summaries and target-local outcomes still require inspection.' }));
    }
  } catch {
    // Native failures can contain private canaries; never render the exception.
    console.error('✗ Failed: connected verification or command preconditions');
    process.exitCode = 1;
  }
}
