import React, { useState, useRef, useEffect } from 'react'
import './Register.css'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'

const validateEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

const validateUsername = (username: string): boolean =>
  /^[a-zA-Z0-9_]{3,20}$/.test(username)

export default function Register() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
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
    const trimmedUsername = username.trim()

    if (!trimmedEmail || !trimmedUsername || !password || !confirmPassword) {
      setError('Please fill in all fields.')
      return
    }

    if (!validateEmail(trimmedEmail)) {
      setError('Please enter a valid email address.')
      return
    }

    if (!validateUsername(trimmedUsername)) {
      setError('Username must be 3–20 characters and contain only letters, numbers, or underscores.')
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
      // Check username is not already taken
      const { data: existing } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', trimmedUsername)
        .single()

      if (existing) {
        setError('That username is already taken. Please choose another.')
        setIsSubmitting(false)
        return
      }

      // Sign up with Supabase auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: { username: trimmedUsername },
        },
      })

      if (signUpError) {
        setError(signUpError.message)
        return
      }

      if (data?.user) {
        // Save username to profiles table
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            username: trimmedUsername,
            updated_at: new Date().toISOString(),
          })

        if (profileError) {
          setError('Account created but failed to save username. Please update it in your profile.')
        } else {
          navigate('/login', {
            state: { message: 'Registration successful! Please check your email to confirm your account.' }
          })
        }
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
    <div className="register-container">
      <div className="register-card">
        <div className="register-header">
          <img src="/instant-hub-logo.svg" alt="Instant Hub Logo" className="register-logo" />
          <h1>Create Account</h1>
          <p>Join the Instant Hub ecosystem</p>
        </div>

        <form onSubmit={handleSubmit} className="register-form" noValidate>
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
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              placeholder="e.g. kgolo_builds"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              disabled={isSubmitting}
              maxLength={20}
            />
            <span className="form-hint">Letters, numbers, underscores only. 3–20 characters.</span>
          </div>

          <div className="form-group">
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
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              disabled={isSubmitting}
              minLength={6}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              placeholder="Repeat your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              disabled={isSubmitting}
              minLength={6}
            />
          </div>

          <button type="submit" className="btn-register" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account...' : 'Create Account'}
          </button>

          <p className="register-login-link">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </form>
      </div>
    </div>
  )
}