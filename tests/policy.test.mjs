import { describe, expect, test } from 'bun:test';
import { createRunPlan } from '../.github/actions/renovate/scripts/policy.mjs';

const callerSha = 'a'.repeat(40);
const implementationSha = 'b'.repeat(40);

function request() {
  return {
    policy: {
      organization: 'example-org',
      repositories: ['example-org/fixture-a', 'example-org/fixture-b'],
    },
    selected: '',
    mode: 'full',
    context: {
      callerRepository: 'example-org/caller',
      callerRef: 'refs/heads/main',
      callerSha,
      callerWorkflowRef: 'example-org/caller/.github/workflows/manual.yml@refs/heads/main',
      event: 'workflow_dispatch',
      implementationRepository: 'vhco-pro/renovate-runner',
      implementationWorkflow: '.github/workflows/renovate.yml',
      implementationSha,
      policyHead: callerSha,
      implementationHead: implementationSha,
      debug: '',
      stepDebug: '',
    },
  };
}

describe('trusted target selection', () => {
  test('full dry-run preserves allowlist order and does not carry credentials', () => {
    const plan = createRunPlan(request());
    expect(plan.organization).toBe('example-org');
    expect(plan.repositoryNames).toEqual(['fixture-a', 'fixture-b']);
    expect(plan.config.repositories).toEqual(['example-org/fixture-a', 'example-org/fixture-b']);
    expect(plan.config.dryRun).toBe('full');
    expect(plan.config).not.toHaveProperty('token');
  });

  test('an explicitly selected subset retains policy order', () => {
    const input = request();
    input.selected = 'example-org/fixture-b, example-org/fixture-a';
    expect(createRunPlan(input).repositoryNames).toEqual(['fixture-a', 'fixture-b']);
    input.selected = 'example-org/fixture-b';
    expect(createRunPlan(input).config.repositories).toEqual(['example-org/fixture-b']);
  });

  test.each([
    'another-org/fixture-a',
    'example-org/unlisted',
    'example-org/*',
    'example-org/fixture-a;echo PRIVATE-CANARY',
    'example-org/fixture-a,,example-org/fixture-b',
    'example-org/fixture-a,example-org/fixture-a',
  ])('refuses unsafe or unlisted selection %s', (selected) => {
    expect(() => createRunPlan({ ...request(), selected })).toThrow();
  });

  test.each([
    {},
    { organization: 'example-org', repositories: [] },
    { organization: 'example-org', repositories: ['another-org/fixture-a'] },
    { organization: 'example-org', repositories: ['example-org/a', 'example-org/A'] },
    { organization: 'example-org', repositories: ['example-org/../other'] },
    { organization: 'example-org', repositories: ['example-org/a'], token: 'PRIVATE-CANARY' },
  ])('refuses malformed trusted policy', (policy) => {
    expect(() => createRunPlan({ ...request(), policy })).toThrow();
  });
});

describe('native caller and implementation identity', () => {
  test.each([
    ['callerRef', 'refs/heads/unreviewed'],
    ['callerSha', 'main'],
    ['callerWorkflowRef', 'other/caller/.github/workflows/manual.yml@refs/heads/main'],
    ['callerWorkflowRef', 'example-org/caller/.github/workflows/manual.yml@refs/tags/main'],
    ['event', 'pull_request_target'],
    ['event', 'pull_request'],
    ['implementationRepository', 'example-org/replacement'],
    ['implementationWorkflow', '.github/workflows/arbitrary.yml'],
    ['implementationSha', 'latest'],
    ['implementationHead', callerSha],
    ['policyHead', implementationSha],
  ])('refuses mismatched %s before token generation', (key, value) => {
    const input = request();
    input.context[key] = value;
    expect(() => createRunPlan(input)).toThrow();
  });

  test.each(['debug', 'stepDebug'])('refuses %s for private processing', (key) => {
    for (const value of ['true', 'TRUE', '1', 'unexpected']) {
      const input = request();
      input.context[key] = value;
      expect(() => createRunPlan(input)).toThrow();
    }
  });

  test('accepts a main scheduled caller and distinguishes live mode', () => {
    const input = request();
    input.context.event = 'schedule';
    input.context.callerWorkflowRef = 'example-org/caller/.github/workflows/schedule.yml@refs/heads/main';
    input.mode = 'write';
    expect(createRunPlan(input).config.dryRun).toBeNull();
  });

  test.each(['lookup', 'extract', 'TRUE', 'write\nPRIVATE-CANARY'])('refuses unsupported mode %s', (mode) => {
    expect(() => createRunPlan({ ...request(), mode })).toThrow();
  });
});

test('native policy disables consumer execution and enforces ordinary update controls', () => {
  const { config } = createRunPlan(request());
  expect(config).toMatchObject({
    platform: 'github',
    autodiscover: false,
    binarySource: 'global',
    exitCodeForErrors: true,
    prCommitsPerRunLimit: 0,
    allowScripts: false,
    allowPlugins: false,
    allowedCommands: [],
    allowedEnv: [],
    exposeAllEnv: false,
    repositoryCache: 'disabled',
    force: {
      schedule: [],
      commitHourlyLimit: 2,
      prConcurrentLimit: 5,
      automerge: false,
    },
  });
});

test('refusal messages do not echo hostile input', () => {
  const input = request();
  input.selected = 'PRIVATE-CANARY';
  try {
    createRunPlan(input);
    throw new Error('Expected refusal');
  } catch (error) {
    expect(error.message).not.toContain('PRIVATE-CANARY');
  }
});
