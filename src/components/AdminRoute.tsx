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

    supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        setIsAdmin(data?.role === 'admin')
        setCheckingRole(false)
      })
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
