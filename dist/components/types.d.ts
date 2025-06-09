import type { FormInstance, Rule } from 'antd/es/form';
import type { ReactNode } from 'react';
export interface Item {
    [key: string]: unknown;
}
export interface RelationConfig {
    displayField?: string;
    render?: (arg0: Item) => ReactNode;
    entity: string;
    idField: string;
    keyColumns?: string[];
    dropDownOptions?: (value: Record<string, unknown>) => {
        label: string;
        value: string;
    };
}
export interface FieldConfig {
    key: string;
    label: string;
    type: 'text' | 'textarea' | 'number' | 'boolean' | 'date' | 'datetime' | 'time' | 'select' | 'relation' | 'url' | 'email';
    required?: boolean;
    readOnly?: boolean;
    placeHolder?: string;
    options?: {
        label: string;
        value: string;
    }[];
    relation?: RelationConfig;
    showInList?: boolean;
    sortable?: boolean;
    filterable?: boolean;
    filterType?: 'eq' | 'range' | 'boolean';
    renderInList?: (value: string | number | boolean | null) => React.ReactNode;
    renderInDetail?: (value: string | number | boolean | null) => React.ReactNode;
    validator?: (value: unknown) => {
        status: boolean;
        message?: string;
    };
    isFile?: boolean;
    isImage?: boolean;
    accept?: string | string[];
    maxSize?: number;
    postable?: boolean;
    patchable?: boolean;
    dateFormat?: string;
    keepLocalTime?: boolean;
}
export interface ActionButtonConfig {
    show?: boolean;
    edit?: {
        show?: boolean;
        text?: string;
        icon?: ReactNode;
    };
    delete?: {
        show?: boolean;
        text?: string;
        icon?: ReactNode;
    };
}
export interface EndpointConfig {
    key: string;
    label: string;
    url: string;
    idField?: string;
    fields: FieldConfig[];
    validator: (values: Record<string, unknown>) => Record<string, string>;
    renderDetail?: (...args: unknown[]) => ReactNode;
    renderEdit?: (...args: unknown[]) => ReactNode;
    customComponent?: React.ComponentType;
    header?: React.ReactNode;
    footer?: React.ReactNode;
    actionButtons?: ActionButtonConfig;
}
interface BaseResponse {
    status: string;
    message: string;
}
export interface ListResponse {
    data: Item[];
    count?: number;
    items?: Item[];
    results?: Item[];
    total?: number;
}
interface ItemResponse {
    data: Item;
}
export interface APIResponse extends BaseResponse {
    data: ListResponse | ItemResponse;
}
export interface ApiClient {
    get: (url: string, config?: any) => Promise<APIResponse>;
    post: (url: string, data?: unknown, config?: any) => Promise<APIResponse>;
    patch: (url: string, data?: unknown, config?: any) => Promise<APIResponse>;
    delete: (url: string, config?: any) => Promise<APIResponse>;
}
export interface ItemCrudProps {
    apiClient: ApiClient;
    config: {
        alertDuration?: number;
        defaultPagesize?: number;
        endpoints: EndpointConfig[];
    };
    useDrawer?: boolean;
}
export interface RelationFieldProps {
    field: FieldConfig;
    apiClient: ApiClient;
    rules: Rule[];
    isDisabled: boolean;
    form: FormInstance;
}
export {};
