import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import DashboardLayout from './layouts/DashboardLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Markets from './pages/Markets'
import Recharge from './pages/Recharge'
import Withdrawals from './pages/Withdrawals'
import Users from './pages/Users'
import Settings from './pages/Settings'
import AdminOnlyRoute from './routes/AdminOnlyRoute'
import ProtectedRoute from './routes/ProtectedRoute'
import PublicRoute from './routes/PublicRoute'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<Login />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="settings" element={<Settings />} />
              <Route element={<AdminOnlyRoute />}>
                <Route path="markets" element={<Markets />} />
                <Route path="users" element={<Users />} />
                <Route path="recharge" element={<Recharge />} />
                <Route path="withdrawals" element={<Withdrawals />} />
              </Route>
            </Route>
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
