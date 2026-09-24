import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4200';

export const api = axios.create({
  baseURL,
  withCredentials: true
});

api.interceptors.request.use((config) => {
  const raw = localStorage.getItem('lgu-leave-auth');
  if (raw) {
    try {
      const { accessToken } = JSON.parse(raw);
      if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
    } catch {}
  }
  return config;
});

let isRefreshing = false;
let refreshQueue = [];

api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      const raw = localStorage.getItem('lgu-leave-auth');
      if (!raw) return Promise.reject(err);
      const { refreshToken } = JSON.parse(raw);
      if (!refreshToken) return Promise.reject(err);
      original._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then(() => api(original));
      }

      isRefreshing = true;
      try {
        const { data } = await axios.post(`${baseURL}/api/v1/auth/refresh`, { refreshToken });
        const newAccess = data.accessToken;
        const stored = JSON.parse(localStorage.getItem('lgu-leave-auth') || '{}');
        stored.accessToken = newAccess;
        localStorage.setItem('lgu-leave-auth', JSON.stringify(stored));
        original.headers.Authorization = `Bearer ${newAccess}`;
        refreshQueue.forEach(p => p.resolve());
        refreshQueue = [];
        return api(original);
      } catch (e) {
        refreshQueue.forEach(p => p.reject(e));
        refreshQueue = [];
        localStorage.removeItem('lgu-leave-auth');
        window.location.href = '/login';
        return Promise.reject(e);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(err);
  }
);
