import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      // Convert workStartDate string to Date object if it exists
      if (user.workStartDate) {
        user.workStartDate = new Date(user.workStartDate);
      }
      return user;
    }
    return null;
  },
  getCurrentToken: () => {
    return localStorage.getItem('token');
  }
};

export const izinService = {
  createTalep: async (data) => {
    const response = await api.post('/izin/talep', data);
    return response.data;
  },
  getTaleplerim: async () => {
    const response = await api.get('/izin/taleplerim');
    return response.data;
  },
  getAllTalepler: async () => {
    const response = await api.get('/izin/talepler');
    return response.data;
  },
  analyzeTalep: async (talepId) => {
    const response = await api.post(`/izin/talep/${talepId}/analiz`);
    return response.data;
  }
};

export default api; 