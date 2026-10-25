import { useEffect, useRef, useState } from "react";
export function useAsync(loader, deps = []) {
  const [state, set] = useState({ loading: true, data: null, error: "" });
  const [retry, setRetry] = useState(0);
  const ref = useRef(loader);
  ref.current = loader;
  useEffect(() => {
    let active = true;
    set({ loading: true, data: null, error: "" });
    Promise.resolve()
      .then(() => ref.current())
      .then((data) => {
        if (active) set({ loading: false, data, error: "" });
      })
      .catch((e) => {
        if (active)
          set({
            loading: false,
            data: null,
            error: e.message || "Network request failed.",
          });
      });
    return () => {
      active = false;
    };
  }, [...deps, retry]);
  return { ...state, retry: () => setRetry((n) => n + 1) };
}
