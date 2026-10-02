import { setupServer } from 'msw/node';

/** Shared MSW server. Tests add handlers with `server.use(...)`. */
export const server = setupServer();
