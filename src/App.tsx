import { lazy, Suspense, type ReactNode } from 'react'
import { Routes, Route } from 'react-router-dom'

const Home = lazy(() => import('./pages/Home'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Profile = lazy(() => import('./pages/Profile'))
const ProductsPage = lazy(() => import('./pages/ProductsPage'))
const ServicesPage = lazy(() => import('./pages/ServicesPage'))
const FeedPage = lazy(() => import('./pages/FeedPage'))
const Marketplace = lazy(() => import('./pages/Marketplace'))
const AdminPage = lazy(() => import('./pages/AdminPage'))
import PrivateRoute from './components/PrivateRoute'
import AdminRoute from './components/AdminRoute'
import Layout from './components/Layout'
import PageShell from './components/PageShell'

import './App.css'

const routeFallback = (
  <PageShell>
    <div className="loading-state">
      <div className="loading-spinner" aria-hidden="true" />
      <p>Loading page...</p>
    </div>
  </PageShell>
)

const RouteWrapper = ({ children }: { children: ReactNode }) => (
  <Suspense fallback={routeFallback}>{children}</Suspense>
)

const NotFound = () => (
  <PageShell>
    <div className="empty-state" role="alert" aria-live="assertive">
      <h2>Page Not Found</h2>
      <p>The page you are looking for does not exist.</p>
    </div>
  </PageShell>
)

function App() {
  return (
    <>
      <Layout>
        <Routes>
          <Route path="/" element={<RouteWrapper><PageShell><Home /></PageShell></RouteWrapper>} />
          <Route path="/login" element={<RouteWrapper><PageShell><Login /></PageShell></RouteWrapper>} />
          <Route path="/register" element={<RouteWrapper><PageShell><Register /></PageShell></RouteWrapper>} />

          <Route element={<PrivateRoute />}>
            <Route path="/dashboard" element={<RouteWrapper><PageShell><Dashboard /></PageShell></RouteWrapper>} />
            <Route path="/profile" element={<RouteWrapper><PageShell><Profile /></PageShell></RouteWrapper>} />
            <Route path="/marketplace" element={<RouteWrapper><PageShell><Marketplace /></PageShell></RouteWrapper>} />
            <Route path="/products" element={<RouteWrapper><PageShell><ProductsPage /></PageShell></RouteWrapper>} />
            <Route path="/services" element={<RouteWrapper><PageShell><ServicesPage /></PageShell></RouteWrapper>} />
            <Route path="/feed" element={<RouteWrapper><PageShell><FeedPage /></PageShell></RouteWrapper>} />
          </Route>

          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<RouteWrapper><PageShell><AdminPage /></PageShell></RouteWrapper>} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>

      <footer className="footer" role="contentinfo">
        &copy; {new Date().getFullYear()} Instant Hub. All rights reserved.
      </footer>
    </>
  )
}

export default App
