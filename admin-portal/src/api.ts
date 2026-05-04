import axios from 'axios';

const API_BASE = 'http://localhost:8080/api/v1';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

export interface Stats {
  totalReports: number;
  pendingReports: number;
  processingReports: number;
  resolvedReports: number;
  rejectedReports: number;
  totalUsers: number;
}

export interface Report {
  id: string;
  title: string;
  description: string;
  status: 'PENDING' | 'PROCESSING' | 'RESOLVED' | 'REJECTED';
  categoryName: string;
  reporterFullName: string;
  assigneeFullName: string;
  district: string;
  createdAt: string;
  latitude: number;
  longitude: number;
  mediaUrls: string[];
}
