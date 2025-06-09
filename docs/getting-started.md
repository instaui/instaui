# Getting Started with instaui

This guide will help you get started with instaui, a zero-code CRUD UI generator for React.

## Installation

Install `instaui` with npm or Yarn:

```bash
npm install instaui
# or
yarn add instaui
```

### Dependencies

`instaui` requires the following peer dependencies:

- React 17+
- React DOM 17+

And uses the following libraries:

- antd 5.11.0+
- axios 1.6.0+
- react-router-dom 6.20.0+
- dayjs 1.11.10+

Make sure these dependencies are installed in your project.

## Basic Setup

Here's a basic example of how to use `instaui`:

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
      {
        key: 'id',
        label: 'ID',
        type: 'text',
        required: true,
        readOnly: true,
        showInList: true,
      },
      {
        key: 'name',
        label: 'Name',
        type: 'text',
        required: true,
        showInList: true,
        patchable: true,
        postable: true,
      },
      {
        key: 'email',
        label: 'Email',
        type: 'email',
        required: true,
        showInList: true,
        patchable: true,
        postable: true,
      },
    ],
    validator: (values) => {
      const errors = {};
      if (!values.name) errors.name = 'Name is required';
      if (!values.email) errors.email = 'Email is required';
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
              useDrawer={false} // Use modal instead of drawer
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

export default App;
```

## API Client Configuration

instaui expects an API client that conforms to a specific interface. If your API doesn't match this interface, you can
create an adapter:

```jsx
const createApiClient = (axiosInstance) => {
  return {
    get: async (url, config) => {
      const response = await axiosInstance.get(url, config);
      return { status: 'success', data: response.data };
    },
    post: async (url, data, config) => {
      const response = await axiosInstance.post(url, data, config);
      return { status: 'success', data: response.data };
    },
    patch: async (url, data, config) => {
      const response = await axiosInstance.patch(url, data, config);
      return { status: 'success', data: response.data };
    },
    delete: async (url, config) => {
      const response = await axiosInstance.delete(url, config);
      return { status: 'success', data: response.data };
    },
  };
};

// Usage
const apiClient = createApiClient(axiosInstance);
```

### Expected API Response Format

The API client should return responses in the following format:

```json
{
  "status": "success",
  "data": {
    "items": [...],  // or "data", "results", etc.
    "total": 100     // or "count", etc.
  }
}
```

For single item responses:

```json
{
  "status": "success",
  "data": {
    "id": "1",
    "name": "Example",
    ...
  }
}
```

## Next Steps

Now that you have a basic setup, you can:

- [Configure your endpoints](./configuration.md) with more advanced options
- [Customize the rendering](./custom-rendering.md) of your fields and components
- [Explore the examples](./examples.md) for more advanced use cases