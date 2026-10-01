# Changelog

All notable changes to this project are documented here. This project follows [Semantic Versioning](https://semver.org/).
Note: versions `1.0.2` and `1.0.3` can never be published (npm reserved them from an unrelated 2016 package), so the release after `1.0.1` is `1.1.0`.

## 0.9.0-rc.1

A pre-1.0 release candidate. It repackages the existing `ItemCrud` component, **unchanged in behaviour**, with a correct modern package (plan phase R0). The new 1.0 engine will ship as `1.0.0-next.*`.

### Packaging

- Valid semver version (`0.9.0.rc1` was invalid and rejected by `npm publish`).
- ESM-only build with `tsc` (ES2020, `.d.ts`, declaration and source maps). This replaces the ES5 CommonJS output, which was mislabelled as `import`.
- A single entry point with a correct `exports` map (`types` first, `./package.json` exported) and `sideEffects: false`.
- `react`, `react-dom`, `antd`, `@ant-design/icons` and `dayjs` are now **peer** dependencies, so consumers no longer get duplicate copies. `react-router-dom` is a temporary peer until R1 removes the router dependency.
- Removed unused `axios` and `@babel/runtime`, and replaced `lodash` with a local `debounce`. The package now has **zero runtime dependencies**.
- Public types no longer deep-import `antd/es/*` (these broke `node16`/`nodenext` consumers).
- Added a LICENSE file (MIT).
- publint and `@arethetypeswrong/cli` run against the packed tarball in CI.

### Repository

- `dist/` and `.idea/` are no longer committed. The `.gitignore` is expanded.
- `.yarnrc.yml` uses the `node-modules` linker.
- Removed the outdated `docs/` and the broken `examples/simple-crud-app` (CRA with `react-scripts@^0.0.0`).
- Added ESLint (flat config), Prettier (2 spaces, applied once across the repo), EditorConfig and Vitest (jsdom, Testing Library, and MSW with unhandled requests failing tests).
- Added CI (lint, format, typecheck, test, version guard, package checks; Node 22 and 24; antd 5 and React 18 compatibility lanes) and a tag-triggered release workflow using npm trusted publishing with provenance.
- Added a version guard that refuses invalid semver and the burned versions `1.0.2`/`1.0.3`.
