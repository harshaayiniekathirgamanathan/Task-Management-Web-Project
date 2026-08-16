import axios from 'axios';

// We keep the current login token here in memory.
// AuthContext will update it on login/logout using setAuthToken().
let authToken = null;

export function setAuthToken(token) {
  authToken = token;
}

export function getAuthToken() {
  return authToken;
}

// One shared Axios instance for the whole app.
const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true, // send cookies too (needed for the refresh token)
});

// Before every request goes out, attach the login token if we have one.
axiosClient.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

export default axiosClient;