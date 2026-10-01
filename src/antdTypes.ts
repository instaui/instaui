/**
 * antd types derived from antd's root exports only.
 *
 * antd ships no `exports` map, so deep imports such as `antd/es/table/interface`
 * resolve differently across module formats and break consumers that use
 * `moduleResolution: node16/nodenext`. Deriving the types from root exports keeps
 * the published `.d.ts` portable across antd 5 and 6.
 */
import type { FormItemProps, TableColumnType, TableProps, UploadProps } from 'antd';

export type { FormInstance, FormRule, TablePaginationConfig, UploadFile } from 'antd';

export type NamePath = NonNullable<FormItemProps['name']>;

type TableOnChange<T> = NonNullable<TableProps<T>['onChange']>;

export type FilterValue = NonNullable<Parameters<TableOnChange<unknown>>[1][string]>;

export type SorterResult<T> = Extract<Parameters<TableOnChange<T>>[2], { columnKey?: unknown }>;

export type SortOrder = NonNullable<TableColumnType<unknown>['sortOrder']>;

export type FilterDropdownProps = Parameters<
  Extract<NonNullable<TableColumnType<unknown>['filterDropdown']>, (...args: never[]) => unknown>
>[0];

export type UploadChangeParam = Parameters<NonNullable<UploadProps['onChange']>>[0];
