import axios, { AxiosResponse, AxiosError, InternalAxiosRequestConfig } from "axios";
import Cookies from "js-cookie";

/* =========================
   CONFIGURATION
========================= */

export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api",
  STORAGE_URL: process.env.NEXT_PUBLIC_STORAGE_URL || "http://localhost:8000/storage",
} as const;

// Cache configuration
const CACHE_TTL = 1000 * 60 * 1; // 1 minute
const MAX_CACHE_SIZE = 100;

// CSRF configuration
const CSRF_FETCH_TIMEOUT = 15000;
const CSRF_RETRY_DELAY = 1000;
const MAX_CSRF_RETRIES = 3;

/* =========================
   CACHE MANAGEMENT
========================= */

const getCache = new Map<string, AxiosResponse>();
const cacheExpiry = new Map<string, number>();

const buildCacheKey = (url: string, config?: Record<string, unknown>): string =>
  `${url}:${JSON.stringify(config || {})}`;

const cleanCache = (): void => {
  const now = Date.now();

  // Remove expired entries
  for (const [key, expiry] of cacheExpiry.entries()) {
    if (expiry < now) {
      cacheExpiry.delete(key);
      getCache.delete(key);
    }
  }

  // LRU trim if cache exceeds max size
  if (getCache.size > MAX_CACHE_SIZE) {
    const firstKey = getCache.keys().next().value;
    if (firstKey) {
      getCache.delete(firstKey);
      cacheExpiry.delete(firstKey);
    }
  }
};

// Clean cache every minute
setInterval(cleanCache, 60000);

const invalidateCache = (urls: string[]): void => {
  urls.forEach((url) => {
    for (const key of getCache.keys()) {
      if (key.startsWith(url)) {
        getCache.delete(key);
        cacheExpiry.delete(key);
      }
    }
  });
};

/* =========================
   AXIOS INSTANCES
========================= */

export const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  withCredentials: true,
  timeout: 60000,
  headers: { "Content-Type": "application/json" },
});

const sanctumApi = axios.create({
  baseURL: API_CONFIG.BASE_URL.replace("/api", ""),
  withCredentials: true,
  timeout: 60000,
});

/* =========================
   CSRF HANDLING
========================= */

let csrfFetchInProgress: Promise<void> | null = null;

const waitForCookie = async (name: string, timeout = 2000): Promise<string | null> => {
  const start = Date.now();

  while (Date.now() - start < timeout) {
    const value = Cookies.get(name);
    if (value) return value;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  return null;
};

export const ensureCsrfToken = async (retry = 0): Promise<void> => {
  if (csrfFetchInProgress) return csrfFetchInProgress;
  if (Cookies.get("XSRF-TOKEN")) return;

  csrfFetchInProgress = (async () => {
    try {
      await Promise.race([
        sanctumApi.get("/sanctum/csrf-cookie"),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("CSRF timeout")), CSRF_FETCH_TIMEOUT)
        ),
      ]);

      const token = await waitForCookie("XSRF-TOKEN");
      if (!token) throw new Error("CSRF cookie not set");
    } catch (err) {
      if (retry < MAX_CSRF_RETRIES) {
        await new Promise((resolve) =>
          setTimeout(resolve, CSRF_RETRY_DELAY * Math.pow(2, retry))
        );
        csrfFetchInProgress = null;
        return ensureCsrfToken(retry + 1);
      }
      throw err;
    } finally {
      csrfFetchInProgress = null;
    }
  })();

  return csrfFetchInProgress;
};

export const clearCsrfState = (): void => {
  Cookies.remove("XSRF-TOKEN");
  csrfFetchInProgress = null;
};

/* =========================
   REQUEST INTERCEPTOR
========================= */

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  await ensureCsrfToken();

  const token = Cookies.get("XSRF-TOKEN");
  if (token) {
    config.headers["X-XSRF-TOKEN"] = token;
  }

  return config;
});

/* =========================
   RESPONSE INTERCEPTOR
========================= */

interface ApiErrorResponse {
  message?: string;
  errors?: Record<string, string[]>;
}

interface ExtendedAxiosError extends AxiosError {
  userMessage?: string;
  validationErrors?: Record<string, string[]> | null;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const err = error as ExtendedAxiosError;

    // Network or timeout errors
    if (!err.response) {
      err.userMessage =
        err.code === "ECONNABORTED"
          ? "Request timed out. Please check your connection."
          : "Network error. Please check your internet connection.";
      return Promise.reject(err);
    }

    const { status, data } = err.response;
    const resData = data as ApiErrorResponse;

    // Session expired
    if (status === 419) {
      clearCsrfState();
      err.userMessage = "Session expired. Please try again.";
      return Promise.reject(err);
    }

    // Unauthorized
    if (status === 401) {
      clearCsrfState();
      if (typeof window !== "undefined") {
        window.location.href = "/auth?expired=true";
      }
      return Promise.reject(err);
    }

    // Validation errors
    if (status === 422) {
      err.validationErrors = resData?.errors || null;
      err.userMessage = resData?.message || "Validation failed. Please check your input.";
      return Promise.reject(err);
    }

    // Other errors
    err.userMessage = resData?.message || "An unexpected error occurred. Please try again.";
    return Promise.reject(err);
  }
);

/* =========================
   CSRF RETRY WRAPPER
========================= */

export const withCsrf = async <T>(
  fn: () => Promise<T>,
  retry = 0
): Promise<T> => {
  try {
    return await fn();
  } catch (err) {
    const error = err as ExtendedAxiosError;
    const shouldRetry = (!error.response || error.response?.status === 419) && retry < MAX_CSRF_RETRIES;

    if (shouldRetry) {
      clearCsrfState();
      await new Promise((resolve) => setTimeout(resolve, CSRF_RETRY_DELAY * Math.pow(2, retry)));
      return withCsrf(fn, retry + 1);
    }

    throw err;
  }
};

/* =========================
   API METHODS
========================= */

export const apiGet = async (
  url: string,
  config: Record<string, unknown> = {},
  useCache = true
): Promise<AxiosResponse> =>
  withCsrf(async () => {
    const cacheKey = buildCacheKey(url, config);

    if (useCache) {
      const expiry = cacheExpiry.get(cacheKey);
      if (expiry && expiry > Date.now()) {
        const cachedResponse = getCache.get(cacheKey);
        if (cachedResponse) return cachedResponse;
      }
    }

    const response = await api.get(url, config);

    if (useCache) {
      getCache.set(cacheKey, response);
      cacheExpiry.set(cacheKey, Date.now() + CACHE_TTL);
    }

    return response;
  });

export const apiPost = async <T>(
  url: string,
  data: T,
  config: Record<string, unknown> = {},
  invalidateUrls: string[] = []
): Promise<AxiosResponse> =>
  withCsrf(async () => {
    const response = await api.post(url, data, config);
    invalidateCache(invalidateUrls);
    return response;
  });

export const apiPut = async <T>(
  url: string,
  data: T,
  config: Record<string, unknown> = {},
  invalidateUrls: string[] = []
): Promise<AxiosResponse> =>
  withCsrf(async () => {
    const response = await api.put(url, data, config);
    invalidateCache(invalidateUrls);
    return response;
  });

export const apiPatch = async <T>(
  url: string,
  data: T,
  config: Record<string, unknown> = {},
  invalidateUrls: string[] = []
): Promise<AxiosResponse> =>
  withCsrf(async () => {
    const response = await api.patch(url, data, config);
    invalidateCache(invalidateUrls);
    return response;
  });

export const apiDelete = async (
  url: string,
  config: Record<string, unknown> = {},
  invalidateUrls: string[] = []
): Promise<AxiosResponse> =>
  withCsrf(async () => {
    const response = await api.delete(url, config);
    invalidateCache(invalidateUrls);
    return response;
  });

export default api;