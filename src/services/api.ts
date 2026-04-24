import axios from 'axios';
import type { User, Call, PaymentStats, CreateUserDTO } from '../types';

const API_BASE_URL = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Mock Data
const MOCK_USERS: User[] = [
  { id: '1', name: 'John Doe', email: 'john@example.com', role: 'admin', status: 'active', createdAt: '2024-03-20' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'user', status: 'active', createdAt: '2024-03-21' },
  { id: '3', name: 'Robert Johnson', email: 'robert@example.com', role: 'user', status: 'inactive', createdAt: '2024-03-22' },
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

export const userService = {
  getUsers: async (): Promise<User[]> => {
    try {
      const response = await api.get('/users');
      return response.data;
    } catch (error) {
      console.warn('Backend not available, using mock data for users');
      return MOCK_USERS;
    }
  },
  createUser: async (userData: CreateUserDTO): Promise<User> => {
    try {
      const response = await api.post('/users', userData);
      return response.data;
    } catch (error) {
      console.warn('Backend not available, simulating user creation');
      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        ...userData,
        role: userData.role as any,
        status: 'active',
        createdAt: new Date().toISOString().split('T')[0],
      };
      return newUser;
    }
  },
};

export const paymentService = {
  getStats: async (): Promise<PaymentStats> => {
    try {
      const response = await api.get('/payments/stats');
      return response.data;
    } catch (error) {
      console.warn('Backend not available, using mock data for stats');
      return MOCK_STATS;
    }
  },
  getRecentCalls: async (): Promise<Call[]> => {
    try {
      const response = await api.get('/calls/recent');
      return response.data;
    } catch (error) {
      console.warn('Backend not available, using mock data for calls');
      return MOCK_CALLS;
    }
  },
};

export default api;
