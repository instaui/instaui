import axios, {AxiosInstance} from 'axios';

// Create an Axios instance with base configuration
const axiosInstance: AxiosInstance = axios.create({
	// In a real application, this would be your API base URL
	baseURL: 'https://jsonplaceholder.typicode.com',
	headers: {
		'Content-Type': 'application/json',
	},
});

// Create an API client adapter that conforms to the expected interface for instaui
export const createApiClient = (axiosInstance: AxiosInstance) => {
	return {
		// GET request handler
		get: async (url: string, config?: any) => {
			try {
				const response = await axiosInstance.get(url, config);
				return {status: 'success', data: response.data};
			} catch (error) {
				console.error('GET request failed:', error);
				return {status: 'error', message: 'Failed to fetch data'};
			}
		},
		
		// POST request handler
		post: async (url: string, data: any, config?: any) => {
			try {
				const response = await axiosInstance.post(url, data, config);
				return {status: 'success', data: response.data};
			} catch (error) {
				console.error('POST request failed:', error);
				return {status: 'error', message: 'Failed to create data'};
			}
		},
		
		// PATCH request handler
		patch: async (url: string, data: any, config?: any) => {
			try {
				const response = await axiosInstance.patch(url, data, config);
				return {status: 'success', data: response.data};
			} catch (error) {
				console.error('PATCH request failed:', error);
				return {status: 'error', message: 'Failed to update data'};
			}
		},
		
		// DELETE request handler
		delete: async (url: string, config?: any) => {
			try {
				const response = await axiosInstance.delete(url, config);
				return {status: 'success', data: response.data};
			} catch (error) {
				console.error('DELETE request failed:', error);
				return {status: 'error', message: 'Failed to delete data'};
			}
		},
	};
};

// Export the configured API client
export const apiClient = createApiClient(axiosInstance);