import { useCallback, useEffect, useState } from 'react'
import { Alert, Badge, Button, Card, Spinner } from 'flowbite-react'
import { Users, DollarSign, Percent, RefreshCw } from 'lucide-react'
import { getOverview } from '../api/markets'

function formatRupees(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0)
}

export default function Dashboard() {
  const [overview, setOverview] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

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

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner size="xl" />
        </div>
      ) : overview ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon

              return (
                <Card key={stat.label} className="border border-gray-100 shadow-sm">
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
                </Card>
              )
            })}
          </div>

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
