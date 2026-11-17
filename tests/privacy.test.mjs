import { afterEach, expect, test } from 'bun:test';
import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

const owned = [];
afterEach(() => {
  for (const dir of owned.splice(0)) rmSync(dir, { recursive: true });
});

test.each([0, 23])('the real command discards private output and preserves exit %i', (exit) => {
  const dir = mkdtempSync(resolve(tmpdir(), 'vhco-renovate-output-'));
  owned.push(dir);
  mkdirSync(resolve(dir, 'bin'));
  const stub = resolve(dir, 'bin', 'renovate');
  writeFileSync(stub, `#!/bin/sh\nprintf '%s\\n' PRIVATE-STDOUT-CANARY\nprintf '%s\\n' PRIVATE-STDERR-CANARY >&2\nexit ${exit}\n`);
  chmodSync(stub, 0o700);
  const result = Bun.spawnSync([
    '/bin/sh', resolve(import.meta.dir, '../.github/actions/renovate/scripts/renovate-command.sh'),
  ], {
    env: { PATH: `${dir}/bin:/usr/bin:/bin`, HOME: dir, NO_COLOR: '1' },
    stdout: 'pipe', stderr: 'pipe',
  });
  expect(result.exitCode).toBe(exit);
  expect(result.stdout.toString()).toBe('');
  expect(result.stderr.toString()).toBe('');
});
