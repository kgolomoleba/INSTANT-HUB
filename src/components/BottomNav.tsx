import { NavLink } from 'react-router-dom'
import { Compass, Home, MessageCircleMore, UserRound, Wallet } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import './BottomNav.css'

const TABS = [
  { to: '/dashboard', label: 'Home', Icon: Home },
  { to: '/marketplace', label: 'Market', Icon: Compass },
  { to: '/feed', label: 'Feed', Icon: MessageCircleMore },
  { to: '/finance', label: 'Finances', Icon: Wallet },
  { to: '/profile', label: 'Profile', Icon: UserRound },
]

/** App-style tab bar at the bottom of the screen on phones (signed-in users). */
export default function BottomNav() {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return null
  return (
    <nav className="bottom-nav" aria-label="Main">
      {TABS.map(({ to, label, Icon }) => (
        <NavLink key={to} to={to} viewTransition className={({ isActive }) => (isActive ? 'active' : '')}>
          <Icon size={22} strokeWidth={2} aria-hidden="true" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
