/**
 * `<InstaAdmin />`: an optional app shell with a menu of resources and one `ResourceCrud` per route.
 * Uses the browser URL by default when the provider was given no router.
 */
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { Button, Layout, Menu, Result, theme } from 'antd';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { InstaConfigOverride, useInsta } from '../react/context.tsx';
import { useLink } from '../react/link.ts';
import { historyAdapter } from '../react/router.ts';
import type { ResourcePaths } from '../react/routes.ts';
import { ResourceCrud } from './ResourceCrud.tsx';

export interface InstaAdminProps {
  /** URL prefix of the admin (default `''`, i.e. resources at `/{name}`). */
  basePath?: string;
  title?: ReactNode;
  /** Route scheme for every resource, e.g. `{ detail: 'view/{id}', edit: 'edit/{id}', create: false }`. */
  paths?: ResourcePaths;
  slots?: { header?: ReactNode; empty?: ReactNode; footer?: ReactNode };
}

export function InstaAdmin(props: InstaAdminProps) {
  const config = useInsta();
  if (config.routerProvided) return <AdminShell {...props} />;
  return (
    <InstaConfigOverride value={{ ...config, router: historyAdapter, routerProvided: true }}>
      <AdminShell {...props} />
    </InstaConfigOverride>
  );
}

const trim = (s: string) => s.replace(/^\/+|\/+$/g, '');

function AdminShell({ basePath = '', title, paths, slots }: InstaAdminProps) {
  const { resources, router, messages } = useInsta();
  const api = router.useRouter();
  const { token } = theme.useToken();
  const [collapsed, setCollapsed] = useState(false);
  const root = trim(basePath) ? `/${trim(basePath)}` : '';
  const Link = useLink();

  const menuResources = useMemo(
    () =>
      [...resources.values()]
        .filter((r) => r.menu !== false)
        .sort(
          (a, b) =>
            (typeof a.menu === 'object' ? (a.menu.order ?? 0) : 0) -
            (typeof b.menu === 'object' ? (b.menu.order ?? 0) : 0),
        ),
    [resources],
  );
  const segment = trim(api.location.pathname.slice(root.length)).split('/')[0] ?? '';
  // Only menu entries are routable: lookup-only resources (`menu: false`) are not screens.
  const active = menuResources.some((r) => r.name === segment) ? segment : undefined;
  const first = menuResources[0]?.name;

  useEffect(() => {
    if (!active && first) api.navigate(`${root}/${first}`, { replace: true });
  }, [active, first, root, api]);

  const basePathOf = (name: string) => `${root}/${name}`;

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Sider
        collapsible
        collapsed={collapsed}
        trigger={null}
        theme="light"
        width={220}
        style={{ borderInlineEnd: `1px solid ${token.colorBorderSecondary}` }}
      >
        <div style={{ padding: 16, fontWeight: 600 }}>{collapsed ? null : title}</div>
        <Menu
          mode="inline"
          selectedKeys={active ? [active] : []}
          items={menuResources.map((r) => ({
            key: r.name,
            label: <Link to={basePathOf(r.name)}>{r.label.other}</Link>,
          }))}
        />
      </Layout.Sider>
      <Layout>
        <Layout.Header
          style={{
            background: token.colorBgContainer,
            paddingInline: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <Button
            type="text"
            aria-label={collapsed ? messages.expandMenu : messages.collapseMenu}
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed((c) => !c)}
          />
          {slots?.header}
        </Layout.Header>
        <Layout.Content style={{ padding: 24 }}>
          {active ? (
            <ResourceCrud
              key={active}
              resource={active}
              basePath={basePathOf(active)}
              basePathOf={basePathOf}
              paths={paths}
            />
          ) : menuResources.length === 0 ? (
            (slots?.empty ?? <Result status="info" title={messages.noData} />)
          ) : null}
        </Layout.Content>
        {slots?.footer ? <Layout.Footer>{slots.footer}</Layout.Footer> : null}
      </Layout>
    </Layout>
  );
}
