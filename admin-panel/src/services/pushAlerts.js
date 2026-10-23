import { getPushPublicKey, removePushSubscription, savePushSubscription } from '../api/push'

const SERVICE_WORKER_URL = '/push-sw.js'

export function canUsePush() {
  return (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window
  )
}

function urlBase64ToUint8Array(value) {
  const padding = '='.repeat((4 - (value.length % 4)) % 4)
  const base64 = `${value}${padding}`.replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(base64)
  const bytes = new Uint8Array(raw.length)

  for (let index = 0; index < raw.length; index += 1) {
    bytes[index] = raw.charCodeAt(index)
  }

  return bytes
}

function usesServerKey(subscription, publicKey) {
  const currentKey = subscription.options?.applicationServerKey
  if (!currentKey) return false

  const currentBytes = new Uint8Array(currentKey)
  const nextBytes = urlBase64ToUint8Array(publicKey)
  if (currentBytes.length !== nextBytes.length) return false
  return currentBytes.every((byte, index) => byte === nextBytes[index])
}

export async function hasAdminPushSubscription() {
  if (!('serviceWorker' in navigator)) return false

  const registration = await navigator.serviceWorker.getRegistration()
  const subscription = await registration?.pushManager.getSubscription()
  return Boolean(subscription)
}

export async function subscribeToAdminPush() {
  if (!canUsePush() || Notification.permission !== 'granted') return false

  const { publicKey } = await getPushPublicKey()
  if (!publicKey) return false

  const registration = await navigator.serviceWorker.register(SERVICE_WORKER_URL)
  await navigator.serviceWorker.ready

  let subscription = await registration.pushManager.getSubscription()
  if (subscription && !usesServerKey(subscription, publicKey)) {
    await subscription.unsubscribe()
    subscription = null
  }

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    })
  }

  const serialized = subscription.toJSON()
  if (!serialized.endpoint || !serialized.keys?.p256dh || !serialized.keys?.auth) return false

  await savePushSubscription({
    endpoint: serialized.endpoint,
    keys: {
      p256dh: serialized.keys.p256dh,
      auth: serialized.keys.auth,
    },
  })

  return true
}

export async function unsubscribeFromAdminPush() {
  if (!('serviceWorker' in navigator)) return

  const registration = await navigator.serviceWorker.getRegistration()
  const subscription = await registration?.pushManager.getSubscription()
  if (!subscription) return

  try {
    await removePushSubscription(subscription.endpoint)
  } catch (error) {
    console.error('Unable to remove the admin push subscription from the server.', error)
  }

  await subscription.unsubscribe()
}
