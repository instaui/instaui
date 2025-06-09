import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button, DatePicker, Drawer, Form, Image, Input, InputNumber, Layout, Menu, message, Modal, notification, Select, Space, Spin, Switch, Table, TimePicker, Upload, } from 'antd';
import { DeleteOutlined, EditOutlined, FileOutlined, MenuFoldOutlined, MenuUnfoldOutlined, PictureOutlined, } from '@ant-design/icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { formatDate, formatDateTime } from '../utils/dateFormat';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { RelationField } from './RelationField';
import { UI_CONSTANTS } from '../constants';
import dayjs from 'dayjs';
import { getRelationString } from './GetRelationString';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);
dayjs.extend(timezone);
const { Sider } = Layout;
export default function ItemCrud({ apiClient, config, useDrawer = false, }) {
    const location = useLocation();
    const navigate = useNavigate();
    const { entity, operation, id } = useParams();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingItem, setEditingItem] = useState(null);
    const [form] = Form.useForm();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedEndpoint, setSelectedEndpoint] = useState(null);
    // Separate endpoint state for modals
    const [modalEndpoint, setModalEndpoint] = useState(null);
    const [pagination, setPagination] = useState({
        current: UI_CONSTANTS.DEFAULTS.FIRST_PAGE,
        pageSize: UI_CONSTANTS.DEFAULTS.PAGE_SIZE,
        total: 0,
    });
    const paginationRef = useRef(pagination);
    paginationRef.current = pagination;
    const [api, contextHolder] = notification.useNotification();
    const [deleteInput, setDeleteInput] = useState('');
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    // Track if we're viewing a relation item to prevent navigation on modal close
    const [viewingRelation, setViewingRelation] = useState(false);
    // Store the entity for the modal
    const [modalEntity, setModalEntity] = useState(null);
    const [modalState, setModalState] = useState({ type: null, item: null });
    const [collapsed, setCollapsed] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_sorting, setSorting] = useState({
        field: null,
        order: 'ascend',
    });
    const [filters, setFilters] = useState({});
    const isMountedRef = useRef(true);
    // Request tracking
    const requestIdRef = useRef(0);
    const alertDuration = config.alertDuration ?? UI_CONSTANTS.DEFAULTS.ALERT_DURATION;
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
            const data = isListResponse ? responseData.data : [responseData.data];
            const count = 'count' in responseData ? responseData.count : undefined;
            const total = count ?? data.length ?? 0;
            setPagination({
                current: parseInt(searchParams.get(UI_CONSTANTS.URL_PARAMS.PAGE) || '1'),
                pageSize: parseInt(searchParams.get(UI_CONSTANTS.URL_PARAMS.PAGE_SIZE) ||
                    config.defaultPagesize?.toString() ||
                    UI_CONSTANTS.DEFAULTS.PAGE_SIZE.toString()),
                total: total,
            });
            const processedItems = data.map((item) => {
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
        }
        catch (err) {
            if (!isMountedRef.current || currentRequestId !== requestIdRef.current) {
                return;
            }
            const errorMessage = err instanceof Error
                ? err.message
                : UI_CONSTANTS.ERROR_MESSAGES.UNKNOWN_ERROR;
            api.error({
                message: UI_CONSTANTS.ERROR_MESSAGES.ERROR,
                description: `${UI_CONSTANTS.ERROR_MESSAGES.FAILED_TO_FETCH_ITEMS} ${errorMessage}`,
                duration: config.alertDuration || UI_CONSTANTS.DEFAULTS.ALERT_DURATION,
            });
        }
        finally {
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
        const newFilters = {};
        searchParams.forEach((value, key) => {
            const excludedKeys = [
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
                    navigate(`/${entity}?${searchParams.toString()}`, { replace: true });
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
            if (newPage !== pagination.current ||
                newPageSize !== pagination.pageSize) {
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
    const handleTableChange = (pagination, filters, sorter) => {
        const searchParams = new URLSearchParams(location.search);
        // Preserve existing filters
        Object.entries(filters).forEach(([key, value]) => {
            if (value) {
                if (Array.isArray(value)) {
                    searchParams.set(key, value.join(','));
                }
                else {
                    searchParams.set(key, String(value));
                }
            }
            else {
                searchParams.delete(key);
            }
        });
        // Update pagination
        const { current, pageSize } = pagination;
        searchParams.set(UI_CONSTANTS.URL_PARAMS.PAGE, String(current));
        searchParams.set(UI_CONSTANTS.URL_PARAMS.PAGE_SIZE, String(pageSize));
        // Handle sorting
        if (Array.isArray(sorter)) {
            if (sorter.length > 0 && sorter[0].column) {
                const field = sorter[0].field;
                const order = sorter[0].order;
                if (order) {
                    searchParams.set(UI_CONSTANTS.URL_PARAMS.SORT, field);
                    searchParams.set(UI_CONSTANTS.URL_PARAMS.ORDER, order === 'ascend' ? 'asc' : 'desc');
                }
                else {
                    searchParams.delete(UI_CONSTANTS.URL_PARAMS.SORT);
                    searchParams.delete(UI_CONSTANTS.URL_PARAMS.ORDER);
                }
            }
        }
        else if (sorter.column) {
            const field = sorter.field;
            const order = sorter.order;
            if (order) {
                searchParams.set(UI_CONSTANTS.URL_PARAMS.SORT, field);
                searchParams.set(UI_CONSTANTS.URL_PARAMS.ORDER, order === 'ascend' ? 'asc' : 'desc');
            }
            else {
                searchParams.delete(UI_CONSTANTS.URL_PARAMS.SORT);
                searchParams.delete(UI_CONSTANTS.URL_PARAMS.ORDER);
            }
        }
        else {
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
    const handleRowClick = (record, event) => {
        const target = event.target;
        // Check if the click is on any interactive element
        const isInteractiveElement = target.closest('button') ||
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
        }
        else if (entity) {
            navigate(`/${entity}/view/${itemId}`, { replace: true });
        }
    };
    const handleEdit = async (item) => {
        if (!selectedEndpoint && !modalEndpoint)
            return;
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
                const data = 'data' in response ? response.data : {};
                setModalState({ type: 'edit', item: data });
            }
            catch (err) {
                const errorMessage = err instanceof Error ? err.message : UI_CONSTANTS.ERROR_MESSAGES.UNKNOWN_ERROR;
                api.error({
                    message: UI_CONSTANTS.ERROR_MESSAGES.ERROR,
                    description: `${UI_CONSTANTS.ERROR_MESSAGES.FAILED_TO_FETCH_ITEM}${errorMessage}`,
                    duration: alertDuration,
                });
            }
            finally {
                setLoading(false);
            }
        }
        else {
            navigate(`/${entity}/edit/${itemId}`, { replace: true });
        }
    };
    const handleModalClose = () => {
        setModalState({ type: null, item: null });
        // If we're viewing a relation item, reset modal state and don't navigate
        if (viewingRelation) {
            // Reset modal endpoint
            setModalEndpoint(null);
            setViewingRelation(false);
            // Reset modal entity
            setModalEntity(null);
        }
        else {
            // Only navigate if we're not viewing a relation
            navigate(`/${entity}`, { replace: true });
        }
    };
    const handleDetailModalClose = () => {
        setModalState({ type: null, item: null });
        setSelectedItem(null);
        setDetailModalVisible(false);
        // If we're viewing a relation item, reset modal state and don't navigate
        if (viewingRelation) {
            // Reset modal endpoint
            setModalEndpoint(null);
            setViewingRelation(false);
            // Reset modal entity
            setModalEntity(null);
        }
        else {
            // Only navigate if we're not viewing a relation
            navigate(`/${entity}`, { replace: true });
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
                setModalState({ type: 'edit', item: modalState.item });
            }
            else {
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
            }
            else if (modalState.type === 'edit') {
                setEditingItem(modalState.item);
                form.setFieldsValue(modalState.item);
                setIsModalVisible(true);
                setDetailModalVisible(false); // Ensure detail modal is closed
                setSelectedItem(null); // Clear detail view state
            }
        }
        else if (!operation || !id) {
            // Only clear modals if we're not supposed to show one
            setDetailModalVisible(false);
            setSelectedItem(null);
            setIsModalVisible(false);
            setEditingItem(null);
            form.resetFields();
        }
    }, [modalState, form, operation, id, modalEntity, modalEndpoint, config.endpoints]);
    const fetchItemById = async (itemId) => {
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
            }
            else {
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
            const data = 'data' in responseData ? responseData.data : {};
            // Set the modal state based on the operation type
            setModalState({ type: operation, item: data });
            // Additional state updates based on operation
            if (operation === 'edit') {
                setEditingItem(data);
                form.setFieldsValue(data);
            }
            else if (operation === 'view') {
                setSelectedItem(data);
            }
        }
        catch (err) {
            const errorMessage = err instanceof Error
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
        }
        finally {
            setLoading(false);
        }
    };
    const handleSubmit = async (values) => {
        if (!selectedEndpoint && !modalEndpoint)
            return;
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
                }
                else if (typeof value === 'object' && value !== null) {
                    // Handle objects (convert to JSON string)
                    formData.append(key, JSON.stringify(value));
                }
                else {
                    // For date fields, handle timezone conversion
                    if (!endpoint) {
                        formData.append(key, String(value));
                        continue;
                    }
                    const field = endpoint.fields.find((f) => f.key === key);
                    if (field &&
                        (field.type === 'date' || field.type === 'datetime') &&
                        value) {
                        const date = dayjs(value);
                        if (date.isValid()) {
                            let finalDate;
                            if (field.keepLocalTime) {
                                // Convert UTC to local time
                                finalDate = date.local();
                            }
                            else {
                                // Keep UTC time as-is
                                finalDate = date.utc();
                            }
                            // Format the date without timezone information
                            let formattedDate;
                            if (field.type === 'date') {
                                // For date fields, use YYYY-MM-DD format
                                formattedDate = finalDate.format('YYYY-MM-DD');
                            }
                            else {
                                // For datetime fields, use format without timezone
                                formattedDate = finalDate.format('YYYY-MM-DDTHH:mm:ss');
                            }
                            formData.append(key, formattedDate);
                        }
                        else {
                            formData.append(key, String(value));
                        }
                    }
                    else {
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
            }
            else {
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
        }
        catch (err) {
            const errorMessage = err instanceof Error
                ? err.message
                : UI_CONSTANTS.ERROR_MESSAGES.UNKNOWN_ERROR;
            api.error({
                message: UI_CONSTANTS.ERROR_MESSAGES.ERROR,
                description: `${UI_CONSTANTS.ERROR_MESSAGES.FAILED_TO_SAVE_ITEM} ${errorMessage}`,
                duration: alertDuration,
            });
        }
        finally {
            setLoading(false);
        }
    };
    const handleDelete = async (id) => {
        if (!selectedEndpoint)
            return;
        setDeleteInput('');
        setItemToDelete(id);
        setDeleteModalVisible(true);
    };
    const handleDeleteConfirm = async () => {
        if ((!selectedEndpoint && !modalEndpoint) || !itemToDelete || deleteInput !== 'DELETE')
            return;
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
        }
        catch (err) {
            const errorMessage = err instanceof Error
                ? err.message
                : UI_CONSTANTS.ERROR_MESSAGES.UNKNOWN_ERROR;
            api.error({
                message: errorMessage,
                description: UI_CONSTANTS.ERROR_MESSAGES.FAILED_TO_DELETE_ITEM,
                duration: alertDuration,
            });
        }
        finally {
            setLoading(false);
            setDeleteModalVisible(false);
            setItemToDelete(null);
            setDeleteInput('');
        }
    };
    const renderValue = (value) => {
        if (value === null || value === undefined) {
            return null;
        }
        if (typeof value === 'object') {
            // Handle relation objects that have an idField
            if (value !== null && 'uid' in value) {
                return value.uid;
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
    const renderFormField = (field) => {
        const rules = [
            {
                required: field.required,
                message: `${field.label} ${UI_CONSTANTS.FORM_MESSAGES.REQUIRED_FIELD}`,
            },
        ];
        if (field.validator) {
            const validatorFn = field.validator;
            rules.push({
                validator: async (_, value) => {
                    const validationResult = validatorFn(value);
                    if (!validationResult.status) {
                        throw new Error(validationResult.message ||
                            UI_CONSTANTS.FORM_MESSAGES.INVALID_VALUE);
                    }
                },
            });
        }
        // Only disable fields that are explicitly marked as read-only
        const isDisabled = field.readOnly === true;
        // Handle relations
        if (field.type === 'relation' && field.relation) {
            return (_jsx(RelationField, { field: field, apiClient: apiClient, rules: rules, isDisabled: isDisabled, form: form }));
        }
        // Handle file and image uploads
        if (field.isFile || field.isImage) {
            const currentValue = form.getFieldValue(field.key);
            const uploadFileList = currentValue
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
                        if (!value)
                            return Promise.resolve();
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
                            if (typeof file === 'string')
                                continue;
                            const uploadFile = file.file ?? file;
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
                                return Promise.reject(new Error(`File type not allowed. Accepted types: ${Array.isArray(field.accept) ? field.accept.join(', ') : field.accept}`));
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
                        if (!value)
                            return Promise.resolve();
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
                            if (typeof file === 'string')
                                continue;
                            const uploadFile = file.file ?? file;
                            if (uploadFile.size && field.maxSize && uploadFile.size / 1024 / 1024 > field.maxSize) {
                                return Promise.reject(new Error(`${UI_CONSTANTS.MODAL_MESSAGES.FILE_SIZE_ERROR} ${field.maxSize}MB!`));
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
                beforeUpload: (file) => {
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
                onChange(info) {
                    if (info.file.status === 'uploading') {
                        // Store the file in the form state
                        form.setFieldValue(field.key, info.file.originFileObj);
                    }
                    else if (info.file.status === 'done') {
                        message.success(`${info.file.name} ${UI_CONSTANTS.MODAL_MESSAGES.FILE_SELECT_SUCCESS}`);
                        // Set the file in the form
                        form.setFieldValue(field.key, info.file.originFileObj);
                    }
                    else if (info.file.status === 'error') {
                        message.error(`${info.file.name} ${UI_CONSTANTS.MODAL_MESSAGES.FILE_SELECT_FAILED}`);
                    }
                },
                accept: (() => {
                    if (!field.accept) {
                        return field.isImage ? 'image/*' : undefined;
                    }
                    const formatAcceptType = (type) => {
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
            return (_jsx(Form.Item, { name: field.key, label: field.label, rules: rules, children: _jsx(Upload, { ...uploadProps, children: _jsx(Button, { icon: (field.isImage ? (_jsx(PictureOutlined, {})) : (_jsx(FileOutlined, {}))), children: field.isImage
                            ? UI_CONSTANTS.BUTTON_TEXTS.SELECT_IMAGE
                            : UI_CONSTANTS.BUTTON_TEXTS.SELECT_FILE }) }) }));
        }
        switch (field.type) {
            case 'date':
                return (_jsx(Form.Item, { name: field.key, label: field.label, rules: [
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
                    ], getValueProps: (value) => {
                        if (!value)
                            return { value: null };
                        const date = dayjs(value);
                        return { value: date.isValid() ? date : null };
                    }, normalize: (value) => {
                        if (!value)
                            return null;
                        const date = dayjs(value);
                        if (!date.isValid())
                            return null;
                        // If keepLocalTime is true, keep the local time
                        // If false, convert to UTC
                        return field.keepLocalTime
                            ? date.toISOString()
                            : date.utc().toISOString();
                    }, children: _jsx(DatePicker, { style: { width: '100%' }, disabled: isDisabled, placeholder: field.placeHolder || `Select ${field.label}`, format: field.dateFormat || 'YYYY-MM-DD' }) }));
            case 'datetime':
                return (_jsx(Form.Item, { name: field.key, label: field.label, rules: [
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
                    ], getValueProps: (value) => {
                        if (!value)
                            return { value: null };
                        const date = dayjs(value);
                        return { value: date.isValid() ? date : null };
                    }, normalize: (value) => {
                        if (!value)
                            return null;
                        const date = dayjs(value);
                        if (!date.isValid())
                            return null;
                        // If keepLocalTime is true, keep the local time
                        // If false, convert to UTC
                        return field.keepLocalTime
                            ? date.toISOString()
                            : date.utc().toISOString();
                    }, children: _jsx(DatePicker, { showTime: true, style: { width: '100%' }, disabled: isDisabled, placeholder: field.placeHolder || `Select ${field.label}`, format: field.dateFormat || 'YYYY-MM-DD HH:mm:ss' }) }));
            case 'boolean':
                return (_jsx(Form.Item, { name: field.key, label: field.label, valuePropName: 'checked', rules: rules, children: _jsx(Switch, { checkedChildren: UI_CONSTANTS.STATUS_TEXTS.YES, unCheckedChildren: UI_CONSTANTS.STATUS_TEXTS.NO, disabled: isDisabled }) }));
            case 'url':
                return (_jsx(Form.Item, { name: field.key, label: field.label, rules: rules, children: _jsx(Input, { type: 'url', placeholder: field.placeHolder, disabled: isDisabled }) }));
            case 'email':
                return (_jsx(Form.Item, { name: field.key, label: field.label, rules: [
                        ...rules,
                        {
                            type: 'email',
                            message: UI_CONSTANTS.FORM_MESSAGES.INVALID_EMAIL,
                        },
                    ], children: _jsx(Input, { type: 'email', placeholder: field.placeHolder, disabled: isDisabled }) }));
            case 'number':
                return (_jsx(Form.Item, { name: field.key, label: field.label, rules: [
                        ...rules,
                        {
                            type: 'number',
                            message: UI_CONSTANTS.FORM_MESSAGES.INVALID_NUMBER,
                        },
                    ], children: _jsx(InputNumber, { placeholder: field.placeHolder, disabled: isDisabled, style: { width: '100%' }, min: 0 }) }));
            case 'textarea':
                return (_jsx(Form.Item, { name: field.key, label: field.label, rules: rules, children: _jsx(Input.TextArea, { placeholder: field.placeHolder, disabled: isDisabled, rows: 4 }) }));
            case 'select':
                return (_jsx(Form.Item, { name: field.key, label: field.label, rules: rules, children: _jsx(Select, { placeholder: field.placeHolder || `Select ${field.label}`, disabled: isDisabled, allowClear: true, children: field.options?.map((option) => (_jsx(Select.Option, { value: option.value, children: option.label }, option.value))) }) }));
            default:
                return (_jsx(Form.Item, { name: field.key, label: field.label, rules: rules, children: _jsx(Input, { placeholder: field.placeHolder, disabled: isDisabled }) }));
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
                const currentOrder = searchParams.get(UI_CONSTANTS.URL_PARAMS.ORDER);
                // Determine the sort order for this column
                let sortOrder = undefined;
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
                                { text: 'Yes', value: 'true' },
                                { text: 'No', value: 'false' },
                            ]
                            : undefined
                        : undefined,
                    filterMode: field.filterable && field.filterType === 'eq'
                        ? 'tree'
                        : undefined,
                    filterSearch: field.filterable && field.filterType === 'eq',
                    filterDropdown: field.filterable
                        ? ({ setSelectedKeys, selectedKeys, confirm, clearFilters, }) => {
                            const handleKeyPress = (e) => {
                                if (e.key === 'Enter') {
                                    confirm();
                                }
                            };
                            if (field.filterType === 'range' && (field.type === 'date' || field.type === 'datetime')) {
                                return (_jsxs("div", { style: { padding: 8 }, children: [_jsx(DatePicker, { placeholder: UI_CONSTANTS.FILTER_PLACEHOLDERS.MIN, value: selectedKeys[0] ? dayjs(selectedKeys[0]) : null, onChange: (date) => setSelectedKeys(date
                                                ? [
                                                    field.keepLocalTime ? date.toISOString() : date.utc().toISOString(),
                                                    selectedKeys[UI_CONSTANTS.DEFAULTS.FIRST_PAGE],
                                                ]
                                                : []), showTime: field.type === 'datetime', style: {
                                                width: UI_CONSTANTS.LAYOUT.FILTER_INPUT_WIDTH,
                                                marginRight: UI_CONSTANTS.STYLES.MARGIN.RIGHT,
                                                marginBottom: 8,
                                            } }), _jsx(DatePicker, { placeholder: UI_CONSTANTS.FILTER_PLACEHOLDERS.MAX, value: selectedKeys[UI_CONSTANTS.DEFAULTS.FIRST_PAGE] ? dayjs(selectedKeys[UI_CONSTANTS.DEFAULTS.FIRST_PAGE]) : null, onChange: (date) => setSelectedKeys([selectedKeys[0], date ? (field.keepLocalTime ? date.toISOString() : date.utc().toISOString()) : '']), showTime: field.type === 'datetime', style: {
                                                width: UI_CONSTANTS.LAYOUT.FILTER_INPUT_WIDTH,
                                                marginBottom: 8,
                                            } }), _jsxs("div", { children: [_jsx(Button, { type: 'primary', onClick: () => confirm(), size: 'small', style: {
                                                        width: UI_CONSTANTS.LAYOUT.FILTER_BUTTON_WIDTH,
                                                        marginRight: UI_CONSTANTS.STYLES.MARGIN.RIGHT,
                                                    }, children: "Filter" }), clearFilters && (_jsx(Button, { onClick: () => {
                                                        if (clearFilters) {
                                                            clearFilters();
                                                            confirm();
                                                        }
                                                    }, size: 'small', children: "Reset" }))] })] }));
                            }
                            else if (field.filterType === 'range' && field.type === 'time') {
                                return (_jsxs("div", { style: { padding: 8 }, children: [_jsx(TimePicker, { placeholder: UI_CONSTANTS.FILTER_PLACEHOLDERS.MIN, value: selectedKeys[0] ? dayjs(selectedKeys[0]) : null, onChange: (time) => setSelectedKeys(time
                                                ? [
                                                    time.format('HH:mm:ss'),
                                                    selectedKeys[UI_CONSTANTS.DEFAULTS.FIRST_PAGE],
                                                ]
                                                : []), format: "HH:mm:ss", style: {
                                                width: UI_CONSTANTS.LAYOUT.FILTER_INPUT_WIDTH,
                                                marginRight: UI_CONSTANTS.STYLES.MARGIN.RIGHT,
                                                marginBottom: 8,
                                            } }), _jsx(TimePicker, { placeholder: UI_CONSTANTS.FILTER_PLACEHOLDERS.MAX, value: selectedKeys[UI_CONSTANTS.DEFAULTS.FIRST_PAGE] ? dayjs(selectedKeys[UI_CONSTANTS.DEFAULTS.FIRST_PAGE]) : null, onChange: (time) => setSelectedKeys([selectedKeys[0], time ? time.format('HH:mm:ss') : '']), format: "HH:mm:ss", style: {
                                                width: UI_CONSTANTS.LAYOUT.FILTER_INPUT_WIDTH,
                                                marginBottom: 8,
                                            } }), _jsxs("div", { children: [_jsx(Button, { type: 'primary', onClick: () => confirm(), size: 'small', style: {
                                                        width: UI_CONSTANTS.LAYOUT.FILTER_BUTTON_WIDTH,
                                                        marginRight: UI_CONSTANTS.STYLES.MARGIN.RIGHT,
                                                    }, children: "Filter" }), clearFilters && (_jsx(Button, { onClick: () => {
                                                        if (clearFilters) {
                                                            clearFilters();
                                                            confirm();
                                                        }
                                                    }, size: 'small', children: "Reset" }))] })] }));
                            }
                            else if (field.filterType === 'range') {
                                return (_jsxs("div", { style: { padding: 8 }, children: [_jsx(Input, { placeholder: UI_CONSTANTS.FILTER_PLACEHOLDERS.MIN, value: selectedKeys[0], onChange: (e) => setSelectedKeys(e.target.value
                                                ? [
                                                    e.target.value,
                                                    selectedKeys[UI_CONSTANTS.DEFAULTS.FIRST_PAGE],
                                                ]
                                                : []), onKeyPress: handleKeyPress, style: {
                                                width: UI_CONSTANTS.LAYOUT.FILTER_INPUT_WIDTH,
                                                marginRight: UI_CONSTANTS.STYLES.MARGIN.RIGHT,
                                                marginBottom: 8,
                                            } }), _jsx(Input, { placeholder: UI_CONSTANTS.FILTER_PLACEHOLDERS.MAX, value: selectedKeys[UI_CONSTANTS.DEFAULTS.FIRST_PAGE], onChange: (e) => setSelectedKeys([selectedKeys[0], e.target.value]), onKeyPress: handleKeyPress, style: {
                                                width: UI_CONSTANTS.LAYOUT.FILTER_INPUT_WIDTH,
                                                marginBottom: 8,
                                            } }), _jsxs("div", { children: [_jsx(Button, { type: 'primary', onClick: () => confirm(), size: 'small', style: {
                                                        width: UI_CONSTANTS.LAYOUT.FILTER_BUTTON_WIDTH,
                                                        marginRight: UI_CONSTANTS.STYLES.MARGIN.RIGHT,
                                                    }, children: "Filter" }), clearFilters && (_jsx(Button, { onClick: () => {
                                                        if (clearFilters) {
                                                            clearFilters();
                                                            confirm();
                                                        }
                                                    }, size: 'small', children: "Reset" }))] })] }));
                            }
                            else if (field.filterType === 'boolean') {
                                return (_jsxs("div", { style: { padding: 8 }, children: [_jsx(Select, { allowClear: true, placeholder: UI_CONSTANTS.FILTER_PLACEHOLDERS.SELECT, style: {
                                                width: UI_CONSTANTS.LAYOUT.FILTER_SELECT_WIDTH,
                                                marginBottom: 8,
                                            }, value: selectedKeys[0], onChange: (value) => {
                                                setSelectedKeys(value ? [value] : []);
                                                confirm();
                                            }, options: [
                                                { label: 'Yes', value: 'true' },
                                                { label: 'No', value: 'false' },
                                            ] }), _jsxs("div", { children: [_jsx(Button, { type: 'primary', onClick: () => confirm(), size: 'small', style: {
                                                        width: UI_CONSTANTS.LAYOUT.FILTER_BUTTON_WIDTH,
                                                        marginRight: UI_CONSTANTS.STYLES.MARGIN.RIGHT,
                                                    }, children: "Filter" }), clearFilters && (_jsx(Button, { onClick: () => {
                                                        if (clearFilters) {
                                                            clearFilters();
                                                            confirm();
                                                        }
                                                    }, size: 'small', children: "Reset" }))] })] }));
                            }
                            else if (field.type === 'select') {
                                return (_jsxs("div", { style: { padding: 8 }, children: [_jsx(Select, { allowClear: true, placeholder: UI_CONSTANTS.FILTER_PLACEHOLDERS.SELECT, style: {
                                                width: UI_CONSTANTS.LAYOUT.FILTER_SELECT_WIDTH,
                                                marginBottom: 8,
                                            }, value: selectedKeys[0], onChange: (value) => {
                                                setSelectedKeys(value ? [value] : []);
                                                confirm();
                                            }, options: field.options }), _jsxs("div", { children: [_jsx(Button, { type: 'primary', onClick: () => confirm(), size: 'small', style: {
                                                        width: UI_CONSTANTS.LAYOUT.FILTER_BUTTON_WIDTH,
                                                        marginRight: UI_CONSTANTS.STYLES.MARGIN.RIGHT,
                                                    }, children: "Filter" }), clearFilters && (_jsx(Button, { onClick: () => {
                                                        if (clearFilters) {
                                                            clearFilters();
                                                            confirm();
                                                        }
                                                    }, size: 'small', children: "Reset" }))] })] }));
                            }
                            else if (field.type === 'date' || field.type === 'datetime') {
                                return (_jsxs("div", { style: { padding: 8 }, children: [_jsx(DatePicker, { placeholder: UI_CONSTANTS.FILTER_PLACEHOLDERS.SELECT, style: {
                                                width: UI_CONSTANTS.LAYOUT.FILTER_SELECT_WIDTH,
                                                marginBottom: 8,
                                            }, value: selectedKeys[0] ? dayjs(selectedKeys[0]) : null, onChange: (date) => {
                                                setSelectedKeys(date ? [(field.keepLocalTime ? date.toISOString() : date.utc().toISOString())] : []);
                                                confirm();
                                            }, showTime: field.type === 'datetime' }), _jsxs("div", { children: [_jsx(Button, { type: 'primary', onClick: () => confirm(), size: 'small', style: {
                                                        width: UI_CONSTANTS.LAYOUT.FILTER_BUTTON_WIDTH,
                                                        marginRight: UI_CONSTANTS.STYLES.MARGIN.RIGHT,
                                                    }, children: "Filter" }), clearFilters && (_jsx(Button, { onClick: () => {
                                                        if (clearFilters) {
                                                            clearFilters();
                                                            confirm();
                                                        }
                                                    }, size: 'small', children: "Reset" }))] })] }));
                            }
                            else {
                                return (_jsxs("div", { style: { padding: 8 }, children: [_jsx(Input, { placeholder: `${UI_CONSTANTS.FILTER_PLACEHOLDERS.SEARCH} ${field.label}`, value: selectedKeys[0], onChange: (e) => {
                                                setSelectedKeys(e.target.value ? [e.target.value] : []);
                                                if (!e.target.value)
                                                    confirm();
                                            }, onKeyPress: handleKeyPress, style: {
                                                width: UI_CONSTANTS.LAYOUT.FILTER_TEXT_WIDTH,
                                                marginBottom: 8,
                                            }, allowClear: true }), _jsxs("div", { children: [_jsx(Button, { type: 'primary', onClick: () => confirm(), size: 'small', style: {
                                                        width: UI_CONSTANTS.LAYOUT.FILTER_BUTTON_WIDTH,
                                                        marginRight: UI_CONSTANTS.STYLES.MARGIN.RIGHT,
                                                    }, children: "Filter" }), clearFilters && (_jsx(Button, { onClick: () => {
                                                        if (clearFilters) {
                                                            clearFilters();
                                                            confirm();
                                                        }
                                                    }, size: 'small', children: "Reset" }))] })] }));
                            }
                        }
                        : undefined,
                    render: (value) => {
                        if (field.renderInList) {
                            return field.renderInList(renderValue(value));
                        }
                        if (field.type === 'relation' && field.relation && value) {
                            const idValue = typeof value === 'object' &&
                                value !== null &&
                                field.relation &&
                                field.relation.idField &&
                                field.relation.idField in value
                                ? value[field.relation.idField]
                                : renderValue(value);
                            return (_jsx(Button, { type: 'link', onClick: () => {
                                    // Fetch and display the relation item in a modal instead of navigating
                                    fetchRelationItem(field.relation.entity, String(idValue));
                                }, children: getRelationString(field.relation, value) }));
                        }
                        if (field.isImage && value) {
                            return (_jsx("div", { onClick: (e) => e.stopPropagation(), children: _jsx(Image, { width: 40, src: renderValue(value) }) }));
                        }
                        if (field.isFile && value) {
                            return (_jsx(Button, { icon: (_jsx(FileOutlined, {})), size: 'small', onClick: (e) => {
                                    e.stopPropagation();
                                    window.open(renderValue(value), '_blank');
                                }, children: "View File" }));
                        }
                        if (field.type === 'boolean') {
                            return (_jsx(Switch, { checked: !!renderValue(value), checkedChildren: 'Yes', unCheckedChildren: 'No', disabled: true }));
                        }
                        if (field.type === 'url' && value) {
                            return (_jsx(Image, { width: 40, src: renderValue(value) }));
                        }
                        if (field.type === 'date') {
                            return formatDate(value, field.keepLocalTime);
                        }
                        if (field.type === 'datetime') {
                            return formatDateTime(value, field.keepLocalTime);
                        }
                        return renderValue(value);
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
                        render: (_, record) => {
                            const { idField, actionButtons } = selectedEndpoint;
                            if (!idField) {
                                return null;
                            }
                            // If actionButtons.show is explicitly false, don't show any buttons
                            if (actionButtons?.show === false) {
                                return null;
                            }
                            return (_jsxs(Space, { children: [actionButtons?.edit?.show !== false && (_jsx(Button, { type: 'primary', icon: actionButtons?.edit?.icon || (_jsx(EditOutlined, {})), onClick: () => handleEdit(record), children: actionButtons?.edit?.text || UI_CONSTANTS.BUTTON_TEXTS.EDIT })), actionButtons?.delete?.show !== false && (_jsx(Button, { danger: true, icon: actionButtons?.delete?.icon || (_jsx(DeleteOutlined, {})), onClick: () => handleDelete(record[idField]), children: actionButtons?.delete?.text || UI_CONSTANTS.BUTTON_TEXTS.DELETE }))] }));
                        },
                    }]),
        ]
        : [];
    const DeleteConfirmationModal = (_jsx(Modal, { title: UI_CONSTANTS.MODAL_TITLES.CONFIRM_DELETION, open: deleteModalVisible, onOk: handleDeleteConfirm, onCancel: () => {
            setDeleteModalVisible(false);
            setItemToDelete(null);
            setDeleteInput('');
        }, okText: UI_CONSTANTS.BUTTON_TEXTS.DELETE, okType: 'danger', okButtonProps: {
            disabled: deleteInput !== 'DELETE',
        }, cancelText: UI_CONSTANTS.BUTTON_TEXTS.CANCEL, children: _jsxs("div", { children: [_jsx("p", { children: UI_CONSTANTS.MODAL_MESSAGES.DELETE_CONFIRMATION }), _jsx("p", { children: UI_CONSTANTS.MODAL_MESSAGES.DELETE_WARNING }), _jsx("p", { children: UI_CONSTANTS.MODAL_MESSAGES.DELETE_INPUT_PLACEHOLDER }), _jsx(Input, { value: deleteInput, onChange: (e) => setDeleteInput(e.target.value), placeholder: UI_CONSTANTS.MODAL_MESSAGES.DELETE_INPUT_PLACEHOLDER })] }) }));
    // Function to fetch and display a relation item in a modal
    const fetchRelationItem = async (relationEntity, itemId) => {
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
            const data = 'data' in responseData ? responseData.data : {};
            // Set the modalEntity to use the target entity's config
            setModalEntity(relationEntity);
            // Set the modalEndpoint to the relation entity's endpoint instead of selectedEndpoint
            // This prevents the background content from changing
            setModalEndpoint(relationEndpoint);
            // Set the viewingRelation flag to true to prevent navigation on modal close
            setViewingRelation(true);
            // Set the modal state to view the item
            setModalState({ type: 'view', item: data });
        }
        catch (err) {
            const errorMessage = err instanceof Error
                ? err.message
                : UI_CONSTANTS.ERROR_MESSAGES.UNKNOWN_ERROR;
            api.error({
                message: UI_CONSTANTS.ERROR_MESSAGES.ERROR,
                description: `${UI_CONSTANTS.ERROR_MESSAGES.FAILED_TO_FETCH_ITEM}${errorMessage}`,
                duration: alertDuration,
                placement: UI_CONSTANTS.ERROR_MESSAGES.ERROR_PLACEMENT,
            });
        }
        finally {
            setLoading(false);
        }
    };
    const renderDetailValue = (field, value) => {
        if (field.renderInDetail) {
            return field.renderInDetail(renderValue(value));
        }
        if (field.type === 'relation' && field.relation && value) {
            const idValue = typeof value === 'object' && value !== null && 'uid' in value
                ? value.uid
                : renderValue(value);
            return (_jsx(Button, { type: 'link', onClick: () => {
                    // Fetch and display the relation item in a modal instead of navigating
                    fetchRelationItem(field.relation.entity, String(idValue));
                }, children: getRelationString(field.relation, value) }));
        }
        if (field.isImage && value) {
            return _jsx(Image, { width: 200, src: String(value) });
        }
        if (field.isFile && value) {
            return (_jsx(Button, { icon: (_jsx(FileOutlined, {})), onClick: () => window.open(String(value), '_blank'), children: "Download File" }));
        }
        if (field.type === 'boolean') {
            return value ? 'Yes' : 'No';
        }
        if (field.type === 'url' && value) {
            return _jsx(Image, { width: 100, src: String(value) });
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
    const DetailModal = useDrawer ? (_jsx(Drawer, { title: UI_CONSTANTS.MODAL_TITLES.ITEM_DETAILS, open: detailModalVisible, onClose: handleDetailModalClose, width: UI_CONSTANTS.LAYOUT.DRAWER_WIDTH, placement: 'right', footer: _jsx("div", { style: { textAlign: 'right' }, children: _jsxs(Space, { children: [_jsx(Button, { onClick: handleDetailModalClose, children: UI_CONSTANTS.BUTTON_TEXTS.CLOSE }), selectedItem &&
                        (viewingRelation ? modalEndpoint : selectedEndpoint) &&
                        (_jsx(Button, { type: 'primary', onClick: handleEditFromDetail, children: UI_CONSTANTS.BUTTON_TEXTS.EDIT }))] }) }), children: selectedItem && (viewingRelation ? modalEndpoint : selectedEndpoint) && (_jsx("div", { children: (viewingRelation ? modalEndpoint : selectedEndpoint)?.fields?.map((field) => {
                const value = selectedItem[field.key];
                return (_jsxs("div", { style: {
                        marginBottom: UI_CONSTANTS.LAYOUT.DETAIL_FIELD_MARGIN,
                    }, children: [_jsxs("div", { style: {
                                fontWeight: UI_CONSTANTS.LAYOUT.DETAIL_LABEL_FONT_WEIGHT,
                                marginBottom: UI_CONSTANTS.LAYOUT.DETAIL_LABEL_MARGIN,
                            }, children: [field.label, ":"] }), _jsx("div", { children: renderDetailValue(field, value) })] }, field.key));
            }) })) })) : (_jsx(Modal, { title: UI_CONSTANTS.MODAL_TITLES.ITEM_DETAILS, open: detailModalVisible, onCancel: handleDetailModalClose, footer: null, width: UI_CONSTANTS.LAYOUT.MODAL_WIDTH, children: selectedItem &&
            (viewingRelation ? modalEndpoint : selectedEndpoint) &&
            (_jsxs("div", { children: [(viewingRelation ? modalEndpoint : selectedEndpoint)?.fields?.map((field) => {
                        const value = selectedItem[field.key];
                        return (_jsxs("div", { style: {
                                marginBottom: UI_CONSTANTS.LAYOUT.DETAIL_FIELD_MARGIN,
                            }, children: [_jsxs("div", { style: {
                                        fontWeight: UI_CONSTANTS.LAYOUT.DETAIL_LABEL_FONT_WEIGHT,
                                        marginBottom: UI_CONSTANTS.LAYOUT.DETAIL_LABEL_MARGIN,
                                    }, children: [field.label, ":"] }), _jsx("div", { children: renderDetailValue(field, value) })] }, field.key));
                    }), _jsx("div", { style: {
                            marginTop: UI_CONSTANTS.LAYOUT.DETAIL_ACTIONS_MARGIN,
                            textAlign: UI_CONSTANTS.LAYOUT.DETAIL_ACTIONS_ALIGN,
                        }, children: _jsxs(Space, { children: [_jsx(Button, { onClick: handleDetailModalClose, children: UI_CONSTANTS.BUTTON_TEXTS.CLOSE }), _jsx(Button, { type: 'primary', onClick: handleEditFromDetail, children: UI_CONSTANTS.BUTTON_TEXTS.EDIT })] }) })] })) }));
    const EditModal = useDrawer ? (_jsx(Drawer, { title: editingItem
            ? UI_CONSTANTS.MODAL_TITLES.EDIT_ITEM
            : UI_CONSTANTS.MODAL_TITLES.ADD_ITEM, open: isModalVisible, onClose: handleModalClose, width: UI_CONSTANTS.LAYOUT.DRAWER_WIDTH, placement: 'right', footer: _jsx("div", { style: { textAlign: 'right' }, children: _jsxs(Space, { children: [_jsxs(Button, { type: 'primary', onClick: () => form.submit(), loading: loading, children: [editingItem
                                ? UI_CONSTANTS.BUTTON_TEXTS.UPDATE
                                : UI_CONSTANTS.BUTTON_TEXTS.ADD, ' ', "Item"] }), _jsx(Button, { onClick: handleModalClose, children: UI_CONSTANTS.BUTTON_TEXTS.CANCEL })] }) }), children: _jsx(Spin, { spinning: loading, children: _jsx(Form, { form: form, layout: 'vertical', onFinish: handleSubmit, initialValues: editingItem || {}, children: (viewingRelation && modalEndpoint ? modalEndpoint : selectedEndpoint)?.fields
                    .filter((field) => editingItem
                    ? field.patchable || !field.readOnly
                    : field.postable || !field.readOnly)
                    .map((field) => (_jsx("div", { children: renderFormField(field) }, field.key))) }) }) })) : (_jsx(Modal, { title: editingItem
            ? UI_CONSTANTS.MODAL_TITLES.EDIT_ITEM
            : UI_CONSTANTS.MODAL_TITLES.ADD_ITEM, open: isModalVisible, onCancel: handleModalClose, footer: null, width: UI_CONSTANTS.LAYOUT.MODAL_WIDTH, children: _jsx(Spin, { spinning: loading, children: _jsxs(Form, { form: form, layout: 'vertical', onFinish: handleSubmit, initialValues: editingItem || {}, children: [(viewingRelation && modalEndpoint ? modalEndpoint : selectedEndpoint)?.fields
                        .filter((field) => editingItem
                        ? field.patchable || !field.readOnly
                        : field.postable || !field.readOnly)
                        .map((field) => (_jsx("div", { children: renderFormField(field) }, field.key))), _jsx(Form.Item, { children: _jsxs(Space, { children: [_jsxs(Button, { type: 'primary', htmlType: 'submit', loading: loading, children: [editingItem
                                            ? UI_CONSTANTS.BUTTON_TEXTS.UPDATE
                                            : UI_CONSTANTS.BUTTON_TEXTS.ADD, ' ', "Item"] }), _jsx(Button, { onClick: handleModalClose, children: UI_CONSTANTS.BUTTON_TEXTS.CANCEL })] }) })] }) }) }));
    const handleAddNew = () => {
        setEditingItem(null);
        form.resetFields();
        setIsModalVisible(true);
    };
    // If the selected endpoint has a custom component, render it instead of the default CRUD
    if (selectedEndpoint?.customComponent) {
        const CustomComponent = selectedEndpoint.customComponent;
        return (_jsxs(Layout, { style: {
                minHeight: '100%',
                background: 'transparent',
                display: 'flex',
                flexDirection: 'row',
                height: '100%',
            }, children: [contextHolder, _jsxs(Sider, { trigger: null, collapsible: true, collapsed: collapsed, style: { background: '#fff' }, children: [_jsx(Menu, { mode: 'inline', selectedKeys: [entity || ''], items: config.endpoints.map((endpoint) => ({
                                key: endpoint.key,
                                label: endpoint.label,
                                onClick: () => {
                                    // Only navigate if not viewing a relation
                                    if (!viewingRelation) {
                                        navigate(`/${endpoint.key}`);
                                    }
                                },
                            })) }), _jsx(Button, { type: 'text', icon: (collapsed ? (_jsx(MenuUnfoldOutlined, {})) : (_jsx(MenuFoldOutlined, {}))), onClick: () => setCollapsed(!collapsed), style: {
                                width: '100%',
                                borderRadius: 0,
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                borderTop: '1px solid #f0f0f0',
                            } })] }), _jsxs(Layout, { style: {
                        background: '#fff',
                        padding: '24px',
                        flex: UI_CONSTANTS.DEFAULTS.FIRST_PAGE,
                        display: 'flex',
                        flexDirection: 'column',
                    }, children: [selectedEndpoint.header || (_jsx("div", { style: {
                                marginBottom: UI_CONSTANTS.LAYOUT.HEADER_MARGIN,
                                display: UI_CONSTANTS.STYLES.FLEX.DISPLAY,
                                alignItems: UI_CONSTANTS.STYLES.FLEX.ALIGN_CENTER,
                            }, children: _jsx("h1", { style: { margin: UI_CONSTANTS.LAYOUT.HEADER_TITLE_MARGIN }, children: selectedEndpoint.label }) })), _jsx(CustomComponent, {}), selectedEndpoint.footer] })] }));
    }
    // Default CRUD rendering
    return (_jsxs(Layout, { style: {
            minHeight: '100%',
            background: 'transparent',
            display: 'flex',
            flexDirection: 'row',
            height: '100%',
        }, children: [contextHolder, _jsxs(Sider, { trigger: null, collapsible: true, collapsed: collapsed, style: { background: '#fff' }, children: [_jsx(Menu, { mode: 'inline', selectedKeys: [entity || ''], items: config.endpoints.map((endpoint) => ({
                            key: endpoint.key,
                            label: endpoint.label,
                            onClick: () => {
                                // Only navigate if not viewing a relation
                                if (!viewingRelation) {
                                    navigate(`/${endpoint.key}`);
                                }
                            },
                        })) }), _jsx(Button, { type: 'text', icon: (collapsed ? (_jsx(MenuUnfoldOutlined, {})) : (_jsx(MenuFoldOutlined, {}))), onClick: () => setCollapsed(!collapsed), style: {
                            width: '100%',
                            borderRadius: 0,
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            borderTop: '1px solid #f0f0f0',
                        } })] }), _jsxs(Layout, { style: {
                    background: '#fff',
                    padding: '24px',
                    flex: UI_CONSTANTS.DEFAULTS.FIRST_PAGE,
                    display: 'flex',
                    flexDirection: 'column',
                }, children: [selectedEndpoint?.header || (_jsxs("div", { style: {
                            marginBottom: UI_CONSTANTS.LAYOUT.HEADER_MARGIN,
                            display: UI_CONSTANTS.STYLES.FLEX.DISPLAY,
                            alignItems: UI_CONSTANTS.STYLES.FLEX.ALIGN_CENTER,
                        }, children: [_jsx("h1", { style: { margin: UI_CONSTANTS.LAYOUT.HEADER_TITLE_MARGIN }, children: selectedEndpoint?.label }), _jsxs(Button, { type: 'primary', onClick: () => handleAddNew(), style: { marginLeft: 'auto' }, children: ["Add New ", selectedEndpoint?.label] })] })), _jsx("div", { style: {
                            flex: UI_CONSTANTS.DEFAULTS.FIRST_PAGE,
                            display: 'flex',
                            flexDirection: 'column',
                            minHeight: 0,
                        }, children: _jsx(Table, { dataSource: items, columns: columns, rowKey: (record) => record[selectedEndpoint?.idField || 'id'], pagination: pagination, loading: loading, onChange: handleTableChange, onRow: (record) => ({
                                onClick: (event) => handleRowClick(record, event),
                                style: { cursor: 'pointer' },
                            }), scroll: { x: 'max-content', y: 'calc(100vh - 400px)' }, style: {
                                flex: UI_CONSTANTS.DEFAULTS.FIRST_PAGE,
                                minHeight: UI_CONSTANTS.LAYOUT.TABLE_MIN_HEIGHT,
                            } }, `table-${selectedEndpoint?.key}`) }), EditModal, DetailModal, DeleteConfirmationModal, selectedEndpoint?.footer] })] }));
}
