import axios from 'axios';

let authToken = localStorage.getItem('accessToken') || null;

export function setAuthToken(token) {
  authToken = token;
  if (token) {
    localStorage.setItem('accessToken', token);
  } else {
    localStorage.removeItem('accessToken');
  }
}

export function getAuthToken() {
  return authToken || localStorage.getItem('accessToken');
}

// One shared Axios instance for the whole app.
const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

// Before every request goes out, attach the login token if we have one.
axiosClient.interceptors.request.use((config) => {
  const activeToken = authToken || localStorage.getItem('accessToken');
  if (activeToken) {
    config.headers.Authorization = `Bearer ${activeToken}`;
  }
  return config;
});

export default axiosClient;