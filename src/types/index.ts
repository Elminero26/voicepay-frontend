export interface User {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  role: 'admin' | 'user';
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface Call {
  id: string;
  customerName: string;
  phoneNumber: string;
  status: 'COMPLETED' | 'FAILED' | 'WAITING_CONFIRMATION' | 'PROCESSING_PAYMENT' | 'CONNECTED' | 'completed' | 'failed' | 'in-progress';
  amount: number;
  timestamp: string;
  duration?: string;
  selectedOption?: string;
  direction?: string;
  option?: string; // Adding this as I saw it used in Dashboard.tsx
  callEvents?: string[];
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
  phoneNumber: string;
  role: string;
}

export interface Notification {
  id: string;
  recipient: string;
  type: 'SMS' | 'EMAIL' | 'PUSH';
  status: 'SENT' | 'FAILED' | 'PENDING';
  message: string;
  timestamp: string;
}


