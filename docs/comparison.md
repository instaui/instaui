# How instaui compares

There are good ways to build an admin today. They differ in what you write, where the app runs, and what your backend has to provide. This page is a fair summary as of October 2026. The other projects change too, so check their sites before deciding.

## At a glance

|                           | You write                                                        | Runs in                                                                               | Needs from your backend                                                                    | UI                                                                    | Licence                                                               |
| ------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- | --------------------------------------------------------------------- |
| **instaui**               | A description of each resource (data: fields, actions, access)   | Your React app, your repo                                                             | Any REST-style API, used through your own HTTP client                                      | antd                                                                  | MIT                                                                   |
| **react-admin**           | React components per resource (`List`, `Edit`, inputs, fields)   | Your React app, your repo                                                             | A data provider: many are ready-made (REST, GraphQL, Firebase, Supabase), or you write one | Material UI                                                           | MIT, plus a paid Enterprise Edition                                   |
| **Refine**                | Hooks plus your own components, or its UI integrations           | Your React app, your repo                                                             | A data provider, the same idea                                                             | Headless, with integrations for antd, Material UI, Mantine and Chakra | MIT (core)                                                            |
| **Retool**                | Apps assembled in a visual builder, with JavaScript where needed | Retool's platform (self-hosting on enterprise plans)                                  | Database or API connections configured in Retool                                           | Retool's components                                                   | Commercial, priced per user                                           |
| **Appsmith, ToolJet**     | Apps in a visual builder, with JavaScript where needed           | Their platform, self-hostable                                                         | Database or API connections                                                                | Their components                                                      | Open source (Appsmith Apache-2.0, ToolJet AGPL-3.0 community edition) |
| **AdminJS, Forest Admin** | Little: the admin is generated from your database models or ORM  | AdminJS: your Node.js server. Forest Admin: a hosted UI plus an agent in your backend | Access to your database or ORM models                                                      | Their own                                                             | AdminJS open source; Forest Admin commercial                          |

## What makes instaui different

- **The description is data, not code.** A resource is a plain object. Conditions, access rules and filters are JSON (`Where`), and custom inputs and screens are referenced by name. So a backend can serve the admin's configuration and you can validate it before it ships ([Server-driven config](server-driven-config.md)). In react-admin and Refine, a screen is code you write. In the low-code builders, an app lives in the builder.
- **Your API stays as it is.** instaui calls your API through your own HTTP client, with your auth headers and interceptors. Its conventions are configured in one place: parameter names, envelopes, error formats, and even missing routes (no GET-one, no search). react-admin and Refine do this with data providers too; instaui adds the fallbacks for routes your API lacks. AdminJS and Forest Admin need your database or ORM rather than your API, so they bypass the API's business rules unless you rebuild them.
- **The people who know the API can build the admin.** Writing a resource description needs no React knowledge ([a guide for backend developers](for-backend-developers.md)). react-admin and Refine expect React developers. The visual builders need no code, but the result lives outside your repository and its review process.
- **Custom where it matters, standard everywhere else.** You can replace one field's input or display, one view, or a whole screen with your own component, and everything else stays generated.
- **It lives in your codebase.** instaui is a library: versioned, reviewed and tested with the rest of your code, with no platform or per-user licence.

## When to choose something else

- **react-admin** when you want the most mature ecosystem: many ready-made data providers including GraphQL, a large community, Material UI, and paid enterprise modules (fine-grained permissions, audit logs, real-time).
- **Refine** when you want a headless toolkit and full control of the UI, with React developers on the team.
- **Retool, Appsmith or ToolJet** when the builders aren't developers, or the tool must query databases and many services directly, with no API of your own in between.
- **AdminJS or Forest Admin** when you have database models but no API, and an admin generated straight from them is enough.
- **None of these** for a customer-facing product UI with a bespoke design. Build that with your own components.

instaui is the right fit when you have a REST API and need a solid admin for it quickly, and you want it to be configuration in your own repository, adapted to the API instead of the other way round.
