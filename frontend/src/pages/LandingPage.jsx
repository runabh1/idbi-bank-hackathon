import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Activity, BarChart3, Shield, TrendingUp, Users, Zap,
  ArrowRight, Globe, CheckCircle, Brain
} from 'lucide-react'
import { getPortfolio } from '../api'
import { ScoreGauge } from '../components/ScoreGauge'

const DEMO_IDS = [1, 2, 3, 4, 5]

const featureHighlights = [
  { icon: Brain, label: 'XGBoost ML Model', desc: 'ROC-AUC 0.88', color: 'text-purple-400', bg: 'bg-purple-500/10' },
  { icon: Shield, label: 'Fairness Monitoring', desc: 'Bias detection across tiers', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  { icon: Globe, label: 'Bilingual UI', desc: 'English & Hindi', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { icon: Zap, label: 'LLM Narratives', desc: 'AI-generated insights', color: 'text-brand-400', bg: 'bg-brand-500/10' },
]

function AnimatedCounter({ target, duration = 1500 }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    const step = target / (duration / 16)
    let current = 0
    const timer = setInterval(() => {
      current = Math.min(current + step, target)
      setVal(Math.round(current))
      if (current >= target) clearInterval(timer)
    }, 16)
    return () => clearInterval(timer)
  }, [target, duration])
  return <span>{val}</span>
}

export default function LandingPage() {
  const navigate = useNavigate()
  const [portfolio, setPortfolio] = useState(null)
  const [ownerId, setOwnerId] = useState('')
  const [ownerError, setOwnerError] = useState('')
  const [demoScore] = useState(72)

  useEffect(() => {
    getPortfolio().then(setPortfolio).catch(() => {})
  }, [])

  const handleOwnerGo = (e) => {
    e.preventDefault()
    const id = parseInt(ownerId)
    if (!id || id < 1) { setOwnerError('Enter a valid applicant ID (1–200)'); return }
    navigate(`/my-score/${id}`)
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-brand-600/15 blur-3xl animate-pulse" />
        <div className="absolute top-1/3 -right-32 w-80 h-80 rounded-full bg-purple-600/10 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-0 left-1/3 w-72 h-72 rounded-full bg-emerald-600/8 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 pt-24 pb-20">

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 glass-card px-4 py-2 mb-6 text-xs text-brand-400"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            IDBI Bank Hackathon 2026 · AI/ML Track
          </motion.div>

          {/* Logo */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <motion.div
              initial={{ rotate: -10, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-2xl shadow-brand-600/40"
            >
              <Activity className="w-9 h-9 text-white" />
            </motion.div>
            <div className="text-left">
              <h1 className="font-display text-5xl font-bold text-white tracking-tight">CreditPulse</h1>
              <p className="text-gray-400 text-sm">MSME Financial Health Card</p>
            </div>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed"
          >
            AI-powered alternate data credit scoring — combining GST, UPI, Bank Account & EPFO signals 
            into a single, explainable financial health score for India's MSMEs.
          </motion.p>
        </motion.div>

        {/* KPI Stats Row */}
        {portfolio && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-14"
          >
            {[
              { label: 'MSME Applicants', value: portfolio.total_applicants, suffix: '' },
              { label: 'Avg Credit Score', value: portfolio.avg_score, suffix: '/100' },
              { label: 'Prime Borrowers', value: portfolio.tier_distribution?.Prime || 0, suffix: '' },
              { label: 'Model ROC-AUC', value: 88, suffix: '%' },
            ].map(({ label, value, suffix }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 + i * 0.07 }}
                className="glass-card p-5 text-center"
              >
                <p className="font-display text-3xl font-bold text-white">
                  <AnimatedCounter target={typeof value === 'number' ? value : 0} />{suffix}
                </p>
                <p className="text-xs text-gray-400 mt-1">{label}</p>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Role Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="mb-14"
        >
          <p className="text-center text-gray-400 text-sm uppercase tracking-widest mb-6">Choose your role</p>
          <div className="grid md:grid-cols-2 gap-6">

            {/* Loan Officer Card */}
            <motion.div
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 300 }}
              onClick={() => navigate('/dashboard')}
              className="glass-card p-8 cursor-pointer group relative overflow-hidden border border-brand-500/20 hover:border-brand-400/40 transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-brand-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative">
                <div className="flex items-center justify-between mb-5">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500/20 to-brand-600/10 border border-brand-500/20 flex items-center justify-center">
                    <BarChart3 className="w-7 h-7 text-brand-400" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-brand-400 group-hover:translate-x-1 transition-all duration-200" />
                </div>
                <h2 className="font-display text-2xl font-bold text-white mb-2">Loan Officer</h2>
                <p className="text-gray-400 text-sm leading-relaxed mb-5">
                  Access the full applicant portfolio. Review AI credit narratives, run what-if simulations, 
                  and monitor fairness metrics across your MSME loan book.
                </p>
                <div className="flex flex-wrap gap-2">
                  {['Portfolio Dashboard', 'AI Analysis', 'What-If Simulator', 'Chat Q&A'].map(tag => (
                    <span key={tag} className="text-xs px-2.5 py-1 rounded-lg bg-brand-500/10 text-brand-300 border border-brand-500/20">{tag}</span>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* MSME Owner Card */}
            <motion.div
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="glass-card p-8 relative overflow-hidden border border-emerald-500/20 hover:border-emerald-400/40 transition-all duration-300 group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative">
                <div className="flex items-center justify-between mb-5">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-600/10 border border-emerald-500/20 flex items-center justify-center">
                    <Users className="w-7 h-7 text-emerald-400" />
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Globe className="w-3.5 h-3.5" /> EN / हिं
                  </div>
                </div>
                <h2 className="font-display text-2xl font-bold text-white mb-2">MSME Owner</h2>
                <p className="text-gray-400 text-sm leading-relaxed mb-4">
                  View your personal financial health score in plain language. 
                  Get 3 actionable steps to improve your creditworthiness in 90 days.
                </p>
                <form onSubmit={handleOwnerGo} className="flex gap-2" onClick={e => e.stopPropagation()}>
                  <input
                    id="owner-id-input"
                    type="number"
                    min={1}
                    max={200}
                    value={ownerId}
                    onChange={e => { setOwnerId(e.target.value); setOwnerError('') }}
                    placeholder="Your applicant ID (1–200)"
                    className="input-field flex-1 text-sm"
                  />
                  <button
                    id="owner-go-btn"
                    type="submit"
                    className="btn-success px-4 flex items-center gap-1 text-sm"
                  >
                    Go <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
                {ownerError && <p className="text-xs text-red-400 mt-2">{ownerError}</p>}
                <p className="text-xs text-gray-600 mt-2">Demo: try any number between 1–200</p>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Live Demo Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          className="grid md:grid-cols-2 gap-6 mb-14"
        >
          {/* Score Demo */}
          <div className="glass-card p-6 flex flex-col items-center gap-4">
            <p className="text-xs text-gray-400 uppercase tracking-widest">Sample CreditPulse Score</p>
            <ScoreGauge score={demoScore} size={140} />
            <div className="text-center">
              <p className="text-white font-semibold">Annapurna Textiles Pvt Ltd</p>
              <p className="text-xs text-gray-400">Manufacturing · Tier 2 City · Near-Prime</p>
            </div>
            <div className="w-full space-y-2 pt-3 border-t border-white/8">
              {[
                ['Revenue Stability', 78], ['Cashflow Health', 65],
                ['Banking Discipline', 71], ['GST Compliance', 82], ['Employment', 68]
              ].map(([label, val]) => {
                const color = val >= 75 ? '#10b981' : val >= 55 ? '#f59e0b' : '#f97316'
                return (
                  <div key={label} className="flex items-center gap-2 text-xs">
                    <span className="text-gray-400 w-32 shrink-0">{label}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-white/8 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${val}%`, background: color }} />
                    </div>
                    <span className="text-white w-6 text-right">{val}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Feature highlights */}
          <div className="space-y-3">
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-4">Platform Highlights</p>
            {featureHighlights.map(({ icon: Icon, label, desc, color, bg }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + i * 0.08 }}
                className="glass-card p-4 flex items-center gap-4"
              >
                <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <div>
                  <p className="text-white font-medium text-sm">{label}</p>
                  <p className="text-gray-400 text-xs">{desc}</p>
                </div>
                <CheckCircle className="w-4 h-4 text-emerald-400 ml-auto shrink-0" />
              </motion.div>
            ))}

            <div className="glass-card p-4 border border-white/8">
              <p className="text-xs text-gray-500 mb-3">Data Sources Integrated</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  ['GST', '2,400 records', '#f59e0b'],
                  ['UPI', '2,400 summaries', '#6272f2'],
                  ['Bank AA', '2,400 entries', '#10b981'],
                  ['EPFO', '2,400 PF records', '#8b5cf6'],
                ].map(([src, count, color]) => (
                  <div key={src} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                    <div>
                      <p className="text-white text-xs font-medium">{src}</p>
                      <p className="text-gray-500 text-[10px]">{count}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="text-center text-xs text-gray-600"
        >
          Built for IDBI Bank Hackathon 2026 · CreditPulse v1.0 · FastAPI + React + XGBoost
        </motion.p>
      </div>
    </div>
  )
}
