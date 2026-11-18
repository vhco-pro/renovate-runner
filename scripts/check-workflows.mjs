import { readdirSync } from 'node:fs';
import { join } from 'node:path';

// actionlint 1.7.12 predates these documented GitHub.com fields. Keep all
// other syntax/expression errors blocking; workflow tests check this wiring.
const compatibility = [
  '^property "workflow_(repository|sha|file_path)" is not defined in object type \\{check_run_id: number; container:.*$',
  '^unexpected key "queue" for "concurrency" section\\. expected one of "cancel-in-progress", "group"$',
];
const actionlintImage = 'docker.io/rhysd/actionlint:1.7.12@sha256:b1934ee5f1c509618f2508e6eb47ee0d3520686341fec936f3b79331f9315667';
const paths = process.argv.slice(2);
const files = paths.length ? paths : readdirSync('.github/workflows')
  .filter((name) => /\.ya?ml$/.test(name)).map((name) => join('.github/workflows', name));
if (!files.length || files.some((file) => file.startsWith('-'))) {
  throw new Error('Expected workflow files');
}
console.error('› Checking: actionlint with documented GitHub.com context/concurrency compatibility filters');
const argumentsList = ['-oneline', ...compatibility.flatMap((pattern) => ['-ignore', pattern]), ...files];
let command = ['actionlint', ...argumentsList];
if (Bun.which('actionlint')) {
  const version = Bun.spawnSync(['actionlint', '-version'], { stdout: 'pipe', stderr: 'pipe' });
  const expected = actionlintImage.match(/:([0-9]+\.[0-9]+\.[0-9]+)@/)[1];
  if (version.exitCode !== 0 || !`${version.stdout}${version.stderr}`.split('\n').includes(`v${expected}`)) {
    throw new Error(`Use actionlint ${expected}, matching the pinned workflow-check image`);
  }
} else {
  console.error('› Checking: using the pinned official actionlint container');
  command = ['docker', 'run', '--rm', '--network', 'none',
    '--volume', `${process.cwd()}:/work:ro`, '--workdir', '/work',
    actionlintImage,
    ...argumentsList];
}
const result = Bun.spawnSync(command, { stdout: 'inherit', stderr: 'inherit' });
if (result.error) throw result.error;
process.exitCode = result.exitCode;
