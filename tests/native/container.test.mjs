import { expect, test } from 'bun:test';
import { verifyLocal } from '../../scripts/verify-local.mjs';

test('the pinned full image validates configuration and extracts the supported synthetic managers', () => {
  const report = verifyLocal();
  console.info(JSON.stringify(report, null, 2));
  expect(report.uid).toBeGreaterThan(0);
  expect(report.privateMountWritable).toBe(true);
  expect(report.validConfiguration).toBe(true);
  expect(report.selfConfigurationValid).toBe(true);
  expect(report.invalidConfigurationRejected).toBe(true);
  for (const name of ['node', 'bun', 'go', 'php', 'composer']) {
    expect(report.versions[name]).toBeTruthy();
  }
  for (const manager of ['github-actions', 'dockerfile', 'npm', 'gomod', 'composer', 'terraform', 'regex']) {
    expect(report.extraction.managers[manager].depCount).toBeGreaterThan(0);
  }
  expect(report.extraction.managers.regex.depCount).toBeGreaterThanOrEqual(3);
  expect(report.nativeOutputSuppressed).toBe(true);
}, 300_000);
