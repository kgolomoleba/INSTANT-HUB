import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Navbar.css'

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const displayName =
    (user as any)?.username ||
    (user as any)?.user_metadata?.username ||
    user?.email ||
    'User'

  const avatarLetter = displayName[0]?.toUpperCase() || 'U'

  return (
    <nav className="navbar" aria-label="Primary navigation">
      {/* Logo */}
      <NavLink to="/" className="nav-logo" aria-label="Instant Hub Home">
        <img src="/instant-hub-logo.svg" alt="Instant Hub" className="nav-logo-icon" />
        <span className="nav-wordmark">INSTANT <span>HUB</span></span>
      </NavLink>

      {/* Links */}
      <ul className="nav-list">
        {isAuthenticated ? (
          <>
            <li><NavLink to="/products" className={({ isActive }) => isActive ? 'active' : ''}>Products</NavLink></li>
            <li><NavLink to="/services" className={({ isActive }) => isActive ? 'active' : ''}>Services</NavLink></li>
            <li><NavLink to="/feed" className={({ isActive }) => isActive ? 'active' : ''}>Community</NavLink></li>
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

      {/* Actions */}
      <div className="nav-actions">
        {isAuthenticated ? (
          <>
            <NavLink to="/profile" className="nav-avatar" title={displayName} aria-label="Profile">
              {avatarLetter}
            </NavLink>
            <button className="btn-nav-ghost" onClick={handleLogout} aria-label="Logout" type="button">
              Logout
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login" className="btn-nav-ghost">Log In</NavLink>
            <NavLink to="/register" className="btn-nav-gold">Join Free</NavLink>
          </>
        )}
      </div>
    </nav>
  )
}