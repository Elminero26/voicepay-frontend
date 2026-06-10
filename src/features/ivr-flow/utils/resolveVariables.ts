import type { Call } from '../../../types';

export const resolvePromptVariables = (prompt: string, call: Call | null): string => {
  if (!prompt) return '';

  const customerName = call?.customerName && call.customerName !== 'Unknown Caller' ? call.customerName : 'Carlos';
  const customerPhone = call?.phoneNumber || '+34 600 000 000';
  const paymentAmount = call?.amount !== undefined && call.amount > 0 ? `${call.amount}` : '150';
  const paymentStatus = call?.status || 'pending';
  const paymentCurrency = 'EUR';

  // Date and time
  const now = new Date();
  const currentDate = now.toLocaleDateString();
  const currentTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return prompt
    .replace(/\{\{customer\.name\}\}/g, customerName)
    .replace(/\{\{customer\.phone\}\}/g, customerPhone)
    .replace(/\{\{payment\.amount\}\}/g, paymentAmount)
    .replace(/\{\{payment\.currency\}\}/g, paymentCurrency)
    .replace(/\{\{payment\.status\}\}/g, paymentStatus)
    .replace(/\{\{system\.date\}\}/g, currentDate)
    .replace(/\{\{system\.time\}\}/g, currentTime);
};
