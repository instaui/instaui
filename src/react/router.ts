/**
 * Router adapters. instaui never imports a router: routing goes through a tiny hook-based adapter.
 *  - `historyAdapter`: the browser URL (`window.history`), the default for `<InstaAdmin>`.
 *  - `memoryAdapter(initial)`: in-memory, the default for embedded views and tests.
 *  - `createRouterAdapter({ useLocation, useNavigate })`: your app's router (react-router 6/7/8, …).
 */
import {
  createElement,
  useCallback,
  useSyncExternalStore,
  type ComponentType,
  type ReactNode,
} from 'react';

export interface RouterLocation {
  pathname: string;
  search: string;
}

export interface NavigateOptions {
  replace?: boolean;
}

export interface RouterApi {
  location: RouterLocation;
  navigate(to: string, options?: NavigateOptions): void;
}

export interface LinkProps {
  to: string;
  children?: ReactNode;
  className?: string;
  onClick?: (event: { preventDefault(): void }) => void;
}

export interface RouterAdapter {
  /** A React hook: called during render. */
  useRouter(): RouterApi;
  /** Optional link component; a plain anchor with client-side navigation is used otherwise. */
  Link?: ComponentType<LinkProps>;
}

function splitPath(to: string): RouterLocation {
  const index = to.indexOf('?');
  return index === -1
    ? { pathname: to || '/', search: '' }
    : { pathname: to.slice(0, index) || '/', search: to.slice(index) };
}

function createStore(
  read: () => RouterLocation,
  write: (loc: RouterLocation, replace: boolean) => void,
) {
  const listeners = new Set<() => void>();
  let snapshot = read();
  const emit = () => {
    const next = read();
    if (next.pathname !== snapshot.pathname || next.search !== snapshot.search) snapshot = next;
    listeners.forEach((l) => l());
  };
  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot: () => snapshot,
    navigate(to: string, { replace = false }: NavigateOptions = {}) {
      write(splitPath(to), replace);
      emit();
    },
    emit,
  };
}

function adapterFor(store: ReturnType<typeof createStore>): RouterAdapter {
  return {
    useRouter() {
      const location = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
      return { location, navigate: store.navigate };
    },
  };
}

/** In-memory routing. Each call creates an independent history. */
export function memoryAdapter(
  initial = '/',
): RouterAdapter & { current(): RouterLocation; history: string[] } {
  let current = splitPath(initial);
  const history = [initial];
  const store = createStore(
    () => current,
    (loc, replace) => {
      current = loc;
      const entry = `${loc.pathname}${loc.search}`;
      if (replace) history[history.length - 1] = entry;
      else history.push(entry);
    },
  );
  return { ...adapterFor(store), current: () => current, history };
}

let browserStore: ReturnType<typeof createStore> | undefined;
function getBrowserStore() {
  if (!browserStore) {
    browserStore = createStore(
      () => ({ pathname: window.location.pathname, search: window.location.search }),
      (loc, replace) => {
        const url = `${loc.pathname}${loc.search}`;
        if (replace) window.history.replaceState(window.history.state, '', url);
        else window.history.pushState(null, '', url);
      },
    );
    window.addEventListener('popstate', browserStore.emit);
  }
  return browserStore;
}

/** The browser URL via `window.history`. */
export const historyAdapter: RouterAdapter = {
  useRouter() {
    const store = getBrowserStore();
    const location = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
    return { location, navigate: store.navigate };
  },
};

export interface RouterHooks {
  useLocation(): { pathname: string; search: string };
  useNavigate(): (to: string, options?: NavigateOptions) => void;
  Link?: ComponentType<LinkProps>;
}

/**
 * Wraps your router's own hooks, e.g. `createRouterAdapter({ useLocation, useNavigate, Link })`
 * imported from your `react-router-dom`. Using your app's copy avoids a second router context.
 */
export function createRouterAdapter({
  useLocation,
  useNavigate,
  Link,
}: RouterHooks): RouterAdapter {
  return {
    useRouter() {
      const { pathname, search } = useLocation();
      const navigate = useNavigate();
      const go = useCallback(
        (to: string, options?: NavigateOptions) => navigate(to, options),
        [navigate],
      );
      return { location: { pathname, search }, navigate: go };
    },
    Link,
  };
}

/** An anchor that navigates client-side through the adapter (keeps open-in-new-tab working). */
export function makeLink(router: RouterApi): ComponentType<LinkProps> {
  return function InstaLink({ to, children, className, onClick }: LinkProps) {
    return createElement(
      'a',
      {
        href: to,
        className,
        onClick: (event: MouseEvent & { preventDefault(): void }) => {
          onClick?.(event);
          if (
            event.defaultPrevented ||
            event.button !== 0 ||
            event.metaKey ||
            event.ctrlKey ||
            event.shiftKey
          )
            return;
          event.preventDefault();
          router.navigate(to);
        },
      },
      children,
    );
  };
}
