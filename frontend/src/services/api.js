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
    if (userStr) return JSON.parse(userStr);
    return null;
  },
  getCurrentToken: () => {
    return localStorage.getItem('token');
  }
};

export const izinService = {
  createTalep: async (talepData) => {
    try {
      const response = await api.post('/izin/talep', talepData);
      return response.data;
    } catch (error) {
      console.error('İzin talebi oluşturma hatası:', error);
      throw error;
    }
  },
  getTaleplerim: async () => {
    try {
      const response = await api.get('/izin/taleplerim');
      return response.data;
    } catch (error) {
      console.error('Talepler getirme hatası:', error);
      throw error;
    }
  },
  getAllTalepler: async () => {
    try {
      const response = await api.get('/izin/talepler');
      return response.data;
    } catch (error) {
      console.error('Tüm talepler getirme hatası:', error);
      throw error;
    }
  },
  updateTalepStatus: async (talepId, newStatus) => {
    try {
      const response = await api.put(`/izin/talep/${talepId}`, { requestStatus: newStatus });
      return response.data;
    } catch (error) {
      console.error('Talep güncelleme hatası:', error);
      throw error;
    }
  }
};

export default api; 