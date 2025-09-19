import React, { useState, useRef, useEffect } from 'react'
import './Login.css'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

const validateEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

export default function Login() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const errorRef = useRef<HTMLDivElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.focus()
    }
  }, [error])

  const focusOnErrorField = () => {
    if (!email.trim() && emailRef.current) {
      emailRef.current.focus()
    } else if (!password.trim() && passwordRef.current) {
      passwordRef.current.focus()
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    const trimmedEmail = email.trim()
    const trimmedPassword = password.trim()

    if (!trimmedEmail || !trimmedPassword) {
      setError('Please fill in all fields.')
      focusOnErrorField()
      return
    }

    if (!validateEmail(trimmedEmail)) {
      setError('Please enter a valid email address.')
      emailRef.current?.focus()
      return
    }

    if (trimmedPassword.length < 6) {
      setError('Password must be at least 6 characters long.')
      passwordRef.current?.focus()
      return
    }

    setIsSubmitting(true)

    try {
      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password: trimmedPassword,
        })

      if (signInError) {
        setError('Login failed: ' + signInError.message)
        setPassword('')
        passwordRef.current?.focus()
      } else if (data?.user) {
        navigate('/dashboard')
      } else {
        setError('Invalid login. Please check your credentials.')
        setPassword('')
        passwordRef.current?.focus()
      }
    } catch (err) {
      console.error(err)
      setError('Something went wrong. Please try again.')
      setPassword('')
      passwordRef.current?.focus()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="login-container page">
      <h2>Login</h2>
      <form
        onSubmit={handleSubmit}
        className="login-form"
        noValidate
        aria-describedby="error-message"
      >
        {error && (
          <div
            className="error-msg"
            tabIndex={-1}
            aria-live="assertive"
            id="error-message"
            ref={errorRef}
          >
            {error}
          </div>
        )}

        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          disabled={isSubmitting}
          aria-invalid={!!error && !validateEmail(email)}
          aria-describedby={
            error && !validateEmail(email) ? 'error-message' : undefined
          }
          ref={emailRef}
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          disabled={isSubmitting}
          minLength={6}
          aria-invalid={!!error && password.length < 6}
          aria-describedby={
            error && password.length < 6 ? 'error-message' : undefined
          }
          ref={passwordRef}
        />

        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  )
}
