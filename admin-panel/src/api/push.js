import { apiRequest } from './client'

export const getPushPublicKey = () =>
  apiRequest('/admin/push/public-key', { authenticated: true })

export const savePushSubscription = (subscription) =>
  apiRequest('/admin/push/subscribe', {
    method: 'POST',
    authenticated: true,
    body: subscription,
  })

export const removePushSubscription = (endpoint) =>
  apiRequest('/admin/push/unsubscribe', {
    method: 'POST',
    authenticated: true,
    body: { endpoint },
  })
