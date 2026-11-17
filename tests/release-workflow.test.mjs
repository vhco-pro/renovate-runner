import { expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';

test('main release waits for tests and an exact-source preflight', () => {
  const workflow = Bun.YAML.parse(readFileSync(new URL('../.github/workflows/release.yml', import.meta.url), 'utf8'));
  expect(workflow.on.push.branches).toEqual(['main']);
  expect(workflow.on.workflow_dispatch.inputs['dry-run']).toMatchObject({ type: 'boolean', default: true });
  expect(workflow.on.workflow_dispatch.inputs['expected-sha']).toMatchObject({ type: 'string', default: '' });
  expect(workflow.on.workflow_dispatch.inputs).not.toHaveProperty('version');
  expect(workflow.permissions).toEqual({ contents: 'read' });
  expect(workflow.concurrency).toEqual({
    group: 'release-${{ github.repository }}', queue: 'max', 'cancel-in-progress': false,
  });
  expect(workflow.jobs.checks.uses).toBe('./.github/workflows/ci.yml');
  expect(workflow.jobs.preflight.needs).toEqual(['checks']);
  const guard = workflow.jobs.preflight.steps.find((step) => step.run?.includes('release-preflight.mjs'));
  expect(guard.env).toMatchObject({
    GITHUB_TOKEN: '${{ github.token }}',
    RELEASE_ENABLED: '${{ vars.RELEASE_ENABLED }}',
    RELEASE_DRY_RUN: '${{ inputs.dry-run }}',
    RELEASE_EXPECTED_SHA: '${{ inputs.expected-sha }}',
  });
  expect(workflow.jobs.publish.needs).toEqual(['checks', 'preflight']);
  expect(workflow.jobs.publish.permissions).toEqual({ contents: 'write' });
  expect(workflow.jobs.publish.uses).toBe('vhco-pro/gh-release-workflow/.github/workflows/gh-release.yml@b18de6d2f305f971afe01ba31e17bde5966b1567');
  expect(workflow.jobs.publish.with['dry-run']).toBe("${{ needs.preflight.outputs.dry-run != 'false' }}");
});
