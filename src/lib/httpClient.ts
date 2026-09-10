import { getAccessToken } from "../features/auth/authSession";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

const DEFAULT_ERROR_MESSAGES: Record<number, string> = {
  400: "Dữ liệu đầu vào không hợp lệ.",
  401: "Email hoặc mật khẩu không chính xác.",
  404: "Không tìm thấy tài nguyên yêu cầu.",
  409: "Email đã tồn tại.",
  500: "Lỗi hệ thống, vui lòng thử lại sau.",
};

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
}

function extractMessage(payload: unknown, status: number): string {
  if (payload && typeof payload === "object") {
    // Real API error shape: { success: false, error: { code, message } }
    if ("error" in payload) {
      const error = (payload as { error: unknown }).error;
      if (error && typeof error === "object" && "message" in error) {
        const message = (error as { message: unknown }).message;
        if (typeof message === "string" && message.length > 0) return message;
      }
    }
    if ("message" in payload) {
      const message = (payload as { message: unknown }).message;
      if (typeof message === "string" && message.length > 0) return message;
      if (Array.isArray(message) && message.length > 0 && typeof message[0] === "string") {
        return message.join(", ");
      }
    }
  }
  return DEFAULT_ERROR_MESSAGES[status] ?? "Đã có lỗi xảy ra, vui lòng thử lại.";
}

async function rawFetch(
  path: string,
  { method = "GET", body, signal }: RequestOptions,
): Promise<unknown> {
  const accessToken = getAccessToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    credentials: "include",
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  });

  const isJson = response.headers
    .get("content-type")
    ?.includes("application/json");
  const payload = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    throw new ApiError(response.status, extractMessage(payload, response.status));
  }

  if (response.status === 204) return undefined;

  if (!isJson) {
    throw new ApiError(
      response.status,
      "Phản hồi từ máy chủ không đúng định dạng. Kiểm tra lại địa chỉ API (VITE_API_BASE_URL) hoặc cấu hình proxy.",
    );
  }

  return payload;
}

export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const payload = await rawFetch(path, options);

  // Standard success envelope: { success: true, data: {...}, meta?: {...} }
  if (payload && typeof payload === "object" && "success" in payload && "data" in payload) {
    return (payload as { data: T }).data;
  }

  return payload as T;
}

export interface PageMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

// Same envelope as apiFetch, but also preserves the sibling `meta` block
// that paginated list endpoints return alongside `data`.
export async function apiFetchPage<T>(
  path: string,
  options: RequestOptions = {},
): Promise<{ data: T[]; meta: PageMeta }> {
  const payload = await rawFetch(path, options);

  if (payload && typeof payload === "object" && "data" in payload) {
    const meta = (payload as { meta?: PageMeta }).meta ?? {
      page: 1,
      pageSize: (payload as { data: T[] }).data.length,
      totalItems: (payload as { data: T[] }).data.length,
      totalPages: 1,
    };
    return { data: (payload as { data: T[] }).data, meta };
  }

  return { data: (payload as T[]) ?? [], meta: { page: 1, pageSize: 0, totalItems: 0, totalPages: 1 } };
}
