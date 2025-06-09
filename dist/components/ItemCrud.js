"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var jsx_runtime_1 = require("react/jsx-runtime");
var antd_1 = require("antd");
var icons_1 = require("@ant-design/icons");
var react_1 = require("react");
var dateFormat_1 = require("../utils/dateFormat");
var react_router_dom_1 = require("react-router-dom");
var RelationField_1 = require("./RelationField");
var constants_1 = require("../constants");
var dayjs_1 = __importDefault(require("dayjs"));
var GetRelationString_1 = require("./GetRelationString");
var timezone_1 = __importDefault(require("dayjs/plugin/timezone"));
var utc_1 = __importDefault(require("dayjs/plugin/utc"));
dayjs_1.default.extend(utc_1.default);
dayjs_1.default.extend(timezone_1.default);
var Sider = antd_1.Layout.Sider;
function ItemCrud(_a) {
    var _this = this;
    var _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
    var apiClient = _a.apiClient, config = _a.config, _p = _a.useDrawer, useDrawer = _p === void 0 ? false : _p;
    var location = (0, react_router_dom_1.useLocation)();
    var navigate = (0, react_router_dom_1.useNavigate)();
    var _q = (0, react_router_dom_1.useParams)(), entity = _q.entity, operation = _q.operation, id = _q.id;
    var _r = (0, react_1.useState)([]), items = _r[0], setItems = _r[1];
    var _s = (0, react_1.useState)(true), loading = _s[0], setLoading = _s[1];
    var _t = (0, react_1.useState)(null), editingItem = _t[0], setEditingItem = _t[1];
    var form = antd_1.Form.useForm()[0];
    var _u = (0, react_1.useState)(false), isModalVisible = _u[0], setIsModalVisible = _u[1];
    var _v = (0, react_1.useState)(null), selectedEndpoint = _v[0], setSelectedEndpoint = _v[1];
    // Separate endpoint state for modals
    var _w = (0, react_1.useState)(null), modalEndpoint = _w[0], setModalEndpoint = _w[1];
    var _x = (0, react_1.useState)({
        current: constants_1.UI_CONSTANTS.DEFAULTS.FIRST_PAGE,
        pageSize: constants_1.UI_CONSTANTS.DEFAULTS.PAGE_SIZE,
        total: 0,
    }), pagination = _x[0], setPagination = _x[1];
    var paginationRef = (0, react_1.useRef)(pagination);
    paginationRef.current = pagination;
    var _y = antd_1.notification.useNotification(), api = _y[0], contextHolder = _y[1];
    var _z = (0, react_1.useState)(''), deleteInput = _z[0], setDeleteInput = _z[1];
    var _0 = (0, react_1.useState)(false), deleteModalVisible = _0[0], setDeleteModalVisible = _0[1];
    var _1 = (0, react_1.useState)(null), itemToDelete = _1[0], setItemToDelete = _1[1];
    var _2 = (0, react_1.useState)(false), detailModalVisible = _2[0], setDetailModalVisible = _2[1];
    var _3 = (0, react_1.useState)(null), selectedItem = _3[0], setSelectedItem = _3[1];
    // Track if we're viewing a relation item to prevent navigation on modal close
    var _4 = (0, react_1.useState)(false), viewingRelation = _4[0], setViewingRelation = _4[1];
    // Store the entity for the modal
    var _5 = (0, react_1.useState)(null), modalEntity = _5[0], setModalEntity = _5[1];
    var _6 = (0, react_1.useState)({ type: null, item: null }), modalState = _6[0], setModalState = _6[1];
    var _7 = (0, react_1.useState)(false), collapsed = _7[0], setCollapsed = _7[1];
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    var _8 = (0, react_1.useState)({
        field: null,
        order: 'ascend',
    }), _sorting = _8[0], setSorting = _8[1];
    var _9 = (0, react_1.useState)({}), filters = _9[0], setFilters = _9[1];
    var isMountedRef = (0, react_1.useRef)(true);
    // Request tracking
    var requestIdRef = (0, react_1.useRef)(0);
    var alertDuration = (_b = config.alertDuration) !== null && _b !== void 0 ? _b : constants_1.UI_CONSTANTS.DEFAULTS.ALERT_DURATION;
    // Cleanup function to prevent memory leaks and state updates after unmount
    (0, react_1.useEffect)(function () {
        isMountedRef.current = true;
        return function () {
            isMountedRef.current = false;
        };
    }, []);
    var fetchItems = (0, react_1.useCallback)(function () { return __awaiter(_this, void 0, void 0, function () {
        var currentRequestId, searchParams, response, responseData, isListResponse, data, count, total, processedItems, err_1, errorMessage;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!selectedEndpoint) {
                        return [2 /*return*/];
                    }
                    currentRequestId = ++requestIdRef.current;
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 3, 4, 5]);
                    setLoading(true);
                    searchParams = new URLSearchParams(location.search);
                    return [4 /*yield*/, apiClient.get(selectedEndpoint.url, {
                            params: searchParams,
                        })];
                case 2:
                    response = _c.sent();
                    if (!isMountedRef.current || currentRequestId !== requestIdRef.current) {
                        return [2 /*return*/];
                    }
                    responseData = response;
                    isListResponse = Array.isArray(responseData.data);
                    data = isListResponse ? responseData.data : [responseData.data];
                    count = 'count' in responseData ? responseData.count : undefined;
                    total = (_a = count !== null && count !== void 0 ? count : data.length) !== null && _a !== void 0 ? _a : 0;
                    setPagination({
                        current: parseInt(searchParams.get(constants_1.UI_CONSTANTS.URL_PARAMS.PAGE) || '1'),
                        pageSize: parseInt(searchParams.get(constants_1.UI_CONSTANTS.URL_PARAMS.PAGE_SIZE) ||
                            ((_b = config.defaultPagesize) === null || _b === void 0 ? void 0 : _b.toString()) ||
                            constants_1.UI_CONSTANTS.DEFAULTS.PAGE_SIZE.toString()),
                        total: total,
                    });
                    processedItems = data.map(function (item) {
                        var idField = selectedEndpoint.idField;
                        if (idField && !item[idField]) {
                            for (var _i = 0, _a = constants_1.UI_CONSTANTS.ID_FIELDS.POSSIBLE_FIELDS; _i < _a.length; _i++) {
                                var field = _a[_i];
                                if (item[field]) {
                                    item[idField] = item[field];
                                    break;
                                }
                            }
                        }
                        return item;
                    });
                    setItems(processedItems);
                    return [3 /*break*/, 5];
                case 3:
                    err_1 = _c.sent();
                    if (!isMountedRef.current || currentRequestId !== requestIdRef.current) {
                        return [2 /*return*/];
                    }
                    errorMessage = err_1 instanceof Error
                        ? err_1.message
                        : constants_1.UI_CONSTANTS.ERROR_MESSAGES.UNKNOWN_ERROR;
                    api.error({
                        message: constants_1.UI_CONSTANTS.ERROR_MESSAGES.ERROR,
                        description: "".concat(constants_1.UI_CONSTANTS.ERROR_MESSAGES.FAILED_TO_FETCH_ITEMS, " ").concat(errorMessage),
                        duration: config.alertDuration || constants_1.UI_CONSTANTS.DEFAULTS.ALERT_DURATION,
                    });
                    return [3 /*break*/, 5];
                case 4:
                    if (isMountedRef.current && currentRequestId === requestIdRef.current) {
                        setLoading(false);
                    }
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, [selectedEndpoint, api, apiClient, location.search]);
    // Effect to sync initial URL parameters
    (0, react_1.useEffect)(function () {
        if (!selectedEndpoint) {
            return;
        }
        var searchParams = new URLSearchParams(location.search);
        // Sync pagination
        var page = searchParams.get(constants_1.UI_CONSTANTS.URL_PARAMS.PAGE);
        var pageSize = searchParams.get(constants_1.UI_CONSTANTS.URL_PARAMS.PAGE_SIZE);
        if (page || pageSize) {
            setPagination({
                current: page ? parseInt(page, 10) : constants_1.UI_CONSTANTS.DEFAULTS.FIRST_PAGE,
                pageSize: pageSize
                    ? parseInt(pageSize, 10)
                    : constants_1.UI_CONSTANTS.DEFAULTS.PAGE_SIZE,
                total: pagination.total,
            });
        }
        // Sync sorting
        var sort = searchParams.get(constants_1.UI_CONSTANTS.URL_PARAMS.SORT);
        var order = searchParams.get(constants_1.UI_CONSTANTS.URL_PARAMS.ORDER);
        if (sort) {
            setSorting({
                field: sort,
                order: order === 'desc' ? 'descend' : 'ascend',
            });
        }
        // Sync filters
        var newFilters = {};
        searchParams.forEach(function (value, key) {
            var excludedKeys = [
                constants_1.UI_CONSTANTS.URL_PARAMS.PAGE,
                constants_1.UI_CONSTANTS.URL_PARAMS.PAGE_SIZE,
                constants_1.UI_CONSTANTS.URL_PARAMS.SORT,
                constants_1.UI_CONSTANTS.URL_PARAMS.ORDER,
            ];
            if (!excludedKeys.includes(key)) {
                newFilters[key] = value.split(',');
            }
        });
        setFilters(newFilters);
    }, [selectedEndpoint, location.search]);
    // Single effect to handle all data fetching
    (0, react_1.useEffect)(function () {
        var isSubscribed = true;
        var loadData = function () { return __awaiter(_this, void 0, void 0, function () {
            var endpoint, searchParams;
            return __generator(this, function (_a) {
                if (!entity || !isSubscribed) {
                    return [2 /*return*/];
                }
                endpoint = config.endpoints.find(function (e) { return e.key === entity; });
                if (!endpoint) {
                    return [2 /*return*/];
                }
                // Handle entity change
                if ((selectedEndpoint === null || selectedEndpoint === void 0 ? void 0 : selectedEndpoint.key) !== entity) {
                    setSelectedEndpoint(endpoint);
                    // Clear filters when changing endpoints
                    setFilters({});
                    searchParams = new URLSearchParams();
                    searchParams.set(constants_1.UI_CONSTANTS.URL_PARAMS.PAGE, String(constants_1.UI_CONSTANTS.DEFAULTS.FIRST_PAGE));
                    searchParams.set(constants_1.UI_CONSTANTS.URL_PARAMS.PAGE_SIZE, String(pagination.pageSize));
                    // Only navigate if not viewing a relation
                    if (!viewingRelation) {
                        navigate("/".concat(entity, "?").concat(searchParams.toString()), { replace: true });
                    }
                    return [2 /*return*/];
                }
                // Handle specific item view/edit
                if (operation && id) {
                    fetchItemById(id).then();
                    return [2 /*return*/];
                }
                // Handle list view
                fetchItems().then();
                return [2 /*return*/];
            });
        }); };
        loadData();
        return function () {
            isSubscribed = false;
        };
    }, [entity, operation, id, selectedEndpoint, fetchItems]);
    // Effect to handle URL changes
    (0, react_1.useEffect)(function () {
        if (!selectedEndpoint || operation || id) {
            return;
        }
        var searchParams = new URLSearchParams(location.search);
        var page = searchParams.get(constants_1.UI_CONSTANTS.URL_PARAMS.PAGE);
        var pageSize = searchParams.get(constants_1.UI_CONSTANTS.URL_PARAMS.PAGE_SIZE);
        if (page || pageSize) {
            var newPage = page
                ? parseInt(page, 10)
                : constants_1.UI_CONSTANTS.DEFAULTS.FIRST_PAGE;
            var newPageSize = pageSize
                ? parseInt(pageSize, 10)
                : constants_1.UI_CONSTANTS.DEFAULTS.PAGE_SIZE;
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
    var handleTableChange = function (pagination, filters, sorter) {
        var searchParams = new URLSearchParams(location.search);
        // Preserve existing filters
        Object.entries(filters).forEach(function (_a) {
            var key = _a[0], value = _a[1];
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
        var current = pagination.current, pageSize = pagination.pageSize;
        searchParams.set(constants_1.UI_CONSTANTS.URL_PARAMS.PAGE, String(current));
        searchParams.set(constants_1.UI_CONSTANTS.URL_PARAMS.PAGE_SIZE, String(pageSize));
        // Handle sorting
        if (Array.isArray(sorter)) {
            if (sorter.length > 0 && sorter[0].column) {
                var field = sorter[0].field;
                var order = sorter[0].order;
                if (order) {
                    searchParams.set(constants_1.UI_CONSTANTS.URL_PARAMS.SORT, field);
                    searchParams.set(constants_1.UI_CONSTANTS.URL_PARAMS.ORDER, order === 'ascend' ? 'asc' : 'desc');
                }
                else {
                    searchParams.delete(constants_1.UI_CONSTANTS.URL_PARAMS.SORT);
                    searchParams.delete(constants_1.UI_CONSTANTS.URL_PARAMS.ORDER);
                }
            }
        }
        else if (sorter.column) {
            var field = sorter.field;
            var order = sorter.order;
            if (order) {
                searchParams.set(constants_1.UI_CONSTANTS.URL_PARAMS.SORT, field);
                searchParams.set(constants_1.UI_CONSTANTS.URL_PARAMS.ORDER, order === 'ascend' ? 'asc' : 'desc');
            }
            else {
                searchParams.delete(constants_1.UI_CONSTANTS.URL_PARAMS.SORT);
                searchParams.delete(constants_1.UI_CONSTANTS.URL_PARAMS.ORDER);
            }
        }
        else {
            searchParams.delete(constants_1.UI_CONSTANTS.URL_PARAMS.SORT);
            searchParams.delete(constants_1.UI_CONSTANTS.URL_PARAMS.ORDER);
        }
        // Only update URL if not viewing a relation
        if (!viewingRelation) {
            navigate("".concat(location.pathname, "?").concat(searchParams.toString()), {
                replace: true,
            });
        }
        // Always fetch items with the updated parameters
        fetchItems().then();
    };
    var handleRowClick = function (record, event) {
        var target = event.target;
        // Check if the click is on any interactive element
        var isInteractiveElement = target.closest('button') ||
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
        var endpoint = viewingRelation && modalEndpoint ? modalEndpoint : selectedEndpoint;
        if (modalEntity && viewingRelation && !modalEndpoint) {
            var targetEndpoint = config.endpoints.find(function (ep) { return ep.key === modalEntity; });
            if (targetEndpoint) {
                endpoint = targetEndpoint;
                setModalEndpoint(targetEndpoint);
            }
        }
        var idField = endpoint === null || endpoint === void 0 ? void 0 : endpoint.idField;
        if (!idField) {
            api.error({
                message: constants_1.UI_CONSTANTS.ERROR_MESSAGES.ERROR,
                description: constants_1.UI_CONSTANTS.ERROR_MESSAGES.ID_FIELD_NOT_CONFIGURED,
                duration: alertDuration,
            });
            return;
        }
        var itemId = record[idField];
        if (!itemId) {
            api.error({
                message: constants_1.UI_CONSTANTS.ERROR_MESSAGES.ERROR,
                description: constants_1.UI_CONSTANTS.ERROR_MESSAGES.ITEM_ID_MISSING,
                duration: alertDuration,
            });
            return;
        }
        // If we're viewing a relation, fetch and display the item in a modal instead of navigating
        if (viewingRelation && entity) {
            fetchRelationItem(entity, String(itemId));
        }
        else if (entity) {
            navigate("/".concat(entity, "/view/").concat(itemId), { replace: true });
        }
    };
    var handleEdit = function (item) { return __awaiter(_this, void 0, void 0, function () {
        var endpoint, targetEndpoint, idField, itemId, response, data, err_2, errorMessage;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!selectedEndpoint && !modalEndpoint)
                        return [2 /*return*/];
                    endpoint = viewingRelation && modalEndpoint ? modalEndpoint : selectedEndpoint;
                    if (modalEntity && viewingRelation && !modalEndpoint) {
                        targetEndpoint = config.endpoints.find(function (ep) { return ep.key === modalEntity; });
                        if (targetEndpoint) {
                            endpoint = targetEndpoint;
                            setModalEndpoint(targetEndpoint);
                        }
                    }
                    idField = endpoint === null || endpoint === void 0 ? void 0 : endpoint.idField;
                    if (!idField) {
                        api.error({
                            message: constants_1.UI_CONSTANTS.ERROR_MESSAGES.ERROR,
                            description: constants_1.UI_CONSTANTS.ERROR_MESSAGES.ID_FIELD_NOT_CONFIGURED,
                            duration: alertDuration,
                        });
                        return [2 /*return*/];
                    }
                    itemId = item[idField];
                    if (!itemId) {
                        api.error({
                            message: constants_1.UI_CONSTANTS.ERROR_MESSAGES.ERROR,
                            description: constants_1.UI_CONSTANTS.ERROR_MESSAGES.ITEM_ID_MISSING,
                            duration: alertDuration,
                        });
                        return [2 /*return*/];
                    }
                    if (!viewingRelation) return [3 /*break*/, 6];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    setLoading(true);
                    if (!endpoint) {
                        throw new Error(constants_1.UI_CONSTANTS.ERROR_MESSAGES.ENDPOINT_NOT_CONFIGURED);
                    }
                    return [4 /*yield*/, apiClient.get("".concat(endpoint.url, "/").concat(itemId))];
                case 2:
                    response = _a.sent();
                    data = 'data' in response ? response.data : {};
                    setModalState({ type: 'edit', item: data });
                    return [3 /*break*/, 5];
                case 3:
                    err_2 = _a.sent();
                    errorMessage = err_2 instanceof Error ? err_2.message : constants_1.UI_CONSTANTS.ERROR_MESSAGES.UNKNOWN_ERROR;
                    api.error({
                        message: constants_1.UI_CONSTANTS.ERROR_MESSAGES.ERROR,
                        description: "".concat(constants_1.UI_CONSTANTS.ERROR_MESSAGES.FAILED_TO_FETCH_ITEM).concat(errorMessage),
                        duration: alertDuration,
                    });
                    return [3 /*break*/, 5];
                case 4:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [3 /*break*/, 7];
                case 6:
                    navigate("/".concat(entity, "/edit/").concat(itemId), { replace: true });
                    _a.label = 7;
                case 7: return [2 /*return*/];
            }
        });
    }); };
    var handleModalClose = function () {
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
            navigate("/".concat(entity), { replace: true });
        }
    };
    var handleDetailModalClose = function () {
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
            navigate("/".concat(entity), { replace: true });
        }
    };
    var handleEditFromDetail = function () {
        setDetailModalVisible(false);
        setSelectedItem(null);
        // Use the relation entity's endpoint if modalEntity is set
        var endpoint = viewingRelation && modalEndpoint ? modalEndpoint : selectedEndpoint;
        if (modalEntity && viewingRelation && !modalEndpoint) {
            var targetEndpoint = config.endpoints.find(function (ep) { return ep.key === modalEntity; });
            if (targetEndpoint) {
                endpoint = targetEndpoint;
                setModalEndpoint(targetEndpoint);
            }
        }
        var idField = endpoint === null || endpoint === void 0 ? void 0 : endpoint.idField;
        if (!idField) {
            api.error({
                message: constants_1.UI_CONSTANTS.ERROR_MESSAGES.ERROR,
                description: constants_1.UI_CONSTANTS.ERROR_MESSAGES.ID_FIELD_NOT_CONFIGURED,
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
                navigate("/".concat(entity, "/edit/").concat(modalState.item[idField]), {
                    replace: true,
                });
            }
        }
    };
    // Effect to handle modal visibility based on modalState
    (0, react_1.useEffect)(function () {
        if (modalState.type && modalState.item) {
            // If modalEntity is set, use the target entity's config to load the view
            if (modalEntity) {
                var targetEndpoint = config.endpoints.find(function (ep) { return ep.key === modalEntity; });
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
    var fetchItemById = function (itemId) { return __awaiter(_this, void 0, void 0, function () {
        var endpoint, targetEndpoint, response, responseData, data, err_3, errorMessage;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if ((!selectedEndpoint && !modalEndpoint) || !operation) {
                        return [2 /*return*/];
                    }
                    endpoint = viewingRelation && modalEndpoint ? modalEndpoint : selectedEndpoint;
                    if (modalEntity && viewingRelation && !modalEndpoint) {
                        targetEndpoint = config.endpoints.find(function (ep) { return ep.key === modalEntity; });
                        if (targetEndpoint) {
                            endpoint = targetEndpoint;
                            setModalEndpoint(targetEndpoint);
                        }
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
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
                        throw new Error(constants_1.UI_CONSTANTS.ERROR_MESSAGES.ENDPOINT_NOT_CONFIGURED);
                    }
                    return [4 /*yield*/, apiClient.get("".concat(endpoint.url, "/").concat(itemId))];
                case 2:
                    response = _a.sent();
                    responseData = response;
                    data = 'data' in responseData ? responseData.data : {};
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
                    return [3 /*break*/, 5];
                case 3:
                    err_3 = _a.sent();
                    errorMessage = err_3 instanceof Error
                        ? err_3.message
                        : constants_1.UI_CONSTANTS.ERROR_MESSAGES.UNKNOWN_ERROR;
                    api.error({
                        message: constants_1.UI_CONSTANTS.ERROR_MESSAGES.ERROR,
                        description: "".concat(constants_1.UI_CONSTANTS.ERROR_MESSAGES.FAILED_TO_FETCH_ITEM).concat(errorMessage),
                        duration: alertDuration,
                        placement: constants_1.UI_CONSTANTS.ERROR_MESSAGES.ERROR_PLACEMENT,
                    });
                    // Navigate back to the list view on error only if not viewing a relation
                    if (!viewingRelation && entity) {
                        navigate("/".concat(entity));
                    }
                    return [3 /*break*/, 5];
                case 4:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var handleSubmit = function (values) { return __awaiter(_this, void 0, void 0, function () {
        var endpoint, targetEndpoint, formData, _loop_1, _i, _a, _b, key, value, idField, itemId, err_4, errorMessage;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!selectedEndpoint && !modalEndpoint)
                        return [2 /*return*/];
                    endpoint = viewingRelation && modalEndpoint ? modalEndpoint : selectedEndpoint;
                    if (modalEntity && viewingRelation && !modalEndpoint) {
                        targetEndpoint = config.endpoints.find(function (ep) { return ep.key === modalEntity; });
                        if (targetEndpoint) {
                            endpoint = targetEndpoint;
                            setModalEndpoint(targetEndpoint);
                        }
                    }
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 6, 7, 8]);
                    setLoading(true);
                    formData = new FormData();
                    _loop_1 = function (key, value) {
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
                                return "continue";
                            }
                            var field = endpoint.fields.find(function (f) { return f.key === key; });
                            if (field &&
                                (field.type === 'date' || field.type === 'datetime') &&
                                value) {
                                var date = (0, dayjs_1.default)(value);
                                if (date.isValid()) {
                                    var finalDate = void 0;
                                    if (field.keepLocalTime) {
                                        // Convert UTC to local time
                                        finalDate = date.local();
                                    }
                                    else {
                                        // Keep UTC time as-is
                                        finalDate = date.utc();
                                    }
                                    // Format the date without timezone information
                                    var formattedDate = void 0;
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
                    };
                    // Add all form values to FormData
                    for (_i = 0, _a = Object.entries(values); _i < _a.length; _i++) {
                        _b = _a[_i], key = _b[0], value = _b[1];
                        _loop_1(key, value);
                    }
                    if (!endpoint) {
                        throw new Error(constants_1.UI_CONSTANTS.ERROR_MESSAGES.ENDPOINT_NOT_CONFIGURED);
                    }
                    if (!editingItem) return [3 /*break*/, 3];
                    idField = endpoint.idField;
                    if (!idField) {
                        throw new Error(constants_1.UI_CONSTANTS.ERROR_MESSAGES.ID_FIELD_NOT_CONFIGURED);
                    }
                    itemId = editingItem[idField];
                    if (!itemId) {
                        throw new Error(constants_1.UI_CONSTANTS.ERROR_MESSAGES.ITEM_ID_MISSING);
                    }
                    return [4 /*yield*/, apiClient.patch("".concat(endpoint.url, "/").concat(itemId), formData, {
                            headers: {
                                'Content-Type': 'multipart/form-data',
                            },
                        })];
                case 2:
                    _c.sent();
                    api.success({
                        message: constants_1.UI_CONSTANTS.SUCCESS_MESSAGES.SUCCESS,
                        description: constants_1.UI_CONSTANTS.SUCCESS_MESSAGES.ITEM_UPDATED,
                        duration: alertDuration,
                    });
                    return [3 /*break*/, 5];
                case 3: return [4 /*yield*/, apiClient.post(endpoint.url, formData, {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                        },
                    })];
                case 4:
                    _c.sent();
                    api.success({
                        message: constants_1.UI_CONSTANTS.SUCCESS_MESSAGES.SUCCESS,
                        description: constants_1.UI_CONSTANTS.SUCCESS_MESSAGES.ITEM_CREATED,
                        duration: alertDuration,
                    });
                    _c.label = 5;
                case 5:
                    handleModalClose();
                    fetchItems().then();
                    return [3 /*break*/, 8];
                case 6:
                    err_4 = _c.sent();
                    errorMessage = err_4 instanceof Error
                        ? err_4.message
                        : constants_1.UI_CONSTANTS.ERROR_MESSAGES.UNKNOWN_ERROR;
                    api.error({
                        message: constants_1.UI_CONSTANTS.ERROR_MESSAGES.ERROR,
                        description: "".concat(constants_1.UI_CONSTANTS.ERROR_MESSAGES.FAILED_TO_SAVE_ITEM, " ").concat(errorMessage),
                        duration: alertDuration,
                    });
                    return [3 /*break*/, 8];
                case 7:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 8: return [2 /*return*/];
            }
        });
    }); };
    var handleDelete = function (id) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            if (!selectedEndpoint)
                return [2 /*return*/];
            setDeleteInput('');
            setItemToDelete(id);
            setDeleteModalVisible(true);
            return [2 /*return*/];
        });
    }); };
    var handleDeleteConfirm = function () { return __awaiter(_this, void 0, void 0, function () {
        var endpoint, targetEndpoint, err_5, errorMessage;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if ((!selectedEndpoint && !modalEndpoint) || !itemToDelete || deleteInput !== 'DELETE')
                        return [2 /*return*/];
                    endpoint = viewingRelation && modalEndpoint ? modalEndpoint : selectedEndpoint;
                    if (modalEntity && viewingRelation && !modalEndpoint) {
                        targetEndpoint = config.endpoints.find(function (ep) { return ep.key === modalEntity; });
                        if (targetEndpoint) {
                            endpoint = targetEndpoint;
                            setModalEndpoint(targetEndpoint);
                        }
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    setLoading(true);
                    if (!endpoint) {
                        throw new Error(constants_1.UI_CONSTANTS.ERROR_MESSAGES.ENDPOINT_NOT_CONFIGURED);
                    }
                    return [4 /*yield*/, apiClient.delete("".concat(endpoint.url, "/").concat(itemToDelete))];
                case 2:
                    _a.sent();
                    api.success({
                        message: constants_1.UI_CONSTANTS.SUCCESS_MESSAGES.SUCCESS,
                        description: constants_1.UI_CONSTANTS.SUCCESS_MESSAGES.ITEM_DELETED,
                        duration: alertDuration,
                    });
                    fetchItems().then();
                    return [3 /*break*/, 5];
                case 3:
                    err_5 = _a.sent();
                    errorMessage = err_5 instanceof Error
                        ? err_5.message
                        : constants_1.UI_CONSTANTS.ERROR_MESSAGES.UNKNOWN_ERROR;
                    api.error({
                        message: errorMessage,
                        description: constants_1.UI_CONSTANTS.ERROR_MESSAGES.FAILED_TO_DELETE_ITEM,
                        duration: alertDuration,
                    });
                    return [3 /*break*/, 5];
                case 4:
                    setLoading(false);
                    setDeleteModalVisible(false);
                    setItemToDelete(null);
                    setDeleteInput('');
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var renderValue = function (value) {
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
    var renderFormField = function (field) {
        var _a;
        var rules = [
            {
                required: field.required,
                message: "".concat(field.label, " ").concat(constants_1.UI_CONSTANTS.FORM_MESSAGES.REQUIRED_FIELD),
            },
        ];
        if (field.validator) {
            var validatorFn_1 = field.validator;
            rules.push({
                validator: function (_, value) { return __awaiter(_this, void 0, void 0, function () {
                    var validationResult;
                    return __generator(this, function (_a) {
                        validationResult = validatorFn_1(value);
                        if (!validationResult.status) {
                            throw new Error(validationResult.message ||
                                constants_1.UI_CONSTANTS.FORM_MESSAGES.INVALID_VALUE);
                        }
                        return [2 /*return*/];
                    });
                }); },
            });
        }
        // Only disable fields that are explicitly marked as read-only
        var isDisabled = field.readOnly === true;
        // Handle relations
        if (field.type === 'relation' && field.relation) {
            return ((0, jsx_runtime_1.jsx)(RelationField_1.RelationField, { field: field, apiClient: apiClient, rules: rules, isDisabled: isDisabled, form: form }));
        }
        // Handle file and image uploads
        if (field.isFile || field.isImage) {
            var currentValue = form.getFieldValue(field.key);
            var uploadFileList = currentValue
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
                    validator: function (_, value) { return __awaiter(_this, void 0, void 0, function () {
                        var files, acceptTypes, _loop_2, _i, files_1, file, state_1;
                        var _a, _b, _c;
                        return __generator(this, function (_d) {
                            if (!value)
                                return [2 /*return*/, Promise.resolve()];
                            files = Array.isArray(value) ? value : [value];
                            // Skip validation if the value is a string URL (existing file) and not a new File object
                            // This prevents validation errors when editing an item without changing the file
                            if (files.length === 1 && typeof files[0] === 'string') {
                                return [2 /*return*/, Promise.resolve()];
                            }
                            acceptTypes = Array.isArray(field.accept)
                                ? field.accept
                                : ((_a = field.accept) === null || _a === void 0 ? void 0 : _a.split(',').map(function (type) { return type.trim(); })) || [];
                            _loop_2 = function (file) {
                                // Skip validation if this is not a new file (e.g., it's a string URL)
                                if (typeof file === 'string')
                                    return "continue";
                                var uploadFile = (_b = file.file) !== null && _b !== void 0 ? _b : file;
                                var fileType = uploadFile.type || '';
                                var fileName = uploadFile.name || '';
                                var fileExtension = fileName.includes('.')
                                    ? ".".concat((_c = fileName.split('.').pop()) === null || _c === void 0 ? void 0 : _c.toLowerCase())
                                    : '';
                                var isValidType = acceptTypes.some(function (type) {
                                    // Handle wildcards like image/*
                                    if (type.endsWith('/*')) {
                                        var mainType = type.split('/')[0];
                                        return fileType.startsWith("".concat(mainType, "/"));
                                    }
                                    // Handle specific extensions like .jpg
                                    if (type.startsWith('.')) {
                                        return fileExtension === type.toLowerCase();
                                    }
                                    // Handle simple extensions like pdf or odf (without dot)
                                    if (/^[a-zA-Z0-9]+$/.test(type)) {
                                        return fileExtension === ".".concat(type.toLowerCase());
                                    }
                                    // Handle specific mime types
                                    return fileType === type;
                                });
                                if (!isValidType) {
                                    return { value: Promise.reject(new Error("File type not allowed. Accepted types: ".concat(Array.isArray(field.accept) ? field.accept.join(', ') : field.accept))) };
                                }
                            };
                            // Check each file against the accepted types
                            for (_i = 0, files_1 = files; _i < files_1.length; _i++) {
                                file = files_1[_i];
                                state_1 = _loop_2(file);
                                if (typeof state_1 === "object")
                                    return [2 /*return*/, state_1.value];
                            }
                            return [2 /*return*/, Promise.resolve()];
                        });
                    }); }
                });
            }
            // Add file size validation rule if maxSize is provided
            if (field.maxSize) {
                rules.push({
                    validator: function (_, value) { return __awaiter(_this, void 0, void 0, function () {
                        var files, _i, files_2, file, uploadFile;
                        var _a;
                        return __generator(this, function (_b) {
                            if (!value)
                                return [2 /*return*/, Promise.resolve()];
                            files = Array.isArray(value) ? value : [value];
                            // Skip validation if the value is a string URL (existing file) and not a new File object
                            // This prevents validation errors when editing an item without changing the file
                            if (files.length === 1 && typeof files[0] === 'string') {
                                return [2 /*return*/, Promise.resolve()];
                            }
                            // Check each file against the maxSize constraint
                            for (_i = 0, files_2 = files; _i < files_2.length; _i++) {
                                file = files_2[_i];
                                // Skip validation if this is not a new file (e.g., it's a string URL)
                                if (typeof file === 'string')
                                    continue;
                                uploadFile = (_a = file.file) !== null && _a !== void 0 ? _a : file;
                                if (uploadFile.size && field.maxSize && uploadFile.size / 1024 / 1024 > field.maxSize) {
                                    return [2 /*return*/, Promise.reject(new Error("".concat(constants_1.UI_CONSTANTS.MODAL_MESSAGES.FILE_SIZE_ERROR, " ").concat(field.maxSize, "MB!")))];
                                }
                            }
                            return [2 /*return*/, Promise.resolve()];
                        });
                    }); }
                });
            }
            var uploadProps = {
                name: field.key,
                headers: {
                    authorization: 'Bearer your-token',
                },
                beforeUpload: function (file) {
                    var _a, _b;
                    // Validate file type if accept is provided
                    // This validation only happens when a new file is selected, so no need to check if it's an existing file
                    if (field.accept) {
                        var acceptTypes = Array.isArray(field.accept)
                            ? field.accept
                            : ((_a = field.accept) === null || _a === void 0 ? void 0 : _a.split(',').map(function (type) { return type.trim(); })) || [];
                        var fileType_1 = file.type || '';
                        var fileName = file.name || '';
                        var fileExtension_1 = fileName.includes('.')
                            ? ".".concat((_b = fileName.split('.').pop()) === null || _b === void 0 ? void 0 : _b.toLowerCase())
                            : '';
                        var isValidType = acceptTypes.some(function (type) {
                            // Handle wildcards like image/*
                            if (type.endsWith('/*')) {
                                var mainType = type.split('/')[0];
                                return fileType_1.startsWith("".concat(mainType, "/"));
                            }
                            // Handle specific extensions like .jpg
                            if (type.startsWith('.')) {
                                return fileExtension_1 === type.toLowerCase();
                            }
                            // Handle simple extensions like pdf or odf (without dot)
                            if (/^[a-zA-Z0-9]+$/.test(type)) {
                                return fileExtension_1 === ".".concat(type.toLowerCase());
                            }
                            // Handle specific mime types
                            return fileType_1 === type;
                        });
                        if (!isValidType) {
                            antd_1.message.error("".concat(file.name, " is not a valid file type. Accepted types: ").concat(Array.isArray(field.accept) ? field.accept.join(', ') : field.accept));
                            return false;
                        }
                    }
                    // Validate file size if maxSize is provided
                    if (field.maxSize && file.size && file.size / 1024 / 1024 > field.maxSize) {
                        antd_1.message.error("".concat(constants_1.UI_CONSTANTS.MODAL_MESSAGES.FILE_SIZE_ERROR, " ").concat(field.maxSize, "MB!"));
                        return false;
                    }
                    return true;
                },
                onChange: function (info) {
                    if (info.file.status === 'uploading') {
                        // Store the file in the form state
                        form.setFieldValue(field.key, info.file.originFileObj);
                    }
                    else if (info.file.status === 'done') {
                        antd_1.message.success("".concat(info.file.name, " ").concat(constants_1.UI_CONSTANTS.MODAL_MESSAGES.FILE_SELECT_SUCCESS));
                        // Set the file in the form
                        form.setFieldValue(field.key, info.file.originFileObj);
                    }
                    else if (info.file.status === 'error') {
                        antd_1.message.error("".concat(info.file.name, " ").concat(constants_1.UI_CONSTANTS.MODAL_MESSAGES.FILE_SELECT_FAILED));
                    }
                },
                accept: (function () {
                    if (!field.accept) {
                        return field.isImage ? 'image/*' : undefined;
                    }
                    var formatAcceptType = function (type) {
                        // If it's already a valid format (starts with . or contains /), return as is
                        if (type.startsWith('.') || type.includes('/')) {
                            return type;
                        }
                        // If it's a simple extension, add a dot prefix
                        if (/^[a-zA-Z0-9]+$/.test(type)) {
                            return ".".concat(type);
                        }
                        return type;
                    };
                    if (Array.isArray(field.accept)) {
                        return field.accept.map(formatAcceptType).join(',');
                    }
                    return field.accept.split(',').map(function (type) { return formatAcceptType(type.trim()); }).join(',');
                })(),
                maxCount: constants_1.UI_CONSTANTS.DEFAULTS.FIRST_PAGE,
                fileList: uploadFileList,
            };
            return ((0, jsx_runtime_1.jsx)(antd_1.Form.Item, { name: field.key, label: field.label, rules: rules, children: (0, jsx_runtime_1.jsx)(antd_1.Upload, __assign({}, uploadProps, { children: (0, jsx_runtime_1.jsx)(antd_1.Button, { icon: (field.isImage ? ((0, jsx_runtime_1.jsx)(icons_1.PictureOutlined, {})) : ((0, jsx_runtime_1.jsx)(icons_1.FileOutlined, {}))), children: field.isImage
                            ? constants_1.UI_CONSTANTS.BUTTON_TEXTS.SELECT_IMAGE
                            : constants_1.UI_CONSTANTS.BUTTON_TEXTS.SELECT_FILE }) })) }));
        }
        switch (field.type) {
            case 'date':
                return ((0, jsx_runtime_1.jsx)(antd_1.Form.Item, { name: field.key, label: field.label, rules: __spreadArray(__spreadArray([], rules, true), [
                        {
                            validator: function (_, value) { return __awaiter(_this, void 0, void 0, function () {
                                var date;
                                return __generator(this, function (_a) {
                                    if (value && typeof value === 'string') {
                                        date = (0, dayjs_1.default)(value);
                                        if (!date.isValid()) {
                                            throw new Error('Invalid date');
                                        }
                                    }
                                    return [2 /*return*/];
                                });
                            }); },
                        },
                    ], false), getValueProps: function (value) {
                        if (!value)
                            return { value: null };
                        var date = (0, dayjs_1.default)(value);
                        return { value: date.isValid() ? date : null };
                    }, normalize: function (value) {
                        if (!value)
                            return null;
                        var date = (0, dayjs_1.default)(value);
                        if (!date.isValid())
                            return null;
                        // If keepLocalTime is true, keep the local time
                        // If false, convert to UTC
                        return field.keepLocalTime
                            ? date.toISOString()
                            : date.utc().toISOString();
                    }, children: (0, jsx_runtime_1.jsx)(antd_1.DatePicker, { style: { width: '100%' }, disabled: isDisabled, placeholder: field.placeHolder || "Select ".concat(field.label), format: field.dateFormat || 'YYYY-MM-DD' }) }));
            case 'datetime':
                return ((0, jsx_runtime_1.jsx)(antd_1.Form.Item, { name: field.key, label: field.label, rules: __spreadArray(__spreadArray([], rules, true), [
                        {
                            validator: function (_, value) { return __awaiter(_this, void 0, void 0, function () {
                                var date;
                                return __generator(this, function (_a) {
                                    if (value && typeof value === 'string') {
                                        date = (0, dayjs_1.default)(value);
                                        if (!date.isValid()) {
                                            throw new Error('Invalid date and time');
                                        }
                                    }
                                    return [2 /*return*/];
                                });
                            }); },
                        },
                    ], false), getValueProps: function (value) {
                        if (!value)
                            return { value: null };
                        var date = (0, dayjs_1.default)(value);
                        return { value: date.isValid() ? date : null };
                    }, normalize: function (value) {
                        if (!value)
                            return null;
                        var date = (0, dayjs_1.default)(value);
                        if (!date.isValid())
                            return null;
                        // If keepLocalTime is true, keep the local time
                        // If false, convert to UTC
                        return field.keepLocalTime
                            ? date.toISOString()
                            : date.utc().toISOString();
                    }, children: (0, jsx_runtime_1.jsx)(antd_1.DatePicker, { showTime: true, style: { width: '100%' }, disabled: isDisabled, placeholder: field.placeHolder || "Select ".concat(field.label), format: field.dateFormat || 'YYYY-MM-DD HH:mm:ss' }) }));
            case 'boolean':
                return ((0, jsx_runtime_1.jsx)(antd_1.Form.Item, { name: field.key, label: field.label, valuePropName: 'checked', rules: rules, children: (0, jsx_runtime_1.jsx)(antd_1.Switch, { checkedChildren: constants_1.UI_CONSTANTS.STATUS_TEXTS.YES, unCheckedChildren: constants_1.UI_CONSTANTS.STATUS_TEXTS.NO, disabled: isDisabled }) }));
            case 'url':
                return ((0, jsx_runtime_1.jsx)(antd_1.Form.Item, { name: field.key, label: field.label, rules: rules, children: (0, jsx_runtime_1.jsx)(antd_1.Input, { type: 'url', placeholder: field.placeHolder, disabled: isDisabled }) }));
            case 'email':
                return ((0, jsx_runtime_1.jsx)(antd_1.Form.Item, { name: field.key, label: field.label, rules: __spreadArray(__spreadArray([], rules, true), [
                        {
                            type: 'email',
                            message: constants_1.UI_CONSTANTS.FORM_MESSAGES.INVALID_EMAIL,
                        },
                    ], false), children: (0, jsx_runtime_1.jsx)(antd_1.Input, { type: 'email', placeholder: field.placeHolder, disabled: isDisabled }) }));
            case 'number':
                return ((0, jsx_runtime_1.jsx)(antd_1.Form.Item, { name: field.key, label: field.label, rules: __spreadArray(__spreadArray([], rules, true), [
                        {
                            type: 'number',
                            message: constants_1.UI_CONSTANTS.FORM_MESSAGES.INVALID_NUMBER,
                        },
                    ], false), children: (0, jsx_runtime_1.jsx)(antd_1.InputNumber, { placeholder: field.placeHolder, disabled: isDisabled, style: { width: '100%' }, min: 0 }) }));
            case 'textarea':
                return ((0, jsx_runtime_1.jsx)(antd_1.Form.Item, { name: field.key, label: field.label, rules: rules, children: (0, jsx_runtime_1.jsx)(antd_1.Input.TextArea, { placeholder: field.placeHolder, disabled: isDisabled, rows: 4 }) }));
            case 'select':
                return ((0, jsx_runtime_1.jsx)(antd_1.Form.Item, { name: field.key, label: field.label, rules: rules, children: (0, jsx_runtime_1.jsx)(antd_1.Select, { placeholder: field.placeHolder || "Select ".concat(field.label), disabled: isDisabled, allowClear: true, children: (_a = field.options) === null || _a === void 0 ? void 0 : _a.map(function (option) {
                            return ((0, jsx_runtime_1.jsx)(antd_1.Select.Option, { value: option.value, children: option.label }, option.value));
                        }) }) }));
            default:
                return ((0, jsx_runtime_1.jsx)(antd_1.Form.Item, { name: field.key, label: field.label, rules: rules, children: (0, jsx_runtime_1.jsx)(antd_1.Input, { placeholder: field.placeHolder, disabled: isDisabled }) }));
        }
    };
    var columns = selectedEndpoint
        ? __spreadArray(__spreadArray([], selectedEndpoint.fields
            .filter(function (field) { return field.showInList; })
            .map(function (field) {
            // Get current sort from URL
            var searchParams = new URLSearchParams(location.search);
            var currentSort = searchParams.get(constants_1.UI_CONSTANTS.URL_PARAMS.SORT);
            var currentOrder = searchParams.get(constants_1.UI_CONSTANTS.URL_PARAMS.ORDER);
            // Determine the sort order for this column
            var sortOrder = undefined;
            if (currentSort === field.key) {
                sortOrder = currentOrder === 'asc' ? 'ascend' : 'descend';
            }
            return {
                title: field.label,
                dataIndex: field.key,
                key: field.key,
                width: constants_1.UI_CONSTANTS.LAYOUT.COLUMN_MIN_WIDTH,
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
                    ? function (_a) {
                        var setSelectedKeys = _a.setSelectedKeys, selectedKeys = _a.selectedKeys, confirm = _a.confirm, clearFilters = _a.clearFilters;
                        var handleKeyPress = function (e) {
                            if (e.key === 'Enter') {
                                confirm();
                            }
                        };
                        if (field.filterType === 'range' && (field.type === 'date' || field.type === 'datetime')) {
                            return ((0, jsx_runtime_1.jsxs)("div", { style: { padding: 8 }, children: [(0, jsx_runtime_1.jsx)(antd_1.DatePicker, { placeholder: constants_1.UI_CONSTANTS.FILTER_PLACEHOLDERS.MIN, value: selectedKeys[0] ? (0, dayjs_1.default)(selectedKeys[0]) : null, onChange: function (date) {
                                            return setSelectedKeys(date
                                                ? [
                                                    field.keepLocalTime ? date.toISOString() : date.utc().toISOString(),
                                                    selectedKeys[constants_1.UI_CONSTANTS.DEFAULTS.FIRST_PAGE],
                                                ]
                                                : []);
                                        }, showTime: field.type === 'datetime', style: {
                                            width: constants_1.UI_CONSTANTS.LAYOUT.FILTER_INPUT_WIDTH,
                                            marginRight: constants_1.UI_CONSTANTS.STYLES.MARGIN.RIGHT,
                                            marginBottom: 8,
                                        } }), (0, jsx_runtime_1.jsx)(antd_1.DatePicker, { placeholder: constants_1.UI_CONSTANTS.FILTER_PLACEHOLDERS.MAX, value: selectedKeys[constants_1.UI_CONSTANTS.DEFAULTS.FIRST_PAGE] ? (0, dayjs_1.default)(selectedKeys[constants_1.UI_CONSTANTS.DEFAULTS.FIRST_PAGE]) : null, onChange: function (date) {
                                            return setSelectedKeys([selectedKeys[0], date ? (field.keepLocalTime ? date.toISOString() : date.utc().toISOString()) : '']);
                                        }, showTime: field.type === 'datetime', style: {
                                            width: constants_1.UI_CONSTANTS.LAYOUT.FILTER_INPUT_WIDTH,
                                            marginBottom: 8,
                                        } }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)(antd_1.Button, { type: 'primary', onClick: function () { return confirm(); }, size: 'small', style: {
                                                    width: constants_1.UI_CONSTANTS.LAYOUT.FILTER_BUTTON_WIDTH,
                                                    marginRight: constants_1.UI_CONSTANTS.STYLES.MARGIN.RIGHT,
                                                }, children: "Filter" }), clearFilters && ((0, jsx_runtime_1.jsx)(antd_1.Button, { onClick: function () {
                                                    if (clearFilters) {
                                                        clearFilters();
                                                        confirm();
                                                    }
                                                }, size: 'small', children: "Reset" }))] })] }));
                        }
                        else if (field.filterType === 'range' && field.type === 'time') {
                            return ((0, jsx_runtime_1.jsxs)("div", { style: { padding: 8 }, children: [(0, jsx_runtime_1.jsx)(antd_1.TimePicker, { placeholder: constants_1.UI_CONSTANTS.FILTER_PLACEHOLDERS.MIN, value: selectedKeys[0] ? (0, dayjs_1.default)(selectedKeys[0]) : null, onChange: function (time) {
                                            return setSelectedKeys(time
                                                ? [
                                                    time.format('HH:mm:ss'),
                                                    selectedKeys[constants_1.UI_CONSTANTS.DEFAULTS.FIRST_PAGE],
                                                ]
                                                : []);
                                        }, format: "HH:mm:ss", style: {
                                            width: constants_1.UI_CONSTANTS.LAYOUT.FILTER_INPUT_WIDTH,
                                            marginRight: constants_1.UI_CONSTANTS.STYLES.MARGIN.RIGHT,
                                            marginBottom: 8,
                                        } }), (0, jsx_runtime_1.jsx)(antd_1.TimePicker, { placeholder: constants_1.UI_CONSTANTS.FILTER_PLACEHOLDERS.MAX, value: selectedKeys[constants_1.UI_CONSTANTS.DEFAULTS.FIRST_PAGE] ? (0, dayjs_1.default)(selectedKeys[constants_1.UI_CONSTANTS.DEFAULTS.FIRST_PAGE]) : null, onChange: function (time) {
                                            return setSelectedKeys([selectedKeys[0], time ? time.format('HH:mm:ss') : '']);
                                        }, format: "HH:mm:ss", style: {
                                            width: constants_1.UI_CONSTANTS.LAYOUT.FILTER_INPUT_WIDTH,
                                            marginBottom: 8,
                                        } }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)(antd_1.Button, { type: 'primary', onClick: function () { return confirm(); }, size: 'small', style: {
                                                    width: constants_1.UI_CONSTANTS.LAYOUT.FILTER_BUTTON_WIDTH,
                                                    marginRight: constants_1.UI_CONSTANTS.STYLES.MARGIN.RIGHT,
                                                }, children: "Filter" }), clearFilters && ((0, jsx_runtime_1.jsx)(antd_1.Button, { onClick: function () {
                                                    if (clearFilters) {
                                                        clearFilters();
                                                        confirm();
                                                    }
                                                }, size: 'small', children: "Reset" }))] })] }));
                        }
                        else if (field.filterType === 'range') {
                            return ((0, jsx_runtime_1.jsxs)("div", { style: { padding: 8 }, children: [(0, jsx_runtime_1.jsx)(antd_1.Input, { placeholder: constants_1.UI_CONSTANTS.FILTER_PLACEHOLDERS.MIN, value: selectedKeys[0], onChange: function (e) {
                                            return setSelectedKeys(e.target.value
                                                ? [
                                                    e.target.value,
                                                    selectedKeys[constants_1.UI_CONSTANTS.DEFAULTS.FIRST_PAGE],
                                                ]
                                                : []);
                                        }, onKeyPress: handleKeyPress, style: {
                                            width: constants_1.UI_CONSTANTS.LAYOUT.FILTER_INPUT_WIDTH,
                                            marginRight: constants_1.UI_CONSTANTS.STYLES.MARGIN.RIGHT,
                                            marginBottom: 8,
                                        } }), (0, jsx_runtime_1.jsx)(antd_1.Input, { placeholder: constants_1.UI_CONSTANTS.FILTER_PLACEHOLDERS.MAX, value: selectedKeys[constants_1.UI_CONSTANTS.DEFAULTS.FIRST_PAGE], onChange: function (e) {
                                            return setSelectedKeys([selectedKeys[0], e.target.value]);
                                        }, onKeyPress: handleKeyPress, style: {
                                            width: constants_1.UI_CONSTANTS.LAYOUT.FILTER_INPUT_WIDTH,
                                            marginBottom: 8,
                                        } }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)(antd_1.Button, { type: 'primary', onClick: function () { return confirm(); }, size: 'small', style: {
                                                    width: constants_1.UI_CONSTANTS.LAYOUT.FILTER_BUTTON_WIDTH,
                                                    marginRight: constants_1.UI_CONSTANTS.STYLES.MARGIN.RIGHT,
                                                }, children: "Filter" }), clearFilters && ((0, jsx_runtime_1.jsx)(antd_1.Button, { onClick: function () {
                                                    if (clearFilters) {
                                                        clearFilters();
                                                        confirm();
                                                    }
                                                }, size: 'small', children: "Reset" }))] })] }));
                        }
                        else if (field.filterType === 'boolean') {
                            return ((0, jsx_runtime_1.jsxs)("div", { style: { padding: 8 }, children: [(0, jsx_runtime_1.jsx)(antd_1.Select, { allowClear: true, placeholder: constants_1.UI_CONSTANTS.FILTER_PLACEHOLDERS.SELECT, style: {
                                            width: constants_1.UI_CONSTANTS.LAYOUT.FILTER_SELECT_WIDTH,
                                            marginBottom: 8,
                                        }, value: selectedKeys[0], onChange: function (value) {
                                            setSelectedKeys(value ? [value] : []);
                                            confirm();
                                        }, options: [
                                            { label: 'Yes', value: 'true' },
                                            { label: 'No', value: 'false' },
                                        ] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)(antd_1.Button, { type: 'primary', onClick: function () { return confirm(); }, size: 'small', style: {
                                                    width: constants_1.UI_CONSTANTS.LAYOUT.FILTER_BUTTON_WIDTH,
                                                    marginRight: constants_1.UI_CONSTANTS.STYLES.MARGIN.RIGHT,
                                                }, children: "Filter" }), clearFilters && ((0, jsx_runtime_1.jsx)(antd_1.Button, { onClick: function () {
                                                    if (clearFilters) {
                                                        clearFilters();
                                                        confirm();
                                                    }
                                                }, size: 'small', children: "Reset" }))] })] }));
                        }
                        else if (field.type === 'select') {
                            return ((0, jsx_runtime_1.jsxs)("div", { style: { padding: 8 }, children: [(0, jsx_runtime_1.jsx)(antd_1.Select, { allowClear: true, placeholder: constants_1.UI_CONSTANTS.FILTER_PLACEHOLDERS.SELECT, style: {
                                            width: constants_1.UI_CONSTANTS.LAYOUT.FILTER_SELECT_WIDTH,
                                            marginBottom: 8,
                                        }, value: selectedKeys[0], onChange: function (value) {
                                            setSelectedKeys(value ? [value] : []);
                                            confirm();
                                        }, options: field.options }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)(antd_1.Button, { type: 'primary', onClick: function () { return confirm(); }, size: 'small', style: {
                                                    width: constants_1.UI_CONSTANTS.LAYOUT.FILTER_BUTTON_WIDTH,
                                                    marginRight: constants_1.UI_CONSTANTS.STYLES.MARGIN.RIGHT,
                                                }, children: "Filter" }), clearFilters && ((0, jsx_runtime_1.jsx)(antd_1.Button, { onClick: function () {
                                                    if (clearFilters) {
                                                        clearFilters();
                                                        confirm();
                                                    }
                                                }, size: 'small', children: "Reset" }))] })] }));
                        }
                        else if (field.type === 'date' || field.type === 'datetime') {
                            return ((0, jsx_runtime_1.jsxs)("div", { style: { padding: 8 }, children: [(0, jsx_runtime_1.jsx)(antd_1.DatePicker, { placeholder: constants_1.UI_CONSTANTS.FILTER_PLACEHOLDERS.SELECT, style: {
                                            width: constants_1.UI_CONSTANTS.LAYOUT.FILTER_SELECT_WIDTH,
                                            marginBottom: 8,
                                        }, value: selectedKeys[0] ? (0, dayjs_1.default)(selectedKeys[0]) : null, onChange: function (date) {
                                            setSelectedKeys(date ? [(field.keepLocalTime ? date.toISOString() : date.utc().toISOString())] : []);
                                            confirm();
                                        }, showTime: field.type === 'datetime' }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)(antd_1.Button, { type: 'primary', onClick: function () { return confirm(); }, size: 'small', style: {
                                                    width: constants_1.UI_CONSTANTS.LAYOUT.FILTER_BUTTON_WIDTH,
                                                    marginRight: constants_1.UI_CONSTANTS.STYLES.MARGIN.RIGHT,
                                                }, children: "Filter" }), clearFilters && ((0, jsx_runtime_1.jsx)(antd_1.Button, { onClick: function () {
                                                    if (clearFilters) {
                                                        clearFilters();
                                                        confirm();
                                                    }
                                                }, size: 'small', children: "Reset" }))] })] }));
                        }
                        else {
                            return ((0, jsx_runtime_1.jsxs)("div", { style: { padding: 8 }, children: [(0, jsx_runtime_1.jsx)(antd_1.Input, { placeholder: "".concat(constants_1.UI_CONSTANTS.FILTER_PLACEHOLDERS.SEARCH, " ").concat(field.label), value: selectedKeys[0], onChange: function (e) {
                                            setSelectedKeys(e.target.value ? [e.target.value] : []);
                                            if (!e.target.value)
                                                confirm();
                                        }, onKeyPress: handleKeyPress, style: {
                                            width: constants_1.UI_CONSTANTS.LAYOUT.FILTER_TEXT_WIDTH,
                                            marginBottom: 8,
                                        }, allowClear: true }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)(antd_1.Button, { type: 'primary', onClick: function () { return confirm(); }, size: 'small', style: {
                                                    width: constants_1.UI_CONSTANTS.LAYOUT.FILTER_BUTTON_WIDTH,
                                                    marginRight: constants_1.UI_CONSTANTS.STYLES.MARGIN.RIGHT,
                                                }, children: "Filter" }), clearFilters && ((0, jsx_runtime_1.jsx)(antd_1.Button, { onClick: function () {
                                                    if (clearFilters) {
                                                        clearFilters();
                                                        confirm();
                                                    }
                                                }, size: 'small', children: "Reset" }))] })] }));
                        }
                    }
                    : undefined,
                render: function (value) {
                    if (field.renderInList) {
                        return field.renderInList(renderValue(value));
                    }
                    if (field.type === 'relation' && field.relation && value) {
                        var idValue_1 = typeof value === 'object' &&
                            value !== null &&
                            field.relation &&
                            field.relation.idField &&
                            field.relation.idField in value
                            ? value[field.relation.idField]
                            : renderValue(value);
                        return ((0, jsx_runtime_1.jsx)(antd_1.Button, { type: 'link', onClick: function () {
                                // Fetch and display the relation item in a modal instead of navigating
                                fetchRelationItem(field.relation.entity, String(idValue_1));
                            }, children: (0, GetRelationString_1.getRelationString)(field.relation, value) }));
                    }
                    if (field.isImage && value) {
                        return ((0, jsx_runtime_1.jsx)("div", { onClick: function (e) { return e.stopPropagation(); }, children: (0, jsx_runtime_1.jsx)(antd_1.Image, { width: 40, src: renderValue(value) }) }));
                    }
                    if (field.isFile && value) {
                        return ((0, jsx_runtime_1.jsx)(antd_1.Button, { icon: ((0, jsx_runtime_1.jsx)(icons_1.FileOutlined, {})), size: 'small', onClick: function (e) {
                                e.stopPropagation();
                                window.open(renderValue(value), '_blank');
                            }, children: "View File" }));
                    }
                    if (field.type === 'boolean') {
                        return ((0, jsx_runtime_1.jsx)(antd_1.Switch, { checked: !!renderValue(value), checkedChildren: 'Yes', unCheckedChildren: 'No', disabled: true }));
                    }
                    if (field.type === 'url' && value) {
                        return ((0, jsx_runtime_1.jsx)(antd_1.Image, { width: 40, src: renderValue(value) }));
                    }
                    if (field.type === 'date') {
                        return (0, dateFormat_1.formatDate)(value, field.keepLocalTime);
                    }
                    if (field.type === 'datetime') {
                        return (0, dateFormat_1.formatDateTime)(value, field.keepLocalTime);
                    }
                    return renderValue(value);
                },
            };
        }), true), (((_c = selectedEndpoint.actionButtons) === null || _c === void 0 ? void 0 : _c.show) === false ||
            (((_e = (_d = selectedEndpoint.actionButtons) === null || _d === void 0 ? void 0 : _d.edit) === null || _e === void 0 ? void 0 : _e.show) === false &&
                ((_g = (_f = selectedEndpoint.actionButtons) === null || _f === void 0 ? void 0 : _f.delete) === null || _g === void 0 ? void 0 : _g.show) === false)
            ? []
            : [{
                    title: constants_1.UI_CONSTANTS.BUTTON_TEXTS.ACTIONS,
                    key: 'actions',
                    width: constants_1.UI_CONSTANTS.LAYOUT.COLUMN_MIN_WIDTH,
                    render: function (_, record) {
                        var _a, _b, _c, _d, _e, _f;
                        var idField = selectedEndpoint.idField, actionButtons = selectedEndpoint.actionButtons;
                        if (!idField) {
                            return null;
                        }
                        // If actionButtons.show is explicitly false, don't show any buttons
                        if ((actionButtons === null || actionButtons === void 0 ? void 0 : actionButtons.show) === false) {
                            return null;
                        }
                        return ((0, jsx_runtime_1.jsxs)(antd_1.Space, { children: [((_a = actionButtons === null || actionButtons === void 0 ? void 0 : actionButtons.edit) === null || _a === void 0 ? void 0 : _a.show) !== false && ((0, jsx_runtime_1.jsx)(antd_1.Button, { type: 'primary', icon: ((_b = actionButtons === null || actionButtons === void 0 ? void 0 : actionButtons.edit) === null || _b === void 0 ? void 0 : _b.icon) || ((0, jsx_runtime_1.jsx)(icons_1.EditOutlined, {})), onClick: function () { return handleEdit(record); }, children: ((_c = actionButtons === null || actionButtons === void 0 ? void 0 : actionButtons.edit) === null || _c === void 0 ? void 0 : _c.text) || constants_1.UI_CONSTANTS.BUTTON_TEXTS.EDIT })), ((_d = actionButtons === null || actionButtons === void 0 ? void 0 : actionButtons.delete) === null || _d === void 0 ? void 0 : _d.show) !== false && ((0, jsx_runtime_1.jsx)(antd_1.Button, { danger: true, icon: ((_e = actionButtons === null || actionButtons === void 0 ? void 0 : actionButtons.delete) === null || _e === void 0 ? void 0 : _e.icon) || ((0, jsx_runtime_1.jsx)(icons_1.DeleteOutlined, {})), onClick: function () { return handleDelete(record[idField]); }, children: ((_f = actionButtons === null || actionButtons === void 0 ? void 0 : actionButtons.delete) === null || _f === void 0 ? void 0 : _f.text) || constants_1.UI_CONSTANTS.BUTTON_TEXTS.DELETE }))] }));
                    },
                }]), true) : [];
    var DeleteConfirmationModal = ((0, jsx_runtime_1.jsx)(antd_1.Modal, { title: constants_1.UI_CONSTANTS.MODAL_TITLES.CONFIRM_DELETION, open: deleteModalVisible, onOk: handleDeleteConfirm, onCancel: function () {
            setDeleteModalVisible(false);
            setItemToDelete(null);
            setDeleteInput('');
        }, okText: constants_1.UI_CONSTANTS.BUTTON_TEXTS.DELETE, okType: 'danger', okButtonProps: {
            disabled: deleteInput !== 'DELETE',
        }, cancelText: constants_1.UI_CONSTANTS.BUTTON_TEXTS.CANCEL, children: (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { children: constants_1.UI_CONSTANTS.MODAL_MESSAGES.DELETE_CONFIRMATION }), (0, jsx_runtime_1.jsx)("p", { children: constants_1.UI_CONSTANTS.MODAL_MESSAGES.DELETE_WARNING }), (0, jsx_runtime_1.jsx)("p", { children: constants_1.UI_CONSTANTS.MODAL_MESSAGES.DELETE_INPUT_PLACEHOLDER }), (0, jsx_runtime_1.jsx)(antd_1.Input, { value: deleteInput, onChange: function (e) { return setDeleteInput(e.target.value); }, placeholder: constants_1.UI_CONSTANTS.MODAL_MESSAGES.DELETE_INPUT_PLACEHOLDER })] }) }));
    // Function to fetch and display a relation item in a modal
    var fetchRelationItem = function (relationEntity, itemId) { return __awaiter(_this, void 0, void 0, function () {
        var relationEndpoint, response, responseData, data, err_6, errorMessage;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, 3, 4]);
                    setLoading(true);
                    relationEndpoint = config.endpoints.find(function (ep) { return ep.key === relationEntity; });
                    if (!relationEndpoint) {
                        throw new Error("Endpoint configuration not found for entity: ".concat(relationEntity));
                    }
                    return [4 /*yield*/, apiClient.get("".concat(relationEndpoint.url, "/").concat(itemId))];
                case 1:
                    response = _a.sent();
                    responseData = response;
                    data = 'data' in responseData ? responseData.data : {};
                    // Set the modalEntity to use the target entity's config
                    setModalEntity(relationEntity);
                    // Set the modalEndpoint to the relation entity's endpoint instead of selectedEndpoint
                    // This prevents the background content from changing
                    setModalEndpoint(relationEndpoint);
                    // Set the viewingRelation flag to true to prevent navigation on modal close
                    setViewingRelation(true);
                    // Set the modal state to view the item
                    setModalState({ type: 'view', item: data });
                    return [3 /*break*/, 4];
                case 2:
                    err_6 = _a.sent();
                    errorMessage = err_6 instanceof Error
                        ? err_6.message
                        : constants_1.UI_CONSTANTS.ERROR_MESSAGES.UNKNOWN_ERROR;
                    api.error({
                        message: constants_1.UI_CONSTANTS.ERROR_MESSAGES.ERROR,
                        description: "".concat(constants_1.UI_CONSTANTS.ERROR_MESSAGES.FAILED_TO_FETCH_ITEM).concat(errorMessage),
                        duration: alertDuration,
                        placement: constants_1.UI_CONSTANTS.ERROR_MESSAGES.ERROR_PLACEMENT,
                    });
                    return [3 /*break*/, 4];
                case 3:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var renderDetailValue = function (field, value) {
        if (field.renderInDetail) {
            return field.renderInDetail(renderValue(value));
        }
        if (field.type === 'relation' && field.relation && value) {
            var idValue_2 = typeof value === 'object' && value !== null && 'uid' in value
                ? value.uid
                : renderValue(value);
            return ((0, jsx_runtime_1.jsx)(antd_1.Button, { type: 'link', onClick: function () {
                    // Fetch and display the relation item in a modal instead of navigating
                    fetchRelationItem(field.relation.entity, String(idValue_2));
                }, children: (0, GetRelationString_1.getRelationString)(field.relation, value) }));
        }
        if (field.isImage && value) {
            return (0, jsx_runtime_1.jsx)(antd_1.Image, { width: 200, src: String(value) });
        }
        if (field.isFile && value) {
            return ((0, jsx_runtime_1.jsx)(antd_1.Button, { icon: ((0, jsx_runtime_1.jsx)(icons_1.FileOutlined, {})), onClick: function () { return window.open(String(value), '_blank'); }, children: "Download File" }));
        }
        if (field.type === 'boolean') {
            return value ? 'Yes' : 'No';
        }
        if (field.type === 'url' && value) {
            return (0, jsx_runtime_1.jsx)(antd_1.Image, { width: 100, src: String(value) });
        }
        if (field.type === 'date') {
            return (0, dateFormat_1.formatDate)(value, field.keepLocalTime);
        }
        if (field.type === 'datetime') {
            return (0, dateFormat_1.formatDateTime)(value, field.keepLocalTime);
        }
        if (value !== null && value !== undefined) {
            return String(value);
        }
        return null;
    };
    var DetailModal = useDrawer ? ((0, jsx_runtime_1.jsx)(antd_1.Drawer, { title: constants_1.UI_CONSTANTS.MODAL_TITLES.ITEM_DETAILS, open: detailModalVisible, onClose: handleDetailModalClose, width: constants_1.UI_CONSTANTS.LAYOUT.DRAWER_WIDTH, placement: 'right', footer: (0, jsx_runtime_1.jsx)("div", { style: { textAlign: 'right' }, children: (0, jsx_runtime_1.jsxs)(antd_1.Space, { children: [(0, jsx_runtime_1.jsx)(antd_1.Button, { onClick: handleDetailModalClose, children: constants_1.UI_CONSTANTS.BUTTON_TEXTS.CLOSE }), selectedItem &&
                        (viewingRelation ? modalEndpoint : selectedEndpoint) &&
                        ((0, jsx_runtime_1.jsx)(antd_1.Button, { type: 'primary', onClick: handleEditFromDetail, children: constants_1.UI_CONSTANTS.BUTTON_TEXTS.EDIT }))] }) }), children: selectedItem && (viewingRelation ? modalEndpoint : selectedEndpoint) && ((0, jsx_runtime_1.jsx)("div", { children: (_j = (_h = (viewingRelation ? modalEndpoint : selectedEndpoint)) === null || _h === void 0 ? void 0 : _h.fields) === null || _j === void 0 ? void 0 : _j.map(function (field) {
                var value = selectedItem[field.key];
                return ((0, jsx_runtime_1.jsxs)("div", { style: {
                        marginBottom: constants_1.UI_CONSTANTS.LAYOUT.DETAIL_FIELD_MARGIN,
                    }, children: [(0, jsx_runtime_1.jsxs)("div", { style: {
                                fontWeight: constants_1.UI_CONSTANTS.LAYOUT.DETAIL_LABEL_FONT_WEIGHT,
                                marginBottom: constants_1.UI_CONSTANTS.LAYOUT.DETAIL_LABEL_MARGIN,
                            }, children: [field.label, ":"] }), (0, jsx_runtime_1.jsx)("div", { children: renderDetailValue(field, value) })] }, field.key));
            }) })) })) : ((0, jsx_runtime_1.jsx)(antd_1.Modal, { title: constants_1.UI_CONSTANTS.MODAL_TITLES.ITEM_DETAILS, open: detailModalVisible, onCancel: handleDetailModalClose, footer: null, width: constants_1.UI_CONSTANTS.LAYOUT.MODAL_WIDTH, children: selectedItem &&
            (viewingRelation ? modalEndpoint : selectedEndpoint) &&
            ((0, jsx_runtime_1.jsxs)("div", { children: [(_l = (_k = (viewingRelation ? modalEndpoint : selectedEndpoint)) === null || _k === void 0 ? void 0 : _k.fields) === null || _l === void 0 ? void 0 : _l.map(function (field) {
                        var value = selectedItem[field.key];
                        return ((0, jsx_runtime_1.jsxs)("div", { style: {
                                marginBottom: constants_1.UI_CONSTANTS.LAYOUT.DETAIL_FIELD_MARGIN,
                            }, children: [(0, jsx_runtime_1.jsxs)("div", { style: {
                                        fontWeight: constants_1.UI_CONSTANTS.LAYOUT.DETAIL_LABEL_FONT_WEIGHT,
                                        marginBottom: constants_1.UI_CONSTANTS.LAYOUT.DETAIL_LABEL_MARGIN,
                                    }, children: [field.label, ":"] }), (0, jsx_runtime_1.jsx)("div", { children: renderDetailValue(field, value) })] }, field.key));
                    }), (0, jsx_runtime_1.jsx)("div", { style: {
                            marginTop: constants_1.UI_CONSTANTS.LAYOUT.DETAIL_ACTIONS_MARGIN,
                            textAlign: constants_1.UI_CONSTANTS.LAYOUT.DETAIL_ACTIONS_ALIGN,
                        }, children: (0, jsx_runtime_1.jsxs)(antd_1.Space, { children: [(0, jsx_runtime_1.jsx)(antd_1.Button, { onClick: handleDetailModalClose, children: constants_1.UI_CONSTANTS.BUTTON_TEXTS.CLOSE }), (0, jsx_runtime_1.jsx)(antd_1.Button, { type: 'primary', onClick: handleEditFromDetail, children: constants_1.UI_CONSTANTS.BUTTON_TEXTS.EDIT })] }) })] })) }));
    var EditModal = useDrawer ? ((0, jsx_runtime_1.jsx)(antd_1.Drawer, { title: editingItem
            ? constants_1.UI_CONSTANTS.MODAL_TITLES.EDIT_ITEM
            : constants_1.UI_CONSTANTS.MODAL_TITLES.ADD_ITEM, open: isModalVisible, onClose: handleModalClose, width: constants_1.UI_CONSTANTS.LAYOUT.DRAWER_WIDTH, placement: 'right', footer: (0, jsx_runtime_1.jsx)("div", { style: { textAlign: 'right' }, children: (0, jsx_runtime_1.jsxs)(antd_1.Space, { children: [(0, jsx_runtime_1.jsxs)(antd_1.Button, { type: 'primary', onClick: function () { return form.submit(); }, loading: loading, children: [editingItem
                                ? constants_1.UI_CONSTANTS.BUTTON_TEXTS.UPDATE
                                : constants_1.UI_CONSTANTS.BUTTON_TEXTS.ADD, ' ', "Item"] }), (0, jsx_runtime_1.jsx)(antd_1.Button, { onClick: handleModalClose, children: constants_1.UI_CONSTANTS.BUTTON_TEXTS.CANCEL })] }) }), children: (0, jsx_runtime_1.jsx)(antd_1.Spin, { spinning: loading, children: (0, jsx_runtime_1.jsx)(antd_1.Form, { form: form, layout: 'vertical', onFinish: handleSubmit, initialValues: editingItem || {}, children: (_m = (viewingRelation && modalEndpoint ? modalEndpoint : selectedEndpoint)) === null || _m === void 0 ? void 0 : _m.fields.filter(function (field) {
                    return editingItem
                        ? field.patchable || !field.readOnly
                        : field.postable || !field.readOnly;
                }).map(function (field) { return ((0, jsx_runtime_1.jsx)("div", { children: renderFormField(field) }, field.key)); }) }) }) })) : ((0, jsx_runtime_1.jsx)(antd_1.Modal, { title: editingItem
            ? constants_1.UI_CONSTANTS.MODAL_TITLES.EDIT_ITEM
            : constants_1.UI_CONSTANTS.MODAL_TITLES.ADD_ITEM, open: isModalVisible, onCancel: handleModalClose, footer: null, width: constants_1.UI_CONSTANTS.LAYOUT.MODAL_WIDTH, children: (0, jsx_runtime_1.jsx)(antd_1.Spin, { spinning: loading, children: (0, jsx_runtime_1.jsxs)(antd_1.Form, { form: form, layout: 'vertical', onFinish: handleSubmit, initialValues: editingItem || {}, children: [(_o = (viewingRelation && modalEndpoint ? modalEndpoint : selectedEndpoint)) === null || _o === void 0 ? void 0 : _o.fields.filter(function (field) {
                        return editingItem
                            ? field.patchable || !field.readOnly
                            : field.postable || !field.readOnly;
                    }).map(function (field) { return ((0, jsx_runtime_1.jsx)("div", { children: renderFormField(field) }, field.key)); }), (0, jsx_runtime_1.jsx)(antd_1.Form.Item, { children: (0, jsx_runtime_1.jsxs)(antd_1.Space, { children: [(0, jsx_runtime_1.jsxs)(antd_1.Button, { type: 'primary', htmlType: 'submit', loading: loading, children: [editingItem
                                            ? constants_1.UI_CONSTANTS.BUTTON_TEXTS.UPDATE
                                            : constants_1.UI_CONSTANTS.BUTTON_TEXTS.ADD, ' ', "Item"] }), (0, jsx_runtime_1.jsx)(antd_1.Button, { onClick: handleModalClose, children: constants_1.UI_CONSTANTS.BUTTON_TEXTS.CANCEL })] }) })] }) }) }));
    var handleAddNew = function () {
        setEditingItem(null);
        form.resetFields();
        setIsModalVisible(true);
    };
    // If the selected endpoint has a custom component, render it instead of the default CRUD
    if (selectedEndpoint === null || selectedEndpoint === void 0 ? void 0 : selectedEndpoint.customComponent) {
        var CustomComponent = selectedEndpoint.customComponent;
        return ((0, jsx_runtime_1.jsxs)(antd_1.Layout, { style: {
                minHeight: '100%',
                background: 'transparent',
                display: 'flex',
                flexDirection: 'row',
                height: '100%',
            }, children: [contextHolder, (0, jsx_runtime_1.jsxs)(Sider, { trigger: null, collapsible: true, collapsed: collapsed, style: { background: '#fff' }, children: [(0, jsx_runtime_1.jsx)(antd_1.Menu, { mode: 'inline', selectedKeys: [entity || ''], items: config.endpoints.map(function (endpoint) { return ({
                                key: endpoint.key,
                                label: endpoint.label,
                                onClick: function () {
                                    // Only navigate if not viewing a relation
                                    if (!viewingRelation) {
                                        navigate("/".concat(endpoint.key));
                                    }
                                },
                            }); }) }), (0, jsx_runtime_1.jsx)(antd_1.Button, { type: 'text', icon: (collapsed ? ((0, jsx_runtime_1.jsx)(icons_1.MenuUnfoldOutlined, {})) : ((0, jsx_runtime_1.jsx)(icons_1.MenuFoldOutlined, {}))), onClick: function () { return setCollapsed(!collapsed); }, style: {
                                width: '100%',
                                borderRadius: 0,
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                borderTop: '1px solid #f0f0f0',
                            } })] }), (0, jsx_runtime_1.jsxs)(antd_1.Layout, { style: {
                        background: '#fff',
                        padding: '24px',
                        flex: constants_1.UI_CONSTANTS.DEFAULTS.FIRST_PAGE,
                        display: 'flex',
                        flexDirection: 'column',
                    }, children: [selectedEndpoint.header || ((0, jsx_runtime_1.jsx)("div", { style: {
                                marginBottom: constants_1.UI_CONSTANTS.LAYOUT.HEADER_MARGIN,
                                display: constants_1.UI_CONSTANTS.STYLES.FLEX.DISPLAY,
                                alignItems: constants_1.UI_CONSTANTS.STYLES.FLEX.ALIGN_CENTER,
                            }, children: (0, jsx_runtime_1.jsx)("h1", { style: { margin: constants_1.UI_CONSTANTS.LAYOUT.HEADER_TITLE_MARGIN }, children: selectedEndpoint.label }) })), (0, jsx_runtime_1.jsx)(CustomComponent, {}), selectedEndpoint.footer] })] }));
    }
    // Default CRUD rendering
    return ((0, jsx_runtime_1.jsxs)(antd_1.Layout, { style: {
            minHeight: '100%',
            background: 'transparent',
            display: 'flex',
            flexDirection: 'row',
            height: '100%',
        }, children: [contextHolder, (0, jsx_runtime_1.jsxs)(Sider, { trigger: null, collapsible: true, collapsed: collapsed, style: { background: '#fff' }, children: [(0, jsx_runtime_1.jsx)(antd_1.Menu, { mode: 'inline', selectedKeys: [entity || ''], items: config.endpoints.map(function (endpoint) { return ({
                            key: endpoint.key,
                            label: endpoint.label,
                            onClick: function () {
                                // Only navigate if not viewing a relation
                                if (!viewingRelation) {
                                    navigate("/".concat(endpoint.key));
                                }
                            },
                        }); }) }), (0, jsx_runtime_1.jsx)(antd_1.Button, { type: 'text', icon: (collapsed ? ((0, jsx_runtime_1.jsx)(icons_1.MenuUnfoldOutlined, {})) : ((0, jsx_runtime_1.jsx)(icons_1.MenuFoldOutlined, {}))), onClick: function () { return setCollapsed(!collapsed); }, style: {
                            width: '100%',
                            borderRadius: 0,
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            borderTop: '1px solid #f0f0f0',
                        } })] }), (0, jsx_runtime_1.jsxs)(antd_1.Layout, { style: {
                    background: '#fff',
                    padding: '24px',
                    flex: constants_1.UI_CONSTANTS.DEFAULTS.FIRST_PAGE,
                    display: 'flex',
                    flexDirection: 'column',
                }, children: [(selectedEndpoint === null || selectedEndpoint === void 0 ? void 0 : selectedEndpoint.header) || ((0, jsx_runtime_1.jsxs)("div", { style: {
                            marginBottom: constants_1.UI_CONSTANTS.LAYOUT.HEADER_MARGIN,
                            display: constants_1.UI_CONSTANTS.STYLES.FLEX.DISPLAY,
                            alignItems: constants_1.UI_CONSTANTS.STYLES.FLEX.ALIGN_CENTER,
                        }, children: [(0, jsx_runtime_1.jsx)("h1", { style: { margin: constants_1.UI_CONSTANTS.LAYOUT.HEADER_TITLE_MARGIN }, children: selectedEndpoint === null || selectedEndpoint === void 0 ? void 0 : selectedEndpoint.label }), (0, jsx_runtime_1.jsxs)(antd_1.Button, { type: 'primary', onClick: function () { return handleAddNew(); }, style: { marginLeft: 'auto' }, children: ["Add New ", selectedEndpoint === null || selectedEndpoint === void 0 ? void 0 : selectedEndpoint.label] })] })), (0, jsx_runtime_1.jsx)("div", { style: {
                            flex: constants_1.UI_CONSTANTS.DEFAULTS.FIRST_PAGE,
                            display: 'flex',
                            flexDirection: 'column',
                            minHeight: 0,
                        }, children: (0, jsx_runtime_1.jsx)(antd_1.Table, { dataSource: items, columns: columns, rowKey: function (record) {
                                return record[(selectedEndpoint === null || selectedEndpoint === void 0 ? void 0 : selectedEndpoint.idField) || 'id'];
                            }, pagination: pagination, loading: loading, onChange: handleTableChange, onRow: function (record) { return ({
                                onClick: function (event) { return handleRowClick(record, event); },
                                style: { cursor: 'pointer' },
                            }); }, scroll: { x: 'max-content', y: 'calc(100vh - 400px)' }, style: {
                                flex: constants_1.UI_CONSTANTS.DEFAULTS.FIRST_PAGE,
                                minHeight: constants_1.UI_CONSTANTS.LAYOUT.TABLE_MIN_HEIGHT,
                            } }, "table-".concat(selectedEndpoint === null || selectedEndpoint === void 0 ? void 0 : selectedEndpoint.key)) }), EditModal, DetailModal, DeleteConfirmationModal, selectedEndpoint === null || selectedEndpoint === void 0 ? void 0 : selectedEndpoint.footer] })] }));
}
exports.default = ItemCrud;
