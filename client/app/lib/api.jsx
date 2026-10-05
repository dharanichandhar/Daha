import { API_URL } from "./format";

export class ApiError extends Error {
  constructor(message, status = 0, data = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

function normaliseErrorPayload(payload, fallback) {
  if (!payload) return fallback;
  if (typeof payload === "string") return payload.trim() || fallback;
  return payload.message || payload.error || fallback;
}

export async function apiFetch(path, options = {}) {
  const {
    method = "GET",
    headers: extraHeaders = {},
    body: rawBody = null,
    ...fetchOptions
  } = options;

  const headers = { ...extraHeaders };
  let body = rawBody;

  if (body instanceof FormData) {
    // Browser must set the multipart boundary itself.
    delete headers["Content-Type"];
  } else if (body !== null && body !== undefined) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
    if (typeof body === "object") body = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body,
      credentials: "include",
      ...fetchOptions,
    });
  } catch (error) {
    throw new ApiError(
      "Cannot connect to the DAHA server. Make sure the backend is running and server/.env is configured.",
      0,
      { cause: error?.message || "Network request failed" }
    );
  }

  const contentType = res.headers.get("content-type") || "";
  let payload = null;

  if (res.status !== 204) {
    try {
      payload = contentType.includes("application/json") ? await res.json() : await res.text();
    } catch {
      payload = null;
    }
  }

  if (!res.ok) {
    const fallback = `Request failed (${res.status})`;
    throw new ApiError(normaliseErrorPayload(payload, fallback), res.status, payload);
  }

  return payload;
}

export const api = {
  get: (path, opts) => apiFetch(path, { ...opts, method: "GET" }),
  post: (path, body, opts) => apiFetch(path, { ...opts, method: "POST", body }),
  put: (path, body, opts) => apiFetch(path, { ...opts, method: "PUT", body }),
  patch: (path, body, opts) => apiFetch(path, { ...opts, method: "PATCH", body }),
  del: (path, opts) => apiFetch(path, { ...opts, method: "DELETE" }),
};
