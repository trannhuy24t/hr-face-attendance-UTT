import { useEffect, useState } from "react";
import { ApiError } from "./httpClient";

export type AsyncState<T> =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; data: T };

export function useAsyncData<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  deps: unknown[],
): [AsyncState<T>, () => void] {
  const [reloadToken, setReloadToken] = useState(0);
  const [state, setState] = useState<AsyncState<T>>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: "loading" });
    fetcher(controller.signal)
      .then((data) => setState({ status: "success", data }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        // Session missing/expired on a protected page — send back to login
        // instead of stranding the user on a dead "Unauthorized" card.
        if (error instanceof ApiError && error.status === 401) {
          console.log("[useAsyncData] got 401, redirecting to login. error:", error.message);
          window.location.hash = "";
          return;
        }
        setState({
          status: "error",
          message: error instanceof Error ? error.message : "Đã có lỗi xảy ra",
        });
      });
    return () => controller.abort();
  }, [...deps, reloadToken]);

  return [state, () => setReloadToken((token) => token + 1)];
}
