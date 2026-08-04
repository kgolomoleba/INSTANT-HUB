import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Logo from './Logo'
import './Navbar.css'

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    setMobileOpen(false)
    await logout()
    navigate('/')
  }

  const closeMobile = () => setMobileOpen(false)

  const metadata = user?.user_metadata as { username?: string } | undefined
  const displayName = metadata?.username || user?.email || 'User'
  const avatarLetter = displayName[0]?.toUpperCase() || 'U'

  return (
    <nav className="navbar" aria-label="Primary navigation">
      {/* Logo */}
      <NavLink to="/" className="nav-logo" aria-label="Instant Hub Home" onClick={closeMobile}>
        <Logo className="nav-logo-icon" />
        <span className="nav-wordmark">INSTANT <span>HUB</span></span>
      </NavLink>

      {/* Desktop Links */}
      <ul className="nav-list">
        {isAuthenticated ? (
          <>
            <li><NavLink to="/marketplace" className={({ isActive }) => isActive ? 'active' : ''}>Marketplace</NavLink></li>
            <li><NavLink to="/products" className={({ isActive }) => isActive ? 'active' : ''}>Products</NavLink></li>
            <li><NavLink to="/services" className={({ isActive }) => isActive ? 'active' : ''}>Services</NavLink></li>
            <li><NavLink to="/feed" className={({ isActive }) => isActive ? 'active' : ''}>Community Feed</NavLink></li>
            <li><NavLink to="/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>Dashboard</NavLink></li>
          </>
        ) : (
          <>
            <li><a href="#features">Features</a></li>
            <li><a href="#ecosystem">Ecosystem</a></li>
            <li><a href="#services">Services</a></li>
          </>
        )}
      </ul>

      {/* Desktop Actions */}
      <div className="nav-actions">
        {isAuthenticated ? (
          <>
            <NavLink to="/profile" className="nav-avatar" title={displayName} aria-label="Profile">
              {avatarLetter}
            </NavLink>
            <button className="btn-nav-ghost nav-desktop-only" onClick={handleLogout} aria-label="Logout" type="button">
              Logout
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login" className="btn-nav-ghost nav-desktop-only">Log In</NavLink>
            <NavLink to="/register" className="btn-nav-gold nav-desktop-only">Join Free</NavLink>
          </>
        )}

        {/* Hamburger toggle - mobile only */}
        <button
          className="nav-hamburger"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
          type="button"
        >
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            {mobileOpen ? (
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileOpen && (
        <div className="nav-mobile-menu">
          <ul className="nav-mobile-list">
            {isAuthenticated ? (
              <>
                <li><NavLink to="/marketplace" onClick={closeMobile} className={({ isActive }) => isActive ? 'active' : ''}>Marketplace</NavLink></li>
                <li><NavLink to="/products" onClick={closeMobile} className={({ isActive }) => isActive ? 'active' : ''}>Products</NavLink></li>
                <li><NavLink to="/services" onClick={closeMobile} className={({ isActive }) => isActive ? 'active' : ''}>Services</NavLink></li>
                <li><NavLink to="/feed" onClick={closeMobile} className={({ isActive }) => isActive ? 'active' : ''}>Community Feed</NavLink></li>
                <li><NavLink to="/dashboard" onClick={closeMobile} className={({ isActive }) => isActive ? 'active' : ''}>Dashboard</NavLink></li>
                <li><NavLink to="/profile" onClick={closeMobile} className={({ isActive }) => isActive ? 'active' : ''}>Profile</NavLink></li>
              </>
            ) : (
              <>
                <li><a href="#features" onClick={closeMobile}>Features</a></li>
                <li><a href="#ecosystem" onClick={closeMobile}>Ecosystem</a></li>
                <li><a href="#services" onClick={closeMobile}>Services</a></li>
              </>
            )}
          </ul>
          <div className="nav-mobile-actions">
            {isAuthenticated ? (
              <button className="btn-nav-ghost" onClick={handleLogout} type="button">Logout</button>
            ) : (
              <>
                <NavLink to="/login" className="btn-nav-ghost" onClick={closeMobile}>Log In</NavLink>
                <NavLink to="/register" className="btn-nav-gold" onClick={closeMobile}>Join Free</NavLink>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}