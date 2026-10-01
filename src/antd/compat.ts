/**
 * antd 5/6 compatibility. The code sticks to APIs both majors share; the few renamed props are
 * branched here once, on antd's exported `version`.
 */
import { version } from 'antd';

export const ANTD_MAJOR = Number.parseInt(version, 10) || 6;

/** Drawer width: `size` (number) in antd 6, `width` in antd 5. */
export function drawerWidth(width: number | string | undefined): Record<string, unknown> {
  if (width === undefined) return {};
  return ANTD_MAJOR >= 6 ? { size: width } : { width };
}
