import { createContext, useContext, useEffect, useState } from 'react';
import * as authApi from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('smartcart_token');
    if (!token) {
      setLoading(false);
      return;
    }
    authApi
      .fetchMe()
      .then((data) => setUser(data.user))
      .catch(() => localStorage.removeItem('smartcart_token'))
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const res = await authApi.login({ email, password });
    localStorage.setItem('smartcart_token', res.token);
    setUser(res.user);
    return res;
  }

  async function register(name, email, password) {
    const res = await authApi.register({ name, email, password });
    localStorage.setItem('smartcart_token', res.token);
    setUser(res.user);
    return res;
  }

  function logout() {
    localStorage.removeItem('smartcart_token');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
