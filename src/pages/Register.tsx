import React, { useState, useRef, useEffect } from 'react'
import './Register.css'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

const validateEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

export default function Register() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const errorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.focus()
    }
  }, [error])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    const trimmedEmail = email.trim()

    if (!trimmedEmail || !password || !confirmPassword) {
      setError('Please fill in all fields.')
      return
    }

    if (!validateEmail(trimmedEmail)) {
      setError('Please enter a valid email address.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setIsSubmitting(true)

    try {
      // Supabase signup
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
      })

      if (signUpError) {
        setError(signUpError.message)
      } else if (data && data.user) {
        // Insert a row into profiles for the new user
        await supabase.from('profiles').upsert({
          id: data.user.id,
          username: '',
          updated_at: new Date().toISOString(),
        })

        alert(
          'Registration successful! Please check your email to confirm your account.'
        )
        navigate('/login')
      } else {
        setError('Registration failed. Please try again.')
      }
    } catch {
      setError('Something went wrong. Please try again later.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="register-container page">
      <h2>Register</h2>
      <form
        onSubmit={handleSubmit}
        className="register-form"
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
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          placeholder="Create a password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
          disabled={isSubmitting}
          minLength={6}
          aria-invalid={!!error && password.length < 6}
          aria-describedby={
            error && password.length < 6 ? 'error-message' : undefined
          }
        />

        <label htmlFor="confirmPassword">Confirm Password</label>
        <input
          id="confirmPassword"
          type="password"
          placeholder="Confirm your password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          autoComplete="new-password"
          disabled={isSubmitting}
          minLength={6}
          aria-invalid={!!error && password !== confirmPassword}
          aria-describedby={
            error && password !== confirmPassword ? 'error-message' : undefined
          }
        />

        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Registering...' : 'Register'}
        </button>
      </form>
    </div>
  )
}
