import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { debounce } from '../src/utils/debounce.ts';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

test('calls once with the latest arguments after the wait', () => {
  const fn = vi.fn();
  const d = debounce(fn, 300);
  d('a');
  d('ab');
  vi.advanceTimersByTime(299);
  expect(fn).not.toHaveBeenCalled();
  vi.advanceTimersByTime(1);
  expect(fn).toHaveBeenCalledExactlyOnceWith('ab');
});

test('cancel drops the pending call', () => {
  const fn = vi.fn();
  const d = debounce(fn, 300);
  d('a');
  d.cancel();
  vi.advanceTimersByTime(1000);
  expect(fn).not.toHaveBeenCalled();
});
