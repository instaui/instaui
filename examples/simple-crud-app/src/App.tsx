import React from 'react';
import {ApiClient, EndpointConfig, ItemCrud} from 'instaui';
import axios from 'axios';
import {BrowserRouter, Navigate, Route, Routes} from 'react-router-dom';
import {Typography} from 'antd';


// Create an API client
const axiosInstance = axios.create({
	baseURL: 'http://localhost:3000',
	headers: {
		Authorization: 'Bearer your-token',
		'Content-Type': 'application/json',
	},
});

// Create a properly typed API client that matches the ApiClient interface
const apiClient: ApiClient = {
	get: async (url: string, config?: any) => {
		try {
			const response = await axiosInstance.get(url, config);
			return {message: response.data.message, data: response.data.data, status: response.data.status};
		} catch (error) {
			console.error('GET request failed:', error);
			return {status: 'error', message: 'Failed to fetch data', data: {data: []}};
		}
	},
	post: async (url: string, data?: unknown, config?: any) => {
		try {
			const response = await axiosInstance.post(url, data, config);
			return {message: response.data.message, data: response.data.data, status: response.data.status};
		} catch (error) {
			console.error('POST request failed:', error);
			return {status: 'error', message: 'Failed to create data', data: {data: {}}};
		}
	},
	patch: async (url: string, data?: unknown, config?: any) => {
		try {
			const response = await axiosInstance.patch(url, data, config);
			return {message: response.data.message, data: response.data.data, status: response.data.status};
		} catch (error) {
			console.error('PATCH request failed:', error);
			return {status: 'error', message: 'Failed to update data', data: {data: {}}};
		}
	},
	delete: async (url: string, config?: any) => {
		try {
			const response = await axiosInstance.delete(url, config);
			return {message: response.data.message, data: response.data.data, status: response.data.status};
		} catch (error) {
			console.error('DELETE request failed:', error);
			return {status: 'error', message: 'Failed to delete data', data: {data: {}}};
		}
	},
};

// Helper functions for custom rendering
const formatCurrency = (value: unknown): React.ReactNode => {
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

// Define your endpoints configuration
const header = <div style={{padding: '16px', background: '#e6f7ff', borderRadius: '4px', marginBottom: '24px'}}>
	<Typography.Title level={2} style={{margin: 0}}>Users Management</Typography.Title>
	<Typography.Paragraph>
		This endpoint uses the default CRUD component but with a custom header and footer.
	</Typography.Paragraph>
</div>;
const footer = <div
	style={{padding: '16px', background: '#e6f7ff', borderRadius: '4px', marginTop: '24px', textAlign: 'center'}}>
	<Typography.Text>Users data is managed according to our privacy policy.</Typography.Text>
</div>;

const endpoints: EndpointConfig[] = [
	{
		key: 'users',
		label: 'Users',
		url: '/users',
		idField: 'uid',
		// Use custom header and footer but keep the default CRUD component
		header: header,
		footer: footer,
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
			const errors: Record<string, string> = {};
			if (!values.fname) errors.fname = 'First name is required';
			if (!values.lname) errors.lname = 'Last name is required';
			if (!values.email) errors.email = 'Email is required';
			return errors;
		},
	},
	{
		key: 'agents',
		label: 'Agents',
		url: '/agents',
		idField: 'uid',
		// Hide all action buttons
		actionButtons: {
			show: false
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
				key: 'email',
				label: 'Email',
				type: 'email',
				required: true,
				showInList: true,
				patchable: true,
				postable: true,
				filterable: true,
				filterType: 'eq',
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
			},
			{
				key: 'user',
				label: 'User',
				type: 'relation',
				required: false,
				showInList: false,
				patchable: true,
				postable: true,
				relation: {
					entity: 'users',
					idField: 'uid',
					keyColumns: ['fname', 'lname', 'email'],
					dropDownOptions: (a) => {
						return {
							label: String(a.fname || ''),
							value: String(a.uid || '')
						}
					}
				},
			},
		],
		validator: (values) => {
			const errors: Record<string, string> = {};
			if (!values.fname) errors.fname = 'First name is required';
			if (!values.lname) errors.lname = 'Last name is required';
			if (!values.name) errors.name = 'Name is required';
			if (!values.email) errors.email = 'Email is required';
			if (!values.status) errors.status = 'Status is required';
			return errors;
		},
	},
	{
		key: 'items',
		label: 'Cards',
		url: '/items',
		idField: 'uid',
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
				key: 'description',
				label: 'Description',
				type: 'textarea',
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
				type: 'boolean',
				required: true,
				showInList: true,
				patchable: true,
				postable: true,
				filterable: true,
				sortable: true,
				filterType: 'boolean',
			},
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
			},
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
				
			},
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
			},
			{
				key: 'agent',
				label: 'Agent',
				type: 'relation',
				required: false,
				showInList: true,
				patchable: true,
				postable: true,
				relation: {
					entity: 'agents',
					idField: 'uid',
					keyColumns: ['email', 'uid'],
				},
			},
		],
		validator: (values) => {
			const errors: Record<string, string> = {};
			if (!values.name) errors.name = 'Name is required';
			if (!values.description) errors.description = 'Description is required';
			if (!values.price) errors.price = 'Price is required';
			return errors;
		},
	},
];

const App: React.FC = () => {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<Navigate to="/users" replace/>}/>
				<Route
					path="/:entity"
					element={
						<ItemCrud
							apiClient={apiClient}
							config={{endpoints}}
							useDrawer={false} // Use modal instead of drawer
						/>
					}
				/>
				<Route
					path="/:entity/:operation/:id"
					element={
						<ItemCrud
							apiClient={apiClient}
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
