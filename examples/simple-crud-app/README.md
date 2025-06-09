# InstaUI Simple CRUD App Example

This is a simple example application that demonstrates how to use the InstaUI package to create a CRUD (Create, Read,
Update, Delete) interface for managing data from a REST API.

## Overview

This example app demonstrates:

1. Setting up an API client for InstaUI
2. Configuring endpoints for users and posts
3. Creating a relation between posts and users
4. Form validation
5. Routing with React Router
6. Styling with Ant Design

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn

### Installation

1. Clone the repository
2. Navigate to the example directory:
   ```bash
   cd examples/simple-crud-app
   ```
3. Install dependencies:
   ```bash
   npm install
   # or
   yarn
   ```

> **Note:** This example app is configured to use the local version of the instaui package using a file reference (
`"instaui": "file:../.."`). This allows you to test changes to the main package directly in the example app.

### Running the App

Start the development server:

```bash
npm start
# or
yarn start
```

The app will be available at [http://localhost:3000](http://localhost:3000).

## How It Works

### API Client

The app uses a mock API for demonstration purposes. The API client is configured in `src/App.tsx` and implements the
`ApiClient` interface:

```typescript
const apiClient: ApiClient = {
	get: async (url: string, config?: any) => {
		try {
			const response = await axiosInstance.get(url, config);
			return response.data
		} catch (error) {
			console.error('GET request failed:', error);
			return {status: 'error', message: 'Failed to fetch data', data: {data: []}};
		}
	},
	post: async (url: string, data?: unknown, config?: any) => {
		try {
			const response = await axiosInstance.post(url, data, config);
			return response.data
		} catch (error) {
			console.error('POST request failed:', error);
			return {status: 'error', message: 'Failed to create data', data: {data: {}}};
		}
	},
	patch: async (url: string, data?: unknown, config?: any) => {
		try {
			const response = await axiosInstance.patch(url, data, config);
			return response.data
		} catch (error) {
			console.error('PATCH request failed:', error);
			return {status: 'error', message: 'Failed to update data', data: {data: {}}};
		}
	},
	delete: async (url: string, config?: any) => {
		try {
			const response = await axiosInstance.delete(url, config);
			return response.data
		} catch (error) {
			console.error('DELETE request failed:', error);
			return {status: 'error', message: 'Failed to delete data', data: {data: {}}};
		}
	},
};
```

### Endpoints Configuration

The app defines three endpoints:

1. **Users** - Manages user data with fields for first name, last name, date, photo, and status
2. **Agents** - Manages agent data with fields for first name, last name, name, email, photo, status, and a relation to
   users
3. **Items** - Manages item data with fields for name, description, price, status, image, file, and relations to users
   and agents

Example endpoint configuration:

```typescript
{
	key: 'users',
		label
:
	'Users',
		url
:
	'/users',
		idField
:
	'uid',
		// Use custom header and footer but keep the default CRUD component
		header
:
	<div style = {
	{
		padding: '16px', background
	:
		'#e6f7ff', borderRadius
	:
		'4px', marginBottom
	:
		'24px'
	}
}>
	<Typography.Title level = {2}
	style = {
	{
		margin: 0
	}
}>
	Users
	Management < /Typography.Title>
	< Typography.Paragraph >
	This
	endpoint
	uses
	the
default
	CRUD
	component
	but
	with a custom
	header
	and
	footer.
	< /Typography.Paragraph>
	< /div>,
	footer: <div style = {
	{
		padding: '16px', background
	:
		'#e6f7ff', borderRadius
	:
		'4px', marginTop
	:
		'24px', textAlign
	:
		'center'
	}
}>
	<Typography.Text>Users
	data
	is
	managed
	according
	to
	our
	privacy
	policy. < /Typography.Text>
	< /div>,
	// Customize action buttons
	actionButtons: {
		edit: {
			text: 'Modify User',
		}
	,
		delete
	:
		{
			text: 'Remove User',
		}
	,
	}
,
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
		// More fields...
	],
		validator
:
	(values) => {
		const errors: Record<string, string> = {};
		if (!values.fname) errors.fname = 'First name is required';
		if (!values.lname) errors.lname = 'Last name is required';
		if (!values.email) errors.email = 'Email is required';
		return errors;
	},
}
```

### ItemCrud Component Usage

The `ItemCrud` component is the main component provided by instaui. It's used to create the CRUD interface for each
endpoint:

```typescript
<ItemCrud
	apiClient = {apiClient}
config = {
{
	endpoints
}
}
useDrawer = {false} // Use modal instead of drawer
/>
```

The component takes three props:

- `apiClient`: The API client that implements the ApiClient interface
- `config`: An object containing the endpoints configuration
- `useDrawer`: A boolean indicating whether to use a drawer or modal for forms

### Routing

The app uses React Router to handle navigation between different views:

- `/:entity` - Shows the list view for an entity (users, agents, or items)
- `/:entity/:operation/:id` - Handles operations like create, edit, or view for a specific entity

```typescript
<BrowserRouter>
	<Routes>
		<Route path = "/"
element = { < Navigate
to = "/users"
replace / >
}
/>
< Route
path = "/:entity"
element = {
	< ItemCrud
apiClient = {apiClient}
config = {
{
	endpoints
}
}
useDrawer = {false}
/>
}
/>
< Route
path = "/:entity/:operation/:id"
element = {
	< ItemCrud
apiClient = {apiClient}
config = {
{
	endpoints
}
}
useDrawer = {false}
/>
}
/>
< /Routes>
< /BrowserRouter>
```

## Key Files

- `src/App.tsx` - Main application component with endpoint configuration
- `src/apiClient.ts` - API client configuration
- `src/index.tsx` - Application entry point

## Field Types and Configurations

The example app demonstrates various field types and configurations:

### Basic Field Types

- **Text**: Simple text input fields
  ```typescript
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
  }
  ```

- **Textarea**: Multi-line text input
  ```typescript
  {
    key: 'description',
    label: 'Description',
    type: 'textarea',
    required: true,
    showInList: true,
    patchable: true,
    postable: true,
    filterable: true,
    filterType: 'eq',
  }
  ```

- **Number**: Numeric input with optional formatting
  ```typescript
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
  }
  ```

- **Boolean**: Checkbox or toggle input
  ```typescript
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
  }
  ```

### Date and Time Fields

- **Date**: Date picker
  ```typescript
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
  }
  ```

- **DateTime**: Date and time picker
  ```typescript
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
  }
  ```

### Select and Relation Fields

- **Select**: Dropdown with predefined options
  ```typescript
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
    patchable: true,
    postable: true,
    filterable: true,
    filterType: 'eq',
  }
  ```

- **Relation**: Field that references another entity
  ```typescript
  {
    key: 'user',
    label: 'User',
    type: 'relation',
    required: false,
    showInList: true,
    patchable: true,
    postable: true,
    relation: {
      entity: 'users',
      idField: 'uid',
      keyColumns: ['fname', 'lname', 'email'],
    },
  }
  ```

### File and Image Fields

- **Image**: Image upload field
  ```typescript
  {
    key: 'image',
    label: 'Image',
    type: 'url',
    required: false,
    showInList: true,
    patchable: true,
    postable: true,
    isImage: true,
    maxSize: 0,
  }
  ```

- **File**: File upload field
  ```typescript
  {
    key: 'file',
    label: 'File',
    type: 'url',
    required: false,
    showInList: true,
    patchable: true,
    postable: true,
    isFile: true,
    accept: 'pdf',
    maxSize: 1,
  }
  ```

## Customization

You can customize this example by:

1. Adding more endpoints
2. Modifying field configurations
3. Adding custom renderers for fields
4. Implementing custom headers or footers for specific endpoints
5. Customizing action buttons
6. Using custom components for specific endpoints

## Learn More

For more information about InstaUI, check out the [documentation](../../docs/index.md).
