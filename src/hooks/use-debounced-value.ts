import { useEffect, useState } from "react";

/** Delays reflecting a fast-changing value (e.g. search-as-you-type) so a
 * dependent effect — like a network fetch — doesn't fire on every keystroke. */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);

  return debounced;
}
