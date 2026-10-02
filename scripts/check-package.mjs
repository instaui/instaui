// Validates the tarball consumers actually receive (the registry normalises manifests,
// which can hide mistakes): npm pack → publint + attw on that exact artefact.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const run = (cmd, args) => execFileSync(cmd, args, { stdio: 'inherit' });
const dir = mkdtempSync(join(tmpdir(), 'instaui-pack-'));

try {
  const out = execFileSync('npm', ['pack', '--json', '--pack-destination', dir], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  const [{ filename, files }] = JSON.parse(out);
  const tarball = join(dir, filename);
  console.log(`packed ${filename} (${files.length} files)`);

  run('publint', ['run', tarball, '--strict']);
  run('attw', [tarball, '--profile', 'esm-only']);
} finally {
  rmSync(dir, { recursive: true, force: true });
}
