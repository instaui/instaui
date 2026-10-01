# Security policy

Please report vulnerabilities privately through GitHub's **"Report a vulnerability"** (Security → Advisories) on this repository. Don't open public issues for them.

| Version                  | Supported                                                                                                           |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| `1.0.0-next.*` and later | ✅                                                                                                                  |
| `0.9.0-rc.*`             | ⚠️ best effort (pre-1.0 component; file uploads send a placeholder `Authorization` header and post to the page URL) |
| `0.0.x`                  | ❌ (deprecated; contains a placeholder upload `Authorization` header)                                               |
