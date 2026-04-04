'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
// import { useRouter } from 'next/navigation';
import api from '@/lib/axios';

// User type definition
type User = {
  id: string | number;
  email: string;
  name?: string;
  avatar?: string;
  role?: string;
  createdAt?: string;
  updatedAt?: string;
} | null;

// API Error type definition
type ApiError = {
  response?: {
    status: number;
    data?: unknown;
  };
  message?: string;
};

type AuthContextType = {
  user: User;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchUser = async () => {
      try {
        const res = await api.get('/user');
        if (!mounted) return;
        setUser(res.data ?? null);
      } catch (err: unknown) {
        const error = err as ApiError;
        if (error?.response?.status === 401) {
          setUser(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchUser();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}