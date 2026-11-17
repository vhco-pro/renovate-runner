const shaPattern = /^[0-9a-f]{40}$/;
const repositoryPattern = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

function repositoryName(value) {
  return typeof value === 'string'
    && repositoryPattern.test(value)
    && value.split('/').every((part) => part !== '.' && part !== '..');
}

function disabled(value) {
  return value === undefined || value === '' || value === '0' || value === 'false';
}

function assertContext(context) {
  if (!context || !repositoryName(context.callerRepository)
    || context.callerRef !== 'refs/heads/main'
    || !shaPattern.test(context.callerSha)
    || context.policyHead !== context.callerSha
    || !['workflow_dispatch', 'schedule'].includes(context.event)
    || context.implementationRepository !== 'vhco-pro/renovate-runner'
    || context.implementationWorkflow !== '.github/workflows/renovate.yml'
    || !shaPattern.test(context.implementationSha)
    || context.implementationHead !== context.implementationSha) {
    throw new Error('Unsupported caller or implementation identity');
  }

  const prefix = `${context.callerRepository}/.github/workflows/`;
  const suffix = '@refs/heads/main';
  const ref = context.callerWorkflowRef;
  if (typeof ref !== 'string' || !ref.startsWith(prefix) || !ref.endsWith(suffix)
    || !/^[A-Za-z0-9_.-]+\.ya?ml$/.test(ref.slice(prefix.length, -suffix.length))) {
    throw new Error('Unsupported calling workflow');
  }

  if (!disabled(context.debug) || !disabled(context.stepDebug)) {
    throw new Error('Debug logging is unavailable for private processing');
  }
}

function assertPolicy(policy) {
  if (!policy || typeof policy !== 'object' || Array.isArray(policy)
    || Object.keys(policy).sort().join(',') !== 'organization,repositories'
    || typeof policy.organization !== 'string'
    || !/^[A-Za-z0-9][A-Za-z0-9-]{0,38}$/.test(policy.organization)
    || !Array.isArray(policy.repositories)
    || policy.repositories.length === 0 || policy.repositories.length > 500
    || policy.repositories.some((repo) => !repositoryName(repo)
      || repo.split('/')[0].toLowerCase() !== policy.organization.toLowerCase())
    || new Set(policy.repositories.map((repo) => repo.toLowerCase())).size !== policy.repositories.length) {
    throw new Error('Invalid trusted target policy');
  }
}

/** Build native Renovate settings before any installation token is requested. */
export function createRunPlan({ policy, context, selected = '', mode = 'full' }) {
  assertContext(context);
  assertPolicy(policy);
  if (!['full', 'write'].includes(mode)) throw new Error('Unsupported run mode');
  if (typeof selected !== 'string') throw new Error('Invalid target selection');

  const selection = selected.trim() === '' ? policy.repositories : selected.split(',').map((repo) => repo.trim());
  if (selection.some((repo) => !repositoryName(repo) || !policy.repositories.includes(repo))
    || new Set(selection).size !== selection.length) {
    throw new Error('Target selection is outside the trusted policy');
  }
  const repositories = policy.repositories.filter((repo) => selection.includes(repo));

  return {
    organization: policy.organization,
    repositoryNames: repositories.map((repo) => repo.split('/')[1]),
    config: {
      platform: 'github',
      autodiscover: false,
      repositories,
      dryRun: mode === 'full' ? 'full' : null,
      binarySource: 'global',
      exitCodeForErrors: true,
      prCommitsPerRunLimit: 0,
      allowScripts: false,
      allowPlugins: false,
      allowedCommands: [],
      allowedEnv: [],
      exposeAllEnv: false,
      repositoryCache: 'disabled',
      baseDir: '/tmp/renovate/work',
      cacheDir: '/tmp/renovate/cache',
      containerbaseDir: '/tmp/renovate/containerbase',
      force: {
        schedule: [],
        commitHourlyLimit: 2,
        prConcurrentLimit: 5,
        automerge: false,
      },
    },
  };
}
