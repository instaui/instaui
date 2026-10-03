/** `render` for antd UI: animations off, so closed dialogs leave the DOM at once. */
import { render as rtlRender, type RenderOptions } from '@testing-library/react';
import { ConfigProvider } from 'antd';
import type { ReactElement, ReactNode } from 'react';

const NoMotion = ({ children }: { children: ReactNode }) => (
  <ConfigProvider theme={{ token: { motion: false } }}>{children}</ConfigProvider>
);

export const render = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
  rtlRender(ui, { wrapper: NoMotion, ...options });
