// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Drawer, Table, Button, Pagination } from 'antd';
import DetailView from './DetailView';
import CreateForm from './CreateForm';
import EditForm from './EditForm';
import { QueryClient, QueryClientProvider } from 'react-query';


interface ValidatorFunction {
  (value: string): [boolean, string];
}

interface FieldConfig {
  key: string;
  label: string;
  type: 'Text' | 'File' | 'relation';
  validator?: string;
  creatable?: boolean;
  editable?: boolean;
  hideInListView?: boolean;
  target?: string;
  path?: string;
  identifier?: string;
}

interface Config {
  keys: FieldConfig[];
}

interface CrudComponentProps {
  endpoint: string;
  axiosClient: any;
  config: Config;
  validators: { [key: string]: ValidatorFunction };
}

interface ItemData {
  [key: string]: any;
  id: string;
}

const CrudComponent: React.FC<CrudComponentProps> = ({ endpoint, axiosClient, config, validators }) => {
  const [data, setData] = useState<ItemData[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ItemData | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axiosClient.get(`${endpoint}?page=${pagination.page}&limit=${pagination.limit}`);
      setData(response.data?.items);
      setPagination({ ...pagination, total: response.data.count });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [pagination.page, pagination.limit]);

  const handlePageChange = (page: number, pageSize: number) => {
    setPagination({ ...pagination, page, limit: pageSize });
  };

  const handleViewDetails = async (id: string) => {
    try {
      const response = await axiosClient.get(`${endpoint}/${id}`);
      setSelectedItem(response.data);
      setDrawerVisible(true);
    } catch (error) {
      console.error('Error fetching details:', error);
    }
  };

  const handleEdit = async (id: string, values: ItemData) => {
    try {
      await axiosClient.patch(`${endpoint}/${id}`, values);
      fetchData();
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axiosClient.delete(`${endpoint}/${id}`);
      fetchData();
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const handleCreate = async (values: ItemData) => {
    try {
      await axiosClient.post(endpoint, values);
      fetchData();
      setDrawerVisible(false);
    } catch (error) {
      console.error('Error creating item:', error);
    }
  };

	const columns: { dataIndex?: string; title: string; render: (text: any, record: any) => JSX.Element }[] = config.keys
		.filter((field) => !field.hideInListView)
		.map((field) => ({
			title: field.label,
			dataIndex: field.key,
			render: (text, record) => (
				<Button type="link" onClick={() => handleViewDetails(record.id)}>
					{text}
				</Button>
			),
		}))
		.concat({
			title: 'Actions',
			dataIndex: 'actions',
			render: (_, record) => (
				<>
					<Button
						type="link"
						onClick={() => {
							setIsCreateMode(false);
							setSelectedItem(record);
							setDrawerVisible(true);
						}}
					>
						Edit
					</Button>
					<Button type="link" danger onClick={() => handleDelete(record.id)}>
						Delete
					</Button>
				</>
			),
    });
    const queryClient = new QueryClient();



	return (
    <div>

      <QueryClientProvider client={queryClient}>
        <Button type="primary" onClick={() => setIsCreateMode(true) || setDrawerVisible(true)}>
          Create New
        </Button>
        <Table
          columns={columns}
          dataSource={data}
          loading={loading}
          pagination={false}
          rowKey="id"
        />
        <Pagination
          current={pagination.page}
          pageSize={pagination.limit}
          total={pagination.total}
          onChange={handlePageChange}
          showSizeChanger
        />
        <Drawer
          title={isCreateMode ? 'Create New Entity' : selectedItem ? `Edit ${selectedItem.id}` : 'Entity Details'}
          open={drawerVisible}
          onClose={() => setDrawerVisible(false)}
          width={500}
        >
          {isCreateMode ? (
            <CreateForm config={config} onSubmit={handleCreate} validators={validators} />
          ) : selectedItem ? (
            <EditForm item={selectedItem} onSubmit={handleEdit} config={config} validators={validators} />
          ) : (
            <DetailView item={selectedItem} config={config} />
          )}
        </Drawer>
        </QueryClientProvider>
    </div>
  );
};

export default CrudComponent;
