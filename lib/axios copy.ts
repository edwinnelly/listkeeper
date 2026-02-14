import axios from "axios";
import Cookies from "js-cookie";

// In-memory GET cache
const getCache: Record<string, any> = {};
const cacheExpiry: Record<string, number> = {};
const CACHE_TTL = 1000 * 60 * 1; // 1 minute TTL

// Helper: ensure CSRF cookie is set
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// Function to ensure CSRF token is set
export const ensureCsrfToken = async (): Promise<void> => {
  try {
    // Check if token already exists in cookies
    const existingToken = Cookies.get("XSRF-TOKEN");
    
    // Only fetch new token if it doesn't exist
    if (!existingToken) {
      await api.get("/sanctum/csrf-cookie");
    }
    
    // Get the token (either existing or newly fetched)
    const token = Cookies.get("XSRF-TOKEN");
    if (token) {
      api.defaults.headers.common["X-XSRF-TOKEN"] = token;
    }
  } catch (err) {
    console.error("Failed to ensure CSRF token:", err);
    throw err;
  }
};

export const withCsrf = async (requestFn: () => Promise<any>) => {
  try {
    // Ensure CSRF token is available before making the request
    await ensureCsrfToken();
    return await requestFn();
  } catch (err) {
    console.error("API request failed:", err);
    throw err;
  }
};

// Invalidate cache keys
const invalidateCache = (urls: string[] = []) => {
  urls.forEach((url) => {
    delete getCache[url];
    delete cacheExpiry[url];
  });
};


// Response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Network / CORS / timeout errors (no response)
    if (!error.response) {
      error.userMessage =
        error.code === "ECONNABORTED"
          ? "Request timed out. Please check your connection."
          : "Network error. Please check your internet connection.";
      return Promise.reject(error);
    }

    const { status, data } = error.response;

    switch (status) {
      case 400:
        error.userMessage =
          data?.message || "Invalid request. Please check your input.";
        break;

      case 401:
        error.userMessage =
          data?.message || "Session expired. Please log in again.";
        break;

      case 403:
        error.userMessage =
          data?.message || "You don’t have permission to perform this action.";
        break;

      case 404:
        error.userMessage =
          data?.message || "The requested resource was not found.";
        break;

      case 409:
        error.userMessage =
          data?.message || "Conflict detected. This record may already exist.";
        break;

      case 422:
        // Laravel validation errors
        error.userMessage =
          data?.message || "Validation failed. Please review your inputs.";
        error.validationErrors = data?.errors || null;
        break;

      case 429:
        error.userMessage =
          "Too many requests. Please slow down and try again.";
        break;

      case 500:
        error.userMessage =
          "Internal server error. Please try again later.";
        break;

      case 502:
        error.userMessage =
          "Bad gateway. Server is temporarily unavailable.";
        break;

      case 503:
        error.userMessage =
          "Service unavailable. Please try again shortly.";
        break;

      case 504:
        error.userMessage =
          "Server timeout. Please try again later.";
        break;

      default:
        error.userMessage =
          data?.message || "An unexpected error occurred.";
    }

    return Promise.reject(error);
  }
);



// GET request with caching
export const apiGet = async (url: string, config = {}, useCache = true) =>
  withCsrf(async () => {
    if (useCache) {
      const now = Date.now();
      if (getCache[url] && cacheExpiry[url] > now) {
        return getCache[url];
      }
    }

    const response = await api.get(url, config);

    if (useCache) {
      getCache[url] = response;
      cacheExpiry[url] = Date.now() + CACHE_TTL;
    }

    return response;
  });

// POST request wrapper
export const apiPost = async (url: string, data: any, config = {}, invalidateUrls: string[] = []) =>
  withCsrf(async () => {
    const response = await api.post(url, data, config);
    invalidateCache(invalidateUrls);
    return response;
  });

// PUT request wrapper
export const apiPut = async (url: string, data: any, config = {}, invalidateUrls: string[] = []) =>
  withCsrf(async () => {
    const response = await api.put(url, data, config);
    invalidateCache(invalidateUrls);
    return response;
  });

// PATCH request wrapper
export const apiPatch = async (url: string, data: any, config = {}, invalidateUrls: string[] = []) =>
  withCsrf(async () => {
    const response = await api.patch(url, data, config);
    invalidateCache(invalidateUrls);
    return response;
  });

// DELETE request wrapper
export const apiDelete = async (url: string, config = {}, invalidateUrls: string[] = []) =>
  withCsrf(async () => {
    const response = await api.delete(url, config);
    invalidateCache(invalidateUrls);
    return response;
  });

export default api;