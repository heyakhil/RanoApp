import { useCallback, useEffect, useState } from 'react'
import { Alert, Badge, Button, Card, Modal, ModalBody, ModalFooter, ModalHeader, Spinner } from 'flowbite-react'
import { Users, DollarSign, Percent, RefreshCw } from 'lucide-react'
import { getOverview, settleCommission } from '../api/markets'
import { useAuth } from '../context/AuthContext'

function formatRupees(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0)
}

export default function Dashboard() {
  const { isSubadmin } = useAuth()
  const [overview, setOverview] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isSettlementOpen, setIsSettlementOpen] = useState(false)
  const [isSettling, setIsSettling] = useState(false)
  const [settlementError, setSettlementError] = useState('')
  const [settlementMessage, setSettlementMessage] = useState('')

  const loadOverview = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      setOverview(await getOverview())
    } catch (loadError) {
      setError(loadError.message || 'Unable to load the market overview.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const confirmSettlement = async () => {
    setIsSettling(true)
    setSettlementError('')

    try {
      const settled = await settleCommission()
      setOverview((current) =>
        current
          ? {
              ...current,
              commission: {
                ...current.commission,
                total: 0,
                adminShare: 0,
                subadminShare: 0,
              },
            }
          : current,
      )
      setIsSettlementOpen(false)
      setSettlementMessage(
        `Settled ${formatRupees(settled.adminShare)} for admin and ${formatRupees(settled.subadminShare)} for subadmin. Both balances have been reset to zero.`,
      )
    } catch (settleError) {
      setSettlementError(settleError.message || 'Unable to settle commission balances.')
    } finally {
      setIsSettling(false)
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(loadOverview, 0)
    return () => window.clearTimeout(timeoutId)
  }, [loadOverview])

  const stats = overview
    ? [
        {
          label: 'Bets placed',
          value: String(overview.current.totalBets),
          detail: 'Current open rounds',
          icon: Users,
          tone: 'bg-indigo-50 text-indigo-600',
        },
        {
          label: 'Total bet amount',
          value: formatRupees(overview.current.totalBetAmount),
          detail: 'Collected in open rounds',
          icon: DollarSign,
          tone: 'bg-emerald-50 text-emerald-600',
        },
        {
          label: 'Commission collected',
          value: formatRupees(overview.commission.total),
          detail: `${overview.commissionPercent}% of each bet`,
          icon: Percent,
          tone: 'bg-amber-50 text-amber-600',
        },
        {
          label: 'Admin / subadmin',
          value: `${formatRupees(overview.commission.adminShare)} / ${formatRupees(overview.commission.subadminShare)}`,
          detail: 'Equal split of commission',
          icon: Percent,
          tone: 'bg-sky-50 text-sky-600',
          action: true,
        },
      ]
    : []

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Overview</h1>
          <p className="mt-1 text-sm text-gray-500">
            Joined users and bet totals for each open market round.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge color="info" className="w-fit">
            Live rounds
          </Badge>
          <Button color="light" size="sm" onClick={loadOverview} disabled={isLoading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {error ? (
        <Alert color="failure" onDismiss={() => setError('')}>
          {error}
        </Alert>
      ) : null}

      {settlementMessage ? (
        <Alert color="success" onDismiss={() => setSettlementMessage('')}>
          {settlementMessage}
        </Alert>
      ) : null}

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner size="xl" />
        </div>
      ) : overview ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon
              const content = (
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-gray-500">{stat.label}</p>
                    <p className="mt-2 text-2xl font-semibold text-gray-900">{stat.value}</p>
                    <p className="mt-2 text-xs text-gray-500">{stat.detail}</p>
                  </div>
                  <div className={`rounded-xl p-2.5 ${stat.tone}`}>
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                </div>
              )

              return (
                <Card key={stat.label} className="border border-gray-100 shadow-sm">
                  {stat.action ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSettlementError('')
                        setIsSettlementOpen(true)
                      }}
                      className="w-full rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                      aria-label="View admin and subadmin commission balances"
                    >
                      {content}
                    </button>
                  ) : content}
                </Card>
              )
            })}
          </div>

          <Modal
            show={isSettlementOpen}
            onClose={() => {
              if (!isSettling) setIsSettlementOpen(false)
            }}
            size="md"
          >
            <ModalHeader>Commission settlement</ModalHeader>
            <ModalBody>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Review the commission amounts to settle. After payout, these accrued
                  balances will reset to zero and new commission will accumulate again.
                </p>
                <div className="space-y-3 rounded-lg bg-gray-50 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-gray-600">Admin take-home</span>
                    <span className="font-semibold text-gray-900">
                      {formatRupees(overview.commission.adminShare)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-gray-600">Subadmin take-home</span>
                    <span className="font-semibold text-gray-900">
                      {formatRupees(overview.commission.subadminShare)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4 border-t border-gray-200 pt-3">
                    <span className="text-sm font-medium text-gray-700">Total to settle</span>
                    <span className="font-semibold text-gray-900">
                      {formatRupees(overview.commission.total)}
                    </span>
                  </div>
                </div>
                {settlementError ? (
                  <Alert color="failure">{settlementError}</Alert>
                ) : null}
                {isSubadmin ? (
                  <p className="text-sm text-gray-500">
                    Only an administrator can settle commission balances.
                  </p>
                ) : (
                  <p className="text-sm text-amber-700">
                    Confirm only after these amounts have been paid out. This action resets
                    the accrued balances.
                  </p>
                )}
              </div>
            </ModalBody>
            <ModalFooter>
              <Button
                color="light"
                onClick={() => setIsSettlementOpen(false)}
                disabled={isSettling}
              >
                Cancel
              </Button>
              {!isSubadmin ? (
                <Button color="blue" onClick={confirmSettlement} disabled={isSettling}>
                  {isSettling ? 'Settling...' : 'Settle commission'}
                </Button>
              ) : null}
            </ModalFooter>
          </Modal>

          <Card className="border border-gray-100 shadow-sm">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Markets</h2>
              <p className="text-sm text-gray-500">
                Commission is credited on every bet, then split equally between the
                admin and subadmin balances.
              </p>
            </div>

            {overview.markets.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="border-b border-gray-100 text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-2 py-3 font-medium">Market</th>
                      <th className="px-2 py-3 font-medium">Round</th>
                      <th className="px-2 py-3 font-medium">Bets placed</th>
                      <th className="px-2 py-3 font-medium">Total bet</th>
                      <th className="px-2 py-3 font-medium">Last result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overview.markets.map((market) => (
                      <tr key={market.id} className="border-b border-gray-50">
                        <td className="px-2 py-3">
                          <p className="font-medium text-gray-900">{market.name}</p>
                          <p className="text-xs text-gray-500">{market.symbol}</p>
                        </td>
                        <td className="px-2 py-3 text-gray-700">{market.currentRound}</td>
                        <td className="px-2 py-3 text-gray-700">
                          {market.participants} / {market.maxParticipants}
                        </td>
                        <td className="px-2 py-3 font-medium text-gray-900">
                          {formatRupees(market.totalBetAmount)}
                        </td>
                        <td className="px-2 py-3 text-gray-700">
                          {market.lastResult || 'Not declared'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-600">No markets have been created yet.</p>
            )}
          </Card>
        </>
      ) : null}
    </div>
  )
}
