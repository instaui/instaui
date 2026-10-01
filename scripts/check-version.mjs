// Release guard: valid semver, never a burned version, and (in CI) tag === version.
import { readFileSync } from 'node:fs';

const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

// https://semver.org/#is-there-a-suggested-regular-expression-regex-to-check-a-semver-string
const SEMVER =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

// Used and unpublished by a 2016 package of the same name; npm never allows reuse.
const BURNED = new Set(['1.0.2', '1.0.3']);

const fail = (msg) => {
  console.error(`check-version: ${msg}`);
  process.exit(1);
};

if (!SEMVER.test(version)) fail(`"${version}" is not valid semver`);
if (BURNED.has(version.split('-')[0].split('+')[0]))
  fail(`${version} uses a burned version number; release 1.1.0 after 1.0.1`);

const tag = process.env.RELEASE_TAG;
if (tag && tag !== `v${version}`)
  fail(`tag ${tag} does not match package.json version v${version}`);

console.log(`check-version: ${version} ok`);
