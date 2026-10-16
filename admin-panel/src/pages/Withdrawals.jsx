import { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Badge,
  Button,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from 'flowbite-react'
import { RefreshCw } from 'lucide-react'
import {
  acceptWithdrawal,
  getWithdrawals,
  rejectWithdrawal,
} from '../api/withdrawals'

function formatWhen(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'

  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

function statusColor(status) {
  if (status === 'accepted') return 'success'
  if (status === 'rejected') return 'failure'
  return 'warning'
}

export default function Withdrawals() {
  const [requests, setRequests] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [reviewingId, setReviewingId] = useState('')
  const [error, setError] = useState('')

  const loadRequests = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const result = await getWithdrawals()
      if (!Array.isArray(result)) {
        throw new Error('The withdrawals API returned an invalid response.')
      }
      setRequests(result)
    } catch (loadError) {
      setError(loadError.message || 'Unable to load withdrawal requests.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(loadRequests, 0)
    return () => window.clearTimeout(timeoutId)
  }, [loadRequests])

  const review = async (id, decision) => {
    setReviewingId(id)
    setError('')
    try {
      if (decision === 'accept') {
        await acceptWithdrawal(id)
      } else {
        await rejectWithdrawal(id)
      }
      await loadRequests()
    } catch (reviewError) {
      setError(reviewError.message || 'Could not update this withdrawal.')
    } finally {
      setReviewingId('')
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Withdrawals</h1>
          <p className="mt-1 text-sm text-gray-500">
            Review withdrawal requests and return funds to the wallet when rejecting.
          </p>
        </div>
        <Button color="light" size="sm" onClick={loadRequests} disabled={isLoading}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {error ? (
        <Alert color="failure" onDismiss={() => setError('')}>
          {error}
        </Alert>
      ) : null}

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeadCell>User</TableHeadCell>
                <TableHeadCell>Amount</TableHeadCell>
                <TableHeadCell>UPI ID</TableHeadCell>
                <TableHeadCell>Status</TableHeadCell>
                <TableHeadCell>Submitted</TableHeadCell>
                <TableHeadCell>Action</TableHeadCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500">
                    No withdrawal requests yet.
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div className="font-medium text-gray-900">
                        {request.userName || 'Unnamed user'}
                      </div>
                      <div className="text-xs text-gray-500">{request.userEmail}</div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap font-semibold">
                      ₹{request.amount}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{request.upiId}</TableCell>
                    <TableCell>
                      <Badge color={statusColor(request.status)} className="w-fit capitalize">
                        {request.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatWhen(request.createdAt)}
                    </TableCell>
                    <TableCell>
                      {request.status === 'pending' ? (
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="xs"
                            color="green"
                            className="whitespace-nowrap"
                            disabled={reviewingId === request.id}
                            onClick={() => review(request.id, 'accept')}
                          >
                            Accept
                          </Button>
                          <Button
                            size="xs"
                            color="red"
                            className="whitespace-nowrap"
                            disabled={reviewingId === request.id}
                            onClick={() => review(request.id, 'reject')}
                          >
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="whitespace-nowrap text-xs text-gray-500">
                          {request.reviewedAt ? formatWhen(request.reviewedAt) : 'Reviewed'}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
