import axios from 'axios';
import type { User, Call, PaymentStats, CreateUserDTO, Notification } from '../types';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Axios Request Interceptor para inyectar JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jwt_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Axios Response Interceptor para manejar errores globales (401, 403)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { status } = error.response || {};

    if (status === 401) {
      // Sesión expirada o no válida
      console.warn('Session expired or unauthorized. Redirecting to login...');
      localStorage.removeItem('jwt_token');
      // Redirección forzada para limpiar estado de la app
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login?expired=true';
      }
    }

    if (status === 403) {
      // Prohibido - Falta de permisos
      console.error('Access forbidden. Not enough permissions.');
      if (!window.location.pathname.includes('/access-denied')) {
        window.location.href = '/access-denied';
      }
    }

    return Promise.reject(error);
  }
);

// Mock Data
const MOCK_USERS: User[] = [
  { id: '1', name: 'John Doe', email: 'john@example.com', phoneNumber: '+1 555 123 456', role: 'admin', status: 'active', createdAt: '2024-03-20' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', phoneNumber: '+1 555 987 654', role: 'user', status: 'active', createdAt: '2024-03-21' },
  { id: '3', name: 'Robert Johnson', email: 'robert@example.com', phoneNumber: '+1 555 000 111', role: 'user', status: 'inactive', createdAt: '2024-03-22' },
];

const MOCK_CALLS: Call[] = [
  { id: 'c1', customerName: 'Alice Brown', phoneNumber: '+1 234 567 890', status: 'completed', amount: 50.0, duration: '2:15', timestamp: '10:45 AM' },
  { id: 'c2', customerName: 'Michael Scott', phoneNumber: '+1 987 654 321', status: 'failed', amount: 25.0, duration: '0:45', timestamp: '11:12 AM' },
  { id: 'c3', customerName: 'Dwight Schrute', phoneNumber: '+1 555 123 456', status: 'completed', amount: 120.0, duration: '5:30', timestamp: '11:45 AM' },
  { id: 'c4', customerName: 'Jim Halpert', phoneNumber: '+1 444 888 999', status: 'in-progress', amount: 0, duration: '1:10', timestamp: '12:05 PM' },
];

const MOCK_STATS: PaymentStats = {
  totalCalls: 1250,
  successfulPayments: 980,
  failedPayments: 270,
  conversionRate: 78.4,
  totalRevenue: 45200.50,
  chartData: [
    { name: 'Mon', completed: 40, failed: 10 },
    { name: 'Tue', completed: 55, failed: 15 },
    { name: 'Wed', completed: 45, failed: 8 },
    { name: 'Thu', completed: 70, failed: 20 },
    { name: 'Fri', completed: 65, failed: 12 },
    { name: 'Sat', completed: 30, failed: 5 },
    { name: 'Sun', completed: 25, failed: 5 },
  ],
};

// Helper: transforma User del backend → User del frontend
const mapUser = (u: any): User => ({
  id: String(u.id),
  name: u.name ?? '',
  email: u.email ?? '',
  phoneNumber: u.phoneNumber ?? '',
  role: (u.role === 'admin' ? 'admin' : 'user') as 'admin' | 'user',
  status: u.active === false ? 'inactive' : 'active',
  createdAt: u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-',
});

export const userService = {
  getUsers: async (): Promise<User[]> => {
    try {
      const response = await api.get('/users');
      return response.data.map(mapUser);
    } catch (error: any) {
      console.error('Error in getUsers:', error.response?.data || error.message);
      console.warn('Backend not available, using mock data for users');
      return MOCK_USERS.map(u => ({ ...u, phoneNumber: '+34000000000' }));
    }
  },
  createUser: async (userData: CreateUserDTO): Promise<User> => {
    try {
      const response = await api.post('/users', userData);
      return mapUser(response.data);
    } catch (error: any) {
      console.error('Error in createUser:', error.response?.data || error.message);
      console.warn('Backend not available or returned error, simulating user creation');
      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        ...userData,
        role: userData.role as 'admin' | 'user',
        status: 'active',
        createdAt: new Date().toLocaleDateString(),
      };
      return newUser;
    }
  },
  updateUser: async (id: string, userData: CreateUserDTO): Promise<User> => {
    try {
      const response = await api.put(`/users/${id}`, userData);
      return mapUser(response.data);
    } catch (error: any) {
      console.error('Error in updateUser:', error.response?.data || error.message);
      console.warn('Backend not available, simulating user update');
      return { 
        id, 
        ...userData, 
        role: userData.role as 'admin' | 'user', 
        status: 'active', 
        createdAt: new Date().toLocaleDateString() 
      };
    }
  },
  deleteUser: async (id: string): Promise<void> => {
    try {
      await api.delete(`/users/${id}`);
    } catch (error: any) {
      console.error('Error in deleteUser:', error.response?.data || error.message);
      console.warn('Backend not available, simulating user deletion');
    }
  },
};

// Helper: transforma Payment del backend → Call del frontend
const mapPaymentToCall = (p: any): Call => ({
  id: String(p.id),
  customerName: p.description ? p.description : `User #${p.userId}`,
  phoneNumber: '-',
  status: p.status === 'COMPLETED' ? 'completed'
         : p.status === 'FAILED'    ? 'failed'
         : 'in-progress',
  // BigDecimal llega como string o number desde Spring — parseFloat lo normaliza
  amount: parseFloat(p.amount) || 0,
  duration: '-',
  timestamp: p.createdAt ? new Date(p.createdAt).toLocaleTimeString() : '-',
});

export const paymentService = {
  getStats: async (): Promise<PaymentStats> => {
    try {
      const response = await api.get('/payments/stats');
      const data = response.data;
      const completed = Number(data.completed) || 0;
      const failed    = Number(data.failed)    || 0;
      const pending   = Number(data.pending)   || 0;
      const total = completed + failed + pending;
      return {
        totalCalls: total,
        successfulPayments: completed,
        failedPayments: failed,
        // BigDecimal → parseFloat para evitar que llegue como string
        totalRevenue: parseFloat(data.totalAmount) || 0,
        conversionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
        chartData: MOCK_STATS.chartData, // Mock hasta que el backend provea datos por día
      };
    } catch (error) {
      console.warn('Backend not available, using mock data for stats');
      return MOCK_STATS;
    }
  },
  getRecentCalls: async (): Promise<Call[]> => {
    try {
      const response = await api.get('/payments/recent');
      return response.data.map(mapPaymentToCall);
    } catch (error) {
      console.warn('Backend not available, using mock data for payments');
      return MOCK_CALLS;
    }
  },
};

// Helper: transforma LiveCall del backend → Call del frontend
// Estados del backend: CONNECTED | WAITING_CONFIRMATION | COMPLETED | FAILED
const mapLiveCall = (c: any): Call => ({
  id: String(c.id),
  customerName: c.userName || 'Unknown Caller',
  phoneNumber: c.phoneNumber || '-',
  status: c.status === 'COMPLETED' ? 'completed'
        : c.status === 'FAILED'    ? 'failed'
        : 'in-progress', // CONNECTED y WAITING_CONFIRMATION → in-progress
  amount: 0,
  // Calcular duración en vivo desde timestamp usando getDurationSeconds
  duration: c.timestamp
    ? `${Math.floor((Date.now() - new Date(c.timestamp).getTime()) / 60000)}m ${Math.floor(((Date.now() - new Date(c.timestamp).getTime()) % 60000) / 1000)}s`
    : '-',
  timestamp: c.timestamp ? new Date(c.timestamp).toLocaleTimeString() : '-',
});

export const ivrService = {
  getLiveCalls: async (): Promise<Call[]> => {
    try {
      const response = await api.get('/ivr/calls/live');
      return response.data.map(mapLiveCall);
    } catch (error) {
      console.warn('Backend not available, using mock data for live calls');
      return MOCK_CALLS;
    }
  }
};

// --- Notifications Service ---

const MOCK_NOTIFICATIONS: Notification[] = [
  { id: 'n1', recipient: '+1 234 567 890', type: 'SMS', status: 'SENT', message: 'Payment of $50.00 successful.', timestamp: '2024-03-24T10:45:00Z' },
  { id: 'n2', recipient: 'alice@example.com', type: 'EMAIL', status: 'SENT', message: 'Your receipt for recent call.', timestamp: '2024-03-24T10:46:00Z' },
  { id: 'n3', recipient: '+1 987 654 321', type: 'SMS', status: 'FAILED', message: 'Payment failed. Please update your card.', timestamp: '2024-03-24T11:15:00Z' },
  { id: 'n4', recipient: 'user_device_123', type: 'PUSH', status: 'PENDING', message: 'New promotion available.', timestamp: '2024-03-24T12:00:00Z' },
];

export const notificationService = {
  getNotifications: async (): Promise<Notification[]> => {
    try {
      // Endpoint doesn't exist yet, but we map it so it's ready.
      const response = await api.get('/notifications');
      // If Vite dev server returns an HTML fallback (string) instead of JSON, throw an error
      if (!Array.isArray(response.data)) {
        throw new Error('Invalid response format (not an array)');
      }
      return response.data;
    } catch (error) {
      console.warn('Backend not available, using mock data for notifications');
      return MOCK_NOTIFICATIONS;
    }
  }
};

// --- Auth Service ---
export const authService = {
  login: async (email: string, password: string):Promise<{token: string}> => {
    try {
      const response = await api.post('/auth/login', { email, password });
      return response.data;
    } catch (error: any) {
      console.error('Login failed:', error);
      throw new Error(error.response?.data?.message || 'Invalid credentials or backend unavailable');
    }
  },
  logout: () => {
    localStorage.removeItem('jwt_token');
  }
};

export default api;
