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

export const getPaymentDestination = () =>
  apiRequest('/payments/destination', { authenticated: true })

export async function savePaymentDestination(upiId, qrFile) {
  const token = getAccessToken()
  if (!token) {
    throw new Error('An admin API access token is required. Please sign in again.')
  }

  const body = new FormData()
  body.append('upiId', upiId)
  if (qrFile) {
    body.append('qr', qrFile)
  }

  let response
  try {
    response = await fetch(`${API_BASE_URL}/payments/destination`, {
      method: 'PUT',
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
