import { createContext, useContext, useState, useEffect } from 'react';
import axiosClient, { setAuthToken } from '../api/axiosClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('accessToken') || null;
  });

  const [loading, setLoading] = useState(true);

  function login(userData, newToken) {
    setUser(userData);
    setToken(newToken);
    setAuthToken(newToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('accessToken', newToken);
  }

  function logout() {
    setUser(null);
    setToken(null);
    setAuthToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
  }

  useEffect(() => {
    async function restoreSession() {
      const savedUser = localStorage.getItem('user');
      const savedToken = localStorage.getItem('accessToken');

      if (!savedUser) {
        setLoading(false);
        return;
      }

      if (savedToken) {
        setAuthToken(savedToken);
      }

      try {
        const res = await axiosClient.post('/api/auth/refresh');
        const newToken = res.data.accessToken;
        if (newToken) {
          setToken(newToken);
          setAuthToken(newToken);
        }
      } catch (err) {
        console.warn('Session refresh fallback using existing saved token:', err?.message);
      } finally {
        setLoading(false);
      }
    }
    restoreSession();
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {loading ? <div style={{ padding: '2rem', color: '#fff' }}>Loading workspace session…</div> : children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
