// 🌐 API Service - Backend Communication
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
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

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const registerUser = async (userData) => {
  const response = await apiClient.post('/auth/register', userData);
  return response.data;
};

export const loginUser = async (credentials) => {
  const response = await apiClient.post('/auth/login', credentials);
  if (response.data.success && response.data.data.token) {
    localStorage.setItem('token', response.data.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.data.user));
  }
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await apiClient.get('/auth/me');
  return response.data;
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
};

// KYC APIs
export const submitKYC = async (formData) => {
  const response = await apiClient.post('/kyc/submit', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getKYCStatus = async (userId) => {
  const response = await apiClient.get(`/kyc/status/${userId}`);
  return response.data;
};

export const getAllKYCRecords = async (params) => {
  const response = await apiClient.get('/kyc/all', { params });
  return response.data;
};

// Blockchain APIs
export const registerVerificationOnBlockchain = async (kycRecordId) => {
  const response = await apiClient.post('/blockchain/register', { kycRecordId });
  return response.data;
};

export const checkBlockchainVerification = async (userId) => {
  const response = await apiClient.get(`/blockchain/verify/${userId}`);
  return response.data;
};

export const getVerificationDetails = async (verificationHash) => {
  const response = await apiClient.get(`/blockchain/details/${verificationHash}`);
  return response.data;
};

export const saveBlockchainConfig = async (config) => {
  const response = await apiClient.post('/blockchain/settings', config);
  return response.data;
};

export const getBlockchainConfig = async () => {
  const response = await apiClient.get('/blockchain/settings');
  return response.data;
};

// Health Check
export const checkBackendHealth = async () => {
  const response = await axios.get(`${API_URL.replace('/api', '')}/health`);
  return response.data;
};

// Helper to get stored user
export const getStoredUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

// Helper to check if user is authenticated
export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

export default apiClient;
