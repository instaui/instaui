// Type-checks every ```tsx block in README.md and docs/*.md against the package source, so docs can't rot.
import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const out = join(root, '.docs-check');
rmSync(out, { recursive: true, force: true });
mkdirSync(out);

const pages = [
  'README.md',
  ...readdirSync(join(root, 'docs'))
    .filter((f) => f.endsWith('.md'))
    .map((f) => join('docs', f)),
];

let count = 0;
for (const page of pages) {
  const file = page.replace(/\W+/g, '-'); // README.md -> README-md, docs/x.md -> docs-x-md
  const text = readFileSync(join(root, page), 'utf8');
  for (const [i, match] of [...text.matchAll(/```tsx\n([\s\S]*?)```/g)].entries()) {
    writeFileSync(join(out, `${file}-${i + 1}.tsx`), match[1]);
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
