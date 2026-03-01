import axios from "axios";
import Cookies from "js-cookie";

// In-memory GET cache
const getCache: Record<string, any> = {};
const cacheExpiry: Record<string, number> = {};
const CACHE_TTL = 1000 * 60 * 1; // 1 minute TTL

// CSRF state tracking
let csrfFetchInProgress: Promise<void> | null = null;
let csrfFetchTimeoutId: NodeJS.Timeout | null = null;
let csrfLastFetchAttempt = 0;
const CSRF_FETCH_TIMEOUT = 15000; // 15 seconds timeout for CSRF fetch
const CSRF_RETRY_DELAY = 1000; // 1 second delay between retries
const MAX_CSRF_RETRIES = 3;

// Create separate axios instances
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
  timeout: 30000, // 30 second timeout for all requests
});

// // Create a separate instance for Sanctum (without /api prefix)
const sanctumApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || "http://localhost:8000",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
  timeout: 10000, // 10 second timeout for CSRF endpoint
});


// Function to ensure CSRF token is set with timeout racing and retry logic
export const ensureCsrfToken = async (retryCount = 0): Promise<void> => {
  // Check if a fetch is already in progress
  if (csrfFetchInProgress) {
    return csrfFetchInProgress;
  }

  // Check if token already exists in cookies
  const existingToken = Cookies.get("XSRF-TOKEN");
  if (existingToken) {
    // Set token on both instances
    api.defaults.headers.common["X-XSRF-TOKEN"] = existingToken;
    sanctumApi.defaults.headers.common["X-XSRF-TOKEN"] = existingToken;
    return;
  }

  // Clear any existing timeout
  if (csrfFetchTimeoutId) {
    clearTimeout(csrfFetchTimeoutId);
    csrfFetchTimeoutId = null;
  }

  // Create a new fetch promise with timeout racing
  csrfFetchInProgress = new Promise(async (resolve, reject) => {
    try {
      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        csrfFetchTimeoutId = setTimeout(() => {
          reject(new Error(`CSRF token fetch timeout after ${CSRF_FETCH_TIMEOUT}ms`));
        }, CSRF_FETCH_TIMEOUT);
      });

      // Race between fetch and timeout
      await Promise.race([
        sanctumApi.get("/sanctum/csrf-cookie"),
        timeoutPromise
      ]);

      // Clear timeout if fetch succeeded
      if (csrfFetchTimeoutId) {
        clearTimeout(csrfFetchTimeoutId);
        csrfFetchTimeoutId = null;
      }

      // Small delay to ensure cookie is set
      await new Promise(resolve => setTimeout(resolve, 50));

      // Get the token
      const token = Cookies.get("XSRF-TOKEN");
      if (token) {
        // Set token on both instances
        api.defaults.headers.common["X-XSRF-TOKEN"] = token;
        sanctumApi.defaults.headers.common["X-XSRF-TOKEN"] = token;
        csrfLastFetchAttempt = Date.now();
        resolve();
      } else {
        throw new Error("CSRF token not found in cookies after fetch");
      }
    } catch (err) {
      // Clear timeout on error
      if (csrfFetchTimeoutId) {
        clearTimeout(csrfFetchTimeoutId);
        csrfFetchTimeoutId = null;
      }

      // Retry logic for network errors or timeouts
      if (retryCount < MAX_CSRF_RETRIES) {
        console.log(`CSRF fetch attempt ${retryCount + 1} failed, retrying...`, {
          error: err.message,
          retryCount: retryCount + 1
        });
        
        // Exponential backoff
        const delay = CSRF_RETRY_DELAY * Math.pow(2, retryCount);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Clear the in-progress flag before retry
        csrfFetchInProgress = null;
        
        // Retry
        return ensureCsrfToken(retryCount + 1);
      }

      console.error("Failed to ensure CSRF token after retries:", {
        error: err,
        message: err.response?.data || err.message,
        status: err.response?.status
      });
      throw err;
    } finally {
      // Clear the in-progress flag
      csrfFetchInProgress = null;
    }
  });

  return csrfFetchInProgress;
};

// Function to clear CSRF state (useful for logout)
export const clearCsrfState = () => {
  Cookies.remove("XSRF-TOKEN");
  delete api.defaults.headers.common["X-XSRF-TOKEN"];
  delete sanctumApi.defaults.headers.common["X-XSRF-TOKEN"];
  
  if (csrfFetchTimeoutId) {
    clearTimeout(csrfFetchTimeoutId);
    csrfFetchTimeoutId = null;
  }
  csrfFetchInProgress = null;
};

export const withCsrf = async (requestFn: () => Promise<any>, retryCount = 0) => {
  try {
    // Ensure CSRF token is available before making the request
    await ensureCsrfToken();
    return await requestFn();
  } catch (err) {
    // Check for 419 CSRF mismatch or network errors
    const isCsrfMismatch = err.response?.status === 419;
    const isNetworkError = !err.response && err.code !== "ECONNABORTED";
    const isTimeoutError = err.code === "ECONNABORTED";
    
    // Retry on 419 (CSRF mismatch), network errors, or timeouts
    if ((isCsrfMismatch || isNetworkError || isTimeoutError) && retryCount < MAX_CSRF_RETRIES) {
      console.log(`Request failed (${err.response?.status || 'network'}), retrying...`, {
        retryCount: retryCount + 1,
        error: err.message
      });

      // Clear CSRF state on 419 or network errors to force a new token fetch
      if (isCsrfMismatch || isNetworkError) {
        clearCsrfState();
      }

      // Exponential backoff
      const delay = CSRF_RETRY_DELAY * Math.pow(2, retryCount);
      await new Promise(resolve => setTimeout(resolve, delay));

      // Retry the request
      return withCsrf(requestFn, retryCount + 1);
    }

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

// Response interceptor for better error handling (only for main api instance)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Network / CORS / timeout errors (no response)
    if (!error.response) {
      error.userMessage =
        error.code === "ECONNABORTED"
          ? "Request timed out. Please check your connection."
          : "Network error. Please check your internet connection.";
      return Promise.reject(error);
    }

    const { status, data } = error.response;

    // Handle 419 CSRF mismatch - but let withCsrf handle retries
    if (status === 419) {
      error.userMessage = "Session expired. Please try again.";
      // Clear CSRF token to force refresh on next request
      clearCsrfState();
      return Promise.reject(error);
    }

    // Handle 401 Unauthorized - token expired
    if (status === 401) {
      clearCsrfState();
      
      // Optionally redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/auth?expired=true';
      }
    }

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