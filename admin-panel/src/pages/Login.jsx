import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Alert, Button, Card, Label, TextInput } from 'flowbite-react'
import { LockKeyhole, UserRound, ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login, isLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const from = location.state?.from?.pathname || '/dashboard'

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!username.trim() || !password) {
      setError('Please enter both username and password.')
      return
    }

    const result = await login(username, password)

    if (result.success) {
      navigate(from, { replace: true })
      return
    }

    setError(result.message || 'Login failed. Please try again.')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-indigo-50 to-white px-4 py-10">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm lg:grid-cols-2">
        <div className="hidden flex-col justify-between bg-indigo-600 p-10 text-white lg:flex">
          <div>
            <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm">
              <ShieldCheck className="h-4 w-4" />
              Secure Admin Access
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">Welcome back</h1>
            <p className="mt-3 max-w-sm text-indigo-100">
              Sign in to manage markets and keep your workspace running smoothly.
            </p>
          </div>

          <p className="text-sm text-indigo-100">
            Use the administrator credentials configured for the backend.
          </p>
        </div>

        <Card className="border-0 shadow-none">
          <div className="mb-2">
            <h2 className="text-2xl font-semibold text-gray-900">Sign in</h2>
            <p className="mt-1 text-sm text-gray-500">Use your admin credentials to continue</p>
          </div>

          {error ? (
            <Alert color="failure" className="mb-2">
              {error}
            </Alert>
          ) : null}

          <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
            <div>
              <div className="mb-2 block">
                <Label htmlFor="username">Username</Label>
              </div>
              <TextInput
                id="username"
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                icon={UserRound}
                autoComplete="username"
                required
              />
            </div>

            <div>
              <div className="mb-2 block">
                <Label htmlFor="password">Password</Label>
              </div>
              <TextInput
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                icon={LockKeyhole}
                autoComplete="current-password"
                required
              />
            </div>

            <Button type="submit" color="blue" disabled={isLoading} className="mt-2">
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-gray-500 lg:hidden">
            Use the administrator credentials configured for the backend.
          </p>
        </Card>
      </div>
    </div>
  )
}
