/** The antd renderer's entries in `InstaRegistry`, typed once here instead of at each lookup. */
import type { ComponentType } from 'react';
import type { InstaRegistry } from '../react/context.tsx';
import type { ViewProps } from './crud/viewProps.ts';
import type { DisplayProps } from './fields/displays.tsx';
import type { WidgetProps } from './fields/widgets.tsx';

export interface AntdRegistry {
  widgets?: Record<string, ComponentType<WidgetProps>>;
  displays?: Record<string, ComponentType<DisplayProps>>;
  components?: Record<string, ComponentType<ViewProps>>;
}

export const antdRegistry = (registry: InstaRegistry) => registry as AntdRegistry;
