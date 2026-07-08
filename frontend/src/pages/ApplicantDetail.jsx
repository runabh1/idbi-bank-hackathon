import React, { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip
} from 'recharts'
import {
  ArrowLeft, MessageSquare, CreditCard, ShieldCheck,
  Send, ExternalLink, X, CheckCircle, Loader,
  AlertTriangle, AlertOctagon, TrendingUp
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { getApplicant, simulate, chat, consent, loanApply } from '../api'
import { RiskBadge } from '../components/RiskBadge'
import { ScoreGauge } from '../components/ScoreGauge'
import TimeMachineChart from '../components/TimeMachineChart'
import CreditCommittee from '../components/CreditCommittee'
import { useToast } from '../components/Toast'

const SIMULATE_FEATURES = [
  { key: 'compliance_score', label: 'GST Filing Punctuality', min: 0, max: 100, unit: 'score' },
  { key: 'cashflow_health_score', label: 'Cashflow Health', min: 0, max: 100, unit: 'score' },
  { key: 'banking_discipline_score', label: 'Banking Discipline', min: 0, max: 100, unit: 'score' },
  { key: 'revenue_stability_score', label: 'Revenue Stability', min: 0, max: 100, unit: 'score' },
  { key: 'employment_stability_score', label: 'Employment Stability', min: 0, max: 100, unit: 'score' },
]

function SubScoreBar({ label, value }) {
  const color = value >= 75 ? '#10b981' : value >= 55 ? '#f59e0b' : value >= 35 ? '#f97316' : '#ef4444'
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-400 w-36 shrink-0">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-white/8 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${value}%`, background: color }}
        />
      </div>
      <span className="text-xs font-semibold text-white w-8 text-right">{Math.round(value)}</span>
    </div>
  )
}

function AnomalyFlags({ app }) {
  const flags = []

  if ((app.aa_total_emi_bounces ?? 0) > 2)
    flags.push({ icon: AlertOctagon, msg: `${app.aa_total_emi_bounces} EMI bounces in past 12 months`, severity: 'high' })
  if ((app.gst_avg_delay_days ?? 0) > 15)
    flags.push({ icon: AlertTriangle, msg: `GST filing delayed avg ${app.gst_avg_delay_days} days`, severity: 'medium' })
  if ((app.upi_inflow_volatility ?? 0) > 0.5)
    flags.push({ icon: AlertTriangle, msg: `High UPI cashflow volatility (${(app.upi_inflow_volatility * 100).toFixed(0)}%)`, severity: 'medium' })
  if ((app.aa_avg_overdraft_days ?? 0) > 5)
    flags.push({ icon: AlertTriangle, msg: `Overdraft used avg ${app.aa_avg_overdraft_days} days/month`, severity: 'medium' })

  if (flags.length === 0) return (
    <div className="flex items-center gap-2 text-emerald-400 text-xs py-1">
      <CheckCircle className="w-4 h-4" />
      No significant risk signals detected
    </div>
  )

  return (
    <div className="space-y-2">
      {flags.map(({ icon: Icon, msg, severity }, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.08 }}
          className={`flex items-start gap-2.5 px-3 py-2.5 rounded-xl text-xs border ${
            severity === 'high'
              ? 'bg-red-500/10 border-red-500/25 text-red-300'
              : 'bg-amber-500/10 border-amber-500/25 text-amber-300'
          }`}
        >
          <Icon className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          {msg}
        </motion.div>
      ))}
    </div>
  )
}

function ConsentModal({ applicantId, onClose, onSuccess }) {
  const [step, setStep] = useState('otp') // otp | loading | done
  const [otp, setOtp] = useState('')
  const [token, setToken] = useState(null)

  const handleVerify = async () => {
    if (otp.length < 4) return
    setStep('loading')
    try {
      const res = await consent(applicantId)
      setToken(res)
      setStep('done')
      setTimeout(() => onSuccess(res), 1500)
    } catch (e) {
      setStep('otp')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="glass-card p-8 max-w-sm w-full mx-4 space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="font-display font-bold text-white text-xl">Account Aggregator</p>
            <p className="text-xs text-gray-400 mt-1">Secure consent for data sharing</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === 'otp' && (
          <>
            <div className="glass-card p-4 space-y-2">
              <p className="text-xs text-gray-400">Consent for</p>
              <p className="text-sm font-semibold text-white">GST · UPI · Bank Account · EPFO</p>
              <p className="text-xs text-gray-500">Valid for 24 hours · Read-only access</p>
            </div>
            <div className="space-y-3">
              <p className="text-sm text-gray-300">Enter OTP sent to registered mobile</p>
              <input
                id="aa-otp-input"
                className="input-field w-full text-center text-xl tracking-[0.5em] font-mono"
                placeholder="• • • •"
                maxLength={6}
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/, ''))}
              />
              <p className="text-xs text-gray-500 text-center">Demo: any 4+ digit OTP works</p>
            </div>
            <button id="aa-verify-btn" onClick={handleVerify} className="btn-primary w-full">
              Verify & Grant Consent
            </button>
          </>
        )}

        {step === 'loading' && (
          <div className="flex flex-col items-center gap-4 py-6">
            <Loader className="w-10 h-10 text-brand-400 animate-spin" />
            <p className="text-gray-400 text-sm">Fetching data from GSTN, UPI, AA, EPFO…</p>
          </div>
        )}

        {step === 'done' && (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <CheckCircle className="w-12 h-12 text-emerald-400" />
            <p className="text-white font-semibold">Consent Granted!</p>
            <p className="text-xs text-gray-400">Token: {token?.consent_token}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ApplicantDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const addToast = useToast()
  const [app, setApp] = useState(null)
  const [simValues, setSimValues] = useState({})
  const [simResult, setSimResult] = useState(null)
  const [simLoading, setSimLoading] = useState(false)
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [showConsent, setShowConsent] = useState(false)
  const [loanResult, setLoanResult] = useState(null)
  const [loanLoading, setLoanLoading] = useState(false)
  const [consentDone, setConsentDone] = useState(false)

  useEffect(() => {
    getApplicant(id).then(data => {
      setApp(data)
      const defaults = {}
      SIMULATE_FEATURES.forEach(f => {
        defaults[f.key] = data[f.key] ?? 50
      })
      setSimValues(defaults)
    })
  }, [id])


  const handleSimulate = async (feature, value) => {
    const newVals = { ...simValues, [feature]: value }
    setSimValues(newVals)
    setSimLoading(true)
    try {
      const res = await simulate(id, feature, value)
      setSimResult(res)
    } finally {
      setSimLoading(false)
    }
  }

  const sendChat = async () => {
    if (!chatInput.trim()) return
    const q = chatInput
    setChatInput('')
    setChatMessages(m => [...m, { role: 'user', text: q }])
    setChatLoading(true)
    try {
      const res = await chat(parseInt(id), q)
      setChatMessages(m => [...m, { role: 'assistant', text: res.answer }])
    } finally {
      setChatLoading(false)
    }
  }

  const handleLoanApply = async () => {
    setLoanLoading(true)
    try {
      const res = await loanApply(id)
      setLoanResult(res)
      addToast(`Loan application submitted! Ref: ${res.application_reference_id}`, 'success')
    } finally {
      setLoanLoading(false)
    }
  }

  const handleConsentSuccess = (res) => {
    setShowConsent(false)
    setConsentDone(true)
    addToast(`AA Consent granted · Token: ${res.consent_token?.slice(0, 12)}…`, 'success')
  }

  if (!app) return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const radarData = [
    { subject: 'Revenue', value: Math.round(app.revenue_stability_score ?? 50), fullMark: 100 },
    { subject: 'Cashflow', value: Math.round(app.cashflow_health_score ?? 50), fullMark: 100 },
    { subject: 'Banking', value: Math.round(app.banking_discipline_score ?? 50), fullMark: 100 },
    { subject: 'Compliance', value: Math.round(app.compliance_score ?? 50), fullMark: 100 },
    { subject: 'Employment', value: Math.round(app.employment_stability_score ?? 50), fullMark: 100 },
  ]

  const currentScore = simResult?.simulated_score ?? app.blended_score

  return (
    <div className="space-y-6 animate-fade-in">
      {showConsent && (
        <ConsentModal
          applicantId={id}
          onClose={() => setShowConsent(false)}
          onSuccess={handleConsentSuccess}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <div>
            <h1 className="font-display text-2xl font-bold text-white">{app.business_name}</h1>
            <p className="text-gray-400 text-sm mt-0.5 capitalize">
              {(app.sector || '').replace('_', ' ')} · {app.region} · {app.years_in_business}y active
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            to={`/my-score/${id}`}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <ExternalLink className="w-4 h-4" /> Owner View
          </Link>
          <button
            id="btn-fetch-aa"
            onClick={() => setShowConsent(true)}
            className={`btn-secondary flex items-center gap-2 text-sm ${consentDone ? 'border-emerald-500/50 text-emerald-400' : ''}`}
          >
            {consentDone ? <CheckCircle className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
            {consentDone ? 'AA Linked' : 'Fetch via AA'}
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left column — Score + Radar */}
        <div className="space-y-5">
          {/* Score card */}
          <div className="glass-card p-6 flex flex-col items-center gap-4">
            <ScoreGauge score={currentScore} size={140} />
            <div className="text-center">
              <RiskBadge tier={simResult?.simulated_tier ?? app.risk_tier} size="lg" />
              {simResult && (
                <p className={`text-sm font-semibold mt-2 ${simResult.delta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {simResult.delta >= 0 ? '▲' : '▼'} {Math.abs(simResult.delta).toFixed(1)} pts simulated
                </p>
              )}
            </div>
            <div className="w-full space-y-2.5 pt-2 border-t border-white/8">
              <SubScoreBar label="Revenue Stability" value={app.revenue_stability_score ?? 50} />
              <SubScoreBar label="Cashflow Health" value={app.cashflow_health_score ?? 50} />
              <SubScoreBar label="Banking Discipline" value={app.banking_discipline_score ?? 50} />
              <SubScoreBar label="GST Compliance" value={app.compliance_score ?? 50} />
              <SubScoreBar label="Employment" value={app.employment_stability_score ?? 50} />
            </div>
          </div>

          {/* Radar chart */}
          <div className="glass-card p-5">
            <h3 className="section-title mb-3">Score Radar</h3>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fill: '#4b5563', fontSize: 9 }} />
                <Radar
                  name="Score"
                  dataKey="value"
                  stroke="#6272f2"
                  fill="#6272f2"
                  fillOpacity={0.25}
                  strokeWidth={2}
                />
                <Tooltip
                  contentStyle={{ background: '#1a1040', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }}
                  itemStyle={{ color: '#a5bbfc' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Anomaly Flags */}
          <div className="glass-card p-5 space-y-3">
            <h3 className="section-title flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-amber-400" /> Risk Signal Alerts
            </h3>
            <AnomalyFlags app={app} />
          </div>

          {/* Quick facts */}
          <div className="glass-card p-5 space-y-3 text-sm">
            <h3 className="section-title">Applicant Details</h3>
            {[
              ['Entity Type', app.entity_type],
              ['GST Avg Delay', `${app.gst_avg_delay_days} days`],
              ['Overdraft Days/mo', `${app.aa_avg_overdraft_days} days`],
              ['EMI Bounces (12m)', app.aa_total_emi_bounces],
              ['EPFO On-Time', `${app.epfo_on_time_pct}%`],
              ['UPI Avg Inflow', `₹${(app.upi_avg_inflow || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between items-center">
                <span className="text-gray-400 text-xs">{k}</span>
                <span className="text-white font-medium text-xs">{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right column — LLM + Simulator + Chat */}
        <div className="lg:col-span-2 space-y-5">
          {/* Time Machine Chart */}
          <div className="glass-card p-6">
            <TimeMachineChart applicantId={id} defaulted={!!app.defaulted_12m} />
          </div>

          {/* AI Credit Committee */}
          <div className="glass-card p-6">
            <CreditCommittee applicantId={id} />
          </div>

          {/* What-If Simulator */}
          <div className="glass-card p-6">
            <h3 className="section-title mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-400" /> What-If Simulator
            </h3>
            <div className="space-y-4">
              {SIMULATE_FEATURES.map(feat => (
                <div key={feat.key} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">{feat.label}</span>
                    <span className="text-white font-medium">{Math.round(simValues[feat.key] ?? 50)}</span>
                  </div>
                  <input
                    id={`sim-${feat.key}`}
                    type="range"
                    min={feat.min}
                    max={feat.max}
                    step={1}
                    value={simValues[feat.key] ?? 50}
                    className="w-full accent-brand-500 cursor-pointer"
                    onChange={e => handleSimulate(feat.key, parseFloat(e.target.value))}
                  />
                </div>
              ))}
            </div>
            {simLoading && <p className="text-xs text-brand-400 mt-3 animate-pulse-soft">Computing simulated score…</p>}
            <AnimatePresence>
              {simResult && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-4 p-4 rounded-xl bg-white/5 border border-white/8"
                >
                  <div className="markdown-content markdown-content-compact">
                    <ReactMarkdown>{simResult.explanation}</ReactMarkdown>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Chat widget */}
          <div className="glass-card p-6 flex flex-col">
            <h3 className="section-title mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-purple-400" /> Ask About This Applicant
            </h3>
            <div className="flex-1 space-y-3 max-h-64 overflow-y-auto mb-4 pr-1">
              {chatMessages.length === 0 && (
                <p className="text-gray-500 text-xs text-center pt-4">
                  Ask anything about this applicant's financial health…
                </p>
              )}
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                    msg.role === 'user'
                      ? 'bg-brand-600/30 text-white rounded-tr-sm'
                      : 'bg-white/8 text-gray-200 rounded-tl-sm'
                  }`}>
                    {msg.role === 'user' ? (
                      msg.text
                    ) : (
                      <div className="markdown-content markdown-content-compact">
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/8 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-gray-400">
                    <span className="animate-pulse-soft">Thinking…</span>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <input
                id="chat-input"
                className="input-field flex-1 text-sm"
                placeholder="e.g. What is the main risk for this applicant?"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendChat()}
              />
              <button
                id="chat-send"
                onClick={sendChat}
                disabled={!chatInput.trim() || chatLoading}
                className="btn-primary px-4"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-4">
            {!loanResult ? (
              <button
                id="btn-loan-apply"
                onClick={handleLoanApply}
                disabled={loanLoading}
                className="btn-success flex items-center justify-center gap-2"
              >
                {loanLoading ? <Loader className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                Apply for Loan
              </button>
            ) : (
              <div className="glass-card p-4 col-span-2 text-center border-emerald-500/30">
                <CheckCircle className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                <p className="text-emerald-400 font-semibold text-sm">Application Submitted!</p>
                <p className="text-xs text-gray-400 mt-1">Ref: {loanResult.application_reference_id}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
