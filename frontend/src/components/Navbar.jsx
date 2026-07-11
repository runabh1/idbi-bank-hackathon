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
    logout()
    navigate('/')
  }
  
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/8"
         style={{ background: 'rgba(10,8,30,0.85)', backdropFilter: 'blur(20px)' }}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center
                          shadow-lg shadow-brand-600/30 group-hover:shadow-brand-500/50 transition-all duration-200">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-display font-bold text-lg text-white tracking-tight">CreditPulse</span>
            <span className="hidden sm:block text-[10px] text-gray-400 -mt-0.5">MSME Financial Health Card</span>
          </div>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          {user?.role === 'admin' && adminNavItems.map(({ to, label, icon: Icon }) => {
            const active = pathname === to
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
                  ${active
                    ? 'bg-brand-600/20 text-brand-400 border border-brand-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            )
          })}
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200 ml-2"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>

        {/* Status pill */}
        <div className="hidden md:flex items-center gap-2 text-xs text-gray-400 glass-card px-3 py-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          {user ? `Logged in as ${user.name}` : 'Live • AI Scoring Active'}
        </div>
      </div>
    </nav>
  )
}
