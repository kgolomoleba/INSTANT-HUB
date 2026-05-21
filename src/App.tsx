import { Routes, Route } from 'react-router-dom'

import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import ProductsPage from './pages/ProductsPage'
import ServicesPage from './pages/ServicesPage'
import FeedPage from './pages/FeedPage'
import Marketplace from './pages/Marketplace'
import PrivateRoute from './components/PrivateRoute'
import Navbar from './components/Navbar'

import './App.css'

const NotFound = () => (
  <div className="page" role="alert" aria-live="assertive">
    <h2>Page Not Found</h2>
    <p>The page you are looking for does not exist.</p>
  </div>
)

function App() {
  return (
    <>
      <header>
        <Navbar />
      </header>

      <main className="container" tabIndex={-1} aria-live="polite" role="main">
        <Routes>
          <Route path="/" element={<div className="page"><Home /></div>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={<PrivateRoute />}>
            <Route path="/dashboard" element={<div className="page"><Dashboard /></div>} />
            <Route path="/profile" element={<div className="page"><Profile /></div>} />
            <Route path="/marketplace" element={<div className="page"><Marketplace /></div>} />
            <Route path="/products" element={<div className="page"><ProductsPage /></div>} />
            <Route path="/services" element={<div className="page"><ServicesPage /></div>} />
            <Route path="/feed" element={<div className="page"><FeedPage /></div>} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <footer className="footer" role="contentinfo">
        &copy; {new Date().getFullYear()} Instant Hub. All rights reserved.
      </footer>
    </>
  )
}

export default App