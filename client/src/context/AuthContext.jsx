import { createContext, useContext, useState, useEffect } from 'react';
import axiosClient, { setAuthToken } from '../api/axiosClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true); // true until we've tried to restore the session

  function login(userData, newToken) {
    setUser(userData);
    setToken(newToken);
    setAuthToken(newToken);
    localStorage.setItem('user', JSON.stringify(userData));
  }

  function logout() {
    setUser(null);
    setToken(null);
    setAuthToken(null);
    localStorage.removeItem('user');
  }

  // On refresh: if a user was saved, use the refresh cookie to get a new token
  useEffect(() => {
    async function restoreSession() {
      if (!localStorage.getItem('user')) {
        setLoading(false);
        return;
      }
      try {
        const res = await axiosClient.post('/api/auth/refresh');
        const newToken = res.data.accessToken;
        setToken(newToken);
        setAuthToken(newToken);     // now axios has the token again
      } catch {
        logout();                   // cookie expired/missing → log out cleanly
      } finally {
        setLoading(false);
      }
    }
    restoreSession();
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {/* Don't render pages until we've restored the token, or they'll fire 401s */}
      {loading ? <div style={{ padding: '2rem' }}>Loading…</div> : children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
