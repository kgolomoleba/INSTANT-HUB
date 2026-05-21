import React, { useState, useRef, useEffect } from 'react'
import './Login.css'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const validateEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()

  const { login, isAuthenticated, loading: authLoading } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fromPath = (location.state as any)?.from || '/dashboard'
  const successMessage = (location.state as any)?.message || null

  const errorRef = useRef<HTMLDivElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (error && errorRef.current) errorRef.current.focus()
  }, [error])

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, navigate])

  if (authLoading) {
    return <div className="loading-text">Checking your session...</div>
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    const trimmedEmail = email.trim()
    const trimmedPassword = password.trim()

    if (!trimmedEmail || !trimmedPassword) {
      setError('Please fill in all fields.')
      return
    }

    if (!validateEmail(trimmedEmail)) {
      setError('Please enter a valid email address.')
      emailRef.current?.focus()
      return
    }

    if (trimmedPassword.length < 6) {
      setError('Password must be at least 6 characters.')
      passwordRef.current?.focus()
      return
    }

    setIsSubmitting(true)

    try {
      await login(trimmedEmail, trimmedPassword)
      navigate(fromPath, { replace: true })
    } catch (loginError: any) {
      const message = loginError?.message || 'Something went wrong. Please try again.'

      if (message.toLowerCase().includes('email not confirmed')) {
        setError('Please verify your email before logging in. Check your inbox for the confirmation link.')
      } else if (
        message.toLowerCase().includes('invalid login') ||
        message.toLowerCase().includes('invalid password')
      ) {
        setError('Incorrect email or password. Please try again.')
      } else {
        setError(message)
      }

      setPassword('')
      passwordRef.current?.focus()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">

        <div className="login-header">
          <h1>Welcome Back</h1>
          <p>Sign in to your Instant Hub account</p>
        </div>

        {successMessage && (
          <div className="login-success">{successMessage}</div>
        )}

        <form onSubmit={handleSubmit} className="login-form" noValidate>
          {error && (
            <div
              className="error-msg"
              tabIndex={-1}
              aria-live="assertive"
              ref={errorRef}
            >
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              disabled={isSubmitting}
              ref={emailRef}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              disabled={isSubmitting}
              minLength={6}
              ref={passwordRef}
            />
          </div>

          <button type="submit" className="btn-login" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="login-footer">
          <p>Don't have an account? <Link to="/register">Join free</Link></p>
        </div>

      </div>
    </div>
  )
}