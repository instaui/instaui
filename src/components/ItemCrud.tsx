import {
	Button,
	DatePicker,
	Drawer,
	Form,
	Image,
	Input,
	InputNumber,
	Layout,
	Menu,
	message,
	Modal,
	notification,
	Select,
	Space,
	Spin,
	Switch,
	Table,
	TimePicker,
	Upload,
} from 'antd';
import {
	DeleteOutlined,
	EditOutlined,
	FileOutlined,
	MenuFoldOutlined,
	MenuUnfoldOutlined,
	PictureOutlined,
} from '@ant-design/icons';
import {EndpointConfig, FieldConfig, Item, ItemCrudProps} from './types';
import type {
	FilterDropdownProps,
	FilterValue,
	SorterResult,
	SortOrder,
	TablePaginationConfig,
} from 'antd/es/table/interface';
import type {ReactNode} from 'react';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import type {UploadChangeParam, UploadFile} from 'antd/es/upload/interface';
import {formatDate, formatDateTime} from '../utils/dateFormat';
import {useLocation, useNavigate, useParams} from 'react-router-dom';

import type {NamePath} from 'antd/es/form/interface';
import {RelationField} from './RelationField';
import type {Rule} from 'antd/es/form';
import {UI_CONSTANTS} from '../constants';
import dayjs from 'dayjs';
import {getRelationString} from './GetRelationString';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);

const {Sider} = Layout;

export default function ItemCrud({
	                                 apiClient,
	                                 config,
	                                 useDrawer = false,
                                 }: ItemCrudProps) {
	const location = useLocation();
	const navigate = useNavigate();
	const {entity, operation, id} = useParams<{
		entity: string;
		operation?: 'view' | 'edit';
		id?: string;
	}>();
	const [items, setItems] = useState<Item[]>([]);
	const [loading, setLoading] = useState(true);
	const [editingItem, setEditingItem] = useState<Item | null>(null);
	const [form] = Form.useForm();
	const [isModalVisible, setIsModalVisible] = useState(false);
	const [selectedEndpoint, setSelectedEndpoint] =
		useState<EndpointConfig | null>(null);
	// Separate endpoint state for modals
	const [modalEndpoint, setModalEndpoint] = useState<EndpointConfig | null>(null);
	const [pagination, setPagination] = useState({
		current: UI_CONSTANTS.DEFAULTS.FIRST_PAGE as number,
		pageSize: UI_CONSTANTS.DEFAULTS.PAGE_SIZE as number,
		total: 0,
	});
	const paginationRef = useRef(pagination);
	paginationRef.current = pagination;
	
	const [api, contextHolder] = notification.useNotification();
	
	const [deleteInput, setDeleteInput] = useState('');
	const [deleteModalVisible, setDeleteModalVisible] = useState(false);
	const [itemToDelete, setItemToDelete] = useState<string | null>(null);
	
	const [detailModalVisible, setDetailModalVisible] = useState(false);
	const [selectedItem, setSelectedItem] = useState<Item | null>(null);
	
	// Track if we're viewing a relation item to prevent navigation on modal close
	const [viewingRelation, setViewingRelation] = useState(false);
	// Store the entity for the modal
	const [modalEntity, setModalEntity] = useState<string | null>(null);
	
	const [modalState, setModalState] = useState<{
		type: 'view' | 'edit' | null;
		item: Item | null;
	}>({type: null, item: null});
	
	const [collapsed, setCollapsed] = useState(false);
	
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [_sorting, setSorting] = useState<{
		field: string | null;
		order: SortOrder;
	}>({
		field: null,
		order: 'ascend',
	});
	const [filters, setFilters] = useState<Record<string, string[]>>({});
	const isMountedRef = useRef<boolean>(true);
	
	// Request tracking
	const requestIdRef = useRef<number>(0);
	const alertDuration =
		config.alertDuration ?? UI_CONSTANTS.DEFAULTS.ALERT_DURATION;
	
	// Cleanup function to prevent memory leaks and state updates after unmount
	useEffect(() => {
		isMountedRef.current = true;
		return () => {
			isMountedRef.current = false;
		};
	}, []);
	
	const fetchItems = useCallback(async () => {
		if (!selectedEndpoint) {
			return;
		}
		
		const currentRequestId = ++requestIdRef.current;
		
		try {
			setLoading(true);
			
			const searchParams = new URLSearchParams(location.search);
			const response = await apiClient.get(selectedEndpoint.url, {
				params: searchParams,
			});
			
			if (!isMountedRef.current || currentRequestId !== requestIdRef.current) {
				return;
			}
			
			
			const responseData = response;
			// Check if the response data has a 'data' property that is an array (ListResponse)
			const isListResponse = Array.isArray(responseData.data);
			const data = isListResponse ? responseData.data as unknown as Item[] : [responseData.data as unknown as Item];
			const count = 'count' in responseData ? responseData.count as number : undefined;
			const total = count ?? data.length ?? 0;
			
			setPagination({
				current: parseInt(
					searchParams.get(UI_CONSTANTS.URL_PARAMS.PAGE) || '1'
				),
				pageSize: parseInt(
					searchParams.get(UI_CONSTANTS.URL_PARAMS.PAGE_SIZE) ||
					config.defaultPagesize?.toString() ||
					UI_CONSTANTS.DEFAULTS.PAGE_SIZE.toString()
				),
				total: total,
			});
			
			const processedItems = data.map((item: Item) => {
				const idField = selectedEndpoint.idField;
				if (idField && !item[idField]) {
					for (const field of UI_CONSTANTS.ID_FIELDS.POSSIBLE_FIELDS) {
						if (item[field]) {
							item[idField] = item[field];
							break;
						}
					}
				}
				return item;
			});
			
			setItems(processedItems);
		} catch (err) {
			if (!isMountedRef.current || currentRequestId !== requestIdRef.current) {
				return;
			}
			
			const errorMessage =
				err instanceof Error
					? err.message
					: UI_CONSTANTS.ERROR_MESSAGES.UNKNOWN_ERROR;
			api.error({
				message: UI_CONSTANTS.ERROR_MESSAGES.ERROR,
				description: `${UI_CONSTANTS.ERROR_MESSAGES.FAILED_TO_FETCH_ITEMS} ${errorMessage}`,
				duration: config.alertDuration || UI_CONSTANTS.DEFAULTS.ALERT_DURATION,
			});
		} finally {
			if (isMountedRef.current && currentRequestId === requestIdRef.current) {
				setLoading(false);
			}
		}
	}, [selectedEndpoint, api, apiClient, location.search]);
	
	// Effect to sync initial URL parameters
	useEffect(() => {
		if (!selectedEndpoint) {
			return;
		}
		
		const searchParams = new URLSearchParams(location.search);
		
		// Sync pagination
		const page = searchParams.get(UI_CONSTANTS.URL_PARAMS.PAGE);
		const pageSize = searchParams.get(UI_CONSTANTS.URL_PARAMS.PAGE_SIZE);
		if (page || pageSize) {
			setPagination({
				current: page ? parseInt(page, 10) : UI_CONSTANTS.DEFAULTS.FIRST_PAGE,
				pageSize: pageSize
					? parseInt(pageSize, 10)
					: UI_CONSTANTS.DEFAULTS.PAGE_SIZE,
				total: pagination.total,
			});
		}
		
		// Sync sorting
		const sort = searchParams.get(UI_CONSTANTS.URL_PARAMS.SORT);
		const order = searchParams.get(UI_CONSTANTS.URL_PARAMS.ORDER);
		if (sort) {
			setSorting({
				field: sort,
				order: order === 'desc' ? 'descend' : 'ascend',
			});
		}
		
		// Sync filters
		const newFilters: Record<string, string[]> = {};
		searchParams.forEach((value, key) => {
			const excludedKeys: string[] = [
				UI_CONSTANTS.URL_PARAMS.PAGE,
				UI_CONSTANTS.URL_PARAMS.PAGE_SIZE,
				UI_CONSTANTS.URL_PARAMS.SORT,
				UI_CONSTANTS.URL_PARAMS.ORDER,
			];
			
			if (!excludedKeys.includes(key)) {
				newFilters[key] = value.split(',');
			}
		});
		setFilters(newFilters);
	}, [selectedEndpoint, location.search]);
	
	// Single effect to handle all data fetching
	useEffect(() => {
		let isSubscribed = true;
		
		const loadData = async () => {
			if (!entity || !isSubscribed) {
				return;
			}
			
			const endpoint = config.endpoints.find((e) => e.key === entity);
			if (!endpoint) {
				return;
			}
			
			// Handle entity change
			if (selectedEndpoint?.key !== entity) {
				setSelectedEndpoint(endpoint);
				// Clear filters when changing endpoints
				setFilters({});
				// Update URL to remove filter parameters
				const searchParams = new URLSearchParams();
				searchParams.set(UI_CONSTANTS.URL_PARAMS.PAGE, String(UI_CONSTANTS.DEFAULTS.FIRST_PAGE));
				searchParams.set(UI_CONSTANTS.URL_PARAMS.PAGE_SIZE, String(pagination.pageSize));
				
				// Only navigate if not viewing a relation
				if (!viewingRelation) {
					navigate(`/${entity}?${searchParams.toString()}`, {replace: true});
				}
				return;
			}
			
			// Handle specific item view/edit
			if (operation && id) {
				fetchItemById(id).then();
				return;
			}
			
			// Handle list view
			fetchItems().then();
		};
		
		loadData();
		
		return () => {
			isSubscribed = false;
		};
	}, [entity, operation, id, selectedEndpoint, fetchItems]);
	
	// Effect to handle URL changes
	useEffect(() => {
		if (!selectedEndpoint || operation || id) {
			return;
		}
		
		const searchParams = new URLSearchParams(location.search);
		const page = searchParams.get(UI_CONSTANTS.URL_PARAMS.PAGE);
		const pageSize = searchParams.get(UI_CONSTANTS.URL_PARAMS.PAGE_SIZE);
		
		if (page || pageSize) {
			const newPage = page
				? parseInt(page, 10)
				: UI_CONSTANTS.DEFAULTS.FIRST_PAGE;
			const newPageSize = pageSize
				? parseInt(pageSize, 10)
				: UI_CONSTANTS.DEFAULTS.PAGE_SIZE;
			
			if (
				newPage !== pagination.current ||
				newPageSize !== pagination.pageSize
			) {
				fetchItems();
			}
		}
	}, [
		location.search,
		selectedEndpoint,
		operation,
		id,
		pagination.current,
		pagination.pageSize,
		fetchItems,
	]);
	
	const handleTableChange = (
		pagination: TablePaginationConfig,
		filters: Record<string, FilterValue | null>,
		sorter: SorterResult<Item> | SorterResult<Item>[]
	) => {
		const searchParams = new URLSearchParams(location.search);
		
		// Preserve existing filters
		Object.entries(filters).forEach(([key, value]) => {
			if (value) {
				if (Array.isArray(value)) {
					searchParams.set(key, value.join(','));
				} else {
					searchParams.set(key, String(value));
				}
			} else {
				searchParams.delete(key);
			}
		});
		
		// Update pagination
		const {current, pageSize} = pagination;
		searchParams.set(UI_CONSTANTS.URL_PARAMS.PAGE, String(current));
		searchParams.set(UI_CONSTANTS.URL_PARAMS.PAGE_SIZE, String(pageSize));
		
		// Handle sorting
		if (Array.isArray(sorter)) {
			if (sorter.length > 0 && sorter[0].column) {
				const field = sorter[0].field as string;
				const order = sorter[0].order;
				
				if (order) {
					searchParams.set(UI_CONSTANTS.URL_PARAMS.SORT, field);
					searchParams.set(
						UI_CONSTANTS.URL_PARAMS.ORDER,
						order === 'ascend' ? 'asc' : 'desc'
					);
				} else {
					searchParams.delete(UI_CONSTANTS.URL_PARAMS.SORT);
					searchParams.delete(UI_CONSTANTS.URL_PARAMS.ORDER);
				}
			}
		} else if (sorter.column) {
			const field = sorter.field as string;
			const order = sorter.order;
			
			if (order) {
				searchParams.set(UI_CONSTANTS.URL_PARAMS.SORT, field);
				searchParams.set(
					UI_CONSTANTS.URL_PARAMS.ORDER,
					order === 'ascend' ? 'asc' : 'desc'
				);
			} else {
				searchParams.delete(UI_CONSTANTS.URL_PARAMS.SORT);
				searchParams.delete(UI_CONSTANTS.URL_PARAMS.ORDER);
			}
		} else {
			searchParams.delete(UI_CONSTANTS.URL_PARAMS.SORT);
			searchParams.delete(UI_CONSTANTS.URL_PARAMS.ORDER);
		}
		
		// Only update URL if not viewing a relation
		if (!viewingRelation) {
			navigate(`${location.pathname}?${searchParams.toString()}`, {
				replace: true,
			});
		}
		
		// Always fetch items with the updated parameters
		fetchItems().then();
	};
	
	const handleRowClick = (record: Item, event: React.MouseEvent) => {
		const target = event.target as HTMLElement;
		
		// Check if the click is on any interactive element
		const isInteractiveElement =
			target.closest('button') ||
			target.closest('img') ||
			target.closest('a') ||
			target.closest('.ant-btn-link') || // Relation field buttons
			target.closest('.ant-select') || // Select dropdowns
			target.closest('.ant-switch') || // Switch components
			target.closest('.ant-upload'); // Upload components
		
		if (isInteractiveElement) {
			return;
		}
		
		// Use the relation entity's endpoint if modalEntity is set
		let endpoint = viewingRelation && modalEndpoint ? modalEndpoint : selectedEndpoint;
		if (modalEntity && viewingRelation && !modalEndpoint) {
			const targetEndpoint = config.endpoints.find(ep => ep.key === modalEntity);
			if (targetEndpoint) {
				endpoint = targetEndpoint;
				setModalEndpoint(targetEndpoint);
			}
		}
		
		const idField = endpoint?.idField;
		if (!idField) {
			api.error({
				message: UI_CONSTANTS.ERROR_MESSAGES.ERROR,
				description: UI_CONSTANTS.ERROR_MESSAGES.ID_FIELD_NOT_CONFIGURED,
				duration: alertDuration,
			});
			return;
		}
		const itemId = record[idField];
		if (!itemId) {
			api.error({
				message: UI_CONSTANTS.ERROR_MESSAGES.ERROR,
				description: UI_CONSTANTS.ERROR_MESSAGES.ITEM_ID_MISSING,
				duration: alertDuration,
			});
			return;
		}
		
		// If we're viewing a relation, fetch and display the item in a modal instead of navigating
		if (viewingRelation && entity) {
			fetchRelationItem(entity, String(itemId));
		} else if (entity) {
			navigate(`/${entity}/view/${itemId}`, {replace: true});
		}
	};
	
	const handleEdit = async (item: Item) => {
		if (!selectedEndpoint && !modalEndpoint) return;
		
		// Use the relation entity's endpoint if modalEntity is set
		let endpoint = viewingRelation && modalEndpoint ? modalEndpoint : selectedEndpoint;
		if (modalEntity && viewingRelation && !modalEndpoint) {
			const targetEndpoint = config.endpoints.find(ep => ep.key === modalEntity);
			if (targetEndpoint) {
				endpoint = targetEndpoint;
				setModalEndpoint(targetEndpoint);
			}
		}
		
		const idField = endpoint?.idField;
		if (!idField) {
			api.error({
				message: UI_CONSTANTS.ERROR_MESSAGES.ERROR,
				description: UI_CONSTANTS.ERROR_MESSAGES.ID_FIELD_NOT_CONFIGURED,
				duration: alertDuration,
			});
			return;
		}
		const itemId = item[idField];
		if (!itemId) {
			api.error({
				message: UI_CONSTANTS.ERROR_MESSAGES.ERROR,
				description: UI_CONSTANTS.ERROR_MESSAGES.ITEM_ID_MISSING,
				duration: alertDuration,
			});
			return;
		}
		
		// If we're viewing a relation, set the modal state to edit without navigating
		if (viewingRelation) {
			// Fetch the item first to ensure we have the complete data
			try {
				setLoading(true);
				
				if (!endpoint) {
					throw new Error(UI_CONSTANTS.ERROR_MESSAGES.ENDPOINT_NOT_CONFIGURED);
				}
				const response = await apiClient.get(`${endpoint.url}/${itemId}`);
				const data = 'data' in response ? response.data as unknown as Item : {} as Item;
				setModalState({type: 'edit', item: data});
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : UI_CONSTANTS.ERROR_MESSAGES.UNKNOWN_ERROR;
				api.error({
					message: UI_CONSTANTS.ERROR_MESSAGES.ERROR,
					description: `${UI_CONSTANTS.ERROR_MESSAGES.FAILED_TO_FETCH_ITEM}${errorMessage}`,
					duration: alertDuration,
				});
			} finally {
				setLoading(false);
			}
		} else {
			navigate(`/${entity}/edit/${itemId}`, {replace: true});
		}
	};
	
	const handleModalClose = () => {
		setModalState({type: null, item: null});
		
		// If we're viewing a relation item, reset modal state and don't navigate
		if (viewingRelation) {
			// Reset modal endpoint
			setModalEndpoint(null);
			setViewingRelation(false);
			// Reset modal entity
			setModalEntity(null);
		} else {
			// Only navigate if we're not viewing a relation
			navigate(`/${entity}`, {replace: true});
		}
	};
	
	const handleDetailModalClose = () => {
		setModalState({type: null, item: null});
		setSelectedItem(null);
		setDetailModalVisible(false);
		
		// If we're viewing a relation item, reset modal state and don't navigate
		if (viewingRelation) {
			// Reset modal endpoint
			setModalEndpoint(null);
			setViewingRelation(false);
			// Reset modal entity
			setModalEntity(null);
		} else {
			// Only navigate if we're not viewing a relation
			navigate(`/${entity}`, {replace: true});
		}
	};
	
	const handleEditFromDetail = () => {
		setDetailModalVisible(false);
		setSelectedItem(null);
		
		// Use the relation entity's endpoint if modalEntity is set
		let endpoint = viewingRelation && modalEndpoint ? modalEndpoint : selectedEndpoint;
		if (modalEntity && viewingRelation && !modalEndpoint) {
			const targetEndpoint = config.endpoints.find(ep => ep.key === modalEntity);
			if (targetEndpoint) {
				endpoint = targetEndpoint;
				setModalEndpoint(targetEndpoint);
			}
		}
		
		const idField = endpoint?.idField;
		if (!idField) {
			api.error({
				message: UI_CONSTANTS.ERROR_MESSAGES.ERROR,
				description: UI_CONSTANTS.ERROR_MESSAGES.ID_FIELD_NOT_CONFIGURED,
				duration: alertDuration,
			});
			return;
		}
		
		if (modalState.item && modalState.item[idField]) {
			if (viewingRelation) {
				// If viewing a relation, set the modal state to edit without navigating
				setModalState({type: 'edit', item: modalState.item});
			} else {
				// Only navigate if not viewing a relation
				navigate(`/${entity}/edit/${modalState.item[idField]}`, {
					replace: true,
				});
			}
		}
	};
	
	// Effect to handle modal visibility based on modalState
	useEffect(() => {
		if (modalState.type && modalState.item) {
			// If modalEntity is set, use the target entity's config to load the view
			if (modalEntity) {
				const targetEndpoint = config.endpoints.find(ep => ep.key === modalEntity);
				if (targetEndpoint) {
					setModalEndpoint(targetEndpoint);
				}
			}
			
			if (modalState.type === 'view') {
				setSelectedItem(modalState.item);
				setDetailModalVisible(true);
				setIsModalVisible(false); // Ensure edit modal is closed
				setEditingItem(null); // Clear any editing state
				form.resetFields(); // Clear form state
			} else if (modalState.type === 'edit') {
				setEditingItem(modalState.item);
				form.setFieldsValue(modalState.item);
				setIsModalVisible(true);
				setDetailModalVisible(false); // Ensure detail modal is closed
				setSelectedItem(null); // Clear detail view state
			}
		} else if (!operation || !id) {
			// Only clear modals if we're not supposed to show one
			setDetailModalVisible(false);
			setSelectedItem(null);
			setIsModalVisible(false);
			setEditingItem(null);
			form.resetFields();
		}
	}, [modalState, form, operation, id, modalEntity, modalEndpoint, config.endpoints]);
	
	const fetchItemById = async (itemId: string) => {
		if ((!selectedEndpoint && !modalEndpoint) || !operation) {
			return;
		}
		
		// Use the relation entity's endpoint if modalEntity is set
		let endpoint = viewingRelation && modalEndpoint ? modalEndpoint : selectedEndpoint;
		if (modalEntity && viewingRelation && !modalEndpoint) {
			const targetEndpoint = config.endpoints.find(ep => ep.key === modalEntity);
			if (targetEndpoint) {
				endpoint = targetEndpoint;
				setModalEndpoint(targetEndpoint);
			}
		}
		
		try {
			setLoading(true);
			
			// Clear existing state
			if (operation === 'edit') {
				setDetailModalVisible(false);
				setSelectedItem(null);
			} else {
				setIsModalVisible(false);
				setEditingItem(null);
				form.resetFields();
			}
			
			if (!endpoint) {
				throw new Error(UI_CONSTANTS.ERROR_MESSAGES.ENDPOINT_NOT_CONFIGURED);
			}
			const response = await apiClient.get(`${endpoint.url}/${itemId}`);
			const responseData = response;
			
			// Ensure data is a single item
			const data = 'data' in responseData ? responseData.data as unknown as Item : {} as Item;
			
			// Set the modal state based on the operation type
			setModalState({type: operation, item: data});
			
			// Additional state updates based on operation
			if (operation === 'edit') {
				setEditingItem(data);
				form.setFieldsValue(data);
			} else if (operation === 'view') {
				setSelectedItem(data);
			}
		} catch (err) {
			const errorMessage =
				err instanceof Error
					? err.message
					: UI_CONSTANTS.ERROR_MESSAGES.UNKNOWN_ERROR;
			api.error({
				message: UI_CONSTANTS.ERROR_MESSAGES.ERROR,
				description: `${UI_CONSTANTS.ERROR_MESSAGES.FAILED_TO_FETCH_ITEM}${errorMessage}`,
				duration: alertDuration,
				placement: UI_CONSTANTS.ERROR_MESSAGES.ERROR_PLACEMENT,
			});
			// Navigate back to the list view on error only if not viewing a relation
			if (!viewingRelation && entity) {
				navigate(`/${entity}`);
			}
		} finally {
			setLoading(false);
		}
	};
	
	const handleSubmit = async (values: Record<string, unknown>) => {
		if (!selectedEndpoint && !modalEndpoint) return;
		
		// Use the relation entity's endpoint if modalEntity is set
		let endpoint = viewingRelation && modalEndpoint ? modalEndpoint : selectedEndpoint;
		if (modalEntity && viewingRelation && !modalEndpoint) {
			const targetEndpoint = config.endpoints.find(ep => ep.key === modalEntity);
			if (targetEndpoint) {
				endpoint = targetEndpoint;
				setModalEndpoint(targetEndpoint);
			}
		}
		
		try {
			setLoading(true);
			
			// Create FormData for the request
			const formData = new FormData();
			
			// Add all form values to FormData
			for (const [key, value] of Object.entries(values)) {
				if (value instanceof File) {
					// If it's a file, append it directly
					formData.append(key, value);
				} else if (typeof value === 'object' && value !== null) {
					// Handle objects (convert to JSON string)
					formData.append(key, JSON.stringify(value));
				} else {
					// For date fields, handle timezone conversion
					if (!endpoint) {
						formData.append(key, String(value));
						continue;
					}
					const field = endpoint.fields.find((f) => f.key === key);
					if (
						field &&
						(field.type === 'date' || field.type === 'datetime') &&
						value
					) {
						const date = dayjs(value as string);
						if (date.isValid()) {
							
							let finalDate;
							if (field.keepLocalTime) {
								// Convert UTC to local time
								finalDate = date.local();
							} else {
								// Keep UTC time as-is
								finalDate = date.utc();
							}
							
							// Format the date without timezone information
							let formattedDate;
							if (field.type === 'date') {
								// For date fields, use YYYY-MM-DD format
								formattedDate = finalDate.format('YYYY-MM-DD');
							} else {
								// For datetime fields, use format without timezone
								formattedDate = finalDate.format('YYYY-MM-DDTHH:mm:ss');
							}
							
							formData.append(key, formattedDate);
						} else {
							formData.append(key, String(value));
						}
					} else {
						// For primitive values
						formData.append(key, String(value));
					}
				}
			}
			
			if (!endpoint) {
				throw new Error(UI_CONSTANTS.ERROR_MESSAGES.ENDPOINT_NOT_CONFIGURED);
			}
			
			if (editingItem) {
				const idField = endpoint.idField;
				if (!idField) {
					throw new Error(UI_CONSTANTS.ERROR_MESSAGES.ID_FIELD_NOT_CONFIGURED);
				}
				const itemId = editingItem[idField];
				if (!itemId) {
					throw new Error(UI_CONSTANTS.ERROR_MESSAGES.ITEM_ID_MISSING);
				}
				await apiClient.patch(`${endpoint.url}/${itemId}`, formData, {
					headers: {
						'Content-Type': 'multipart/form-data',
					},
				});
				api.success({
					message: UI_CONSTANTS.SUCCESS_MESSAGES.SUCCESS,
					description: UI_CONSTANTS.SUCCESS_MESSAGES.ITEM_UPDATED,
					duration: alertDuration,
				});
			} else {
				await apiClient.post(endpoint.url, formData, {
					headers: {
						'Content-Type': 'multipart/form-data',
					},
				});
				api.success({
					message: UI_CONSTANTS.SUCCESS_MESSAGES.SUCCESS,
					description: UI_CONSTANTS.SUCCESS_MESSAGES.ITEM_CREATED,
					duration: alertDuration,
				});
			}
			
			handleModalClose();
			fetchItems().then();
		} catch (err) {
			const errorMessage =
				err instanceof Error
					? err.message
					: UI_CONSTANTS.ERROR_MESSAGES.UNKNOWN_ERROR;
			api.error({
				message: UI_CONSTANTS.ERROR_MESSAGES.ERROR,
				description: `${UI_CONSTANTS.ERROR_MESSAGES.FAILED_TO_SAVE_ITEM} ${errorMessage}`,
				duration: alertDuration,
			});
		} finally {
			setLoading(false);
		}
	};
	
	const handleDelete = async (id: string) => {
		if (!selectedEndpoint) return;
		setDeleteInput('');
		setItemToDelete(id);
		setDeleteModalVisible(true);
	};
	
	const handleDeleteConfirm = async () => {
		if ((!selectedEndpoint && !modalEndpoint) || !itemToDelete || deleteInput !== 'DELETE') return;
		
		// Use the relation entity's endpoint if modalEntity is set
		let endpoint = viewingRelation && modalEndpoint ? modalEndpoint : selectedEndpoint;
		if (modalEntity && viewingRelation && !modalEndpoint) {
			const targetEndpoint = config.endpoints.find(ep => ep.key === modalEntity);
			if (targetEndpoint) {
				endpoint = targetEndpoint;
				setModalEndpoint(targetEndpoint);
			}
		}
		
		try {
			setLoading(true);
			if (!endpoint) {
				throw new Error(UI_CONSTANTS.ERROR_MESSAGES.ENDPOINT_NOT_CONFIGURED);
			}
			await apiClient.delete(`${endpoint.url}/${itemToDelete}`);
			api.success({
				message: UI_CONSTANTS.SUCCESS_MESSAGES.SUCCESS,
				description: UI_CONSTANTS.SUCCESS_MESSAGES.ITEM_DELETED,
				duration: alertDuration,
			});
			fetchItems().then();
		} catch (err) {
			const errorMessage =
				err instanceof Error
					? err.message
					: UI_CONSTANTS.ERROR_MESSAGES.UNKNOWN_ERROR;
			api.error({
				message: errorMessage,
				description: UI_CONSTANTS.ERROR_MESSAGES.FAILED_TO_DELETE_ITEM,
				duration: alertDuration,
			});
		} finally {
			setLoading(false);
			setDeleteModalVisible(false);
			setItemToDelete(null);
			setDeleteInput('');
		}
	};
	
	const renderValue = (value: unknown): string | number | boolean | null => {
		if (value === null || value === undefined) {
			return null;
		}
		
		if (typeof value === 'object') {
			// Handle relation objects that have an idField
			if (value !== null && 'uid' in value) {
				return (value as { uid: string }).uid;
			}
			// Handle Date objects
			if (value instanceof Date) {
				return value.toISOString();
			}
			return String(value);
		}
		
		if (typeof value === 'string') {
			// Handle string "true" / "false" and "1" / "0" as booleans
			if (value === 'true' || value === '1') {
				return true;
			}
			if (value === 'false' || value === '0') {
				return false;
			}
			return value; // Return the string itself if it's not a boolean string
		}
		
		if (typeof value === 'number') {
			// Handle number 1 / 0 as booleans
			if (value === 1) {
				return true;
			}
			if (value === 0) {
				return false;
			}
			return value; // Return the number itself if it's not a boolean representation
		}
		
		if (typeof value === 'boolean') {
			return value; // Return the boolean value itself
		}
		
		return String(value); // Fallback for other types (like Symbol, etc.)
	};
	
	const renderFormField = (field: FieldConfig) => {
		const rules: Rule[] = [
			{
				required: field.required,
				message: `${field.label} ${UI_CONSTANTS.FORM_MESSAGES.REQUIRED_FIELD}`,
			},
		];
		
		if (field.validator) {
			const validatorFn = field.validator;
			rules.push({
				validator: async (_: unknown, value: unknown) => {
					const validationResult = validatorFn(value);
					if (!validationResult.status) {
						throw new Error(
							validationResult.message ||
							UI_CONSTANTS.FORM_MESSAGES.INVALID_VALUE
						);
					}
				},
			});
		}
		
		// Only disable fields that are explicitly marked as read-only
		const isDisabled = field.readOnly === true;
		
		// Handle relations
		if (field.type === 'relation' && field.relation) {
			return (
				<RelationField
					field={field}
					apiClient={apiClient}
					rules={rules}
					isDisabled={isDisabled}
					form={form}
				/>
			);
		}
		
		// Handle file and image uploads
		if (field.isFile || field.isImage) {
			const currentValue = form.getFieldValue(field.key as NamePath);
			const uploadFileList: UploadFile[] = currentValue
				? [
					{
						uid: '-1',
						name: field.key,
						status: 'done',
						url: currentValue,
					},
				]
				: [];
			
			// Add file type validation rule if accept is provided
			if (field.accept) {
				rules.push({
					validator: async (_, value) => {
						if (!value) return Promise.resolve();
						
						// Handle both single file and array of files
						const files = Array.isArray(value) ? value : [value];
						
						// Skip validation if the value is a string URL (existing file) and not a new File object
						// This prevents validation errors when editing an item without changing the file
						if (files.length === 1 && typeof files[0] === 'string') {
							return Promise.resolve();
						}
						
						const acceptTypes = Array.isArray(field.accept)
							? field.accept
							: field.accept?.split(',').map(type => type.trim()) || [];
						
						// Check each file against the accepted types
						for (const file of files) {
							// Skip validation if this is not a new file (e.g., it's a string URL)
							if (typeof file === 'string') continue;
							
							const uploadFile = file.file ?? file as UploadFile;
							const fileType = uploadFile.type || '';
							const fileName = uploadFile.name || '';
							const fileExtension = fileName.includes('.')
								? `.${fileName.split('.').pop()?.toLowerCase()}`
								: '';
							
							const isValidType = acceptTypes.some(type => {
								// Handle wildcards like image/*
								if (type.endsWith('/*')) {
									const mainType = type.split('/')[0];
									return fileType.startsWith(`${mainType}/`);
								}
								// Handle specific extensions like .jpg
								if (type.startsWith('.')) {
									return fileExtension === type.toLowerCase();
								}
								// Handle simple extensions like pdf or odf (without dot)
								if (/^[a-zA-Z0-9]+$/.test(type)) {
									return fileExtension === `.${type.toLowerCase()}`;
								}
								// Handle specific mime types
								return fileType === type;
							});
							
							if (!isValidType) {
								return Promise.reject(
									new Error(`File type not allowed. Accepted types: ${Array.isArray(field.accept) ? field.accept.join(', ') : field.accept}`)
								);
							}
						}
						
						return Promise.resolve();
					}
				});
			}
			
			// Add file size validation rule if maxSize is provided
			if (field.maxSize) {
				rules.push({
					validator: async (_, value) => {
						if (!value) return Promise.resolve();
						
						// Handle both single file and array of files
						const files = Array.isArray(value) ? value : [value];
						
						// Skip validation if the value is a string URL (existing file) and not a new File object
						// This prevents validation errors when editing an item without changing the file
						if (files.length === 1 && typeof files[0] === 'string') {
							return Promise.resolve();
						}
						
						// Check each file against the maxSize constraint
						for (const file of files) {
							// Skip validation if this is not a new file (e.g., it's a string URL)
							if (typeof file === 'string') continue;
							
							const uploadFile = file.file ?? file as UploadFile;
							if (uploadFile.size && field.maxSize && uploadFile.size / 1024 / 1024 > field.maxSize) {
								return Promise.reject(
									new Error(`${UI_CONSTANTS.MODAL_MESSAGES.FILE_SIZE_ERROR} ${field.maxSize}MB!`)
								);
							}
						}
						
						return Promise.resolve();
					}
				});
			}
			
			const uploadProps = {
				name: field.key,
				headers: {
					authorization: 'Bearer your-token',
				},
				beforeUpload: (file: UploadFile) => {
					// Validate file type if accept is provided
					// This validation only happens when a new file is selected, so no need to check if it's an existing file
					if (field.accept) {
						const acceptTypes = Array.isArray(field.accept)
							? field.accept
							: field.accept?.split(',').map(type => type.trim()) || [];
						
						const fileType = file.type || '';
						const fileName = file.name || '';
						const fileExtension = fileName.includes('.')
							? `.${fileName.split('.').pop()?.toLowerCase()}`
							: '';
						
						const isValidType = acceptTypes.some(type => {
							// Handle wildcards like image/*
							if (type.endsWith('/*')) {
								const mainType = type.split('/')[0];
								return fileType.startsWith(`${mainType}/`);
							}
							// Handle specific extensions like .jpg
							if (type.startsWith('.')) {
								return fileExtension === type.toLowerCase();
							}
							// Handle simple extensions like pdf or odf (without dot)
							if (/^[a-zA-Z0-9]+$/.test(type)) {
								return fileExtension === `.${type.toLowerCase()}`;
							}
							// Handle specific mime types
							return fileType === type;
						});
						
						if (!isValidType) {
							message.error(`${file.name} is not a valid file type. Accepted types: ${Array.isArray(field.accept) ? field.accept.join(', ') : field.accept}`);
							return false;
						}
					}
					
					// Validate file size if maxSize is provided
					if (field.maxSize && file.size && file.size / 1024 / 1024 > field.maxSize) {
						message.error(`${UI_CONSTANTS.MODAL_MESSAGES.FILE_SIZE_ERROR} ${field.maxSize}MB!`);
						return false;
					}
					
					return true;
				},
				onChange(info: UploadChangeParam) {
					if (info.file.status === 'uploading') {
						// Store the file in the form state
						form.setFieldValue(field.key as NamePath, info.file.originFileObj);
					} else if (info.file.status === 'done') {
						message.success(
							`${info.file.name} ${UI_CONSTANTS.MODAL_MESSAGES.FILE_SELECT_SUCCESS}`
						);
						// Set the file in the form
						form.setFieldValue(field.key as NamePath, info.file.originFileObj);
					} else if (info.file.status === 'error') {
						message.error(
							`${info.file.name} ${UI_CONSTANTS.MODAL_MESSAGES.FILE_SELECT_FAILED}`
						);
					}
				},
				accept: (() => {
					if (!field.accept) {
						return field.isImage ? 'image/*' : undefined;
					}
					
					const formatAcceptType = (type: string) => {
						// If it's already a valid format (starts with . or contains /), return as is
						if (type.startsWith('.') || type.includes('/')) {
							return type;
						}
						// If it's a simple extension, add a dot prefix
						if (/^[a-zA-Z0-9]+$/.test(type)) {
							return `.${type}`;
						}
						return type;
					};
					
					if (Array.isArray(field.accept)) {
						return field.accept.map(formatAcceptType).join(',');
					}
					
					return field.accept.split(',').map(type => formatAcceptType(type.trim())).join(',');
				})(),
				maxCount: UI_CONSTANTS.DEFAULTS.FIRST_PAGE,
				fileList: uploadFileList,
			};
			
			return (
				<Form.Item
					name={field.key as NamePath}
					label={field.label}
					rules={rules}>
					<Upload {...uploadProps}>
						<Button
							icon={
								(field.isImage ? (
									<PictureOutlined/>
								) : (
									<FileOutlined/>
								)) as ReactNode
							}>
							{field.isImage
								? UI_CONSTANTS.BUTTON_TEXTS.SELECT_IMAGE
								: UI_CONSTANTS.BUTTON_TEXTS.SELECT_FILE}
						</Button>
					</Upload>
				</Form.Item>
			);
		}
		
		switch (field.type) {
			case 'date':
				return (
					<Form.Item
						name={field.key as NamePath}
						label={field.label}
						rules={[
							...rules,
							{
								validator: async (_, value) => {
									if (value && typeof value === 'string') {
										const date = dayjs(value);
										if (!date.isValid()) {
											throw new Error('Invalid date');
										}
									}
								},
							},
						]}
						getValueProps={(value) => {
							if (!value) return {value: null};
							const date = dayjs(value);
							return {value: date.isValid() ? date : null};
						}}
						normalize={(value) => {
							if (!value) return null;
							const date = dayjs(value);
							if (!date.isValid()) return null;
							// If keepLocalTime is true, keep the local time
							// If false, convert to UTC
							return field.keepLocalTime
								? date.toISOString()
								: date.utc().toISOString();
						}}>
						<DatePicker
							style={{width: '100%'}}
							disabled={isDisabled}
							placeholder={field.placeHolder || `Select ${field.label}`}
							format={field.dateFormat || 'YYYY-MM-DD'}
						/>
					</Form.Item>
				);
			case 'datetime':
				return (
					<Form.Item
						name={field.key as NamePath}
						label={field.label}
						rules={[
							...rules,
							{
								validator: async (_, value) => {
									if (value && typeof value === 'string') {
										const date = dayjs(value);
										if (!date.isValid()) {
											throw new Error('Invalid date and time');
										}
									}
								},
							},
						]}
						getValueProps={(value) => {
							if (!value) return {value: null};
							const date = dayjs(value);
							return {value: date.isValid() ? date : null};
						}}
						normalize={(value) => {
							if (!value) return null;
							const date = dayjs(value);
							if (!date.isValid()) return null;
							// If keepLocalTime is true, keep the local time
							// If false, convert to UTC
							return field.keepLocalTime
								? date.toISOString()
								: date.utc().toISOString();
						}}>
						<DatePicker
							showTime
							style={{width: '100%'}}
							disabled={isDisabled}
							placeholder={field.placeHolder || `Select ${field.label}`}
							format={field.dateFormat || 'YYYY-MM-DD HH:mm:ss'}
						/>
					</Form.Item>
				);
			case 'boolean':
				return (
					<Form.Item
						name={field.key as NamePath}
						label={field.label}
						valuePropName='checked'
						rules={rules}>
						<Switch
							checkedChildren={UI_CONSTANTS.STATUS_TEXTS.YES}
							unCheckedChildren={UI_CONSTANTS.STATUS_TEXTS.NO}
							disabled={isDisabled}
						/>
					</Form.Item>
				);
			case 'url':
				return (
					<Form.Item
						name={field.key as NamePath}
						label={field.label}
						rules={rules}>
						<Input
							type='url'
							placeholder={field.placeHolder}
							disabled={isDisabled}
						/>
					</Form.Item>
				);
			case 'email':
				return (
					<Form.Item
						name={field.key as NamePath}
						label={field.label}
						rules={[
							...rules,
							{
								type: 'email',
								message: UI_CONSTANTS.FORM_MESSAGES.INVALID_EMAIL,
							},
						]}>
						<Input
							type='email'
							placeholder={field.placeHolder}
							disabled={isDisabled}
						/>
					</Form.Item>
				);
			case 'number':
				return (
					<Form.Item
						name={field.key as NamePath}
						label={field.label}
						rules={[
							...rules,
							{
								type: 'number',
								message: UI_CONSTANTS.FORM_MESSAGES.INVALID_NUMBER,
							},
						]}>
						<InputNumber
							placeholder={field.placeHolder}
							disabled={isDisabled}
							style={{width: '100%'}}
							min={0}
						/>
					</Form.Item>
				);
			case 'textarea':
				return (
					<Form.Item
						name={field.key as NamePath}
						label={field.label}
						rules={rules}>
						<Input.TextArea
							placeholder={field.placeHolder}
							disabled={isDisabled}
							rows={4}
						/>
					</Form.Item>
				);
			case 'select':
				return (
					<Form.Item
						name={field.key as NamePath}
						label={field.label}
						rules={rules}>
						<Select
							placeholder={field.placeHolder || `Select ${field.label}`}
							disabled={isDisabled}
							allowClear>
							{field.options?.map(
								(option) =>
									(
										<Select.Option key={option.value} value={option.value}>
											{option.label}
										</Select.Option>
									) as ReactNode
							)}
						</Select>
					</Form.Item>
				);
			default:
				return (
					<Form.Item
						name={field.key as NamePath}
						label={field.label}
						rules={rules}>
						<Input placeholder={field.placeHolder} disabled={isDisabled}/>
					</Form.Item>
				);
		}
	};
	
	const columns = selectedEndpoint
		? [
			...selectedEndpoint.fields
				.filter((field) => field.showInList)
				.map((field) => {
					// Get current sort from URL
					const searchParams = new URLSearchParams(location.search);
					const currentSort = searchParams.get(UI_CONSTANTS.URL_PARAMS.SORT);
					const currentOrder = searchParams.get(
						UI_CONSTANTS.URL_PARAMS.ORDER
					);
					
					// Determine the sort order for this column
					let sortOrder: SortOrder | undefined = undefined;
					if (currentSort === field.key) {
						sortOrder = currentOrder === 'asc' ? 'ascend' : 'descend';
					}
					
					return {
						title: field.label,
						dataIndex: field.key,
						key: field.key,
						width: UI_CONSTANTS.LAYOUT.COLUMN_MIN_WIDTH,
						sorter: !!field.sortable,
						sortOrder: sortOrder,
						filtered: field.filterable ? !!filters[field.key] : undefined,
						filters: field.filterable
							? field.filterType === 'boolean'
								? [
									{text: 'Yes', value: 'true'},
									{text: 'No', value: 'false'},
								]
								: undefined
							: undefined,
						filterMode:
							field.filterable && field.filterType === 'eq'
								? ('tree' as const)
								: undefined,
						filterSearch: field.filterable && field.filterType === 'eq',
						filterDropdown: field.filterable
							? ({
								   setSelectedKeys,
								   selectedKeys,
								   confirm,
								   clearFilters,
							   }: FilterDropdownProps) => {
								const handleKeyPress = (e: React.KeyboardEvent) => {
									if (e.key === 'Enter') {
										confirm();
									}
								};
								
								if (field.filterType === 'range' && (field.type === 'date' || field.type === 'datetime')) {
									return (
										<div style={{padding: 8}}>
											<DatePicker
												placeholder={UI_CONSTANTS.FILTER_PLACEHOLDERS.MIN}
												value={selectedKeys[0] ? dayjs(selectedKeys[0] as string) : null}
												onChange={(date) =>
													setSelectedKeys(
														date
															? [
																field.keepLocalTime ? date.toISOString() : date.utc().toISOString(),
																selectedKeys[
																	UI_CONSTANTS.DEFAULTS.FIRST_PAGE
																	],
															]
															: []
													)
												}
												showTime={field.type === 'datetime'}
												style={{
													width: UI_CONSTANTS.LAYOUT.FILTER_INPUT_WIDTH,
													marginRight: UI_CONSTANTS.STYLES.MARGIN.RIGHT,
													marginBottom: 8,
												}}
											/>
											<DatePicker
												placeholder={UI_CONSTANTS.FILTER_PLACEHOLDERS.MAX}
												value={
													selectedKeys[
														UI_CONSTANTS.DEFAULTS.FIRST_PAGE
														] ? dayjs(selectedKeys[
														UI_CONSTANTS.DEFAULTS.FIRST_PAGE
														] as string) : null
												}
												onChange={(date) =>
													setSelectedKeys([selectedKeys[0], date ? (field.keepLocalTime ? date.toISOString() : date.utc().toISOString()) : ''])
												}
												showTime={field.type === 'datetime'}
												style={{
													width: UI_CONSTANTS.LAYOUT.FILTER_INPUT_WIDTH,
													marginBottom: 8,
												}}
											/>
											<div>
												<Button
													type='primary'
													onClick={() => confirm()}
													size='small'
													style={{
														width: UI_CONSTANTS.LAYOUT.FILTER_BUTTON_WIDTH,
														marginRight: UI_CONSTANTS.STYLES.MARGIN.RIGHT,
													}}>
													Filter
												</Button>
												{clearFilters && (
													<Button
														onClick={() => {
															if (clearFilters) {
																clearFilters();
																confirm();
															}
														}}
														size='small'>
														Reset
													</Button>
												)}
											</div>
										</div>
									);
								} else if (field.filterType === 'range' && field.type === 'time') {
									return (
										<div style={{padding: 8}}>
											<TimePicker
												placeholder={UI_CONSTANTS.FILTER_PLACEHOLDERS.MIN}
												value={selectedKeys[0] ? dayjs(selectedKeys[0] as string) : null}
												onChange={(time) =>
													setSelectedKeys(
														time
															? [
																time.format('HH:mm:ss'),
																selectedKeys[
																	UI_CONSTANTS.DEFAULTS.FIRST_PAGE
																	],
															]
															: []
													)
												}
												format="HH:mm:ss"
												style={{
													width: UI_CONSTANTS.LAYOUT.FILTER_INPUT_WIDTH,
													marginRight: UI_CONSTANTS.STYLES.MARGIN.RIGHT,
													marginBottom: 8,
												}}
											/>
											<TimePicker
												placeholder={UI_CONSTANTS.FILTER_PLACEHOLDERS.MAX}
												value={
													selectedKeys[
														UI_CONSTANTS.DEFAULTS.FIRST_PAGE
														] ? dayjs(selectedKeys[
														UI_CONSTANTS.DEFAULTS.FIRST_PAGE
														] as string) : null
												}
												onChange={(time) =>
													setSelectedKeys([selectedKeys[0], time ? time.format('HH:mm:ss') : ''])
												}
												format="HH:mm:ss"
												style={{
													width: UI_CONSTANTS.LAYOUT.FILTER_INPUT_WIDTH,
													marginBottom: 8,
												}}
											/>
											<div>
												<Button
													type='primary'
													onClick={() => confirm()}
													size='small'
													style={{
														width: UI_CONSTANTS.LAYOUT.FILTER_BUTTON_WIDTH,
														marginRight: UI_CONSTANTS.STYLES.MARGIN.RIGHT,
													}}>
													Filter
												</Button>
												{clearFilters && (
													<Button
														onClick={() => {
															if (clearFilters) {
																clearFilters();
																confirm();
															}
														}}
														size='small'>
														Reset
													</Button>
												)}
											</div>
										</div>
									);
								} else if (field.filterType === 'range') {
									return (
										<div style={{padding: 8}}>
											<Input
												placeholder={UI_CONSTANTS.FILTER_PLACEHOLDERS.MIN}
												value={selectedKeys[0] as string}
												onChange={(e) =>
													setSelectedKeys(
														e.target.value
															? [
																e.target.value,
																selectedKeys[
																	UI_CONSTANTS.DEFAULTS.FIRST_PAGE
																	],
															]
															: []
													)
												}
												onKeyPress={handleKeyPress}
												style={{
													width: UI_CONSTANTS.LAYOUT.FILTER_INPUT_WIDTH,
													marginRight: UI_CONSTANTS.STYLES.MARGIN.RIGHT,
													marginBottom: 8,
												}}
											/>
											<Input
												placeholder={UI_CONSTANTS.FILTER_PLACEHOLDERS.MAX}
												value={
													selectedKeys[
														UI_CONSTANTS.DEFAULTS.FIRST_PAGE
														] as string
												}
												onChange={(e) =>
													setSelectedKeys([selectedKeys[0], e.target.value])
												}
												onKeyPress={handleKeyPress}
												style={{
													width: UI_CONSTANTS.LAYOUT.FILTER_INPUT_WIDTH,
													marginBottom: 8,
												}}
											/>
											<div>
												<Button
													type='primary'
													onClick={() => confirm()}
													size='small'
													style={{
														width: UI_CONSTANTS.LAYOUT.FILTER_BUTTON_WIDTH,
														marginRight: UI_CONSTANTS.STYLES.MARGIN.RIGHT,
													}}>
													Filter
												</Button>
												{clearFilters && (
													<Button
														onClick={() => {
															if (clearFilters) {
																clearFilters();
																confirm();
															}
														}}
														size='small'>
														Reset
													</Button>
												)}
											</div>
										</div>
									);
								} else if (field.filterType === 'boolean') {
									return (
										<div style={{padding: 8}}>
											<Select
												allowClear
												placeholder={UI_CONSTANTS.FILTER_PLACEHOLDERS.SELECT}
												style={{
													width: UI_CONSTANTS.LAYOUT.FILTER_SELECT_WIDTH,
													marginBottom: 8,
												}}
												value={selectedKeys[0] as string}
												onChange={(value) => {
													setSelectedKeys(value ? [value] : []);
													confirm();
												}}
												options={[
													{label: 'Yes', value: 'true'},
													{label: 'No', value: 'false'},
												]}
											/>
											<div>
												<Button
													type='primary'
													onClick={() => confirm()}
													size='small'
													style={{
														width: UI_CONSTANTS.LAYOUT.FILTER_BUTTON_WIDTH,
														marginRight: UI_CONSTANTS.STYLES.MARGIN.RIGHT,
													}}>
													Filter
												</Button>
												{clearFilters && (
													<Button
														onClick={() => {
															if (clearFilters) {
																clearFilters();
																confirm();
															}
														}}
														size='small'>
														Reset
													</Button>
												)}
											</div>
										</div>
									);
								} else if (field.type === 'select') {
									return (
										<div style={{padding: 8}}>
											<Select
												allowClear
												placeholder={UI_CONSTANTS.FILTER_PLACEHOLDERS.SELECT}
												style={{
													width: UI_CONSTANTS.LAYOUT.FILTER_SELECT_WIDTH,
													marginBottom: 8,
												}}
												value={selectedKeys[0] as string}
												onChange={(value) => {
													setSelectedKeys(value ? [value] : []);
													confirm();
												}}
												options={field.options}
											/>
											<div>
												<Button
													type='primary'
													onClick={() => confirm()}
													size='small'
													style={{
														width: UI_CONSTANTS.LAYOUT.FILTER_BUTTON_WIDTH,
														marginRight: UI_CONSTANTS.STYLES.MARGIN.RIGHT,
													}}>
													Filter
												</Button>
												{clearFilters && (
													<Button
														onClick={() => {
															if (clearFilters) {
																clearFilters();
																confirm();
															}
														}}
														size='small'>
														Reset
													</Button>
												)}
											</div>
										</div>
									);
								} else if (field.type === 'date' || field.type === 'datetime') {
									return (
										<div style={{padding: 8}}>
											<DatePicker
												placeholder={UI_CONSTANTS.FILTER_PLACEHOLDERS.SELECT}
												style={{
													width: UI_CONSTANTS.LAYOUT.FILTER_SELECT_WIDTH,
													marginBottom: 8,
												}}
												value={selectedKeys[0] ? dayjs(selectedKeys[0] as string) : null}
												onChange={(date) => {
													setSelectedKeys(date ? [(field.keepLocalTime ? date.toISOString() : date.utc().toISOString())] : []);
													confirm();
												}}
												showTime={field.type === 'datetime'}
											/>
											<div>
												<Button
													type='primary'
													onClick={() => confirm()}
													size='small'
													style={{
														width: UI_CONSTANTS.LAYOUT.FILTER_BUTTON_WIDTH,
														marginRight: UI_CONSTANTS.STYLES.MARGIN.RIGHT,
													}}>
													Filter
												</Button>
												{clearFilters && (
													<Button
														onClick={() => {
															if (clearFilters) {
																clearFilters();
																confirm();
															}
														}}
														size='small'>
														Reset
													</Button>
												)}
											</div>
										</div>
									);
								} else {
									return (
										<div style={{padding: 8}}>
											<Input
												placeholder={`${UI_CONSTANTS.FILTER_PLACEHOLDERS.SEARCH} ${field.label}`}
												value={selectedKeys[0] as string}
												onChange={(e) => {
													setSelectedKeys(e.target.value ? [e.target.value] : []);
													if (!e.target.value) confirm();
												}}
												onKeyPress={handleKeyPress}
												style={{
													width: UI_CONSTANTS.LAYOUT.FILTER_TEXT_WIDTH,
													marginBottom: 8,
												}}
												allowClear
											/>
											<div>
												<Button
													type='primary'
													onClick={() => confirm()}
													size='small'
													style={{
														width: UI_CONSTANTS.LAYOUT.FILTER_BUTTON_WIDTH,
														marginRight: UI_CONSTANTS.STYLES.MARGIN.RIGHT,
													}}>
													Filter
												</Button>
												{clearFilters && (
													<Button
														onClick={() => {
															if (clearFilters) {
																clearFilters();
																confirm();
															}
														}}
														size='small'>
														Reset
													</Button>
												)}
											</div>
										</div>
									);
								}
							}
							: undefined,
						render: (value: unknown) => {
							if (field.renderInList) {
								return field.renderInList(
									renderValue(value) as string | number | boolean | null
								);
							}
							
							if (field.type === 'relation' && field.relation && value) {
								const idValue =
									typeof value === 'object' &&
									value !== null &&
									field.relation &&
									field.relation.idField &&
									field.relation.idField in value
										? (value as Record<string, unknown>)[
											field.relation.idField
											]
										: renderValue(value);
								
								return (
									<Button
										type='link'
										onClick={() => {
											// Fetch and display the relation item in a modal instead of navigating
											fetchRelationItem(field.relation!.entity, String(idValue));
										}}>
										{
											getRelationString(
												field.relation,
												value as Item
											) as ReactNode
										}
									</Button>
								);
							}
							
							if (field.isImage && value) {
								return (
									<div onClick={(e) => e.stopPropagation()}>
										<Image width={40} src={renderValue(value) as string}/>
									</div>
								);
							}
							
							if (field.isFile && value) {
								return (
									<Button
										icon={(<FileOutlined/>) as ReactNode}
										size='small'
										onClick={(e) => {
											e.stopPropagation();
											window.open(renderValue(value) as string, '_blank');
										}}>
										View File
									</Button>
								);
							}
							
							if (field.type === 'boolean') {
								return (
									<Switch
										checked={!!renderValue(value)}
										checkedChildren='Yes'
										unCheckedChildren='No'
										disabled
									/>
								);
							}
							
							if (field.type === 'url' && value) {
								return (
									<Image width={40} src={renderValue(value) as string}/>
								);
							}
							
							if (field.type === 'date') {
								return formatDate(value, field.keepLocalTime);
							}
							
							if (field.type === 'datetime') {
								return formatDateTime(value, field.keepLocalTime);
							}
							
							return renderValue(value) as React.ReactNode;
						},
					};
				}),
			// Only add the actions column if at least one action button is visible
			...(selectedEndpoint.actionButtons?.show === false ||
			(selectedEndpoint.actionButtons?.edit?.show === false &&
				selectedEndpoint.actionButtons?.delete?.show === false)
				? []
				: [{
					title: UI_CONSTANTS.BUTTON_TEXTS.ACTIONS,
					key: 'actions',
					width: UI_CONSTANTS.LAYOUT.COLUMN_MIN_WIDTH,
					render: (_: unknown, record: Item) => {
						const {idField, actionButtons} = selectedEndpoint;
						if (!idField) {
							return null;
						}
						
						// If actionButtons.show is explicitly false, don't show any buttons
						if (actionButtons?.show === false) {
							return null;
						}
						
						return (
							<Space>
								{/* Show edit button unless explicitly hidden */}
								{actionButtons?.edit?.show !== false && (
									<Button
										type='primary'
										icon={actionButtons?.edit?.icon || ((<EditOutlined/>) as ReactNode)}
										onClick={() => handleEdit(record)}>
										{actionButtons?.edit?.text || UI_CONSTANTS.BUTTON_TEXTS.EDIT}
									</Button>
								)}
								
								{/* Show delete button unless explicitly hidden */}
								{actionButtons?.delete?.show !== false && (
									<Button
										danger
										icon={actionButtons?.delete?.icon || ((<DeleteOutlined/>) as ReactNode)}
										onClick={() => handleDelete(record[idField] as string)}>
										{actionButtons?.delete?.text || UI_CONSTANTS.BUTTON_TEXTS.DELETE}
									</Button>
								)}
							</Space>
						);
					},
				}]),
		]
		: [];
	
	const DeleteConfirmationModal = (
		<Modal
			title={UI_CONSTANTS.MODAL_TITLES.CONFIRM_DELETION}
			open={deleteModalVisible}
			onOk={handleDeleteConfirm}
			onCancel={() => {
				setDeleteModalVisible(false);
				setItemToDelete(null);
				setDeleteInput('');
			}}
			okText={UI_CONSTANTS.BUTTON_TEXTS.DELETE}
			okType='danger'
			okButtonProps={{
				disabled: deleteInput !== 'DELETE',
			}}
			cancelText={UI_CONSTANTS.BUTTON_TEXTS.CANCEL}>
			<div>
				<p>{UI_CONSTANTS.MODAL_MESSAGES.DELETE_CONFIRMATION}</p>
				<p>{UI_CONSTANTS.MODAL_MESSAGES.DELETE_WARNING}</p>
				<p>{UI_CONSTANTS.MODAL_MESSAGES.DELETE_INPUT_PLACEHOLDER}</p>
				<Input
					value={deleteInput}
					onChange={(e) => setDeleteInput(e.target.value)}
					placeholder={UI_CONSTANTS.MODAL_MESSAGES.DELETE_INPUT_PLACEHOLDER}
				/>
			</div>
		</Modal>
	);
	
	// Function to fetch and display a relation item in a modal
	const fetchRelationItem = async (relationEntity: string, itemId: string) => {
		try {
			setLoading(true);
			
			// Find the endpoint config for the relation entity
			const relationEndpoint = config.endpoints.find(ep => ep.key === relationEntity);
			
			if (!relationEndpoint) {
				throw new Error(`Endpoint configuration not found for entity: ${relationEntity}`);
			}
			
			// Fetch the relation item
			const response = await apiClient.get(`${relationEndpoint.url}/${itemId}`);
			const responseData = response;
			
			// Ensure data is a single item
			const data = 'data' in responseData ? responseData.data as unknown as Item : {} as Item;
			
			// Set the modalEntity to use the target entity's config
			setModalEntity(relationEntity);
			
			// Set the modalEndpoint to the relation entity's endpoint instead of selectedEndpoint
			// This prevents the background content from changing
			setModalEndpoint(relationEndpoint);
			
			// Set the viewingRelation flag to true to prevent navigation on modal close
			setViewingRelation(true);
			
			// Set the modal state to view the item
			setModalState({type: 'view', item: data});
		} catch (err) {
			const errorMessage =
				err instanceof Error
					? err.message
					: UI_CONSTANTS.ERROR_MESSAGES.UNKNOWN_ERROR;
			api.error({
				message: UI_CONSTANTS.ERROR_MESSAGES.ERROR,
				description: `${UI_CONSTANTS.ERROR_MESSAGES.FAILED_TO_FETCH_ITEM}${errorMessage}`,
				duration: alertDuration,
				placement: UI_CONSTANTS.ERROR_MESSAGES.ERROR_PLACEMENT,
			});
		} finally {
			setLoading(false);
		}
	};
	
	const renderDetailValue = (field: FieldConfig, value: unknown) => {
		if (field.renderInDetail) {
			return field.renderInDetail(renderValue(value));
		}
		
		if (field.type === 'relation' && field.relation && value) {
			const idValue =
				typeof value === 'object' && value !== null && 'uid' in value
					? value.uid
					: renderValue(value);
			return (
				<Button
					type='link'
					onClick={() => {
						// Fetch and display the relation item in a modal instead of navigating
						fetchRelationItem(field.relation!.entity, String(idValue));
					}}>
					{getRelationString(field.relation, value as Item) as ReactNode}
				</Button>
			);
		}
		
		if (field.isImage && value) {
			return <Image width={200} src={String(value)}/>;
		}
		
		if (field.isFile && value) {
			return (
				<Button
					icon={(<FileOutlined/>) as ReactNode}
					onClick={() => window.open(String(value), '_blank')}>
					Download File
				</Button>
			);
		}
		
		if (field.type === 'boolean') {
			return value ? 'Yes' : 'No';
		}
		
		if (field.type === 'url' && value) {
			return <Image width={100} src={String(value)}/>;
		}
		
		if (field.type === 'date') {
			return formatDate(value, field.keepLocalTime);
		}
		
		if (field.type === 'datetime') {
			return formatDateTime(value, field.keepLocalTime);
		}
		
		if (value !== null && value !== undefined) {
			return String(value);
		}
		
		return null;
	};
	
	const DetailModal = useDrawer ? (
		<Drawer
			title={UI_CONSTANTS.MODAL_TITLES.ITEM_DETAILS}
			open={detailModalVisible}
			onClose={handleDetailModalClose}
			width={UI_CONSTANTS.LAYOUT.DRAWER_WIDTH}
			placement='right'
			footer={
				<div style={{textAlign: 'right'}}>
					<Space>
						<Button onClick={handleDetailModalClose}>
							{UI_CONSTANTS.BUTTON_TEXTS.CLOSE}
						</Button>
						{selectedItem &&
							(viewingRelation ? modalEndpoint : selectedEndpoint) &&
							((
								<Button type='primary' onClick={handleEditFromDetail}>
									{UI_CONSTANTS.BUTTON_TEXTS.EDIT}
								</Button>
							) as ReactNode)}
					</Space>
				</div>
			}>
			{selectedItem && (viewingRelation ? modalEndpoint : selectedEndpoint) && (
				<div>
					{(viewingRelation ? modalEndpoint : selectedEndpoint)?.fields?.map((field) => {
						const value = selectedItem[field.key];
						return (
							<div
								key={field.key}
								style={{
									marginBottom: UI_CONSTANTS.LAYOUT.DETAIL_FIELD_MARGIN,
								}}>
								<div
									style={{
										fontWeight: UI_CONSTANTS.LAYOUT.DETAIL_LABEL_FONT_WEIGHT,
										marginBottom: UI_CONSTANTS.LAYOUT.DETAIL_LABEL_MARGIN,
									}}>
									{field.label}:
								</div>
								<div>{renderDetailValue(field, value)}</div>
							</div>
						);
					})}
				</div>
			)}
		</Drawer>
	) : (
		<Modal
			title={UI_CONSTANTS.MODAL_TITLES.ITEM_DETAILS}
			open={detailModalVisible}
			onCancel={handleDetailModalClose}
			footer={null}
			width={UI_CONSTANTS.LAYOUT.MODAL_WIDTH}>
			{selectedItem &&
				(viewingRelation ? modalEndpoint : selectedEndpoint) &&
				((
					<div>
						{(viewingRelation ? modalEndpoint : selectedEndpoint)?.fields?.map((field) => {
							const value = selectedItem[field.key];
							return (
								<div
									key={field.key}
									style={{
										marginBottom: UI_CONSTANTS.LAYOUT.DETAIL_FIELD_MARGIN,
									}}>
									<div
										style={{
											fontWeight: UI_CONSTANTS.LAYOUT.DETAIL_LABEL_FONT_WEIGHT,
											marginBottom: UI_CONSTANTS.LAYOUT.DETAIL_LABEL_MARGIN,
										}}>
										{field.label}:
									</div>
									<div>{renderDetailValue(field, value)}</div>
								</div>
							);
						})}
						<div
							style={{
								marginTop: UI_CONSTANTS.LAYOUT.DETAIL_ACTIONS_MARGIN,
								textAlign: UI_CONSTANTS.LAYOUT.DETAIL_ACTIONS_ALIGN,
							}}>
							<Space>
								<Button onClick={handleDetailModalClose}>
									{UI_CONSTANTS.BUTTON_TEXTS.CLOSE}
								</Button>
								<Button type='primary' onClick={handleEditFromDetail}>
									{UI_CONSTANTS.BUTTON_TEXTS.EDIT}
								</Button>
							</Space>
						</div>
					</div>
				) as ReactNode)}
		</Modal>
	);
	
	const EditModal = useDrawer ? (
		<Drawer
			title={
				editingItem
					? UI_CONSTANTS.MODAL_TITLES.EDIT_ITEM
					: UI_CONSTANTS.MODAL_TITLES.ADD_ITEM
			}
			open={isModalVisible}
			onClose={handleModalClose}
			width={UI_CONSTANTS.LAYOUT.DRAWER_WIDTH}
			placement='right'
			footer={
				<div style={{textAlign: 'right'}}>
					<Space>
						<Button
							type='primary'
							onClick={() => form.submit()}
							loading={loading}>
							{editingItem
								? UI_CONSTANTS.BUTTON_TEXTS.UPDATE
								: UI_CONSTANTS.BUTTON_TEXTS.ADD}{' '}
							Item
						</Button>
						<Button onClick={handleModalClose}>
							{UI_CONSTANTS.BUTTON_TEXTS.CANCEL}
						</Button>
					</Space>
				</div>
			}>
			<Spin spinning={loading}>
				<Form
					form={form}
					layout='vertical'
					onFinish={handleSubmit}
					initialValues={editingItem || {}}>
					{(viewingRelation && modalEndpoint ? modalEndpoint : selectedEndpoint)?.fields
						.filter((field) =>
							editingItem
								? field.patchable || !field.readOnly
								: field.postable || !field.readOnly
						)
						.map((field) => (
							<div key={field.key}>{renderFormField(field)}</div>
						))}
				</Form>
			</Spin>
		</Drawer>
	) : (
		<Modal
			title={
				editingItem
					? UI_CONSTANTS.MODAL_TITLES.EDIT_ITEM
					: UI_CONSTANTS.MODAL_TITLES.ADD_ITEM
			}
			open={isModalVisible}
			onCancel={handleModalClose}
			footer={null}
			width={UI_CONSTANTS.LAYOUT.MODAL_WIDTH}>
			<Spin spinning={loading}>
				<Form
					form={form}
					layout='vertical'
					onFinish={handleSubmit}
					initialValues={editingItem || {}}>
					{(viewingRelation && modalEndpoint ? modalEndpoint : selectedEndpoint)?.fields
						.filter((field) =>
							editingItem
								? field.patchable || !field.readOnly
								: field.postable || !field.readOnly
						)
						.map((field) => (
							<div key={field.key}>{renderFormField(field)}</div>
						))}
					<Form.Item>
						<Space>
							<Button type='primary' htmlType='submit' loading={loading}>
								{editingItem
									? UI_CONSTANTS.BUTTON_TEXTS.UPDATE
									: UI_CONSTANTS.BUTTON_TEXTS.ADD}{' '}
								Item
							</Button>
							<Button onClick={handleModalClose}>
								{UI_CONSTANTS.BUTTON_TEXTS.CANCEL}
							</Button>
						</Space>
					</Form.Item>
				</Form>
			</Spin>
		</Modal>
	);
	
	const handleAddNew = () => {
		setEditingItem(null);
		form.resetFields();
		setIsModalVisible(true);
	};
	
	
	// If the selected endpoint has a custom component, render it instead of the default CRUD
	if (selectedEndpoint?.customComponent) {
		const CustomComponent = selectedEndpoint.customComponent;
		return (
			<Layout
				style={{
					minHeight: '100%',
					background: 'transparent',
					display: 'flex',
					flexDirection: 'row',
					height: '100%',
				}}>
				{contextHolder}
				<Sider
					trigger={null}
					collapsible
					collapsed={collapsed}
					style={{background: '#fff'}}>
					<Menu
						mode='inline'
						selectedKeys={[entity || '']}
						items={config.endpoints.map((endpoint) => ({
							key: endpoint.key,
							label: endpoint.label,
							onClick: () => {
								// Only navigate if not viewing a relation
								if (!viewingRelation) {
									navigate(`/${endpoint.key}`);
								}
							},
						}))}
					/>
					<Button
						type='text'
						icon={
							(collapsed ? (
								<MenuUnfoldOutlined/>
							) : (
								<MenuFoldOutlined/>
							)) as ReactNode
						}
						onClick={() => setCollapsed(!collapsed)}
						style={{
							width: '100%',
							borderRadius: 0,
							position: 'absolute',
							bottom: 0,
							left: 0,
							borderTop: '1px solid #f0f0f0',
						}}
					/>
				</Sider>
				<Layout
					style={{
						background: '#fff',
						padding: '24px',
						flex: UI_CONSTANTS.DEFAULTS.FIRST_PAGE,
						display: 'flex',
						flexDirection: 'column',
					}}>
					{/* Render custom header if provided, otherwise render default header */}
					{selectedEndpoint.header || (
						<div
							style={{
								marginBottom: UI_CONSTANTS.LAYOUT.HEADER_MARGIN,
								display: UI_CONSTANTS.STYLES.FLEX.DISPLAY,
								alignItems: UI_CONSTANTS.STYLES.FLEX.ALIGN_CENTER,
							}}>
							<h1 style={{margin: UI_CONSTANTS.LAYOUT.HEADER_TITLE_MARGIN}}>
								{selectedEndpoint.label}
							</h1>
						</div>
					)}
					
					{/* Render the custom component without props */}
					<CustomComponent/>
					
					{/* Render custom footer if provided */}
					{selectedEndpoint.footer}
				</Layout>
			</Layout>
		);
	}
	
	// Default CRUD rendering
	return (
		<Layout
			style={{
				minHeight: '100%',
				background: 'transparent',
				display: 'flex',
				flexDirection: 'row',
				height: '100%',
			}}>
			{contextHolder}
			<Sider
				trigger={null}
				collapsible
				collapsed={collapsed}
				style={{background: '#fff'}}>
				<Menu
					mode='inline'
					selectedKeys={[entity || '']}
					items={config.endpoints.map((endpoint) => ({
						key: endpoint.key,
						label: endpoint.label,
						onClick: () => {
							// Only navigate if not viewing a relation
							if (!viewingRelation) {
								navigate(`/${endpoint.key}`);
							}
						},
					}))}
				/>
				<Button
					type='text'
					icon={
						(collapsed ? (
							<MenuUnfoldOutlined/>
						) : (
							<MenuFoldOutlined/>
						)) as ReactNode
					}
					onClick={() => setCollapsed(!collapsed)}
					style={{
						width: '100%',
						borderRadius: 0,
						position: 'absolute',
						bottom: 0,
						left: 0,
						borderTop: '1px solid #f0f0f0',
					}}
				/>
			</Sider>
			<Layout
				style={{
					background: '#fff',
					padding: '24px',
					flex: UI_CONSTANTS.DEFAULTS.FIRST_PAGE,
					display: 'flex',
					flexDirection: 'column',
				}}>
				{/* Render custom header if provided, otherwise render default header */}
				{selectedEndpoint?.header || (
					<div
						style={{
							marginBottom: UI_CONSTANTS.LAYOUT.HEADER_MARGIN,
							display: UI_CONSTANTS.STYLES.FLEX.DISPLAY,
							alignItems: UI_CONSTANTS.STYLES.FLEX.ALIGN_CENTER,
						}}>
						<h1 style={{margin: UI_CONSTANTS.LAYOUT.HEADER_TITLE_MARGIN}}>
							{selectedEndpoint?.label}
						</h1>
						<Button
							type='primary'
							onClick={() => handleAddNew()}
							style={{marginLeft: 'auto'}}>
							Add New {selectedEndpoint?.label}
						</Button>
					</div>
				)}
				
				
				<div
					style={{
						flex: UI_CONSTANTS.DEFAULTS.FIRST_PAGE,
						display: 'flex',
						flexDirection: 'column',
						minHeight: 0,
					}}>
					<Table
						key={`table-${selectedEndpoint?.key}`}
						dataSource={items}
						columns={columns}
						rowKey={(record) =>
							record[selectedEndpoint?.idField || 'id'] as string
						}
						pagination={pagination}
						loading={loading}
						onChange={handleTableChange}
						onRow={(record) => ({
							onClick: (event) => handleRowClick(record, event),
							style: {cursor: 'pointer'},
						})}
						scroll={{x: 'max-content', y: 'calc(100vh - 400px)'}}
						style={{
							flex: UI_CONSTANTS.DEFAULTS.FIRST_PAGE,
							minHeight: UI_CONSTANTS.LAYOUT.TABLE_MIN_HEIGHT,
						}}
					/>
				</div>
				
				{EditModal as ReactNode}
				{DetailModal as ReactNode}
				{DeleteConfirmationModal as ReactNode}
				
				{/* Render custom footer if provided */}
				{selectedEndpoint?.footer}
			</Layout>
		</Layout>
	);
}
