

const DEFAULT_API_BASE_URL = import.meta.env.PROD
  ? 'https://api.ranoapps.com/api/v1'
  : `${window.location.protocol}//${window.location.hostname}:4000/api/v1`

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL
).replace(/\/$/, '')

export const API_ORIGIN = API_BASE_URL.replace(/\/api\/v1\/?$/, '')

function getAccessToken() {
  const storedAuth = localStorage.getItem('admin_panel_auth')
  if (!storedAuth) return null

  try {
    return JSON.parse(storedAuth).accessToken || null
  } catch (error) {
    console.error('Unable to read admin API credentials.', error)
    throw new Error('Admin API credentials are invalid. Please sign in again.', {
      cause: error,
    })
  }
}

export async function apiRequest(path, { method = 'GET', body, authenticated = false } = {}) {
  const headers = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  if (authenticated) {
    const token = getAccessToken()
    if (!token) {
      throw new Error('An admin API access token is required. Please sign in again.')
    }
    headers.Authorization = `Bearer ${token}`
  }

  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch (error) {
    console.error('Unable to reach the admin API.', error)
    throw new Error(
      `Cannot reach the API at ${API_BASE_URL} (${error.message}). Check that the backend is running and that this admin page's origin is allowed by the backend.`,
      { cause: error },
    )
  }

  let payload
  try {
    payload = await response.json()
  } catch (error) {
    console.error('Admin API returned an invalid response.', error)
    throw new Error('The admin API returned an invalid response.', { cause: error })
  }

  if (!response.ok || !payload.success) {
    throw new Error(payload.message || `Admin API request failed (${response.status}).`)
  }

  return payload.data
}
