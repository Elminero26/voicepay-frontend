import { useState, useEffect } from 'react';

/**
 * Delays updating the returned value until `delay` milliseconds have passed
 * since the last change to `value`. Useful for throttling expensive operations
 * (e.g. HTTP requests, heavy client-side filters) triggered by user input.
 *
 * @param value  The reactive value to debounce.
 * @param delay  Delay in milliseconds (default: 300ms per VP-16 spec).
 * @returns      The debounced value, updated only after the delay expires.
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clear the previous timer on every change so the clock resets
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
