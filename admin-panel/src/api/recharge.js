import { API_ORIGIN, apiRequest } from './client'

export const screenshotUrl = (path) =>
  path.startsWith('http') ? path : `${API_ORIGIN}${path}`

export const getRecharges = () =>
  apiRequest('/recharges', { authenticated: true })

export const acceptRecharge = (id) =>
  apiRequest(`/recharges/${id}/accept`, { method: 'POST', authenticated: true })

export const rejectRecharge = (id) =>
  apiRequest(`/recharges/${id}/reject`, { method: 'POST', authenticated: true })
