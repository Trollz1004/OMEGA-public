import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor for adding auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Dashboard
export const fetchDashboardStats = async () => {
  const response = await api.get('/admin/dashboard/stats');
  return response.data;
};

// Users
export const fetchUsers = async (params) => {
  const response = await api.get('/admin/users', { params });
  return response.data;
};

export const fetchUser = async (id) => {
  const response = await api.get(`/admin/users/${id}`);
  return response.data;
};

export const updateUser = async (id, data) => {
  const response = await api.put(`/admin/users/${id}`, data);
  return response.data;
};

export const suspendUser = async (id) => {
  const response = await api.post(`/admin/users/${id}/suspend`);
  return response.data;
};

// Profiles
export const fetchProfiles = async (params) => {
  const response = await api.get('/admin/profiles', { params });
  return response.data;
};

export const approveProfile = async (id) => {
  const response = await api.post(`/admin/profiles/${id}/approve`);
  return response.data;
};

// Matches
export const fetchMatches = async (params) => {
  const response = await api.get('/admin/matches', { params });
  return response.data;
};

// Messages
export const fetchConversations = async (params) => {
  const response = await api.get('/admin/messages', { params });
  return response.data;
};

export const fetchFlaggedMessages = async () => {
  const response = await api.get('/admin/messages/flagged');
  return response.data;
};

export const approveMessage = async (id) => {
  const response = await api.post(`/admin/messages/${id}/approve`);
  return response.data;
};

export const deleteMessage = async (id) => {
  const response = await api.delete(`/admin/messages/${id}`);
  return response.data;
};

// Subscriptions
export const fetchSubscriptions = async (params) => {
  const response = await api.get('/admin/subscriptions', { params });
  return response.data;
};

export const fetchRevenueStats = async (period) => {
  const response = await api.get('/admin/subscriptions/revenue', { params: { period } });
  return response.data;
};

// Moderation
export const fetchModerationQueue = async (type) => {
  const response = await api.get('/admin/moderation/queue', { params: { type } });
  return response.data;
};

export const moderateContent = async (id, action, type) => {
  const response = await api.post(`/admin/moderation/${type}/${id}`, { action });
  return response.data;
};

// Analytics
export const fetchAnalytics = async (params) => {
  const response = await api.get('/admin/analytics', { params });
  return response.data;
};

// Settings
export const fetchSettings = async () => {
  const response = await api.get('/admin/settings');
  return response.data;
};

export const updateSettings = async (data) => {
  const response = await api.put('/admin/settings', data);
  return response.data;
};

export default api;
