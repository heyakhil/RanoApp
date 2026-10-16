import { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Badge,
  Button,
  Card,
  Pagination,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from 'flowbite-react'
import { RefreshCw, Users as UsersIcon } from 'lucide-react'
import { getUsers } from '../api/users'

const PAGE_SIZE = 10

function formatDate(value) {
  if (!value) return '—'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'

  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

export default function Users() {
  const [users, setUsers] = useState([])
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  const loadPage = useCallback(async (page, signal) => {
    setIsLoading(true)
    setError('')

    try {
      const result = await getUsers(page, PAGE_SIZE)
      if (signal.cancelled) return

      if (!Array.isArray(result.users) || !result.pagination) {
        throw new Error('The users API returned an invalid response.')
      }
      setUsers(result.users)
      setPagination(result.pagination)
    } catch (loadError) {
      if (!signal.cancelled) {
        setError(loadError.message || 'Unable to load users.')
      }
    } finally {
      if (!signal.cancelled) setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const signal = { cancelled: false }
    const timeoutId = window.setTimeout(
      () => loadPage(pagination.page, signal),
      0,
    )

    return () => {
      signal.cancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [loadPage, pagination.page, refreshKey])

  const changePage = (page) => {
    if (page !== pagination.page) {
      setPagination((current) => ({ ...current, page }))
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Users</h1>
          <p className="mt-1 text-sm text-gray-500">
            Registered accounts and their profile information.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge color="info" className="w-fit">
            {pagination.total} total users
          </Badge>
          <Button
            color="light"
            size="sm"
            onClick={() => setRefreshKey((key) => key + 1)}
            disabled={isLoading}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {error ? (
        <Alert
          color="failure"
          onDismiss={() => setError('')}
          additionalContent={
            <Button
              color="failure"
              size="xs"
              onClick={() => setRefreshKey((key) => key + 1)}
            >
              Try again
            </Button>
          }
        >
          {error}
        </Alert>
      ) : null}

      <Card className="overflow-hidden border border-gray-100 p-0 shadow-sm">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner size="xl" />
          </div>
        ) : users.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <Table striped hoverable>
                <TableHead>
                  <TableRow>
                    <TableHeadCell>Name</TableHeadCell>
                    <TableHeadCell>Email</TableHeadCell>
                    <TableHeadCell>Mobile</TableHeadCell>
                    <TableHeadCell>Gender</TableHeadCell>
                    <TableHeadCell>Profile</TableHeadCell>
                    <TableHeadCell>Joined</TableHeadCell>
                  </TableRow>
                </TableHead>
                <TableBody className="divide-y">
                  {users.map((user) => (
                    <TableRow key={user.id} className="bg-white">
                      <TableCell className="whitespace-nowrap font-medium text-gray-900">
                        {user.name || '—'}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.mobile || '—'}</TableCell>
                      <TableCell className="capitalize">
                        {user.gender?.replaceAll('_', ' ') || '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Badge color={user.isProfileComplete ? 'success' : 'gray'}>
                            {user.isProfileComplete ? 'Complete' : 'Incomplete'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(user.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-200 px-4 py-4 sm:flex-row">
              <p className="text-sm text-gray-500">
                Showing {(pagination.page - 1) * pagination.pageSize + 1}–
                {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{' '}
                {pagination.total}
              </p>
              <Pagination
                layout="pagination"
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={changePage}
                showIcons
                previousLabel="Previous"
                nextLabel="Next"
              />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center py-16 text-center">
            <UsersIcon className="h-10 w-10 text-gray-400" />
            <h2 className="mt-3 text-base font-semibold text-gray-900">No users yet</h2>
            <p className="mt-1 text-sm text-gray-500">
              Registered users will appear here.
            </p>
          </div>
        )}
      </Card>
    </div>
  )
}
