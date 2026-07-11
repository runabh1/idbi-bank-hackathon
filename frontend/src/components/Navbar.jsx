import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { BarChart3, Users, Shield, Activity, LogOut } from 'lucide-react'
import { useAuth } from '../AuthContext'

const adminNavItems = [
  { to: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { to: '/admin', label: 'Fairness Panel', icon: Shield },
]

export default function Navbar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  
  const handleLogout = () => {
    navigate('/login')
    setTimeout(() => {
      logout()
    }, 0)
  }
  
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        
        {/* Left Section: Logo & Links */}
        <div className="flex items-center gap-8">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center transition-transform group-hover:scale-105">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-lg text-gray-900 tracking-tight hidden sm:block">CreditPulse</span>
          </Link>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-6">
            {user?.role === 'admin' && adminNavItems.map(({ to, label }) => {
              const active = pathname === to
              return (
                <Link
                  key={to}
                  to={to}
                  className={`text-sm font-medium transition-colors
                    ${active
                      ? 'text-gray-900 font-semibold'
                      : 'text-gray-500 hover:text-gray-900'
                    }`}
                >
                  {label}
                </Link>
              )
            })}
          </div>
        </div>

        {/* Right Section: Actions */}
        <div className="flex items-center gap-3">
          {/* Sign Out (Outline pill style like 'Receive') */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>

          {/* Divider */}
          <div className="w-px h-6 bg-gray-200 mx-2 hidden sm:block"></div>
          
          {/* Avatar dummy */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-400 to-indigo-500 border-2 border-white shadow-sm flex items-center justify-center overflow-hidden">
             <span className="text-white text-xs font-bold">{user?.name ? user.name.charAt(0).toUpperCase() : 'U'}</span>
          </div>
        </div>

      </div>
    </nav>
  )
}
