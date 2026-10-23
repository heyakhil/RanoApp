import { useCallback, useEffect, useState } from 'react'
import {
  canUsePush,
  hasAdminPushSubscription,
  subscribeToAdminPush,
  unsubscribeFromAdminPush,
} from '../services/pushAlerts'

function readPermission() {
  if (typeof Notification === 'undefined') return 'unsupported'
  return Notification.permission
}

export function useRechargeAlerts() {
  const [permission, setPermission] = useState(readPermission)
  const [enabled, setEnabled] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    let cancelled = false

    hasAdminPushSubscription()
      .then((active) => {
        if (!cancelled) setEnabled(active)
      })
      .catch((error) => {
        console.error('Unable to read the recharge push subscription.', error)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const enableAlerts = useCallback(async () => {
    if (!canUsePush()) {
      setPermission(typeof Notification === 'undefined' ? 'unsupported' : Notification.permission)
      return
    }

    setIsUpdating(true)
    try {
      const nextPermission = await Notification.requestPermission()
      setPermission(nextPermission)
      if (nextPermission !== 'granted') return
      setEnabled(await subscribeToAdminPush())
    } catch (error) {
      console.error('Unable to turn on recharge push alerts.', error)
      setEnabled(false)
    } finally {
      setIsUpdating(false)
    }
  }, [])

  const disableAlerts = useCallback(async () => {
    setIsUpdating(true)
    try {
      await unsubscribeFromAdminPush()
      setEnabled(false)
    } catch (error) {
      console.error('Unable to turn off recharge push alerts.', error)
    } finally {
      setIsUpdating(false)
    }
  }, [])

  return { permission, enabled, isUpdating, enableAlerts, disableAlerts }
}
