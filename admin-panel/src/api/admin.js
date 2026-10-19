import { apiRequest } from './client'

export const changeAdminPassword = (currentPassword, newPassword) =>
  apiRequest('/admin/change-password', {
    method: 'POST',
    body: { currentPassword, newPassword },
    authenticated: true,
  })
