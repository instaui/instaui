# instaui documentation

instaui turns a REST API into an admin app from a description of its resources: their fields, actions and access rules. Three ideas run through every page here:

1. **Describe resources, not screens.** Lists, filters, forms, detail views and actions follow from each resource's description.
2. **The description is data.** It's checked before it ships, and your backend can serve it.
3. **It fits the API you have.** Its conventions are configured in the frontend, and the API doesn't change.

## How it fits together

1. **Resources** describe what to show: one per collection, such as `/customers` ([Resources and fields](resources-and-fields.md), [Actions and access](actions-and-access.md)).
2. **A data provider** talks to your API, through your own HTTP client, configured for its conventions ([Data providers](data-providers.md)).
3. **`InstaApp`** renders the app. Your own screens plug in where you need a custom design ([Custom fields and escape hatches](custom-fields-and-escape-hatches.md)).

## Where to start

- [A frontend for your REST API](for-backend-developers.md): from an empty folder to a working admin, no React knowledge needed
- [How instaui compares](comparison.md) with react-admin, Refine, ProComponents, amis, Retool and others
- [Getting started](getting-started.md)
- [Resources and fields](resources-and-fields.md)
- [Conditions and filters (`Where`)](where.md)
- [Data providers](data-providers.md)
- [Routing](routing.md)
- [Actions and access](actions-and-access.md)
- [Server-driven config](server-driven-config.md)
- [Custom fields and escape hatches](custom-fields-and-escape-hatches.md)

## Under the hood

instaui has three layers, and each depends only on the ones before it (lint-enforced):

- **Core** is plain TypeScript, with no React or antd. It holds resource definitions, the `Where` language, codecs and payloads, data providers, config validation, and the rules: which actions show and are enabled, what a user may do, and how a list's filters, tabs and URL fit together.
- **React bindings** add data hooks on TanStack Query, routing adapters and the submit pipeline. They contain no antd.
- **The antd renderer** draws tables, forms, dialogs and the app shell. It evaluates every condition and access rule through the core.

So a rule behaves the same in every view, it's unit-tested without a browser, and it doesn't depend on antd. antd is the only renderer today.

Every `tsx` example in these pages is type-checked against the package in CI (`yarn check:docs`).
