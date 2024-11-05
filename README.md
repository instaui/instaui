
# instaui

`instaui` is a zero-code CRUD UI generator for React, allowing you to create fully functional CRUD interfaces from any REST API with minimal setup. By simply passing in an API client and configuration object, `instaui` dynamically renders all necessary CRUD components and actions, saving you from writing repetitive code.

## Features

- 🛠️ **Instant CRUD UI**: Generate CRUD interfaces by defining an API endpoint and config details.
- 📄 **Server-side Pagination**: Efficiently handles large datasets using server-side pagination.
- 🔗 **Relation Management**: Supports related entities, seamlessly linking them within the UI.
- ✏️ **Built-in Validation**: Define custom validators for each field in the config.
- 🚀 **Ant Design Integration**: Uses Ant Design's Drawer and components for a polished UI out of the box.
- 🔄 **Routing & Breadcrumbs**: Integrated routing and breadcrumb support for easy navigation.

## Installation

Install `instaui` with npm or Yarn:

```bash
npm install instaui
# or
yarn add instaui
```

## Usage

To get started, import `instaui` and provide it with the required configuration props.

### Basic Setup

```typescript
import React from 'react';
import Instaui from 'instaui';
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'https://example.com/api',
  headers: { Authorization: 'Bearer your-token' },
});

const userConfig = {
  entity: "users",
  endpoint: "/users",
  keys: [
    {
      key: "fname",
      label: "First Name",
      type: "Text",
      validator: "name",
      creatable: true,
      editable: true,
    },
    {
      key: "lname",
      label: "Last Name",
      type: "Text",
      validator: "name",
      creatable: true,
      editable: true,
    },
    {
      key: "email",
      label: "Email",
      type: "Text",
      validator: "email",
      creatable: true,
      editable: false,
    },
    {
      key: "photo",
      label: "Photo",
      type: "File",
      validator: "image",
      creatable: true,
      editable: false,
      hideInListView: true,
    },
    {
      key: "card",
      label: "Card",
      type: "relation",
      target: "card",
      path: "/cards",
      identifier: "cardId",
    },
  ],
};

function App() {
  return (
    <Instaui
      config={userConfig}
      client={apiClient}
      validators={{
        email: (v) => /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/.test(v)
          ? [true, ""]
          : [false, "Invalid email format"],
        name: (v) => v.length >= 2 ? [true, ""] : [false, "Name too short"],
      }}
    />
  );
}

export default App;
```

### Props

| Prop         | Type        | Description                                                                                             |
|--------------|-------------|---------------------------------------------------------------------------------------------------------|
| `config`     | `object`    | Configuration object defining the entity, fields, validation, and relation details.                     |
| `client`     | `AxiosInstance` | The axios instance for handling API calls, including authentication headers.                     |
| `validators` | `object`    | Custom validation functions for fields. Validators should return `[true, ""]` or `[false, "Error"]`.    |

### Example Config

The `config` prop defines the fields and behavior of each CRUD component. Here’s an example config:

```json
{
  "entity": "users",
  "endpoint": "/users",
  "keys": [
    {
      "key": "fname",
      "label": "First Name",
      "type": "Text",
      "validator": "name",
      "creatable": true,
      "editable": true
    },
    {
      "key": "lname",
      "label": "Last Name",
      "type": "Text",
      "validator": "name",
      "creatable": true,
      "editable": true
    },
    {
      "key": "email",
      "label": "Email",
      "type": "Text",
      "validator": "email",
      "creatable": true,
      "editable": false
    },
    {
      "key": "photo",
      "label": "Photo",
      "type": "File",
      "validator": "image",
      "creatable": true,
      "editable": false,
      "hideInListView": true
    },
    {
      "key": "card",
      "label": "Card",
      "type": "relation",
      "target": "card",
      "path": "/cards",
      "identifier": "cardId"
    }
  ]
}
```

### Validators

Define custom validation functions in the `validators` prop. Each validator should return a tuple with a boolean and an error message:

```typescript
validators: {
  email: (value: string) => /^[\w-]+@([\w-]+\.)+[\w-]{2,4}$/.test(value)
    ? [true, ""]
    : [false, "Invalid email format"],
  name: (value: string) => value.length > 1
    ? [true, ""]
    : [false, "Name too short"],
}
```

## Example with Relations

Define relations in the config to handle foreign entities. The `relation` type field will make requests to the specified `path` and populate options in a dropdown.

## Components

- **Create**: Handles creating a new entity.
- **Edit**: Allows in-line and modal-based editing of fields.
- **Delete**: Enables single-click deletion with confirmation.
- **Detail View**: Displays additional details in a Drawer for fields hidden in list view.

## Contributing

We welcome contributions to `instaui`. Please see our contribution guidelines for more information.

---

## License

This project is licensed under the MIT License.
