import { useState, useEffect } from "react";
import { api } from "../api";

export function useLoad(path) {
  const [result, setResult] = useState(null),
    [tick, setTick] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    api(path, { signal: controller.signal })
      .then((data) => setResult({ path, data, error: "" }))
      .catch((e) => {
        if (!controller.signal.aborted)
          setResult({ path, data: null, error: e.message });
      });
    return () => controller.abort();
  }, [path, tick]);
  return {
    data: result?.path === path ? result.data : null,
    error: result?.path === path ? result.error : "",
    reload: () => setTick((n) => n + 1),
  };
}
