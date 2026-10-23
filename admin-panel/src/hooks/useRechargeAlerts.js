import { useCallback, useEffect, useState } from 'react'
import { getRecharges } from '../api/recharge'

const SEEN_KEY = 'admin_recharge_alert_seen'
const READY_KEY = 'admin_recharge_alert_ready'
const POLL_MS = 15000
const MAX_STORED_SEEN = 200

const seenIds = new Set(readSeenIds())
let alertsReady = localStorage.getItem(READY_KEY) === '1'
let activeRefresh = null

function readSeenIds() {
  try {
    const stored = JSON.parse(localStorage.getItem(SEEN_KEY) || '[]')
    return Array.isArray(stored) ? stored.filter((id) => typeof id === 'string') : []
  } catch (error) {
    console.error('Unable to read stored recharge alerts.', error)
    return []
  }
}

function persistSeen(pendingIds) {
  const stillPending = [...seenIds].filter((id) => pendingIds.has(id))
  const older = [...seenIds].filter((id) => !pendingIds.has(id)).slice(-MAX_STORED_SEEN)
  const next = [...stillPending, ...older]
  seenIds.clear()
  next.forEach((id) => seenIds.add(id))
  localStorage.setItem(SEEN_KEY, JSON.stringify(next))
  localStorage.setItem(READY_KEY, '1')
  alertsReady = true
}

function takeUnseen(pending) {
  const pendingIds = new Set(pending.map((request) => request.id))

  if (!alertsReady) {
    pending.forEach((request) => seenIds.add(request.id))
    persistSeen(pendingIds)
    return []
  }

  const unseen = pending.filter((request) => !seenIds.has(request.id))
  unseen.forEach((request) => seenIds.add(request.id))
  if (unseen.length > 0) persistSeen(pendingIds)
  return unseen
}

function showBrowserNotifications(requests) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return

  const openRecharges = () => {
    window.focus()
    window.dispatchEvent(new Event('open-recharge-requests'))
  }

  requests.slice(0, 3).forEach((request) => {
    const name = request.userName || request.userEmail || 'A user'
    const notification = new Notification('New recharge request', {
      body: `${name} requested ₹${request.amount}`,
      tag: `recharge-${request.id}`,
    })
    notification.onclick = () => {
      openRecharges()
      notification.close()
    }
  })

  const extra = requests.length - 3
  if (extra > 0) {
    const notification = new Notification('New recharge requests', {
      body: `${extra} more recharge ${extra === 1 ? 'request is' : 'requests are'} waiting.`,
      tag: 'recharge-extra',
    })
    notification.onclick = () => {
      openRecharges()
      notification.close()
    }
  }
}

async function refreshRecharges() {
  if (activeRefresh) return activeRefresh

  activeRefresh = getRecharges()
    .then((result) => {
      if (!Array.isArray(result)) return []
      const pending = result.filter((request) => request.status === 'pending')
      const unseen = takeUnseen(pending)
      if (unseen.length > 0) {
        showBrowserNotifications(unseen)
        window.dispatchEvent(new Event('recharges-updated'))
      }
      return pending
    })
    .catch((error) => {
      console.error('Unable to check for new recharge requests.', error)
      return null
    })
    .finally(() => {
      activeRefresh = null
    })

  return activeRefresh
}

function readPermission() {
  if (typeof Notification === 'undefined') return 'unsupported'
  return Notification.permission
}

export function useRechargeAlerts(enabled) {
  const [pending, setPending] = useState([])
  const [permission, setPermission] = useState(readPermission)

  const refresh = useCallback(async () => {
    const nextPending = await refreshRecharges()
    if (nextPending) setPending(nextPending)
  }, [])

  const enableAlerts = useCallback(async () => {
    if (typeof Notification === 'undefined') return 'unsupported'
    const nextPermission = await Notification.requestPermission()
    setPermission(nextPermission)
    return nextPermission
  }, [])

  useEffect(() => {
    if (!enabled) return undefined

    const timeoutId = window.setTimeout(refresh, 0)
    const intervalId = window.setInterval(refresh, POLL_MS)
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh()
    }

    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearTimeout(timeoutId)
      window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [enabled, refresh])

  useEffect(() => {
    const baseTitle = 'Admin Panel'
    document.title = pending.length > 0 ? `(${pending.length}) ${baseTitle}` : baseTitle
    return () => {
      document.title = baseTitle
    }
  }, [pending.length])

  return { pending, permission, enableAlerts, refresh }
}
