export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface Call {
  id: string;
  customerName: string;
  phoneNumber: string;
  status: 'completed' | 'failed' | 'in-progress';
  amount: number;
  duration: string;
  timestamp: string;
}

export interface PaymentStats {
  totalCalls: number;
  successfulPayments: number;
  failedPayments: number;
  conversionRate: number;
  totalRevenue: number;
  chartData: {
    name: string;
    completed: number;
    failed: number;
  }[];
}

export interface CreateUserDTO {
  name: string;
  email: string;
  role: string;
}

export {};
