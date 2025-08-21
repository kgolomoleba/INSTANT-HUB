import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar" aria-label="Primary navigation">
      <ul className="nav-list">
        <li>
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
            Home
          </NavLink>
        </li>

        {isAuthenticated && (
          <>
            <li>
              <NavLink to="/products" className={({ isActive }) => (isActive ? 'active' : '')}>
                Products
              </NavLink>
            </li>
            <li>
              <NavLink to="/services" className={({ isActive }) => (isActive ? 'active' : '')}>
                Services
              </NavLink>
            </li>
            <li>
              <NavLink to="/feed" className={({ isActive }) => (isActive ? 'active' : '')}>
                Community
              </NavLink>
            </li>
            <li>
              <NavLink to="/dashboard" className={({ isActive }) => (isActive ? 'active' : '')}>
                Dashboard
              </NavLink>
            </li>
            <li>
              <NavLink to="/profile" className={({ isActive }) => (isActive ? 'active' : '')}>
                Profile
              </NavLink>
            </li>
          </>
        )}

        {!isAuthenticated && (
          <>
            <li>
              <NavLink to="/login" className={({ isActive }) => (isActive ? 'active' : '')}>
                Login
              </NavLink>
            </li>
            <li>
              <NavLink to="/register" className={({ isActive }) => (isActive ? 'active' : '')}>
                Register
              </NavLink>
            </li>
          </>
        )}
      </ul>
      {isAuthenticated && (
        <div className="nav-user-actions">
          {user && (
            <span className="nav-avatar" title={user.email}>
              {user.username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
            </span>
          )}
          <button
            className="btn-primary logout-button"
            onClick={handleLogout}
            aria-label="Logout"
            type="button"
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}