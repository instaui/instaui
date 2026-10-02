// Type-checks every ```tsx block in docs/*.md against the package source, so docs can't rot.
import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const out = join(root, '.docs-check');
rmSync(out, { recursive: true, force: true });
mkdirSync(out);

let count = 0;
for (const file of readdirSync(join(root, 'docs')).filter((f) => f.endsWith('.md'))) {
  const text = readFileSync(join(root, 'docs', file), 'utf8');
  for (const [i, match] of [...text.matchAll(/```tsx\n([\s\S]*?)```/g)].entries()) {
    writeFileSync(join(out, `${file.replace(/\.md$/, '')}-${i + 1}.tsx`), match[1]);
    count++;
  }
}
writeFileSync(
  join(out, 'tsconfig.json'),
  JSON.stringify({
    extends: '../tsconfig.json',
    compilerOptions: {
      moduleDetection: 'force',
      noUnusedLocals: false,
      paths: { instaui: ['../src/index.ts'] },
    },
    include: ['./*.tsx'],
  }),
);
try {
  execFileSync('tsc', ['-p', join(out, 'tsconfig.json')], { stdio: 'inherit' });
  console.log(`check-docs: ${count} examples type-check`);
} finally {
  rmSync(out, { recursive: true, force: true });
}
