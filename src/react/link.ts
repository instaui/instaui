import { createElement, type ComponentType, type MouseEvent } from 'react';
import { useInsta } from './context.tsx';
import type { LinkProps } from './router.ts';

/** An anchor that navigates client-side through the adapter (keeps open-in-new-tab working). */
function AnchorLink({ to, children, className, onClick }: LinkProps) {
  const { navigate } = useInsta().router.useRouter();
  return createElement(
    'a',
    {
      href: to,
      className,
      onClick: (event: MouseEvent) => {
        onClick?.(event);
        if (event.defaultPrevented || event.button !== 0) return;
        if (event.metaKey || event.ctrlKey || event.shiftKey) return;
        event.preventDefault();
        navigate(to);
      },
    },
    children,
  );
}

/** The router's `Link`, else a plain anchor. The same component every render, so links keep state. */
export function useLink(): ComponentType<LinkProps> {
  return useInsta().router.Link ?? AnchorLink;
}
