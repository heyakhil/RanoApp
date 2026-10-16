import { apiRequest } from './client'

export const getUsers = (page, pageSize = 10) =>
  apiRequest(`/admin/users?page=${page}&pageSize=${pageSize}`, {
    authenticated: true,
  })
