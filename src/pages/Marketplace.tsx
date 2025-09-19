import { Link, Outlet } from 'react-router-dom'

export default function Marketplace() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Marketplace</h1>
      <p className="text-gray-400 mb-6">
        Explore products and services offered on Instant Hub.
      </p>

      <nav className="flex gap-4 mb-6">
        <Link to="products" className="text-blue-500 hover:underline">
          Products
        </Link>
        <Link to="services" className="text-blue-500 hover:underline">
          Services
        </Link>
      </nav>

      {/* Render child route content here */}
      <Outlet />
    </div>
  )
}
