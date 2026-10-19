import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AdminOnlyRoute() {
  const { isSubadmin } = useAuth()

  if (isSubadmin) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
