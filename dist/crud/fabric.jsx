"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
const react_1 = __importStar(require("react"));
const antd_1 = require("antd");
const DetailView_1 = __importDefault(require("./DetailView"));
const CreateForm_1 = __importDefault(require("./CreateForm"));
const EditForm_1 = __importDefault(require("./EditForm"));
const react_query_1 = require("react-query");
const CrudComponent = ({ endpoint, axiosClient, config, validators }) => {
    const [data, setData] = (0, react_1.useState)([]);
    const [pagination, setPagination] = (0, react_1.useState)({ page: 1, limit: 10, total: 0 });
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [selectedItem, setSelectedItem] = (0, react_1.useState)(null);
    const [drawerVisible, setDrawerVisible] = (0, react_1.useState)(false);
    const [isCreateMode, setIsCreateMode] = (0, react_1.useState)(false);
    const fetchData = () => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        setLoading(true);
        try {
            const response = yield axiosClient.get(`${endpoint}?page=${pagination.page}&limit=${pagination.limit}`);
            setData((_a = response.data) === null || _a === void 0 ? void 0 : _a.items);
            setPagination(Object.assign(Object.assign({}, pagination), { total: response.data.count }));
        }
        catch (error) {
            console.error('Error fetching data:', error);
        }
        finally {
            setLoading(false);
        }
    });
    (0, react_1.useEffect)(() => {
        fetchData();
    }, [pagination.page, pagination.limit]);
    const handlePageChange = (page, pageSize) => {
        setPagination(Object.assign(Object.assign({}, pagination), { page, limit: pageSize }));
    };
    const handleViewDetails = (id) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const response = yield axiosClient.get(`${endpoint}/${id}`);
            setSelectedItem(response.data);
            setDrawerVisible(true);
        }
        catch (error) {
            console.error('Error fetching details:', error);
        }
    });
    const handleEdit = (id, values) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            yield axiosClient.patch(`${endpoint}/${id}`, values);
            fetchData();
        }
        catch (error) {
            console.error('Error updating item:', error);
        }
    });
    const handleDelete = (id) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            yield axiosClient.delete(`${endpoint}/${id}`);
            fetchData();
        }
        catch (error) {
            console.error('Error deleting item:', error);
        }
    });
    const handleCreate = (values) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            yield axiosClient.post(endpoint, values);
            fetchData();
            setDrawerVisible(false);
        }
        catch (error) {
            console.error('Error creating item:', error);
        }
    });
    const columns = config.keys
        .filter((field) => !field.hideInListView)
        .map((field) => ({
        title: field.label,
        dataIndex: field.key,
        render: (text, record) => (<antd_1.Button type="link" onClick={() => handleViewDetails(record.id)}>
					{text}
				</antd_1.Button>),
    }))
        .concat({
        title: 'Actions',
        dataIndex: 'actions',
        render: (_, record) => (<>
					<antd_1.Button type="link" onClick={() => {
                setIsCreateMode(false);
                setSelectedItem(record);
                setDrawerVisible(true);
            }}>
						Edit
					</antd_1.Button>
					<antd_1.Button type="link" danger onClick={() => handleDelete(record.id)}>
						Delete
					</antd_1.Button>
				</>),
    });
    const queryClient = new react_query_1.QueryClient();
    return (<div>

      <react_query_1.QueryClientProvider client={queryClient}>
        <antd_1.Button type="primary" onClick={() => setIsCreateMode(true) || setDrawerVisible(true)}>
          Create New
        </antd_1.Button>
        <antd_1.Table columns={columns} dataSource={data} loading={loading} pagination={false} rowKey="id"/>
        <antd_1.Pagination current={pagination.page} pageSize={pagination.limit} total={pagination.total} onChange={handlePageChange} showSizeChanger/>
        <antd_1.Drawer title={isCreateMode ? 'Create New Entity' : selectedItem ? `Edit ${selectedItem.id}` : 'Entity Details'} open={drawerVisible} onClose={() => setDrawerVisible(false)} width={500}>
          {isCreateMode ? (<CreateForm_1.default config={config} onSubmit={handleCreate} validators={validators}/>) : selectedItem ? (<EditForm_1.default item={selectedItem} onSubmit={handleEdit} config={config} validators={validators}/>) : (<DetailView_1.default item={selectedItem} config={config}/>)}
        </antd_1.Drawer>
        </react_query_1.QueryClientProvider>
    </div>);
};
exports.default = CrudComponent;
