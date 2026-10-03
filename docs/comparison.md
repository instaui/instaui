# How instaui compares

There are good ways to build an admin today. They differ in what you write, where the app runs, and what your backend has to provide. This page is a fair summary as of October 2026. The other projects change too, so check their sites before deciding.

## At a glance

|                              | You write                                                                                              | Runs in                                                                               | Needs from your backend                                                                    | UI                                                                    | Licence                                                               |
| ---------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- | --------------------------------------------------------------------- |
| **instaui**                  | A description of each resource (data: fields, actions, access)                                         | Your React app, your repo                                                             | Any REST-style API, used through your own HTTP client                                      | antd                                                                  | MIT                                                                   |
| **react-admin**              | React components per resource (`List`, `Edit`, inputs, fields)                                         | Your React app, your repo                                                             | A data provider: many are ready-made (REST, GraphQL, Firebase, Supabase), or you write one | Material UI                                                           | MIT, plus a paid Enterprise Edition                                   |
| **Refine**                   | Hooks plus your own components, or its UI integrations                                                 | Your React app, your repo                                                             | A data provider, the same idea                                                             | Headless, with integrations for antd, Material UI, Mantine and Chakra | MIT (core)                                                            |
| **Ant Design ProComponents** | React components configured with column and field lists (`ProTable`, `ProForm`, `BetaSchemaForm`)      | Your React app, your repo                                                             | A `request` function for each table or form                                                | antd                                                                  | MIT                                                                   |
| **amis**                     | JSON that describes each page: its components, layout and the API calls they make                      | Your web app, through amis's renderer (a React component or a script tag)             | Any HTTP API, answering in amis's `{ status, msg, data }` shape or mapped with adaptors    | Its own, with an antd-style theme                                     | Apache-2.0                                                            |
| **API Platform Admin**       | Little to start: a react-admin app generated from your API's docs, then customised as react-admin code | Your React app, your repo                                                             | Hydra or OpenAPI documentation; works best with an API Platform backend                    | Material UI (it is react-admin)                                       | MIT                                                                   |
| **Retool**                   | Apps assembled in a visual builder, with JavaScript where needed                                       | Retool's platform (self-hosting on enterprise plans)                                  | Database or API connections configured in Retool                                           | Retool's components                                                   | Commercial, priced per user                                           |
| **Appsmith, ToolJet**        | Apps in a visual builder, with JavaScript where needed                                                 | Their platform, self-hostable                                                         | Database or API connections                                                                | Their components                                                      | Open source (Appsmith Apache-2.0, ToolJet AGPL-3.0 community edition) |
| **AdminJS, Forest Admin**    | Little: the admin is generated from your database models or ORM                                        | AdminJS: your Node.js server. Forest Admin: a hosted UI plus an agent in your backend | Access to your database or ORM models                                                      | Their own                                                             | AdminJS open source; Forest Admin commercial                          |

## What makes instaui different

Three things, most important first:

1. **Describe resources, not screens.** You describe each resource once, and the menu, lists, filters, forms, detail views, relation pickers and action dialogs follow from it. In react-admin, Refine and ProComponents, a screen is code you write; ProComponents' column and field lists are props inside that code. amis is data, but it describes pages (components, layout, the endpoint each one calls), so every list, form and detail view is written out. In the visual builders, each screen is assembled by hand.
2. **The description is data.** A resource is a plain object. Conditions, access rules and filters are JSON (`Where`), and custom inputs and screens are referenced by name. TypeScript types and `validateConfig` check a definition before it ships, and a backend can serve it ([Server-driven config](server-driven-config.md)). API Platform Admin also starts from data, your API's docs, but anything the docs don't describe becomes react-admin code.
3. **It fits the API you have.** instaui calls your API through your own HTTP client, with your auth headers and interceptors. Parameter names, envelopes and error formats are configured in one place, and fallbacks cover routes your API lacks (no GET-one, no search). react-admin and Refine adapt to an API with data providers too, but filling a missing route is your code. AdminJS and Forest Admin need your database or ORM rather than your API, so they bypass the API's business rules unless you rebuild them.

Because of those three:

- **The people who know the API can build the admin.** Writing a resource description needs no React knowledge ([a guide for backend developers](for-backend-developers.md)). react-admin and Refine expect React developers. The visual builders need no code, but the result lives outside your repository and its review process.
- **You customise only where it matters.** You can replace one field's input or display, one view, or a whole screen with your own component, and everything else stays generated.
- **It lives in your codebase.** instaui is a library: versioned, reviewed and tested with the rest of your code, with no platform or per-user licence.

## What each one lacks compared with instaui

This is the other half of the picture: what you would build yourself, or give up, with each option. Most gaps are one of the three above: screens you write per resource, configuration a backend can't serve, or API gaps you fill in code. What each option does better than instaui is under [When to choose something else](#when-to-choose-something-else).

- **react-admin**
  - Every resource needs its own `List`, `Create`, `Edit` and `Show` components. The guessers (`ListGuesser`, `EditGuesser`) only print starting code for you to copy and maintain.
  - Screens are code, so a backend can't serve them and they can't be validated as data.
  - Material UI only, so it doesn't fit an antd codebase.
  - Missing routes (no GET-one, no search) and odd envelopes are your data provider's code.
- **Refine**
  - Even with `@refinedev/antd`, you write a list, create, edit and show page for every resource. The Inferencer generates starting code, not a description.
  - Access rules and conditional fields are code (an access-control provider and your components), not data.
  - Missing routes are your data provider's code, as with react-admin.
- **Ant Design ProComponents**
  - It gives you building blocks, not an app. `ProLayout` draws a menu from your route config, but you wire each resource's list, form and detail screens, the routes between them, the relation pickers and the actions yourself.
  - Each table or form has its own `request` function, with no data provider shared across resources.
  - Column options such as `render` are functions in your code, so the configuration can't be served by a backend.
- **amis**
  - It describes pages, not resources. Each list, form and detail view is written out, and each picker names its own endpoint and label mapping.
  - Its UI isn't antd. Your own React components plug in through its renderer registration, not as ordinary components.
  - Your API must answer in its `{ status, msg, data }` shape, or be mapped with adaptors on each request.
  - It has no fallbacks for routes your API lacks.
- **API Platform Admin**
  - Anything the API docs don't describe becomes react-admin code: custom actions, conditional fields, access rules, list filters beyond the spec.
  - It works best when the backend is API Platform (Hydra). With other APIs you're left with plain react-admin.
  - Material UI, as with react-admin.
- **Retool**
  - Screens are assembled in the builder, not derived from a description of your API.
  - The app lives on Retool's platform. Git-based source control and self-hosting are on paid plans.
  - The price is per user.
- **Appsmith, ToolJet**
  - Screens are assembled in a builder, as with Retool.
  - You run and upgrade a platform to get the app.
  - The app lives outside your repository and its review process unless you set up their Git sync.
- **AdminJS, Forest Admin**
  - They work from your database or ORM, so the API's validation, permissions and side effects don't apply unless you rebuild them.
  - They can't serve APIs whose database you don't own, such as third-party APIs or other teams' services.
  - AdminJS needs a Node.js backend.

## When to choose something else

- **react-admin** when you want the most mature ecosystem: many ready-made data providers including GraphQL, a large community, Material UI, and paid enterprise modules (fine-grained permissions, audit logs, real-time).
- **Ant Design ProComponents** when you are on antd and want config-driven tables and forms, from the antd team, inside screens you lay out and route yourself.
- **amis** when you want whole pages as JSON, including dashboards and complex layouts, with a large existing user base, and its UI and response format suit you.
- **API Platform Admin** when your backend is API Platform or publishes Hydra docs, and react-admin's approach suits you.
- **Refine** when you want a headless toolkit and full control of the UI, with React developers on the team.
- **Retool, Appsmith or ToolJet** when the builders aren't developers, or the tool must query databases and many services directly, with no API of your own in between.
- **AdminJS or Forest Admin** when you have database models but no API, and an admin generated straight from them is enough.
- **None of these** for a customer-facing product UI with a bespoke design. Build that with your own components.

instaui is the right fit when you have a REST API and need a solid admin for it quickly, and you want it to be configuration in your own repository, adapted to the API instead of the other way round.
