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
    console.log('🔐 [AuthProvider] fetchUser called');
    console.log('🔐 [AuthProvider] Request URL: GET /user');
    console.log('🔐 [AuthProvider] Signal provided:', !!signal);
    
    // Begin loading; clear any stale error from a previous attempt.
    setLoading(true);
    setError(null);

    try {
      // Axios will attach the signal to the underlying fetch / XHR,
      // so it properly aborts the network request when signalled.
      console.log('🔐 [AuthProvider] Making API request...');
      const { data } = await api.get<User>('/user', { signal });
      
      console.log('🔐 [AuthProvider] API response received:', data);
      console.log('🔐 [AuthProvider] Response status: success');
      console.log('🔐 [AuthProvider] User data:', JSON.stringify(data, null, 2));
      
      // Log specific user fields
      if (data) {
        console.log('🔐 [AuthProvider] User Details:');
        console.log('  - ID:', data.id);
        console.log('  - Name:', data.name);
        console.log('  - Email:', data.email);
        console.log('  - Creator:', data.creator);
        console.log('  - active_business_key:', data.active_business_key);
        console.log('  - active_location_key:', data.active_location_key);
        console.log('  - business_key:', data.business_key);
        console.log('  - businesses_one:', data.businesses_one);
        console.log('  - about_business:', data.about_business);
        
        if (data.businesses_one && data.businesses_one.length > 0) {
          console.log('🔐 [AuthProvider] Businesses:');
          data.businesses_one.forEach((business, index) => {
            console.log(`  Business ${index + 1}:`, {
              id: business.id,
              business_key: business.business_key,
              business_name: business.business_name,
              subscription_type: business.subscription_type,
              created_at: business.created_at
            });
          });
        } else {
          console.log('🔐 [AuthProvider] No businesses found in user data');
        }
      } else {
        console.log('🔐 [AuthProvider] User data is null or undefined');
      }
      
      setUser(data ?? null);
    } catch (error: any) {
      console.error('🔐 [AuthProvider] Error fetching user:', error);
      console.error('🔐 [AuthProvider] Error details:', {
        code: error?.code,
        name: error?.name,
        message: error?.message,
        response: error?.response,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data
      });
      
      // ------------------------------------------------------------------
      // Abort / cancel – the request was intentionally cancelled (e.g. the
      // provider unmounted).  We MUST NOT update state because the component
      // is gone (React will warn about "setState on unmounted component").
      // ------------------------------------------------------------------
      if (error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError') {
        console.log('🔐 [AuthProvider] Request was cancelled, returning early');
        return;
      }

      // ------------------------------------------------------------------
      // HTTP-level errors – map known statuses to user-friendly messages.
      // ------------------------------------------------------------------

      if (error?.response?.status === 401) {
        console.log('🔐 [AuthProvider] 401 Unauthorized - No valid session');
        // Unauthorized – no valid session.  Clear the user so the app
        // redirects to login / shows a sign-in prompt.
        setUser(null);
      } else if (error?.response?.status === 403) {
        console.log('🔐 [AuthProvider] 403 Forbidden - Session exists but lacks permissions');
        // Forbidden – session exists but lacks required permissions.
        setUser(null);
        setError(new Error('Access forbidden'));
      } else if (error?.response?.status === 429) {
        console.log('🔐 [AuthProvider] 429 Too Many Requests - Rate limited');
        // Rate-limited – tell the user to back off; keep the current user
        // (if any) so they don't lose their session unnecessarily.
        setError(new Error('Too many requests. Please try again later.'));
      } else if (error?.code === 'ERR_NETWORK') {
        console.log('🔐 [AuthProvider] Network error - No internet or CORS issue');
        // Network-level failure (no internet, DNS, CORS, etc.).
        setError(new Error('Network error. Please check your connection.'));
      } else {
        console.log('🔐 [AuthProvider] Unexpected error occurred');
        // Any other unexpected error – wrap it in a generic message but
        // also log the raw error for debugging.
        setError(error instanceof Error ? error : new Error('Authentication failed'));
        console.error('Auth error:', error);
      }
    } finally {
      // Whether we succeeded or failed (except abort), loading is done.
      console.log('🔐 [AuthProvider] fetchUser completed, loading set to false');
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
    console.log('🔐 [AuthProvider] logout called');
    try {
      console.log('🔐 [AuthProvider] Sending POST /auth/logout');
      await api.post('/auth/logout');
      console.log('🔐 [AuthProvider] Logout successful');
    } catch (error) {
      // Even if the API call fails (e.g. network down) we still want to
      // clear the local state so the user isn't stuck.
      console.error('🔐 [AuthProvider] Logout error:', error);
    } finally {
      console.log('🔐 [AuthProvider] Clearing user state');
      setUser(null);
      setError(null);
    }
  }, []);

  // ---- initial fetch on mount ---------------------------------------------

  useEffect(() => {
    console.log('🔐 [AuthProvider] Component mounted, initializing auth check');
    // Create a fresh AbortController whose signal we pass to fetchUser.
    // When the cleanup function runs (unmount / dependency change) we call
    // .abort() which causes axios to cancel the in-flight request.
    const abortController = new AbortController();

    fetchUser(abortController.signal);

    // Cleanup: abort the request so we don't try to update state after
    // the provider is removed from the tree.
    return () => {
      console.log('🔐 [AuthProvider] Component unmounting, aborting request');
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
    refetchUser: () => {
      console.log('🔐 [AuthProvider] Manual refetch triggered');
      return fetchUser();
    },   // public wrapper – no signal (manual call)
    logout,
  };

  // Log context value changes
  useEffect(() => {
    console.log('🔐 [AuthProvider] Context value updated:');
    console.log('  - user:', user);
    console.log('  - loading:', loading);
    console.log('  - error:', error);
    console.log('  - isAuthenticated:', !!user);
  }, [user, loading, error]);

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
  console.log('🔐 [useAuth] Hook called, context exists:', !!context);
  
  // Guard: if the context is undefined it means there's no <AuthProvider>
  // ancestor in the React tree – blow up early with a clear message.
  if (!context) {
    console.error('🔐 [useAuth] Error: useAuth used outside of AuthProvider');
    throw new Error('useAuth must be used within AuthProvider');
  }

  // Log the current auth state when hook is used
  console.log('🔐 [useAuth] Current auth state:', {
    isAuthenticated: context.isAuthenticated,
    hasUser: !!context.user,
    loading: context.loading,
    hasError: !!context.error,
    userDetails: context.user ? {
      id: context.user.id,
      name: context.user.name,
      creator: context.user.creator,
      active_business_key: context.user.active_business_key
    } : null
  });

  return context;
}