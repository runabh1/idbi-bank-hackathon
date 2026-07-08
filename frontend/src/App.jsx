import React from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Navbar from './components/Navbar'
import LandingPage from './pages/LandingPage'
import Dashboard from './pages/Dashboard'
import ApplicantDetail from './pages/ApplicantDetail'
import OwnerView from './pages/OwnerView'
import AdminPanel from './pages/AdminPanel'
import { ToastProvider } from './components/Toast'

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
      {children}
    </motion.div>
  )
}

export default function App() {
  const location = useLocation()
  const isLanding = location.pathname === '/'

  return (
    <ToastProvider>
      <div className="min-h-screen">
        {!isLanding && <Navbar />}
        <main className={isLanding ? '' : 'pt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16'}>
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<AnimatedRoute><LandingPage /></AnimatedRoute>} />
              <Route path="/dashboard" element={<AnimatedRoute><Dashboard /></AnimatedRoute>} />
              <Route path="/applicant/:id" element={<AnimatedRoute><ApplicantDetail /></AnimatedRoute>} />
              <Route path="/my-score/:id" element={<AnimatedRoute><OwnerView /></AnimatedRoute>} />
              <Route path="/admin" element={<AnimatedRoute><AdminPanel /></AnimatedRoute>} />
            </Routes>
          </AnimatePresence>
        </main>
      </div>
    </ToastProvider>
  )
}
