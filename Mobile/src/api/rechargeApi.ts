import { apiClient } from './client';
import type { PaginatedData } from '../types';

export interface WalletBalance {
  balance: string;
}

export interface PaymentProof {
  uri: string;
  name: string;
  type: string;
}

export interface RechargePayload {
  amount: string;
  referenceId: string;
  screenshot: PaymentProof;
}

export type TransactionStatus = 'pending' | 'accepted' | 'rejected';
export type TransactionType = 'credit' | 'debit';

export interface WalletTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  description: string;
  reference: string;
  createdAt: string;
}

const TRANSACTION_PAGE_SIZE = 20;

export async function fetchTransactions(
  page: number,
): Promise<PaginatedData<WalletTransaction>> {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(TRANSACTION_PAGE_SIZE),
  });
  const response = await apiClient.get<PaginatedData<WalletTransaction>>(
    `/transactions?${params.toString()}`,
  );

  if (!response.success || !response.data) {
    throw new Error(response.message || 'Could not load transactions');
  }

  return response.data;
}

export interface PaymentDestination {
  upiId: string;
  qrImageUrl: string;
}

export async function fetchPaymentDestination(): Promise<PaymentDestination> {
  const response = await apiClient.get<PaymentDestination>(
    '/payments/destination',
  );

  if (!response.success || !response.data) {
    throw new Error(response.message || 'Could not load payment details');
  }

  return response.data;
}

export async function fetchWallet(): Promise<WalletBalance> {
  const response = await apiClient.get<WalletBalance>('/recharges/wallet');

  if (!response.success || !response.data) {
    throw new Error(response.message || 'Could not load wallet');
  }

  return response.data;
}

export async function registerDeviceToken(token: string): Promise<void> {
  const response = await apiClient.post<{ registered: boolean }>(
    '/recharges/device-token',
    { token },
  );

  if (!response.success) {
    throw new Error(response.message || 'Could not register this device');
  }
}

export async function submitRecharge(
  payload: RechargePayload,
): Promise<string> {
  const body = new FormData();
  body.append('amount', payload.amount);
  body.append('referenceId', payload.referenceId);
  body.append('screenshot', {
    uri: payload.screenshot.uri,
    name: payload.screenshot.name,
    type: payload.screenshot.type,
  } as unknown as Blob);

  const response = await apiClient.postForm<{ id: string }>('/recharges', body);

  if (!response.success) {
    throw new Error(response.message || 'Could not submit the recharge');
  }

  return response.message?.trim() || 'Recharge request submitted';
}
