import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, BellOff } from 'lucide-react'
import { useRechargeAlerts } from '../hooks/useRechargeAlerts'

export default function RechargeAlertBell() {
  const navigate = useNavigate()
  const { permission, enabled, isUpdating, enableAlerts, disableAlerts } = useRechargeAlerts()

  useEffect(() => {
    const onPushMessage = (event) => {
      if (event.data?.type === 'open-recharge-requests') {
        navigate('/dashboard/recharge')
      }
    }

    navigator.serviceWorker?.addEventListener('message', onPushMessage)
    return () => navigator.serviceWorker?.removeEventListener('message', onPushMessage)
  }, [navigate])

  const blocked = permission === 'denied' || permission === 'unsupported'
  const label = isUpdating
    ? 'Saving recharge notifications'
    : enabled
      ? 'Disable recharge notifications'
      : 'Enable recharge notifications'
  const Icon = enabled ? Bell : BellOff

  return (
    <button
      type="button"
      className={`relative flex h-10 w-10 items-center justify-center rounded-lg disabled:cursor-not-allowed disabled:opacity-60 ${
        enabled
          ? 'bg-indigo-600 text-white hover:bg-indigo-700'
          : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-100'
      }`}
      disabled={isUpdating || blocked}
      aria-pressed={enabled}
      aria-label={label}
      title={
        permission === 'denied'
          ? 'Notifications are blocked. Allow them for this site in the browser settings.'
          : permission === 'unsupported'
            ? 'This browser does not support push notifications.'
            : label
      }
      onClick={() => {
        if (enabled) disableAlerts()
        else enableAlerts()
      }}
    >
      <Icon className="h-5 w-5" />
      {enabled ? (
        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-emerald-300" />
      ) : null}
    </button>
  )
}
