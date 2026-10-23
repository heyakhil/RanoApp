import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { useRechargeAlerts } from '../hooks/useRechargeAlerts'

function formatAmount(amount) {
  return `₹${amount}`
}

export default function RechargeAlertBell() {
  const navigate = useNavigate()
  const { pending, permission, enableAlerts } = useRechargeAlerts(true)
  const [isOpen, setIsOpen] = useState(false)
  const rootRef = useRef(null)
  const preview = pending.slice(0, 5)

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (!rootRef.current?.contains(event.target)) setIsOpen(false)
    }

    document.addEventListener('mousedown', closeOnOutsideClick)
    return () => document.removeEventListener('mousedown', closeOnOutsideClick)
  }, [])

  useEffect(() => {
    const openRecharges = () => {
      setIsOpen(false)
      navigate('/dashboard/recharge')
    }

    window.addEventListener('open-recharge-requests', openRecharges)
    return () => window.removeEventListener('open-recharge-requests', openRecharges)
  }, [navigate])

  const openRechargePage = () => {
    setIsOpen(false)
    navigate('/dashboard/recharge')
  }

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        className="relative rounded-lg p-2 text-gray-600 hover:bg-gray-100"
        aria-label={
          pending.length > 0
            ? `${pending.length} pending recharge requests`
            : 'Recharge notifications'
        }
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        <Bell className="h-5 w-5" />
        {pending.length > 0 ? (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
            {pending.length > 9 ? '9+' : pending.length}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="absolute right-0 z-30 mt-2 w-80 rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="border-b border-gray-100 px-4 py-3">
            <p className="text-sm font-semibold text-gray-900">Recharge requests</p>
            <p className="text-xs text-gray-500">
              {pending.length === 0
                ? 'No pending requests'
                : `${pending.length} waiting for review`}
            </p>
          </div>

          {permission === 'default' ? (
            <div className="border-b border-gray-100 px-4 py-3">
              <button
                type="button"
                className="w-full rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                onClick={enableAlerts}
              >
                Turn on browser alerts
              </button>
            </div>
          ) : null}

          {permission === 'denied' ? (
            <p className="border-b border-gray-100 px-4 py-3 text-xs text-gray-500">
              Browser alerts are blocked. Allow notifications for this site in the browser
              settings to get a popup when a recharge is requested.
            </p>
          ) : null}

          {permission === 'unsupported' ? (
            <p className="border-b border-gray-100 px-4 py-3 text-xs text-gray-500">
              This browser does not support notifications. Pending requests still appear here.
            </p>
          ) : null}

          {preview.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-gray-500">You are all caught up.</p>
          ) : (
            <ul>
              {preview.map((request) => (
                <li key={request.id}>
                  <button
                    type="button"
                    className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left hover:bg-gray-50"
                    onClick={openRechargePage}
                  >
                    <span>
                      <span className="block text-sm font-medium text-gray-900">
                        {request.userName || 'Unnamed user'}
                      </span>
                      <span className="block text-xs text-gray-500">
                        {request.userEmail || 'New recharge request'}
                      </span>
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatAmount(request.amount)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <button
            type="button"
            className="w-full border-t border-gray-100 px-4 py-3 text-sm font-medium text-indigo-600 hover:bg-gray-50"
            onClick={openRechargePage}
          >
            Review recharges
          </button>
        </div>
      ) : null}
    </div>
  )
}
