// src/services/api.js
const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "https://api.cms.icaici.com";

export function getToken() {
  return localStorage.getItem("token");
}

export async function apiFetch(path, options = {}) {
  const token = getToken();

  const headers = {
    ...(options.headers || {}),
  };

  // If sending JSON, set content-type (but don't force it for FormData)
  const isFormData = options.body instanceof FormData;
  if (!isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  // Try parse JSON if possible
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const message =
      (data && data.error) ||
      (typeof data === "string" ? data : "Request failed");
    throw new Error(message);
  }

  return data;
}
