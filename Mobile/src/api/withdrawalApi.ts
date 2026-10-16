import { apiClient } from './client';

export interface UpiAccount {
  id: string;
  upiId: string;
  createdAt: string;
}

export interface CreateWithdrawalPayload {
  amount: number;
  upiAccountId: string;
}

export async function fetchUpiAccounts(): Promise<UpiAccount[]> {
  const response = await apiClient.get<UpiAccount[]>('/withdrawals/upi');
  if (!response.success || !response.data) {
    throw new Error(response.message || 'Could not load saved UPI IDs');
  }
  return response.data;
}

export async function createUpiAccount(upiId: string): Promise<UpiAccount> {
  const response = await apiClient.post<UpiAccount>('/withdrawals/upi', { upiId });
  if (!response.success || !response.data) {
    throw new Error(response.message || 'Could not add this UPI ID');
  }
  return response.data;
}

export async function updateUpiAccount(id: string, upiId: string): Promise<UpiAccount> {
  const response = await apiClient.patch<UpiAccount>(
    `/withdrawals/upi/${encodeURIComponent(id)}`,
    { upiId },
  );
  if (!response.success || !response.data) {
    throw new Error(response.message || 'Could not update this UPI ID');
  }
  return response.data;
}

export async function deleteUpiAccount(id: string): Promise<void> {
  const response = await apiClient.delete<{ deleted: boolean }>(
    `/withdrawals/upi/${encodeURIComponent(id)}`,
  );
  if (!response.success) {
    throw new Error(response.message || 'Could not delete this UPI ID');
  }
}

export async function submitWithdrawal(payload: CreateWithdrawalPayload): Promise<string> {
  const response = await apiClient.post<{ id: string }>('/withdrawals', payload);
  if (!response.success) {
    throw new Error(response.message || 'Could not submit the withdrawal');
  }
  return response.message?.trim() || 'Withdrawal request submitted';
}
