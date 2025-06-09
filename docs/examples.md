# Examples

This page provides complete examples of how to use instaui in different scenarios.

## Basic CRUD

This example shows how to set up a basic CRUD interface for a users endpoint.

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

// Optional: Create an API adapter if your API doesn't match the expected format
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
      {
        key: 'active',
        label: 'Active',
        type: 'boolean',
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
              apiClient={createApiClient(apiClient)}
              config={{ endpoints }}
              useDrawer={false} // Use modal instead of drawer
            />
          }
        />
        <Route
          path="/:entity/:operation/:id"
          element={
            <ItemCrud
              apiClient={createApiClient(apiClient)}
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

## Custom Rendering

This example shows how to use custom renderers for fields.

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

// Custom renderers
const formatCurrency = (value) => {
  if (typeof value === 'number') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }
  return String(value);
};

const formatStatus = (value) => {
  const statusMap = {
    active: { color: 'green', text: 'Active' },
    inactive: { color: 'red', text: 'Inactive' },
    pending: { color: 'orange', text: 'Pending' },
    completed: { color: 'blue', text: 'Completed' },
  };
  
  const statusValue = String(value).toLowerCase();
  const status = statusMap[statusValue] || statusMap['inactive'];
  
  return (
    <span style={{ color: status.color, fontWeight: 'bold' }}>
      {status.text}
    </span>
  );
};

// Define your endpoints configuration
const endpoints = [
  {
    key: 'products',
    label: 'Products',
    url: '/products',
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
        key: 'price',
        label: 'Price',
        type: 'number',
        required: true,
        showInList: true,
        patchable: true,
        postable: true,
        renderInList: formatCurrency,
        renderInDetail: formatCurrency,
      },
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        options: [
          { label: 'Active', value: 'active' },
          { label: 'Inactive', value: 'inactive' },
          { label: 'Pending', value: 'pending' },
          { label: 'Completed', value: 'completed' },
        ],
        required: true,
        showInList: true,
        patchable: true,
        postable: true,
        renderInList: formatStatus,
        renderInDetail: formatStatus,
      },
    ],
    validator: (values) => {
      const errors = {};
      if (!values.name) errors.name = 'Name is required';
      if (!values.price) errors.price = 'Price is required';
      if (!values.status) errors.status = 'Status is required';
      return errors;
    },
  },
];

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/products" replace />} />
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

export default App;
```

## Custom Components

This example shows how to use a custom component for an endpoint.

```jsx
import { ItemCrud } from 'instaui';
import { Typography, Card } from 'antd';
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

// Custom renderers
const formatCurrency = (value) => {
  if (typeof value === 'number') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }
  return String(value);
};

const formatStatus = (value) => {
  const statusMap = {
    active: { color: 'green', text: 'Active' },
    inactive: { color: 'red', text: 'Inactive' },
    pending: { color: 'orange', text: 'Pending' },
    completed: { color: 'blue', text: 'Completed' },
  };
  
  const statusValue = String(value).toLowerCase();
  const status = statusMap[statusValue] || statusMap['inactive'];
  
  return (
    <span style={{ color: status.color, fontWeight: 'bold' }}>
      {status.text}
    </span>
  );
};

// Custom component for the Items endpoint
const CustomItemsComponent = () => {
  const { Title, Paragraph, Text } = Typography;

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '20px' }}>
        <Title level={2}>Custom Items View</Title>
        <Paragraph>
          This is a custom component for the Items endpoint. It demonstrates how to use custom renders.
        </Paragraph>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
        <Card
          title="Sample Item"
          style={{ width: 300 }}
          hoverable
        >
          <p><Text strong>Description:</Text> This is a sample item description.</p>
          <p><Text strong>Price:</Text> {formatCurrency(99.99)}</p>
          <p><Text strong>Status:</Text> {formatStatus('active')}</p>
        </Card>
        <Card
          title="Another Item"
          style={{ width: 300 }}
          hoverable
        >
          <p><Text strong>Description:</Text> Another sample item description.</p>
          <p><Text strong>Price:</Text> {formatCurrency(149.99)}</p>
          <p><Text strong>Status:</Text> {formatStatus('pending')}</p>
        </Card>
      </div>
    </div>
  );
};

// Define your endpoints configuration
const endpoints = [
  {
    key: 'items',
    label: 'Items',
    url: '/items',
    idField: 'id',
    customComponent: CustomItemsComponent,
    fields: [], // Fields are not used when a custom component is provided
  },
];

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/items" replace />} />
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

export default App;
```

## Relation Management

This example shows how to set up relations between entities.

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
  {
    key: 'orders',
    label: 'Orders',
    url: '/orders',
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
        key: 'product',
        label: 'Product',
        type: 'text',
        required: true,
        showInList: true,
        patchable: true,
        postable: true,
      },
      {
        key: 'quantity',
        label: 'Quantity',
        type: 'number',
        required: true,
        showInList: true,
        patchable: true,
        postable: true,
      },
      {
        key: 'user',
        label: 'User',
        type: 'relation',
        required: true,
        showInList: true,
        patchable: true,
        postable: true,
        relation: {
          entity: 'users',
          idField: 'id',
          keyColumns: ['name', 'email'],
          dropDownOptions: (item) => ({
            label: `${item.name} (${item.email})`,
            value: item.id,
          }),
        },
      },
    ],
    validator: (values) => {
      const errors = {};
      if (!values.product) errors.product = 'Product is required';
      if (!values.quantity) errors.quantity = 'Quantity is required';
      if (!values.user) errors.user = 'User is required';
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

export default App;
```

## Complete Example

For a complete example that combines all of the above features, see
the [Complete Example](../README.md#complete-example) in the README.