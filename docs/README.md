# instaui documentation

instaui turns a REST API into an admin app from a description of its resources: their fields, actions and access rules. Lists, filters, detail views, forms and actions come from that description, and the API doesn't change.

## How it fits together

1. **Resources** describe what to show: one per collection, such as `/customers` ([Resources and fields](resources-and-fields.md), [Actions and access](actions-and-access.md)).
2. **A data provider** talks to your API, through your own HTTP client, configured for its conventions ([Data providers](data-providers.md)).
3. **`InstaApp`** renders the app. Your own screens plug in where you need a custom design ([Custom fields and escape hatches](custom-fields-and-escape-hatches.md)).

## Where to start

- [A frontend for your REST API](for-backend-developers.md): from an empty folder to a working admin, no React knowledge needed
- [Getting started](getting-started.md)
- [Resources and fields](resources-and-fields.md)
- [Conditions and filters (`Where`)](where.md)
- [Data providers](data-providers.md)
- [Routing](routing.md)
- [Actions and access](actions-and-access.md)
- [Server-driven config](server-driven-config.md)
- [Custom fields and escape hatches](custom-fields-and-escape-hatches.md)

Every `tsx` example in these pages is type-checked against the package in CI (`yarn check:docs`).
