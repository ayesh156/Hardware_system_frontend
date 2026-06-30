import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  user: { name: string; email: string } | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('auth_user') !== null;
  });
  const [user, setUser] = useState<{ name: string; email: string } | null>(() => {
    const stored = sessionStorage.getItem('auth_user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = useCallback(async (username: string, _password: string): Promise<boolean> => {
    // Simulate authentication - accept any non-empty username
    // In production, this would call a real API
    if (!username.trim()) return false;

    const userData = {
      name: username,
      email: username.includes('@') ? username : `${username.toLowerCase().replace(/\s+/g, '.')}@liyanage.lk`,
    };

    sessionStorage.setItem('auth_user', JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
    return true;
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem('auth_user');
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, user }}>
      {children}
    </AuthContext.Provider>
  );
};