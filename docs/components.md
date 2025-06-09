# Components

instaui provides several components that you can use to build your CRUD interfaces. This page documents the main
components and their props.

## ItemCrud

The `ItemCrud` component is the main component of instaui. It renders a complete CRUD interface for a set of endpoints.

### Props

| Prop                     | Type               | Description                                                                      |
|--------------------------|--------------------|----------------------------------------------------------------------------------|
| `apiClient`              | `ApiClient`        | The API client to use for making requests.                                       |
| `config`                 | `object`           | The configuration object for the CRUD interface.                                 |
| `config.endpoints`       | `EndpointConfig[]` | An array of endpoint configurations.                                             |
| `config.alertDuration`   | `number`           | (Optional) The duration of alert messages in seconds. Default: 3.                |
| `config.defaultPagesize` | `number`           | (Optional) The default page size for list views. Default: 10.                    |
| `useDrawer`              | `boolean`          | (Optional) Whether to use a drawer instead of a modal for forms. Default: false. |

### Example

```jsx
import { ItemCrud } from 'instaui';
import axios from 'axios';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Create an API client
const apiClient = axios.create({
  baseURL: 'http://localhost:3000',
  headers: {
    Authorization: 'Bearer your-token',
    'Content-Type': 'application/json',
  },
});

// Define your endpoints configuration
const endpoints = [
  {
    key: 'users',
    label: 'Users',
    url: '/users',
    idField: 'id',
    fields: [
      // Field configurations...
    ],
    validator: (values) => {
      // Validation logic...
      return errors;
    },
  },
];

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/users" replace />} />
        <Route
          path="/:entity"
          element={
            <ItemCrud
              apiClient={apiClient}
              config={{ endpoints }}
              useDrawer={false}
            />
          }
        />
        <Route
          path="/:entity/:operation/:id"
          element={
            <ItemCrud
              apiClient={apiClient}
              config={{ endpoints }}
              useDrawer={false}
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
```

## RelationField

The `RelationField` component renders a select field for selecting related entities. It's used internally by the
`ItemCrud` component, but you can also use it directly in your own forms.

### Props

| Prop         | Type           | Description                                     |
|--------------|----------------|-------------------------------------------------|
| `field`      | `FieldConfig`  | The field configuration for the relation field. |
| `apiClient`  | `ApiClient`    | The API client to use for making requests.      |
| `rules`      | `Rule[]`       | The form validation rules for the field.        |
| `isDisabled` | `boolean`      | Whether the field is disabled.                  |
| `form`       | `FormInstance` | The Ant Design form instance.                   |

### Example

```jsx
import { Form } from 'antd';
import { RelationField } from 'instaui';

function MyForm() {
  const [form] = Form.useForm();
  
  const field = {
    key: 'user',
    label: 'User',
    type: 'relation',
    relation: {
      entity: 'users',
      idField: 'id',
      keyColumns: ['name', 'email'],
    },
  };
  
  return (
    <Form form={form}>
      <RelationField
        field={field}
        apiClient={apiClient}
        rules={[{ required: true, message: 'Please select a user' }]}
        isDisabled={false}
        form={form}
      />
    </Form>
  );
}
```

## getRelationString

The `getRelationString` function is a utility function that formats a related entity as a string. It's used internally
by the `RelationField` component, but you can also use it directly in your own code.

### Parameters

| Parameter    | Type       | Description                                          |
|--------------|------------|------------------------------------------------------|
| `item`       | `object`   | The related entity object.                           |
| `keyColumns` | `string[]` | The columns to include in the string representation. |

### Returns

A string representation of the related entity.

### Example

```jsx
import { getRelationString } from 'instaui';

const user = {
  id: '1',
  name: 'John Doe',
  email: 'john@example.com',
};

const relationString = getRelationString(user, ['name', 'email']);
// Output: "John Doe (john@example.com)"
```

## UI_CONSTANTS

The `UI_CONSTANTS` object contains constants used by the instaui components. You can use these constants in your own
code if needed.

### Example

```jsx
import { UI_CONSTANTS } from 'instaui';

console.log(UI_CONSTANTS.DATE_FORMAT); // "YYYY-MM-DD"
console.log(UI_CONSTANTS.DATETIME_FORMAT); // "YYYY-MM-DD HH:mm:ss"
```

## formatDate and formatDateTime

The `formatDate` and `formatDateTime` functions are utility functions for formatting dates. They're used internally by
the instaui components, but you can also use them directly in your own code.

### Parameters

| Parameter | Type                       | Description                                                                                      |
|-----------|----------------------------|--------------------------------------------------------------------------------------------------|
| `date`    | `string \| Date \| number` | The date to format.                                                                              |
| `format`  | `string`                   | (Optional) The format to use. Default: UI_CONSTANTS.DATE_FORMAT or UI_CONSTANTS.DATETIME_FORMAT. |

### Returns

A formatted date string.

### Example

```jsx
import { formatDate, formatDateTime } from 'instaui';

const date = new Date('2023-01-01');
const formattedDate = formatDate(date);
// Output: "2023-01-01"

const formattedDateTime = formatDateTime(date);
// Output: "2023-01-01 00:00:00"
```