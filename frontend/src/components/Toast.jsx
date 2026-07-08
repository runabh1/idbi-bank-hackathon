import React, { createContext, useContext, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, AlertTriangle, X, Info } from 'lucide-react'

const ToastContext = createContext(null)

const ICONS = {
  success: CheckCircle,
  warning: AlertTriangle,
  info: Info,
}
const COLORS = {
  success: { icon: 'text-emerald-400', border: 'border-emerald-500/30', glow: 'shadow-emerald-500/10' },
  warning: { icon: 'text-amber-400', border: 'border-amber-500/30', glow: 'shadow-amber-500/10' },
  info: { icon: 'text-brand-400', border: 'border-brand-500/30', glow: 'shadow-brand-500/10' },
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'success', duration = 3500) => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration)
  }, [])

  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id))

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map(({ id, message, type }) => {
            const Icon = ICONS[type] || Info
            const c = COLORS[type] || COLORS.info
            return (
              <motion.div
                key={id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.25 }}
                className={`pointer-events-auto flex items-center gap-3 glass-card px-4 py-3 min-w-64 max-w-80 border ${c.border} shadow-xl ${c.glow}`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${c.icon}`} />
                <p className="text-sm text-gray-200 flex-1">{message}</p>
                <button
                  onClick={() => removeToast(id)}
                  className="text-gray-500 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
