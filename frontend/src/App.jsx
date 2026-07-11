import React, { Suspense, lazy } from 'react'
import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Navbar from './components/Navbar'
import { ToastProvider } from './components/Toast'
import { AuthProvider, useAuth } from './AuthContext'

const LandingPage = lazy(() => import('./pages/LandingPage'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const ApplicantDetail = lazy(() => import('./pages/ApplicantDetail'))
const OwnerView = lazy(() => import('./pages/OwnerView'))
const AdminPanel = lazy(() => import('./pages/AdminPanel'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const SignupPage = lazy(() => import('./pages/SignupPage'))

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -8 },
}
const pageTransition = { duration: 0.25, ease: 'easeInOut' }

function AnimatedRoute({ children }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="in"
      exit="out"
      transition={pageTransition}
    >
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-medium text-gray-500">Loading...</div>}>
        {children}
      </Suspense>
    </motion.div>
  )
}

function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth()
  if (!user) {
    return <Navigate to="/login" replace />
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />
  }
  return children
}

function AppContent() {
  const location = useLocation()
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup'
  const isLanding = location.pathname === '/' || isAuthPage

  return (
    <div className="min-h-screen">
      {!isLanding && <Navbar />}
      <main className={isLanding ? '' : 'pt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16'}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<AnimatedRoute><LandingPage /></AnimatedRoute>} />
            <Route path="/login" element={<AnimatedRoute><LoginPage /></AnimatedRoute>} />
            <Route path="/signup" element={<AnimatedRoute><SignupPage /></AnimatedRoute>} />
            
            <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AnimatedRoute><Dashboard /></AnimatedRoute></ProtectedRoute>} />
            <Route path="/applicant/:id" element={<ProtectedRoute allowedRoles={['admin']}><AnimatedRoute><ApplicantDetail /></AnimatedRoute></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AnimatedRoute><AdminPanel /></AnimatedRoute></ProtectedRoute>} />
            
            <Route path="/my-score/:id" element={<ProtectedRoute allowedRoles={['applicant', 'admin']}><AnimatedRoute><OwnerView /></AnimatedRoute></ProtectedRoute>} />
          </Routes>
        </AnimatePresence>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  )
}
