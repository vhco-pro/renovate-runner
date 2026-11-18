import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';

try {
  const directory = resolve(process.env.PRIVATE_DIRECTORY ?? '');
  const temp = process.env.RUNNER_TEMP;
  if (!temp || dirname(directory) !== resolve(temp)
    || !/^vhco-renovate-[A-Za-z0-9]+$/.test(directory.slice(dirname(directory).length + 1))) {
    throw new Error('Not an owned runner temporary directory');
  }
  execFileSync('sudo', ['rm', '--recursive', '--force', '--', directory], {
    env: { PATH: process.env.PATH, LANG: 'C.UTF-8' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  console.log('✓ Passed: private working-directory removal');
} catch {
  console.error('✗ Failed: private working-directory removal');
  process.exitCode = 1;
}
