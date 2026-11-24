import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'

const AdminRoute = () => {
  const { user, isAuthenticated, loading } = useAuth()
  const location = useLocation()
  // Which user the role was checked for. Until it matches the current user,
  // we're still checking; deciding earlier sent real admins to the dashboard.
  const [checked, setChecked] = useState<{ userId: string; isAdmin: boolean } | null>(null)

  useEffect(() => {
    if (!user) return
    let live = true
    supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
      .then(
        ({ data }) => live && setChecked({ userId: user.id, isAdmin: data?.role === 'admin' }),
        () => live && setChecked({ userId: user.id, isAdmin: false }),
      )
    return () => {
      live = false
    }
  }, [user])

  if (loading) return <div className="loading-text">Checking access...</div>
  if (!isAuthenticated || !user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (checked?.userId !== user.id) return <div className="loading-text">Checking access...</div>
  if (!checked.isAdmin) return <Navigate to="/dashboard" replace />
  return <Outlet />
}

export default AdminRoute
