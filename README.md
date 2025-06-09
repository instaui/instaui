
# instaui

> **⚠️ Notice:** This package is currently under development and is in **beta**. Features and functionality may change. Use it at your own risk, and feel free to contribute or report issues!

`instaui` is a zero-code CRUD UI generator for React, allowing you to create fully functional CRUD interfaces from any REST API with minimal setup. By simply passing in an API client and configuration object, `instaui` dynamically renders all necessary CRUD components and actions, saving you from writing repetitive code.

## Features

- 🛠️ **Instant CRUD UI**: Generate CRUD interfaces by defining API endpoints and field configurations.
- 📄 **Server-side Pagination**: Efficiently handles large datasets using server-side pagination.
- 🔗 **Relation Management**: Supports related entities, seamlessly linking them within the UI.
- ✏️ **Built-in Validation**: Define custom validators for each field in the config.
- 🚀 **Ant Design Integration**: Uses Ant Design components for a polished UI out of the box.
- 🔄 **Routing & Navigation**: Integrated with React Router for seamless navigation.
- 🎨 **Customizable UI**: Customize headers, footers, and even replace entire components.
- 📱 **Responsive Design**: Works on both desktop and mobile devices.

## Installation

Install `instaui` with npm or Yarn:

```bash
npm install instaui
# or
yarn add instaui
```

## Dependencies

`instaui` requires the following peer dependencies:

- React 17+
- React DOM 17+

And uses the following libraries:

- antd 5.11.0+
- axios 1.6.0+
- react-router-dom 6.20.0+
- dayjs 1.11.10+

## Basic Usage

Here's a basic example of how to use `instaui`:

```jsx
import {ItemCrud} from 'instaui';
import axios from 'axios';
import {BrowserRouter, Routes, Route, Navigate} from 'react-router-dom';

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
            return {status: 'success', data: response.data};
        },
        post: async (url, data, config) => {
            const response = await axiosInstance.post(url, data, config);
            return {status: 'success', data: response.data};
        },
        patch: async (url, data, config) => {
            const response = await axiosInstance.patch(url, data, config);
            return {status: 'success', data: response.data};
        },
        delete: async (url, config) => {
            const response = await axiosInstance.delete(url, config);
            return {status: 'success', data: response.data};
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
              <Route path="/" element={<Navigate to="/users" replace/>}/>
              <Route
                  path="/:entity"
                  element={
                      <ItemCrud
                          apiClient={createApiClient(apiClient)}
                          config={{endpoints}}
                          useDrawer={false} // Use modal instead of drawer
                      />
                  }
              />
              <Route
                  path="/:entity/:operation/:id"
                  element={
                      <ItemCrud
                          apiClient={createApiClient(apiClient)}
                          config={{endpoints}}
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

## Advanced Configuration

### Endpoint Configuration

Each endpoint in the `endpoints` array can have the following properties:

```typescript
interface EndpointConfig {
	key: string;                 // Unique identifier for the endpoint
	label: string;               // Display name for the endpoint
	url: string;                 // API URL for the endpoint
	idField?: string;            // Field to use as the ID (default: 'id')
	fields: FieldConfig[];       // Array of field configurations
	validator: (values: Record<string, unknown>) => Record<string, string>; // Form validation function
	customComponent?: React.ComponentType; // Custom component to render instead of the default CRUD UI
	header?: React.ReactNode;    // Custom header component
	footer?: React.ReactNode;    // Custom footer component
	actionButtons?: ActionButtonConfig; // Configuration for action buttons
}
```

### Field Configuration

Each field in the `fields` array can have the following properties:

```typescript
interface FieldConfig {
	key: string;                 // Field key in the API data
	label: string;               // Display label for the field
	type: 'text' | 'textarea' | 'number' | 'boolean' | 'date' | 'datetime' | 'time' | 'select' | 'relation' | 'url' | 'email'; // Field type
	required?: boolean;          // Whether the field is required
	readOnly?: boolean;          // Whether the field is read-only
	placeHolder?: string;        // Placeholder text
	options?: { label: string; value: string }[]; // Options for select fields
	relation?: RelationConfig;   // Configuration for relation fields
	showInList?: boolean;        // Whether to show the field in the list view
	sortable?: boolean;          // Whether the field can be sorted
	filterable?: boolean;        // Whether the field can be filtered
	filterType?: 'eq' | 'range' | 'boolean'; // Type of filter to use
	renderInList?: (value: any) => React.ReactNode; // Custom renderer for list view
	renderInDetail?: (value: any) => React.ReactNode; // Custom renderer for detail view
	isFile?: boolean;            // Whether the field is a file upload
	isImage?: boolean;           // Whether the field is an image upload
	accept?: string | string[];  // Accepted file types
	maxSize?: number;            // Maximum file size in MB
	postable?: boolean;          // Whether the field can be included in POST requests
	patchable?: boolean;         // Whether the field can be included in PATCH requests
	dateFormat?: string;         // Format for date fields
	keepLocalTime?: boolean;     // Whether to keep local time for date fields
}
```

### Relation Configuration

For fields of type `relation`, you can configure how the relation works:

```typescript
interface RelationConfig {
	entity: string;              // The related entity key
	idField: string;             // The ID field of the related entity
	keyColumns?: string[];       // Fields to display from the related entity
	dropDownOptions?: (value: Record<string, unknown>) => { label: string; value: string }; // Custom function to format dropdown options
}
```

### Action Button Configuration

You can customize the action buttons for each endpoint:

```typescript
interface ActionButtonConfig {
	show?: boolean;              // Whether to show action buttons at all
	edit?: {
		show?: boolean;            // Whether to show the edit button
		text?: string;             // Custom text for the edit button
		icon?: ReactNode;          // Custom icon for the edit button
	};
	delete?: {
		show?: boolean;            // Whether to show the delete button
		text?: string;             // Custom text for the delete button
		icon?: ReactNode;          // Custom icon for the delete button
	};
}
```

## Custom Rendering

You can customize how fields are rendered in both list and detail views:

```jsx
// Custom renderer for currency values
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

// Field configuration using the custom renderer
{
    key: 'price',
        label
:
    'Price',
        type
:
    'number',
        required
:
    true,
        showInList
:
    true,
        patchable
:
    true,
        postable
:
    true,
        renderInList
:
    formatCurrency,
        renderInDetail
:
    formatCurrency,
}
```

## Custom Components

You can replace the entire CRUD UI for an endpoint with your own custom component:

```jsx
const CustomComponent = () => {
    return (
        <div>
            <h1>Custom Component</h1>
            <p>This is a completely custom component for this endpoint.</p>
        </div>
    );
};

// Endpoint configuration using the custom component
{
    key: 'custom',
        label
:
    'Custom',
        url
:
    '/custom',
        customComponent
:
    CustomComponent,
        fields
:
    [], // Fields are not used when a custom component is provided
}
```

## Custom Headers and Footers

You can add custom headers and footers to any endpoint:

```jsx
const CustomHeader = () => {
    return (
        <div style={{padding: '16px', background: '#f0f2f5', marginBottom: '24px'}}>
            <h2>Custom Header</h2>
            <p>This is a custom header for this endpoint.</p>
        </div>
    );
};

const CustomFooter = () => {
    return (
        <div style={{padding: '16px', background: '#f0f2f5', marginTop: '24px'}}>
            <p>Custom Footer © {new Date().getFullYear()}</p>
        </div>
    );
};

// Endpoint configuration using custom header and footer
{
    key: 'users',
        label
:
    'Users',
        url
:
    '/users',
        header
:
    <CustomHeader/>,
        footer
:
    <CustomFooter/>,
    // ... other configuration
}
```

## Complete Example

For a complete example of how to use `instaui`, see the example below:

```jsx
import {App as AntApp, Card, ConfigProvider, Typography} from 'antd';
import {BrowserRouter, Navigate, Route, Routes} from 'react-router-dom';

import {EndpointConfig, ItemCrud} from 'instaui';
import axios from 'axios';
import React from 'react';
import {createApiClient} from './utils/apiAdapter';

// Helper functions for custom rendering
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
        active: {color: 'green', text: 'Active'},
        inactive: {color: 'red', text: 'Inactive'},
        pending: {color: 'orange', text: 'Pending'},
        completed: {color: 'blue', text: 'Completed'},
    };

    const statusValue = String(value).toLowerCase();
    const status = statusMap[statusValue] || statusMap['inactive'];

    return (
        <span style={{color: status.color, fontWeight: 'bold'}}>
      {status.text}
    </span>
    );
};

// Custom component for the Items endpoint
const CustomItemsComponent = () => {
    const {Title, Paragraph, Text} = Typography;

    return (
        <div style={{padding: '20px'}}>
            <div style={{marginBottom: '20px'}}>
                <Title level={2}>Custom Items View</Title>
                <Paragraph>
                    This is a custom component for the Items endpoint. It demonstrates how to use custom renders.
                </Paragraph>
            </div>

            <div style={{display: 'flex', flexWrap: 'wrap', gap: '16px'}}>
                <Card
                    title="Sample Item"
                    style={{width: 300}}
                    hoverable
                >
                    <p><Text strong>Description:</Text> This is a sample item description.</p>
                    <p><Text strong>Price:</Text> {formatCurrency(99.99)}</p>
                    <p><Text strong>Status:</Text> {formatStatus('active')}</p>
                </Card>
                <Card
                    title="Another Item"
                    style={{width: 300}}
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

// Custom header component
const CustomHeader = () => {
    const {Title} = Typography;

    return (
        <div style={{
            padding: '16px',
            background: '#f0f2f5',
            borderRadius: '4px',
            marginBottom: '24px'
        }}>
            <Title level={2} style={{margin: 0}}>Custom Header</Title>
            <p>This is a custom header that can be used with any endpoint.</p>
        </div>
    );
};

// Custom footer component
const CustomFooter = () => {
    return (
        <div style={{
            padding: '16px',
            background: '#f0f2f5',
            borderRadius: '4px',
            marginTop: '24px',
            textAlign: 'center'
        }}>
            <p style={{margin: 0}}>instaui © {new Date().getFullYear()}</p>
        </div>
    );
};

// Application-level header component
const AppHeader = () => {
    const {Title} = Typography;

    return (
        <div style={{
            padding: '20px',
            background: '#001529',
            color: 'white',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
        }}>
            <Title level={2} style={{color: 'white', margin: 0}}>Item CRUD Application</Title>
            <p style={{color: 'rgba(255, 255, 255, 0.65)', margin: '8px 0 0 0'}}>
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
            <p style={{margin: 0}}>
                instaui © {new Date().getFullYear()} | All Rights Reserved
            </p>
        </div>
    );
};

function App() {
    const axiosInstance = axios.create({
        baseURL: 'http://localhost:3000',
        headers: {
            Authorization: 'Bearer your-token',
            'Content-Type': 'application/json',
        },
    });

    const apiClient = createApiClient(axiosInstance);

    // You can toggle this to switch between Modal and Drawer
    const useDrawer = false;

    const endpoints = [
        {
            key: 'users',
            label: 'Users',
            url: '/users',
            idField: 'uid',
            // Use custom header and footer but keep the default CRUD component
            header: <div style={{padding: '16px', background: '#e6f7ff', borderRadius: '4px', marginBottom: '24px'}}>
                <Typography.Title level={2} style={{margin: 0}}>Users Management</Typography.Title>
                <Typography.Paragraph>
                    This endpoint uses the default CRUD component but with a custom header and footer.
                </Typography.Paragraph>
            </div>,
            footer: <div style={{
                padding: '16px',
                background: '#e6f7ff',
                borderRadius: '4px',
                marginTop: '24px',
                textAlign: 'center'
            }}>
                <Typography.Text>Users data is managed according to our privacy policy.</Typography.Text>
            </div>,
            // Customize action buttons
            actionButtons: {
                edit: {
                    text: 'Modify User',
                },
                delete: {
                    text: 'Remove User',
                },
            },
            fields: [
                {
                    key: 'uid',
                    label: 'ID',
                    type: 'text',
                    required: true,
                    readOnly: true,
                    showInList: true,
                    filterable: true,
                    filterType: 'eq',
                },
                {
                    key: 'fname',
                    label: 'First Name',
                    type: 'text',
                    required: true,
                    showInList: true,
                    patchable: true,
                    postable: true,
                    filterable: true,
                    sortable: true,
                    filterType: 'eq',
                },
                {
                    key: 'lname',
                    label: 'Last Name',
                    type: 'text',
                    required: true,
                    showInList: true,
                    patchable: true,
                    postable: true,
                    filterable: true,
                    filterType: 'eq',
                },
                {
                    key: 'date',
                    label: 'Date',
                    type: 'date',
                    required: true,
                    showInList: true,
                    patchable: true,
                    postable: true,
                    filterable: true,
                    filterType: 'range',
                },
                {
                    key: 'date2',
                    label: 'Date2',
                    type: 'datetime',
                    required: true,
                    showInList: true,
                    patchable: true,
                    postable: true,
                    filterable: true,
                    filterType: 'range',
                    keepLocalTime: false,
                },
                {
                    key: 'photo',
                    label: 'Photo',
                    type: 'url',
                    required: false,
                    showInList: true,
                    patchable: true,
                    postable: true,
                    isImage: true,
                },
                {
                    key: 'status',
                    label: 'Status',
                    type: 'boolean',
                    required: true,
                    showInList: true,
                    patchable: true,
                    postable: true,
                    filterable: true,
                    filterType: 'boolean',
                },
            ],
            validator: (values) => {
                const errors = {};
                if (!values.fname) errors.fname = 'First name is required';
                if (!values.lname) errors.lname = 'Last name is required';
                if (!values.email) errors.email = 'Email is required';
                return errors;
            },
    },
    {
        key: 'items',
        label: 'Items',
        url: '/items',
        idField: 'uid',
        // Use the custom header
        header: <CustomHeader/>,
        // Use the custom footer
        footer: <CustomFooter/>,
        // Hide only the delete button
        actionButtons: {
            delete: {
                show: false
            }
        },
        fields: [
            {
                key: 'uid',
                label: 'ID',
                type: 'text',
                required: true,
                readOnly: true,
                showInList: true,
                filterable: true,
                filterType: 'eq',
            },
            {
                key: 'name',
                label: 'Name',
                type: 'text',
                required: true,
                showInList: true,
                patchable: true,
                postable: true,
                filterable: true,
                filterType: 'eq',
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
                filterable: true,
                filterType: 'range',
            },
            {
                key: 'status',
                label: 'Status',
                type: 'select',
                options: [
                    {label: 'Active', value: 'active'},
                    {label: 'Inactive', value: 'inactive'},
                ],
                required: true,
                showInList: true,
                patchable: true,
                postable: true,
                filterable: true,
                filterType: 'eq',
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
        {
            key: 'cards',
            label: 'Cards',
            url: '/cards',
            idField: 'uid',
            // Use the custom component for this endpoint
            customComponent: CustomItemsComponent,
            fields: [],
        },
    ];

    return (
        <ConfigProvider
            theme={{
                token: {
                    colorPrimary: '#1890ff',
                },
            }}>
            <AntApp notification={{placement: 'bottomRight', duration: 5}}>
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
                        <AppHeader/>

                        {/* Main Content */}
                        <div>
                            <Routes>
                                <Route path='/' element={<Navigate to='/users' replace/>}/>
                                <Route
                                    path='/:entity'
                                    element={
                                        <ItemCrud
                                            apiClient={apiClient}
                                            config={{endpoints}}
                                            useDrawer={useDrawer}
                                        />
                                    }
                                />
                                <Route
                                    path='/:entity/:operation/:id'
                                    element={
                                        <ItemCrud
                                            apiClient={apiClient}
                                            config={{endpoints}}
                                            useDrawer={useDrawer}
                                        />
                                    }
                                />
                            </Routes>
                        </div>

                        {/* Application Footer */}
                        <AppFooter/>
                    </div>
                </BrowserRouter>
            </AntApp>
        </ConfigProvider>
    );
}

export default App;
```

## Documentation

For more detailed documentation, please see the [docs](./docs) folder:

- [Getting Started](./docs/getting-started.md) - Installation and basic setup
- [Components](./docs/components.md) - Documentation for the components provided by instaui
- [Configuration](./docs/configuration.md) - Detailed configuration options
- [Custom Rendering](./docs/custom-rendering.md) - How to customize the rendering of fields and components
- [Examples](./docs/examples.md) - Complete examples of how to use instaui
- [API Reference](./docs/api-reference.md) - Detailed API reference

## Contributing

We welcome contributions to `instaui`. Please feel free to submit issues and pull requests on our GitHub repository.

## License

This project is licensed under the MIT License.
