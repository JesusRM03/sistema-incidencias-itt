import { useState, useEffect } from "react";
import { api } from "../api";

export function useLoad(path) {
  const [data, setData] = useState(null),
    [error, setError] = useState(""),
    [tick, setTick] = useState(0);
  useEffect(() => {
    let live = true;
    api(path)
      .then((d) => {
        if (live) {
          setData(d);
          setError("");
        }
      })
      .catch((e) => {
        if (live) setError(e.message);
      });
    return () => {
      live = false;
    };
  }, [path, tick]);
  return { data, error, reload: () => setTick((n) => n + 1) };
}
