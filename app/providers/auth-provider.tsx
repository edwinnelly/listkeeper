'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import api from '@/lib/axios';
import { User } from '../../hoc/user';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Shape of the authentication context value exposed to consumers.
 * 
 * @property user           - The currently authenticated user, or null if
 *                            not logged in / session expired.
 * @property loading        - Whether the initial auth check is still in
 *                            flight.  UI should show a loader when true.
 * @property error          - The last error that occurred during auth (null
 *                            when everything is fine).
 * @property isAuthenticated - Convenience boolean derived from !!user.
 * @property refetchUser     - Manually re-fetch the current user from the
 *                             server (e.g. after login / profile update).
 * @property logout          - Call the logout endpoint and clear local state.
 */
type AuthContextType = {
  user: User | null;
  loading: boolean;
  error: Error | null;
  isAuthenticated: boolean;
  refetchUser: () => Promise<void>;
  logout: () => Promise<void>;
};

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

/**
 * React context that holds authentication state.
 * Initialised as undefined so the hook can detect missing <AuthProvider>.
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

/**
 * AuthProvider
 *
 * Wraps the application (or a sub-tree) and provides authentication state
 * via React context.  On mount it performs an initial "who am I?" request
 * against `/user`.  If the request returns 401 the user is treated as
 * anonymous.  Other errors are surfaced via the `error` field.
 *
 * The request is aborted when the provider unmounts to avoid state updates
 * on unmounted components (React 18+ will warn about this in dev mode).
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  // ---- state --------------------------------------------------------------

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);   // true while first fetch runs
  const [error, setError] = useState<Error | null>(null);

  // ---- helpers ------------------------------------------------------------

  /**
   * fetchUser
   *
   * Calls GET /user to retrieve the currently authenticated user.
   * Accepts an optional AbortSignal so the HTTP request can be cancelled
   * when the component unmounts.
   *
   * State updates:
   *  - Sets loading → true  at the start.
   *  - Clears any previous error.
   *  - On success: sets user (or null if data is falsy).
   *  - On 401 / 403: clears user (session is invalid).
   *  - On 429 / network error: keeps user untouched, surfaces error.
   *  - On abort: returns early without touching state.
   */
  const fetchUser = useCallback(async (signal?: AbortSignal) => {
    // Begin loading; clear any stale error from a previous attempt.
    setLoading(true);
    setError(null);

    try {
      // Axios will attach the signal to the underlying fetch / XHR,
      // so it properly aborts the network request when signalled.
      const { data } = await api.get<User>('/user', { signal });
      setUser(data ?? null);
    } catch (error: any) {
      // ------------------------------------------------------------------
      // Abort / cancel – the request was intentionally cancelled (e.g. the
      // provider unmounted).  We MUST NOT update state because the component
      // is gone (React will warn about "setState on unmounted component").
      // ------------------------------------------------------------------
      if (error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError') {
        return;
      }

      // ------------------------------------------------------------------
      // HTTP-level errors – map known statuses to user-friendly messages.
      // ------------------------------------------------------------------

      if (error?.response?.status === 401) {
        // Unauthorized – no valid session.  Clear the user so the app
        // redirects to login / shows a sign-in prompt.
        setUser(null);
      } else if (error?.response?.status === 403) {
        // Forbidden – session exists but lacks required permissions.
        setUser(null);
        setError(new Error('Access forbidden'));
      } else if (error?.response?.status === 429) {
        // Rate-limited – tell the user to back off; keep the current user
        // (if any) so they don't lose their session unnecessarily.
        setError(new Error('Too many requests. Please try again later.'));
      } else if (error?.code === 'ERR_NETWORK') {
        // Network-level failure (no internet, DNS, CORS, etc.).
        setError(new Error('Network error. Please check your connection.'));
      } else {
        // Any other unexpected error – wrap it in a generic message but
        // also log the raw error for debugging.
        setError(error instanceof Error ? error : new Error('Authentication failed'));
        console.error('Auth error:', error);
      }
    } finally {
      // Whether we succeeded or failed (except abort), loading is done.
      setLoading(false);
    }
  }, []);

  /**
   * logout
   *
   * Sends a POST /auth/logout to invalidate the server-side session (cookie /
   * token), then clears local auth state regardless of the API result.
   */
  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Even if the API call fails (e.g. network down) we still want to
      // clear the local state so the user isn't stuck.
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setError(null);
    }
  }, []);

  // ---- initial fetch on mount ---------------------------------------------

  useEffect(() => {
    // Create a fresh AbortController whose signal we pass to fetchUser.
    // When the cleanup function runs (unmount / dependency change) we call
    // .abort() which causes axios to cancel the in-flight request.
    const abortController = new AbortController();

    fetchUser(abortController.signal);

    // Cleanup: abort the request so we don't try to update state after
    // the provider is removed from the tree.
    return () => {
      abortController.abort();
    };
  }, [fetchUser]); // fetchUser is stable thanks to useCallback([])

  // ---- context value ------------------------------------------------------

  /**
   * Context value is recreated on every render but that's fine because
   * only the primitive values / stable callbacks change reference when
   * state actually changes.
   */
  const value: AuthContextType = {
    user,
    loading,
    error,
    isAuthenticated: !!user,          // true when user object exists
    refetchUser: () => fetchUser(),   // public wrapper – no signal (manual call)
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * useAuth
 *
 * Convenience hook to consume the AuthContext.
 * Throws a descriptive error when the hook is used outside of <AuthProvider>,
 * which helps catch configuration mistakes early.
 *
 * @example
 *   const { user, loading, error, logout } = useAuth();
 */
export function useAuth() {
  const context = useContext(AuthContext);

  // Guard: if the context is undefined it means there's no <AuthProvider>
  // ancestor in the React tree – blow up early with a clear message.
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}