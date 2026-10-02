import { expect, test } from 'vitest';

// Guards the guard: an unmocked request must be rejected by MSW, not reach the network.
test('unhandled requests are rejected by MSW', async () => {
  const error = await fetch('https://api.example.com/users').catch((e: Error) => e);
  expect(error).toBeInstanceOf(Error);
  expect(String((error as Error & { cause?: unknown }).cause)).toContain('[MSW]');
});
