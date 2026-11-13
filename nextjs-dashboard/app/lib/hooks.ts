import { useCallback, useRef } from 'react';

// Client-only hooks. Keep these out of utils.ts, which is also imported by Server Components.
export const useDebounceCallback = (callback: (...args: any[]) => void, delay = 300) => {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 1) useCallback memoizes the debounced function so it isn't recreated on every render.
  const debouncedCallback = useCallback((...args: any[]) => {
    // 2) Clear any existing timeout to reset the debounce timer.
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    // 3) Set a new timeout to call the callback after the specified delay.
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);

  return debouncedCallback;
};
