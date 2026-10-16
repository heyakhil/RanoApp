import { API_BASE_URL, apiRequest } from './client'

function getAccessToken() {
  const storedAuth = localStorage.getItem('admin_panel_auth')
  if (!storedAuth) return null

  try {
    return JSON.parse(storedAuth).accessToken || null
  } catch {
    return null
  }
}

export const getMarkets = () => apiRequest('/markets')

export const loginAdmin = (username, password) =>
  apiRequest('/admin/login', {
    method: 'POST',
    body: { username, password },
  })

export const createMarket = (market) =>
  apiRequest('/markets', { method: 'POST', body: market, authenticated: true })

export const updateMarket = (id, market) =>
  apiRequest(`/markets/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: market,
    authenticated: true,
  })

export async function uploadMarketImage(id, imageFile) {
  const token = getAccessToken()
  if (!token) {
    throw new Error('An admin API access token is required. Please sign in again.')
  }

  const body = new FormData()
  body.append('image', imageFile)

  let response
  try {
    response = await fetch(`${API_BASE_URL}/markets/${encodeURIComponent(id)}/image`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body,
    })
  } catch (error) {
    throw new Error(`Cannot reach the API at ${API_BASE_URL}. Check that the backend is running.`, {
      cause: error,
    })
  }

  let payload
  try {
    payload = await response.json()
  } catch (error) {
    throw new Error('The admin API returned an invalid response.', { cause: error })
  }

  if (!response.ok || !payload.success) {
    throw new Error(payload.message || `Admin API request failed (${response.status}).`)
  }

  return payload.data
}

export const deleteMarket = (id) =>
  apiRequest(`/markets/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    authenticated: true,
  })

export const getOverview = () => apiRequest('/admin/overview', { authenticated: true })

export const declareMarketResult = (id, result) =>
  apiRequest(`/markets/${encodeURIComponent(id)}/result`, {
    method: 'POST',
    body: { result },
    authenticated: true,
  })
