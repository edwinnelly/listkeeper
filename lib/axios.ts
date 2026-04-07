import axios, { AxiosResponse, AxiosError, InternalAxiosRequestConfig } from "axios";
import Cookies from "js-cookie";

/* =========================
   CONFIG
========================= */
const CACHE_TTL = 1000 * 60 * 1;
const MAX_CACHE_SIZE = 100;

const CSRF_FETCH_TIMEOUT = 15000;
const CSRF_RETRY_DELAY = 1000;
const MAX_CSRF_RETRIES = 3;

/* =========================
   CACHE (LRU + TTL)
========================= */
const getCache = new Map<string, AxiosResponse>();
const cacheExpiry = new Map<string, number>();

const buildCacheKey = (url: string, config?: Record<string, unknown>) =>
  `${url}:${JSON.stringify(config || {})}`;

const cleanCache = () => {
  const now = Date.now();

  for (const [key, expiry] of cacheExpiry.entries()) {
    if (expiry < now) {
      cacheExpiry.delete(key);
      getCache.delete(key);
    }
  }

  // LRU trim
  if (getCache.size > MAX_CACHE_SIZE) {
    const firstKey = getCache.keys().next().value;
    if (firstKey) {
      getCache.delete(firstKey);
      cacheExpiry.delete(firstKey);
    }
  }
};

// periodic cleanup
setInterval(cleanCache, 60000);

/* =========================
   AXIOS INSTANCES
========================= */
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "https://snowviewssl.net/api",
  // baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api",
  withCredentials: true,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

const sanctumApi = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ||
    "https://snowviewssl.net",
    // "http://localhost:8000",
  withCredentials: true,
  timeout: 10000,
});

/* =========================
   CSRF HANDLING
========================= */
let csrfFetchInProgress: Promise<void> | null = null;

// wait until cookie exists (deterministic)
const waitForCookie = async (name: string, timeout = 2000) => {
  const start = Date.now();

  while (Date.now() - start < timeout) {
    const value = Cookies.get(name);
    if (value) return value;
    await new Promise((r) => setTimeout(r, 50));
  }

  return null;
};

export const ensureCsrfToken = async (retry = 0): Promise<void> => {
  if (csrfFetchInProgress) return csrfFetchInProgress;

  const existing = Cookies.get("XSRF-TOKEN");
  if (existing) return;

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
        await new Promise((r) =>
          setTimeout(r, CSRF_RETRY_DELAY * Math.pow(2, retry))
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

export const clearCsrfState = () => {
  Cookies.remove("XSRF-TOKEN");
  csrfFetchInProgress = null;
};

/* =========================
   REQUEST INTERCEPTOR (CSRF)
========================= */
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    await ensureCsrfToken();

    const token = Cookies.get("XSRF-TOKEN");
    if (token) {
      config.headers["X-XSRF-TOKEN"] = token;
    }

    return config;
  }
);

/* =========================
   ERROR HANDLING
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
  (res) => res,
  async (error: AxiosError) => {
    const err = error as ExtendedAxiosError;

    if (!err.response) {
      err.userMessage =
        err.code === "ECONNABORTED"
          ? "Request timed out. Check your connection."
          : "Network error. Please check your internet.";
      return Promise.reject(err);
    }

    const { status, data } = err.response;
    const resData = data as ApiErrorResponse;

    if (status === 419) {
      clearCsrfState();
      err.userMessage = "Session expired. Please retry.";
      return Promise.reject(err);
    }

    switch (status) {
      case 401:
        clearCsrfState();
        if (typeof window !== "undefined") {
          window.location.href = "/auth?expired=true";
        }
        break;

      case 422:
        err.validationErrors = resData?.errors || null;
        err.userMessage = resData?.message || "Validation failed.";
        break;

      default:
        err.userMessage =
          resData?.message || "An unexpected error occurred.";
    }

    return Promise.reject(err);
  }
);

/* =========================
   WITH CSRF RETRY WRAPPER
========================= */
export const withCsrf = async <T>(
  fn: () => Promise<T>,
  retry = 0
): Promise<T> => {
  try {
    return await fn();
  } catch (err: unknown) {
    const error = err as ExtendedAxiosError;
    const shouldRetry =
      (!error.response || error.response?.status === 419) &&
      retry < MAX_CSRF_RETRIES;

    if (shouldRetry) {
      clearCsrfState();

      await new Promise((r) =>
        setTimeout(r, CSRF_RETRY_DELAY * Math.pow(2, retry))
      );

      return withCsrf(fn, retry + 1);
    }

    throw err;
  }
};

/* =========================
   CACHE INVALIDATION
========================= */
const invalidateCache = (urls: string[]) => {
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
   API METHODS
========================= */
export const apiGet = async (
  url: string,
  config: Record<string, unknown> = {},
  useCache = true
): Promise<AxiosResponse> =>
  withCsrf(async () => {
    const key = buildCacheKey(url, config);

    if (useCache) {
      const expiry = cacheExpiry.get(key);
      if (expiry && expiry > Date.now()) {
        const cachedResponse = getCache.get(key);
        if (cachedResponse) return cachedResponse;
      }
    }

    const res = await api.get(url, config);

    if (useCache) {
      getCache.set(key, res);
      cacheExpiry.set(key, Date.now() + CACHE_TTL);
    }

    return res;
  });

export const apiPost = async <T>(
  url: string,
  data: T,
  config: Record<string, unknown> = {},
  invalidateUrls: string[] = []
) =>
  withCsrf(async () => {
    const res = await api.post(url, data, config);
    invalidateCache(invalidateUrls);
    return res;
  });

export const apiPut = async <T>(
  url: string,
  data: T,
  config: Record<string, unknown> = {},
  invalidateUrls: string[] = []
) =>
  withCsrf(async () => {
    const res = await api.put(url, data, config);
    invalidateCache(invalidateUrls);
    return res;
  });

export const apiPatch = async <T>(
  url: string,
  data: T,
  config: Record<string, unknown> = {},
  invalidateUrls: string[] = []
) =>
  withCsrf(async () => {
    const res = await api.patch(url, data, config);
    invalidateCache(invalidateUrls);
    return res;
  });

export const apiDelete = async (
  url: string,
  config: Record<string, unknown> = {},
  invalidateUrls: string[] = []
) =>
  withCsrf(async () => {
    const res = await api.delete(url, config);
    invalidateCache(invalidateUrls);
    return res;
  });

export default api;