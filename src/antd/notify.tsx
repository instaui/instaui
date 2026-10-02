/**
 * Notifications that follow the host's antd `<App>` (theme, placement) when present, and fall back
 * to an own hook instance otherwise. Never the static `message`/`notification` APIs, which ignore
 * ConfigProvider and need a patch on antd 5 + React 19.
 */
import { App, notification } from 'antd';
import type { ReactNode } from 'react';
import { useMemo } from 'react';

export interface Notify {
  success(message: string): void;
  error(message: string, description?: string): void;
}

export function useNotify(): { notify: Notify; holder: ReactNode } {
  const app = App.useApp();
  const [api, holder] = notification.useNotification();
  const target = typeof app.notification?.success === 'function' ? app.notification : api;
  const notify = useMemo<Notify>(
    () => ({
      success: (message) => target.success({ message }),
      error: (message, description) => target.error({ message, description }),
    }),
    [target],
  );
  return { notify, holder };
}
