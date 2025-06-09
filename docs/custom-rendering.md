# Custom Rendering

instaui provides several ways to customize the rendering of your CRUD interfaces. This page documents the different
customization options available.

## Custom Field Renderers

You can customize how fields are rendered in both list and detail views by providing custom renderer functions.

### List View Renderers

To customize how a field is rendered in the list view, use the `renderInList` property:

```jsx
{
  key: 'price',
  label: 'Price',
  type: 'number',
  required: true,
  showInList: true,
  renderInList: (value) => {
    if (typeof value === 'number') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);
    }
    return String(value);
  },
}
```

### Detail View Renderers

To customize how a field is rendered in the detail view, use the `renderInDetail` property:

```jsx
{
  key: 'status',
  label: 'Status',
  type: 'select',
  options: [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
  ],
  required: true,
  showInList: true,
  renderInDetail: (value) => {
    const statusMap = {
      active: { color: 'green', text: 'Active' },
      inactive: { color: 'red', text: 'Inactive' },
    };
    
    const statusValue = String(value).toLowerCase();
    const status = statusMap[statusValue] || statusMap['inactive'];
    
    return (
      <span style={{ color: status.color, fontWeight: 'bold' }}>
        {status.text}
      </span>
    );
  },
}
```

### Common Renderer Examples

#### Currency Formatter

```jsx
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

// Usage
{
  key: 'price',
  label: 'Price',
  type: 'number',
  required: true,
  showInList: true,
  renderInList: formatCurrency,
  renderInDetail: formatCurrency,
}
```

#### Status Formatter

```jsx
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

// Usage
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
  renderInList: formatStatus,
  renderInDetail: formatStatus,
}
```

## Custom Components

You can replace the entire CRUD UI for an endpoint with your own custom component by using the `customComponent`
property.

```jsx
import { Typography, Card } from 'antd';

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

// Usage
{
  key: 'items',
  label: 'Items',
  url: '/items',
  idField: 'uid',
  customComponent: CustomItemsComponent,
  fields: [], // Fields are not used when a custom component is provided
}
```

When using a custom component, the `fields` array is not used, as you're providing your own UI. However, you can still
use the `header` and `footer` properties to add custom headers and footers to your component.

## Custom Headers and Footers

You can add custom headers and footers to any endpoint, whether you're using the default CRUD UI or a custom component.

### Custom Headers

```jsx
import { Typography } from 'antd';

const CustomHeader = () => {
  const { Title } = Typography;

  return (
    <div style={{
      padding: '16px',
      background: '#f0f2f5',
      borderRadius: '4px',
      marginBottom: '24px'
    }}>
      <Title level={2} style={{ margin: 0 }}>Custom Header</Title>
      <p>This is a custom header that can be used with any endpoint.</p>
    </div>
  );
};

// Usage
{
  key: 'users',
  label: 'Users',
  url: '/users',
  header: <CustomHeader />,
  // ... other configuration
}
```

### Custom Footers

```jsx
import { Typography } from 'antd';

const CustomFooter = () => {
  return (
    <div style={{
      padding: '16px',
      background: '#f0f2f5',
      borderRadius: '4px',
      marginTop: '24px',
      textAlign: 'center'
    }}>
      <Typography.Text>
        instaui © {new Date().getFullYear()}
      </Typography.Text>
    </div>
  );
};

// Usage
{
  key: 'users',
  label: 'Users',
  url: '/users',
  footer: <CustomFooter />,
  // ... other configuration
}
```

### Inline Headers and Footers

You can also define headers and footers inline:

```jsx
{
  key: 'users',
  label: 'Users',
  url: '/users',
  header: (
    <div style={{ padding: '16px', background: '#e6f7ff', borderRadius: '4px', marginBottom: '24px' }}>
      <Typography.Title level={2} style={{ margin: 0 }}>Users Management</Typography.Title>
      <Typography.Paragraph>
        This endpoint uses the default CRUD component but with a custom header and footer.
      </Typography.Paragraph>
    </div>
  ),
  footer: (
    <div style={{ padding: '16px', background: '#e6f7ff', borderRadius: '4px', marginTop: '24px', textAlign: 'center' }}>
      <Typography.Text>Users data is managed according to our privacy policy.</Typography.Text>
    </div>
  ),
  // ... other configuration
}
```

## Application-Level Customization

You can also add application-level headers and footers to wrap your entire CRUD interface:

```jsx
import { App as AntApp, ConfigProvider, Typography } from 'antd';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ItemCrud } from 'instaui';

// Application-level header component
const AppHeader = () => {
  const { Title } = Typography;

  return (
    <div style={{
      padding: '20px',
      background: '#001529',
      color: 'white',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
    }}>
      <Title level={2} style={{ color: 'white', margin: 0 }}>Item CRUD Application</Title>
      <p style={{ color: 'rgba(255, 255, 255, 0.65)', margin: '8px 0 0 0' }}>
        A React-based CRUD application with dynamic form generation
      </p>
    </div>
  );
};

// Application-level footer component
const AppFooter = () => {
  return (
    <div style={{
      padding: '16px',
      background: '#001529',
      color: 'white',
      textAlign: 'center'
    }}>
      <p style={{ margin: 0 }}>
        instaui © {new Date().getFullYear()} | All Rights Reserved
      </p>
    </div>
  );
};

function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
        },
      }}>
      <AntApp notification={{ placement: 'bottomRight', duration: 5 }}>
        <BrowserRouter>
          <div
            style={{
              width: '100vw',
              height: '100vh',
              overflow: 'scroll',
              display: 'flex',
              flexDirection: 'column',
            }}>
            {/* Application Header */}
            <AppHeader />

            {/* Main Content */}
            <div>
              <Routes>
                <Route path='/' element={<Navigate to='/users' replace />} />
                <Route
                  path='/:entity'
                  element={
                    <ItemCrud
                      apiClient={apiClient}
                      config={{ endpoints }}
                      useDrawer={useDrawer}
                    />
                  }
                />
                <Route
                  path='/:entity/:operation/:id'
                  element={
                    <ItemCrud
                      apiClient={apiClient}
                      config={{ endpoints }}
                      useDrawer={useDrawer}
                    />
                  }
                />
              </Routes>
            </div>

            {/* Application Footer */}
            <AppFooter />
          </div>
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  );
}
```

This approach allows you to have a consistent header and footer across all your CRUD interfaces, while still allowing
for endpoint-specific customization.