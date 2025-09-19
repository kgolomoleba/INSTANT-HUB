import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Home from './pages/Home'
import Marketplace from './pages/Marketplace'
import Profile from './pages/Profile'

const router = createBrowserRouter([
  { path: '/', element: <Home /> },
  { path: '/marketplace', element: <Marketplace /> },
  { path: '/profile', element: <Profile /> },
])

export default function AppRouter() {
  return <RouterProvider router={router} />
}
