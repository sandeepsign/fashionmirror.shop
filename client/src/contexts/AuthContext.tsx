import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export interface User {
  id: string;
  username: string;
  email: string;
  name?: string;
  role: string;
  plan?: string;
  createdAt: string;
}

export interface ApiKeys {
  liveKey: string;
  testKey: string;
  liveKeyMasked: string;
  testKeyMasked: string;
}

export interface Quota {
  plan: string;
  totalQuota: number | null;
  monthlyQuota: number | null;
  quotaUsed: number;
  quotaResetAt: string | null;
}

interface AuthContextType {
  user: User | null;
  apiKeys: ApiKeys | null;
  quota: Quota | null;
  login: (user: User) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
  refreshApiKeys: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKeys | null>(null);
  const [quota, setQuota] = useState<Quota | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user's API keys
  const fetchApiKeys = useCallback(async () => {
    try {
      const response = await fetch('/api/account/keys', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.keys) {
          setApiKeys(data.keys);
        }
      }
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
    }
  }, []);

  // Fetch user's profile with quota info
  const fetchProfile = useCallback(async () => {
    try {
      const response = await fetch('/api/account/profile', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.quota) {
          setQuota(data.quota);
        }
        return data;
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
    return null;
  }, []);

  // Check for existing session on app load
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          // Fetch API keys and profile in parallel
          await Promise.all([fetchApiKeys(), fetchProfile()]);
        } else {
          setUser(null);
          setApiKeys(null);
          setQuota(null);
        }
      } catch (error) {
        console.error('Session check failed:', error);
        setUser(null);
        setApiKeys(null);
        setQuota(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, [fetchApiKeys, fetchProfile]);

  const login = useCallback(async (userData: User) => {
    setUser(userData);
    // Fetch additional data after login
    await Promise.all([fetchApiKeys(), fetchProfile()]);
  }, [fetchApiKeys, fetchProfile]);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      setUser(null);
      setApiKeys(null);
      setQuota(null);
    }
  }, []);

  // Refresh user data
  const refreshUser = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  }, []);

  // Refresh API keys
  const refreshApiKeys = useCallback(async () => {
    await fetchApiKeys();
  }, [fetchApiKeys]);

  // Refresh quota/profile
  const refreshProfile = useCallback(async () => {
    await fetchProfile();
  }, [fetchProfile]);

  const isAuthenticated = user !== null;

  return (
    <AuthContext.Provider value={{
      user,
      apiKeys,
      quota,
      login,
      logout,
      isAuthenticated,
      isLoading,
      refreshUser,
      refreshApiKeys,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
