import axios from 'axios';
import type { User, Call, PaymentStats, CreateUserDTO, Notification } from '../types';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Axios Request Interceptor para inyectar JWT token y API Key
api.interceptors.request.use((config) => {
  // Inyectamos la API Key de seguridad básica
  config.headers['X-API-KEY'] = 'voicepay-secret-key-2024';

  const token = localStorage.getItem('jwt_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Axios Response Interceptor para manejar errores globales (401, 403)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const { status } = error.response || {};

    // Prevent infinite loops if refresh fails
    if (status === 401 && !originalRequest._retry && originalRequest.url !== '/auth/refresh') {
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }).catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Llamada al backend para renovar token
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
        const newAuthToken = response.data.token;
        const newRefreshToken = response.data.refreshToken;

        // Guardamos los nuevos tokens
        localStorage.setItem('jwt_token', newAuthToken);
        if (newRefreshToken) localStorage.setItem('refresh_token', newRefreshToken);

        // Actualizamos header y procesamos encolados
        api.defaults.headers.common['Authorization'] = `Bearer ${newAuthToken}`;
        originalRequest.headers['Authorization'] = `Bearer ${newAuthToken}`;
        processQueue(null, newAuthToken);

        return api(originalRequest);
      } catch (err) {
        processQueue(err, null);
        console.warn('Session expired or unauthorized. Redirecting to login...');
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('refresh_token');
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login?expired=true';
        }
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    } else if (status === 401 && originalRequest.url === '/auth/refresh') {
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('refresh_token');
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login?expired=true';
        }
    }

    if (status === 403) {
      // Prohibido - Falta de permisos
      console.error('Access forbidden. Not enough permissions.');
      const isTransferBack = originalRequest.url?.includes('/ivr/calls/transfer-back');
      if (!isTransferBack && !window.location.pathname.includes('/access-denied')) {
        window.location.href = '/access-denied';
      }
    }
    
    if (status >= 500) {
      console.error('Server error occurred:', error.response?.data || error.message);
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
  { id: 'c1', customerName: 'Alice Brown', phoneNumber: '+1 234 567 890', status: 'completed', amount: 50.0, duration: '2:15', timestamp: '10:45 AM', audioUrl: '/call_recording.mp3' },
  { id: 'c2', customerName: 'Michael Scott', phoneNumber: '+1 987 654 321', status: 'failed', amount: 25.0, duration: '0:45', timestamp: '11:12 AM', audioUrl: '/call_recording.mp3' },
  { id: 'c3', customerName: 'Dwight Schrute', phoneNumber: '+1 555 123 456', status: 'completed', amount: 120.0, duration: '5:30', timestamp: '11:45 AM', audioUrl: '/call_recording.mp3' },
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
  audioUrl: p.audioUrl || (p.status === 'COMPLETED' || p.status === 'FAILED' ? '/call_recording.mp3' : undefined),
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
  getCalls: async (): Promise<Call[]> => {
    const mockExtensions: Call[] = [
      ...MOCK_CALLS,
      { id: 'c5', customerName: 'Pam Beesly', phoneNumber: '+1 555 222 333', status: 'completed', amount: 45.5, duration: '3:20', timestamp: '01:15 PM', audioUrl: '/call_recording.mp3' },
      { id: 'c6', customerName: 'Andy Bernard', phoneNumber: '+1 555 444 555', status: 'failed', amount: 15.0, duration: '1:10', timestamp: '02:30 PM', audioUrl: '/call_recording.mp3' },
      { id: 'c7', customerName: 'Angela Martin', phoneNumber: '+1 555 666 777', status: 'completed', amount: 80.0, duration: '4:45', timestamp: '03:45 PM', audioUrl: '/call_recording.mp3' },
      { id: 'c8', customerName: 'Stanley Hudson', phoneNumber: '+1 555 888 999', status: 'completed', amount: 200.0, duration: '10:00', timestamp: '04:20 PM', audioUrl: '/call_recording.mp3' },
    ];
    try {
      const response = await api.get('/payments');
      const backendCalls = response.data.map(mapPaymentToCall);
      // Combinamos las llamadas reales del backend con las mockeadas
      // para asegurar que siempre haya llamadas finalizadas con las que probar el reproductor.
      return [...backendCalls, ...mockExtensions];
    } catch (error) {
      console.warn('Backend not available, using mock data for all calls');
      return mockExtensions;
    }
  },
  downloadPdfReport: async (userId?: number, status?: string, startDate?: string, endDate?: string): Promise<void> => {
    try {
      const response = await api.get('/payments/reports/export/pdf', {
        params: { userId, status, startDate, endDate },
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `reporte-voicepay-${new Date().toISOString().slice(0, 19).replace(/[-T:]/g, "")}.pdf`;
      link.click();
    } catch (error) {
      console.error('Error downloading PDF report:', error);
      throw error;
    }
  },
  downloadExcelReport: async (userId?: number, status?: string, startDate?: string, endDate?: string): Promise<void> => {
    try {
      const response = await api.get('/payments/reports/export/excel', {
        params: { userId, status, startDate, endDate },
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `reporte-voicepay-${new Date().toISOString().slice(0, 19).replace(/[-T:]/g, "")}.xlsx`;
      link.click();
    } catch (error) {
      console.error('Error downloading Excel report:', error);
      throw error;
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
        : c.status === 'TRANSFERRED' ? 'in-progress' // O podrías añadir un estado 'transferred'
        : 'in-progress',
  amount: Number(c.callAmount) || 0,
  duration: c.timestamp
    ? `${Math.floor((Date.now() - new Date(c.timestamp).getTime()) / 60000)}m ${Math.floor(((Date.now() - new Date(c.timestamp).getTime()) % 60000) / 1000)}s`
    : '-',
  timestamp: c.timestamp ? new Date(c.timestamp).toLocaleTimeString() : '-',
  callEvents: c.callEvents || [],
  selectedOption: c.selectedOption || null
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
  },
  getFlow: async (): Promise<{ nodes: any[], edges: any[] } | null> => {
    try {
      const response = await api.get('/ivr/flow');
      if (response.data && response.data.flowJson) {
        return JSON.parse(response.data.flowJson);
      }
      return null;
    } catch (error) {
      console.warn('Backend IVR flow not available or error occurred', error);
      return null;
    }
  },
  saveFlow: async (flowData: { nodes: any[], edges: any[] }): Promise<any> => {
    try {
      const payload = {
        flowJson: JSON.stringify(flowData)
      };
      const response = await api.post('/ivr/flow', payload);
      return response.data;
    } catch (error) {
      console.error('Error saving IVR flow to backend:', error);
      throw error;
    }
  },
  transferToPaymentIvr: async (callId: string): Promise<unknown> => {
    try {
      const response = await api.post('/ivr/calls/transfer-back', { callId });
      return response.data;
    } catch (error) {
      console.warn('Backend not available, simulating transfer back to IVR locally');
      return { success: true };
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
      const response = await api.get('/notifications');
      // Mapeamos los campos del backend (createdAt) a los del frontend (timestamp)
      return response.data.map((n: any) => ({
        ...n,
        id: String(n.id),
        timestamp: n.createdAt ? new Date(n.createdAt).toLocaleString() : '-'
      }));
    } catch (error) {
      console.warn('Backend notifications not available, using mock data');
      return MOCK_NOTIFICATIONS;
    }
  }
};

// --- Auth Service ---
export const authService = {
  login: async (email: string, password: string):Promise<{token: string, refreshToken?: string}> => {
    try {
      const response = await api.post('/auth/login', { email, password });
      return response.data;
    } catch (error: any) {
      console.error('Login failed:', error);
      throw new Error(error.response?.data?.message || 'Invalid credentials or backend unavailable', { cause: error });
    }
  },
  logout: () => {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('refresh_token');
  }
};

export default api;
