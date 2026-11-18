import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

// The parent remains host-owned so the official action can stat the config.
// The caller changes ownership of only these two returned paths to the image.
export function prepareStorage(directory, config) {
  const workDirectory = resolve(directory, 'work');
  const configFile = resolve(directory, 'renovate.json');
  mkdirSync(workDirectory, { mode: 0o700 });
  writeFileSync(configFile, `${JSON.stringify(config, null, 2)}\n`, { mode: 0o600 });
  return { workDirectory, configFile };
}
