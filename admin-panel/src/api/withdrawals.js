import { apiRequest } from './client'

export const getWithdrawals = () =>
  apiRequest('/withdrawals', { authenticated: true })

export const acceptWithdrawal = (id) =>
  apiRequest(`/withdrawals/${encodeURIComponent(id)}/accept`, {
    method: 'POST',
    authenticated: true,
  })

export const rejectWithdrawal = (id) =>
  apiRequest(`/withdrawals/${encodeURIComponent(id)}/reject`, {
    method: 'POST',
    authenticated: true,
  })
