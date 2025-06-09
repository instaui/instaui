import {Item, RelationFieldProps} from "./types";
import React, {useCallback, useEffect, useState} from "react";
import {Form, message, Select, Spin} from "antd";
import {UI_CONSTANTS} from "../constants";
import type {NamePath} from "antd/es/form/interface";
import debounce from 'lodash/debounce';

/**
 * RelationField component for selecting related entities
 *
 * This component provides a searchable dropdown that fetches options from an API
 * based on the search text. It supports pagination, loading states, and error handling.
 */
export const RelationField: React.FC<RelationFieldProps> = ({
	                                                            field,
	                                                            apiClient,
	                                                            rules,
	                                                            isDisabled,
	                                                            form,
                                                            }) => {
	// Core state for the component
	const [options, setOptions] = useState<{ label: string; value: string }[]>([]);
	const [loading, setLoading] = useState(false);
	const [searchValue, setSearchValue] = useState('');
	
	// Pagination state
	const [pagination, setPagination] = useState({
		current: 1,
		pageSize: UI_CONSTANTS.DEFAULTS.PAGE_SIZE,
		total: 0
	});
	
	/**
	 * Fetch options from the API
	 * @param page - Page number to fetch
	 * @param search - Search text to filter results
	 */
	const fetchOptions = useCallback(async (page = 1, search = '') => {
		if (!field.relation) return;
		
		try {
			setLoading(true);
			
			// Build query parameters
			const queryParams: Record<string, string> = {
				[UI_CONSTANTS.URL_PARAMS.PAGE]: page.toString(),
				[UI_CONSTANTS.URL_PARAMS.PAGE_SIZE]: pagination.pageSize.toString(),
			};
			
			// Add columns to fetch
			if (field.relation.keyColumns?.length) {
				queryParams['cols'] = field.relation.keyColumns.join(',');
			}
			
			// Add search filter if provided
			if (search) {
				queryParams['search'] = search;
			}
			
			// Construct query string
			const queryString = Object.entries(queryParams)
				.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
				.join('&');
			
			// Make API request
			const response = await apiClient.get(`/${field.relation.entity}?${queryString}`);
			
			// Process response data
			const responseData = response.data;
			
			// Handle different response structures
			let items: Item[] = [];
			let total = 0;
			
			if (responseData) {
				// Case 1: Standard structure with data property containing array
				if (responseData.data && Array.isArray(responseData.data)) {
					items = responseData.data;
					total = 'count' in responseData ? Number(responseData.count) : items.length;
				}
				// Case 2: Response is directly an array
				else if (Array.isArray(responseData)) {
					items = responseData;
					total = items.length;
				}
				// Case 3: Response has items property (check if it exists first)
				else if ('items' in responseData && responseData.items && Array.isArray(responseData.items)) {
					items = responseData.items;
					total = 'total' in responseData ? Number(responseData.total) : items.length;
				}
				// Case 4: Response has results property (check if it exists first)
				else if ('results' in responseData && responseData.results && Array.isArray(responseData.results)) {
					items = responseData.results;
					total = 'count' in responseData ? Number(responseData.count) : items.length;
				}
			}
			
			// Map items to options
			const newOptions = items.map((item: Item) => {
				if (field.relation?.dropDownOptions) {
					return field.relation.dropDownOptions(item);
				}
				
				// Ensure field.relation is defined (it should be at this point)
				if (!field.relation) {
					return {label: '', value: ''};
				}
				
				// Generate label from keyColumns if available
				let label = '';
				
				if (field.relation.keyColumns && field.relation.keyColumns.length > 0) {
					// Use keyColumns to generate label
					label = field.relation.keyColumns
						.map((col) => item[col])
						.filter(Boolean)
						.join(' - ')
						.toString();
				}
				
				// Fallback if label is empty: try common fields or use the ID
				if (!label) {
					// Try common name fields
					for (const nameField of ['name', 'title', 'label', 'displayName']) {
						if (item[nameField]) {
							label = String(item[nameField]);
							break;
						}
					}
					
					// If still no label, use ID field or first available property
					if (!label) {
						const idValue = item[field.relation.idField];
						if (idValue) {
							label = `ID: ${String(idValue)}`;
						} else {
							// Last resort: use first non-object property
							const firstProp = Object.entries(item)
								.find(([_, val]) => val !== null && typeof val !== 'object');
							
							if (firstProp) {
								label = String(firstProp[1]);
							} else {
								label = 'Unknown';
							}
						}
					}
				}
				
				return {
					label,
					value: String(item[field.relation.idField] || ''),
				};
			});
			
			// Update options - replace on first page, append on subsequent pages
			setOptions(prev => {
				// Ensure we're returning an array of objects with the correct type
				const updatedOptions = page === 1 ? newOptions : [...prev, ...newOptions];
				return updatedOptions as { label: string; value: string }[];
			});
			
			// Update pagination
			setPagination(prev => ({
				...prev,
				current: page,
				total: total || 0, // Ensure total is always a number
			}));
		} catch (error) {
			console.error('Error fetching relation options:', error);
			const {message: errMessage} = error as { message: string };
			message.error(errMessage ?? UI_CONSTANTS.MODAL_MESSAGES.FAILED_TO_LOAD_RELATION);
			
			// Set empty options to prevent UI from being stuck in loading state
			setOptions([]);
		} finally {
			setLoading(false);
		}
	}, [field.relation, apiClient, pagination.pageSize]);
	
	// Create debounced search function
	const debouncedFetchOptions = useCallback(
		debounce((value: string) => {
			fetchOptions(1, value);
		}, 300),
		[fetchOptions]
	);
	
	// Handle search input change
	const handleSearch = useCallback((value: string) => {
		setSearchValue(value);
		debouncedFetchOptions(value);
	}, [debouncedFetchOptions]);
	
	// Handle dropdown scroll for pagination
	const handlePopupScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
		const target = e.target as HTMLDivElement;
		if (
			!loading &&
			target.scrollTop + target.offsetHeight >= target.scrollHeight - 20 &&
			options.length < pagination.total
		) {
			fetchOptions(pagination.current + 1, searchValue);
		}
	}, [loading, options.length, pagination, fetchOptions, searchValue]);
	
	// Handle dropdown visibility change
	const handleDropdownVisibleChange = useCallback((visible: boolean) => {
		
		// Load initial options when opening dropdown if no options exist
		if (visible && options.length === 0 && !loading) {
			fetchOptions(1, searchValue);
		}
	}, [options.length, loading, fetchOptions, searchValue]);
	
	// Load initial options on mount
	useEffect(() => {
		fetchOptions(1, '');
	}, [fetchOptions]);
	
	// Get current value from form
	const currentValue = form.getFieldValue(field.key as NamePath);
	
	return (
		<Form.Item name={field.key as NamePath} label={field.label} rules={rules}>
			<Select
				showSearch
				placeholder={field.placeHolder || `Select ${field.label}`}
				disabled={isDisabled}
				loading={loading}
				options={options}
				value={currentValue}
				searchValue={searchValue}
				filterOption={(input, option) =>
					option?.label?.toString().toLowerCase().includes(input.toLowerCase()) ?? false
				}
				onSearch={handleSearch}
				onPopupScroll={handlePopupScroll}
				onChange={(value) => form.setFieldValue(field.key as NamePath, value)}
				onDropdownVisibleChange={handleDropdownVisibleChange}
				notFoundContent={loading ? <Spin size="small"/> : null}
				allowClear
				defaultActiveFirstOption={false}
				autoClearSearchValue={false}
				popupMatchSelectWidth={false}
				listHeight={256}
				getPopupContainer={(triggerNode) => triggerNode.parentNode as HTMLElement}
			/>
		</Form.Item>
	);
};
