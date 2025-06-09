# API Reference

This page provides a detailed API reference for the instaui package.

## ItemCrud Props

The `ItemCrud` component accepts the following props:

| Prop                     | Type               | Description                                                                      |
|--------------------------|--------------------|----------------------------------------------------------------------------------|
| `apiClient`              | `ApiClient`        | The API client to use for making requests.                                       |
| `config`                 | `object`           | The configuration object for the CRUD interface.                                 |
| `config.endpoints`       | `EndpointConfig[]` | An array of endpoint configurations.                                             |
| `config.alertDuration`   | `number`           | (Optional) The duration of alert messages in seconds. Default: 3.                |
| `config.defaultPagesize` | `number`           | (Optional) The default page size for list views. Default: 10.                    |
| `useDrawer`              | `boolean`          | (Optional) Whether to use a drawer instead of a modal for forms. Default: false. |

## Types

### ApiClient

```typescript
interface ApiClient {
  get: (url: string, config?: any) => Promise<APIResponse>;
  post: (url: string, data?: unknown, config?: any) => Promise<APIResponse>;
  patch: (url: string, data?: unknown, config?: any) => Promise<APIResponse>;
  delete: (url: string, config?: any) => Promise<APIResponse>;
}
```

### APIResponse

```typescript
interface APIResponse {
  status: string;
  message: string;
  data: ListResponse | ItemResponse;
}
```

### ListResponse

```typescript
interface ListResponse {
  data: Item[];
  count?: number;
  items?: Item[];
  results?: Item[];
  total?: number;
}
```

### ItemResponse

```typescript
interface ItemResponse {
  data: Item;
}
```

### Item

```typescript
interface Item {
  [key: string]: unknown;
}
```

### EndpointConfig

```typescript
interface EndpointConfig {
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
```

### FieldConfig

```typescript
interface FieldConfig {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'boolean' | 'date' | 'datetime' | 'time' | 'select' | 'relation' | 'url' | 'email';
  required?: boolean;
  readOnly?: boolean;
  placeHolder?: string;
  options?: { label: string; value: string }[];
  relation?: RelationConfig;
  showInList?: boolean;
  sortable?: boolean;
  filterable?: boolean;
  filterType?: 'eq' | 'range' | 'boolean';
  renderInList?: (value: string | number | boolean | null) => React.ReactNode;
  renderInDetail?: (value: string | number | boolean | null) => React.ReactNode;
  validator?: (value: unknown) => { status: boolean; message?: string };
  isFile?: boolean;
  isImage?: boolean;
  accept?: string | string[];
  maxSize?: number;
  postable?: boolean;
  patchable?: boolean;
  dateFormat?: string;
  keepLocalTime?: boolean;
}
```

### RelationConfig

```typescript
interface RelationConfig {
  displayField?: string;
  render?: (arg0: Item) => ReactNode;
  entity: string;
  idField: string;
  keyColumns?: string[];
  dropDownOptions?: (value: Record<string, unknown>) => { label: string; value: string };
}
```

### ActionButtonConfig

```typescript
interface ActionButtonConfig {
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
```

### RelationFieldProps

```typescript
interface RelationFieldProps {
  field: FieldConfig;
  apiClient: ApiClient;
  rules: Rule[];
  isDisabled: boolean;
  form: FormInstance;
}
```

### ItemCrudProps

```typescript
interface ItemCrudProps {
  apiClient: ApiClient;
  config: {
    alertDuration?: number;
    defaultPagesize?: number;
    endpoints: EndpointConfig[];
  };
  useDrawer?: boolean;
}
```

## Constants

### UI_CONSTANTS

The `UI_CONSTANTS` object contains constants used by the instaui components.

```typescript
const UI_CONSTANTS = {
  DATE_FORMAT: 'YYYY-MM-DD',
  DATETIME_FORMAT: 'YYYY-MM-DD HH:mm:ss',
  TIME_FORMAT: 'HH:mm:ss',
  DEFAULT_PAGE_SIZE: 10,
  DEFAULT_ALERT_DURATION: 3,
};
```

## Utility Functions

### getRelationString

The `getRelationString` function formats a related entity as a string.

```typescript
function getRelationString(item: Item, keyColumns?: string[]): string;
```

#### Parameters

| Parameter    | Type       | Description                                                     |
|--------------|------------|-----------------------------------------------------------------|
| `item`       | `Item`     | The related entity object.                                      |
| `keyColumns` | `string[]` | (Optional) The columns to include in the string representation. |

#### Returns

A string representation of the related entity.

### formatDate

The `formatDate` function formats a date as a string.

```typescript
function formatDate(date: string | Date | number, format?: string): string;
```

#### Parameters

| Parameter | Type                       | Description                                                      |
|-----------|----------------------------|------------------------------------------------------------------|
| `date`    | `string \| Date \| number` | The date to format.                                              |
| `format`  | `string`                   | (Optional) The format to use. Default: UI_CONSTANTS.DATE_FORMAT. |

#### Returns

A formatted date string.

### formatDateTime

The `formatDateTime` function formats a date and time as a string.

```typescript
function formatDateTime(date: string | Date | number, format?: string): string;
```

#### Parameters

| Parameter | Type                       | Description                                                          |
|-----------|----------------------------|----------------------------------------------------------------------|
| `date`    | `string \| Date \| number` | The date to format.                                                  |
| `format`  | `string`                   | (Optional) The format to use. Default: UI_CONSTANTS.DATETIME_FORMAT. |

#### Returns

A formatted date and time string.