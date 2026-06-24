import { createContext, useContext, useState } from 'react';
import { setAuthToken } from '../api/axiosClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Load the saved user (if any) so a page refresh keeps them logged in
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  // The token is kept in memory only (safer than saving it in the browser)
  const [token, setToken] = useState(null);

  function login(userData, newToken) {
    setUser(userData);
    setToken(newToken);
    setAuthToken(newToken); // hand the token to axios so requests carry it
    localStorage.setItem('user', JSON.stringify(userData));
  }

  function logout() {
    setUser(null);
    setToken(null);
    setAuthToken(null); // clear the token from axios
    localStorage.removeItem('user');
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Lets any component do: const { user, login, logout } = useAuth();
export function useAuth() {
  return useContext(AuthContext);
}