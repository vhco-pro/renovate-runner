import { execFileSync } from 'node:child_process';
import { readFileSync, statSync, writeFileSync } from 'node:fs';

const run = (command, args) => execFileSync(command, args, { encoding: 'utf8' }).trim();
writeFileSync('/work/write-probe', 'owned fixture', { mode: 0o600 });
console.log(JSON.stringify({
  uid: process.getuid(),
  gid: process.getgid(),
  privateMountWritable: readFileSync('/work/write-probe', 'utf8') === 'owned fixture'
    && statSync('/work/write-probe').uid === process.getuid()
    && (statSync('/work').mode & 0o777) === 0o700,
  versions: {
    node: process.versions.node,
    bun: run('bun', ['--version']),
    go: run('go', ['version']),
    php: run('php', ['-r', 'echo PHP_VERSION;']),
    composer: run('composer', ['--version', '--no-ansi']),
  },
}));
