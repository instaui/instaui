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
exports.RelationField = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var react_1 = require("react");
var antd_1 = require("antd");
var constants_1 = require("../constants");
var debounce_1 = __importDefault(require("lodash/debounce"));
/**
 * RelationField component for selecting related entities
 *
 * This component provides a searchable dropdown that fetches options from an API
 * based on the search text. It supports pagination, loading states, and error handling.
 */
var RelationField = function (_a) {
    var field = _a.field, apiClient = _a.apiClient, rules = _a.rules, isDisabled = _a.isDisabled, form = _a.form;
    // Core state for the component
    var _b = (0, react_1.useState)([]), options = _b[0], setOptions = _b[1];
    var _c = (0, react_1.useState)(false), loading = _c[0], setLoading = _c[1];
    var _d = (0, react_1.useState)(''), searchValue = _d[0], setSearchValue = _d[1];
    // Pagination state
    var _e = (0, react_1.useState)({
        current: 1,
        pageSize: constants_1.UI_CONSTANTS.DEFAULTS.PAGE_SIZE,
        total: 0
    }), pagination = _e[0], setPagination = _e[1];
    /**
     * Fetch options from the API
     * @param page - Page number to fetch
     * @param search - Search text to filter results
     */
    var fetchOptions = (0, react_1.useCallback)(function (page, search) {
        if (page === void 0) { page = 1; }
        if (search === void 0) { search = ''; }
        return __awaiter(void 0, void 0, void 0, function () {
            var queryParams, queryString, response, responseData, items, total_1, newOptions_1, error_1, errMessage;
            var _a;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!field.relation)
                            return [2 /*return*/];
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 3, 4, 5]);
                        setLoading(true);
                        queryParams = (_a = {},
                            _a[constants_1.UI_CONSTANTS.URL_PARAMS.PAGE] = page.toString(),
                            _a[constants_1.UI_CONSTANTS.URL_PARAMS.PAGE_SIZE] = pagination.pageSize.toString(),
                            _a);
                        // Add columns to fetch
                        if ((_b = field.relation.keyColumns) === null || _b === void 0 ? void 0 : _b.length) {
                            queryParams['cols'] = field.relation.keyColumns.join(',');
                        }
                        // Add search filter if provided
                        if (search) {
                            queryParams['search'] = search;
                        }
                        queryString = Object.entries(queryParams)
                            .map(function (_a) {
                            var key = _a[0], value = _a[1];
                            return "".concat(encodeURIComponent(key), "=").concat(encodeURIComponent(value));
                        })
                            .join('&');
                        return [4 /*yield*/, apiClient.get("/".concat(field.relation.entity, "?").concat(queryString))];
                    case 2:
                        response = _c.sent();
                        responseData = response.data;
                        items = [];
                        total_1 = 0;
                        if (responseData) {
                            // Case 1: Standard structure with data property containing array
                            if (responseData.data && Array.isArray(responseData.data)) {
                                items = responseData.data;
                                total_1 = 'count' in responseData ? Number(responseData.count) : items.length;
                            }
                            // Case 2: Response is directly an array
                            else if (Array.isArray(responseData)) {
                                items = responseData;
                                total_1 = items.length;
                            }
                            // Case 3: Response has items property (check if it exists first)
                            else if ('items' in responseData && responseData.items && Array.isArray(responseData.items)) {
                                items = responseData.items;
                                total_1 = 'total' in responseData ? Number(responseData.total) : items.length;
                            }
                            // Case 4: Response has results property (check if it exists first)
                            else if ('results' in responseData && responseData.results && Array.isArray(responseData.results)) {
                                items = responseData.results;
                                total_1 = 'count' in responseData ? Number(responseData.count) : items.length;
                            }
                        }
                        newOptions_1 = items.map(function (item) {
                            var _a;
                            if ((_a = field.relation) === null || _a === void 0 ? void 0 : _a.dropDownOptions) {
                                return field.relation.dropDownOptions(item);
                            }
                            // Ensure field.relation is defined (it should be at this point)
                            if (!field.relation) {
                                return { label: '', value: '' };
                            }
                            // Generate label from keyColumns if available
                            var label = '';
                            if (field.relation.keyColumns && field.relation.keyColumns.length > 0) {
                                // Use keyColumns to generate label
                                label = field.relation.keyColumns
                                    .map(function (col) { return item[col]; })
                                    .filter(Boolean)
                                    .join(' - ')
                                    .toString();
                            }
                            // Fallback if label is empty: try common fields or use the ID
                            if (!label) {
                                // Try common name fields
                                for (var _i = 0, _b = ['name', 'title', 'label', 'displayName']; _i < _b.length; _i++) {
                                    var nameField = _b[_i];
                                    if (item[nameField]) {
                                        label = String(item[nameField]);
                                        break;
                                    }
                                }
                                // If still no label, use ID field or first available property
                                if (!label) {
                                    var idValue = item[field.relation.idField];
                                    if (idValue) {
                                        label = "ID: ".concat(String(idValue));
                                    }
                                    else {
                                        // Last resort: use first non-object property
                                        var firstProp = Object.entries(item)
                                            .find(function (_a) {
                                            var _ = _a[0], val = _a[1];
                                            return val !== null && typeof val !== 'object';
                                        });
                                        if (firstProp) {
                                            label = String(firstProp[1]);
                                        }
                                        else {
                                            label = 'Unknown';
                                        }
                                    }
                                }
                            }
                            return {
                                label: label,
                                value: String(item[field.relation.idField] || ''),
                            };
                        });
                        // Update options - replace on first page, append on subsequent pages
                        setOptions(function (prev) {
                            // Ensure we're returning an array of objects with the correct type
                            var updatedOptions = page === 1 ? newOptions_1 : __spreadArray(__spreadArray([], prev, true), newOptions_1, true);
                            return updatedOptions;
                        });
                        // Update pagination
                        setPagination(function (prev) { return (__assign(__assign({}, prev), { current: page, total: total_1 || 0 })); });
                        return [3 /*break*/, 5];
                    case 3:
                        error_1 = _c.sent();
                        console.error('Error fetching relation options:', error_1);
                        errMessage = error_1.message;
                        antd_1.message.error(errMessage !== null && errMessage !== void 0 ? errMessage : constants_1.UI_CONSTANTS.MODAL_MESSAGES.FAILED_TO_LOAD_RELATION);
                        // Set empty options to prevent UI from being stuck in loading state
                        setOptions([]);
                        return [3 /*break*/, 5];
                    case 4:
                        setLoading(false);
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        });
    }, [field.relation, apiClient, pagination.pageSize]);
    // Create debounced search function
    var debouncedFetchOptions = (0, react_1.useCallback)((0, debounce_1.default)(function (value) {
        fetchOptions(1, value);
    }, 300), [fetchOptions]);
    // Handle search input change
    var handleSearch = (0, react_1.useCallback)(function (value) {
        setSearchValue(value);
        debouncedFetchOptions(value);
    }, [debouncedFetchOptions]);
    // Handle dropdown scroll for pagination
    var handlePopupScroll = (0, react_1.useCallback)(function (e) {
        var target = e.target;
        if (!loading &&
            target.scrollTop + target.offsetHeight >= target.scrollHeight - 20 &&
            options.length < pagination.total) {
            fetchOptions(pagination.current + 1, searchValue);
        }
    }, [loading, options.length, pagination, fetchOptions, searchValue]);
    // Handle dropdown visibility change
    var handleDropdownVisibleChange = (0, react_1.useCallback)(function (visible) {
        // Load initial options when opening dropdown if no options exist
        if (visible && options.length === 0 && !loading) {
            fetchOptions(1, searchValue);
        }
    }, [options.length, loading, fetchOptions, searchValue]);
    // Load initial options on mount
    (0, react_1.useEffect)(function () {
        fetchOptions(1, '');
    }, [fetchOptions]);
    // Get current value from form
    var currentValue = form.getFieldValue(field.key);
    return ((0, jsx_runtime_1.jsx)(antd_1.Form.Item, { name: field.key, label: field.label, rules: rules, children: (0, jsx_runtime_1.jsx)(antd_1.Select, { showSearch: true, placeholder: field.placeHolder || "Select ".concat(field.label), disabled: isDisabled, loading: loading, options: options, value: currentValue, searchValue: searchValue, filterOption: function (input, option) { var _a, _b; return (_b = (_a = option === null || option === void 0 ? void 0 : option.label) === null || _a === void 0 ? void 0 : _a.toString().toLowerCase().includes(input.toLowerCase())) !== null && _b !== void 0 ? _b : false; }, onSearch: handleSearch, onPopupScroll: handlePopupScroll, onChange: function (value) { return form.setFieldValue(field.key, value); }, onDropdownVisibleChange: handleDropdownVisibleChange, notFoundContent: loading ? (0, jsx_runtime_1.jsx)(antd_1.Spin, { size: "small" }) : null, allowClear: true, defaultActiveFirstOption: false, autoClearSearchValue: false, popupMatchSelectWidth: false, listHeight: 256, getPopupContainer: function (triggerNode) { return triggerNode.parentNode; } }) }));
};
exports.RelationField = RelationField;
