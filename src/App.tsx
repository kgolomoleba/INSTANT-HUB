import { Routes, Route } from 'react-router-dom';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import ProductsPage from './pages/ProductsPage';
import ServicesPage from './pages/ServicesPage';
import FeedPage from './pages/FeedPage';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';

import './App.css';

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

          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <div className="page"><Dashboard /></div>
              </PrivateRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <div className="page"><Profile /></div>
              </PrivateRoute>
            }
          />

          <Route
            path="/products"
            element={
              <PrivateRoute>
                <div className="page"><ProductsPage /></div>
              </PrivateRoute>
            }
          />

          <Route
            path="/services"
            element={
              <PrivateRoute>
                <div className="page"><ServicesPage /></div>
              </PrivateRoute>
            }
          />

          <Route
            path="/feed"
            element={
              <PrivateRoute>
                <div className="page"><FeedPage /></div>
              </PrivateRoute>
            }
          />

          <Route
            path="*"
            element={
              <div className="page" role="alert" aria-live="assertive">
                <h2>Page Not Found</h2>
              </div>
            }
          />
        </Routes>
      </main>

      <footer className="footer" role="contentinfo">
        &copy; {new Date().getFullYear()} Instant Hub. All rights reserved.
      </footer>
    </>
  );
}

export default App;