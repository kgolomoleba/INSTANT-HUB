import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'

const AdminRoute = () => {
  const { user, isAuthenticated, loading } = useAuth()
  const location = useLocation()
  const [checkingRole, setCheckingRole] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setCheckingRole(false)
      return
    }

    let live = true
    setCheckingRole(true)
    supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
      .then(
        ({ data }) => {
          if (!live) return
          setIsAdmin(data?.role === 'admin')
          setCheckingRole(false)
        },
        () => {
          if (!live) return
          setIsAdmin(false)
          setCheckingRole(false)
        },
      )
    return () => {
      live = false
    }
  }, [isAuthenticated, user])

  if (loading || checkingRole) {
    return <div className="loading-text">Checking access...</div>
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    )
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}

export default AdminRoute
