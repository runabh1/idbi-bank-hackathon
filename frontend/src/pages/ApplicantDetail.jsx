import React, { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, MessageSquare, CreditCard, ShieldCheck,
  Send, ExternalLink, X, CheckCircle, Loader,
  AlertTriangle, AlertOctagon, TrendingUp, Download
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { getApplicant, simulate, chat, consent, loanApply } from '../api'
import { RiskBadge } from '../components/RiskBadge'
import { ScoreGauge } from '../components/ScoreGauge'
import TimeMachineChart from '../components/TimeMachineChart'
import CreditCommittee from '../components/CreditCommittee'
import { useToast } from '../components/Toast'
import { ChartRadarDots, StatCard } from '../components/SharedOwnerCards'

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
      <div className="premium-card p-8 max-w-sm w-full mx-4 space-y-6 bg-white">
        <div className="flex justify-between items-start">
          <div>
            <p className="font-display font-bold text-gray-900 text-xl">Account Aggregator</p>
            <p className="text-xs text-gray-500 mt-1">Secure consent for data sharing</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === 'otp' && (
          <>
            <div className="premium-card p-4 space-y-2 bg-gray-50/50">
              <p className="text-xs text-gray-500">Consent for</p>
              <p className="text-sm font-semibold text-gray-900">GST · UPI · Bank Account · EPFO</p>
              <p className="text-xs text-gray-500">Valid for 24 hours · Read-only access</p>
            </div>
            <div className="space-y-3">
              <p className="text-sm text-gray-600">Enter OTP sent to registered mobile</p>
              <input
                id="aa-otp-input"
                className="input-field w-full text-center text-xl tracking-[0.5em] font-mono bg-white text-gray-900"
                placeholder="• • • •"
                maxLength={6}
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/, ''))}
              />
              <p className="text-xs text-gray-500 text-center">Demo: any 4+ digit OTP works</p>
            </div>
            <button id="aa-verify-btn" onClick={handleVerify} className="bg-black text-white px-6 py-2.5 rounded-full w-full font-semibold hover:bg-gray-800 transition-all">
              Verify & Grant Consent
            </button>
          </>
        )}

        {step === 'loading' && (
          <div className="max-w-7xl mx-auto space-y-6 animate-fade-in mt-6">
            <div className="flex items-start gap-4 mb-8">
              <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse"></div>
              <div className="space-y-2">
                <div className="w-48 h-6 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-32 h-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="premium-card p-6 h-64 bg-gray-100 animate-pulse"></div>
              <div className="lg:col-span-2 premium-card p-6 h-64 bg-gray-100 animate-pulse"></div>
            </div>
            <div className="grid md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="premium-card p-4 h-24 bg-gray-100 animate-pulse"></div>
              ))}
            </div>
          </div>
        )}

        {step === 'done' && (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <CheckCircle className="w-12 h-12 text-emerald-500" />
            <p className="text-gray-900 font-semibold">Consent Granted!</p>
            <p className="text-xs text-gray-500">Token: {token?.consent_token}</p>
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
  const [loanStatus, setLoanStatus] = useState(localStorage.getItem(`loanStatus_${id}`) || 'none')
  const [loanLoading, setLoanLoading] = useState(false)
  const [consentDone, setConsentDone] = useState(false)

  useEffect(() => {
    let cancelled = false
    setApp(null)
    setSimResult(null)
    setSimValues({})
    getApplicant(id).then(data => {
      if (!cancelled) {
        setApp(data)
        const defaults = {}
        SIMULATE_FEATURES.forEach(f => {
          defaults[f.key] = data[f.key] ?? 50
        })
        setSimValues(defaults)
      }
    })
    return () => { cancelled = true }
  }, [id])

  // Sync loanStatus when navigating to a different applicant
  useEffect(() => {
    setLoanStatus(localStorage.getItem(`loanStatus_${id}`) || 'none')
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

  const handleApproveLoan = () => {
    setLoanStatus('approved')
    localStorage.setItem(`loanStatus_${id}`, 'approved')
    addToast('Loan application approved.', 'success')
  }

  const handleRejectLoan = () => {
    setLoanStatus('rejected')
    localStorage.setItem(`loanStatus_${id}`, 'rejected')
    addToast('Loan application rejected.', 'error')
  }

  const handleConsentSuccess = (res) => {
    setShowConsent(false)
    setConsentDone(true)
    addToast(`AA Consent granted · Token: ${res.consent_token?.slice(0, 12)}…`, 'success')
  }

  if (!app) return (
    <div className="space-y-6 animate-fade-in p-6 max-w-7xl mx-auto">
      {/* Header Skeleton */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gray-200 animate-pulse"></div>
          <div>
            <div className="h-8 w-64 bg-gray-200 rounded-lg animate-pulse mb-2"></div>
            <div className="h-4 w-48 bg-gray-100 rounded-md animate-pulse"></div>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-32 bg-gray-200 rounded-xl animate-pulse"></div>
          <div className="h-10 w-32 bg-gray-200 rounded-xl animate-pulse"></div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column Skeleton */}
        <div className="space-y-5">
          <div className="premium-card p-6 h-[160px] bg-gray-50/50 animate-pulse flex flex-col justify-between">
            <div className="flex justify-between"><div className="w-24 h-5 bg-gray-200 rounded"></div><div className="w-16 h-6 bg-gray-200 rounded-full"></div></div>
            <div className="w-32 h-10 bg-gray-200 rounded mt-4"></div>
          </div>
          <div className="premium-card p-6 h-[300px] bg-gray-50/50 animate-pulse"></div>
          <div className="premium-card p-5 h-[340px] bg-gray-50/50 animate-pulse"></div>
        </div>

        {/* Right Column Skeleton */}
        <div className="lg:col-span-2 space-y-5">
          <div className="premium-card p-6 h-36 bg-gray-50/50 animate-pulse"></div>
          <div className="premium-card p-6 h-[350px] bg-gray-50/50 animate-pulse"></div>
          <div className="premium-card p-6 h-64 bg-gray-50/50 animate-pulse"></div>
        </div>
      </div>
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
    <div className="space-y-6 animate-fade-in font-sans text-gray-900 pb-12">
      <style>{`
        body { background: #F7F8FA !important; }
        .markdown-light { color: #374151; font-size: 0.875rem; line-height: 1.625; }
        .markdown-light p { margin-bottom: 0.75rem; color: #374151 !important; }
        .markdown-light strong, .markdown-light b { color: #111827 !important; font-weight: 700; }
        .markdown-light li { color: #374151 !important; }
        .markdown-light li strong { color: #111827 !important; }
        .markdown-light ul { list-style-type: disc; padding-left: 1.25rem; margin-bottom: 0.75rem; }
        .markdown-light ol { list-style-type: decimal; padding-left: 1.25rem; margin-bottom: 0.75rem; }
        .markdown-light h1, .markdown-light h2, .markdown-light h3 { color: #111827 !important; font-weight: 600; margin-top: 1rem; margin-bottom: 0.5rem; }
        .markdown-light code { background: #f3f4f6 !important; color: #111827 !important; padding: 0.125rem 0.375rem; border-radius: 0.25rem; }
      `}</style>
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
            className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-900">{app.business_name}</h1>
            <p className="text-gray-500 text-sm mt-0.5 capitalize">
              {(app.sector || '').replace('_', ' ')} · {app.region} · {app.years_in_business}y active
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <Download className="w-4 h-4" /> Download PDF
          </button>
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
          
          {/* Credit Score */}
          <div className="premium-card p-6 flex flex-col justify-between h-[160px]">
            <div className="flex justify-between items-start">
              <h2 className="text-lg font-semibold text-gray-900">Credit Score</h2>
              <RiskBadge tier={simResult?.simulated_tier ?? app.risk_tier} size="md" />
            </div>
            <div>
              <div className="flex items-center gap-3 mt-2">
                <h1 className="text-4xl font-bold tracking-tight text-gray-900 leading-none">
                  {Math.round(currentScore)}<span className="text-2xl text-gray-300">/100</span>
                </h1>
              </div>
              {simResult && (
                <p className={`text-xs font-semibold mt-1 ${simResult.delta >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {simResult.delta >= 0 ? '▲' : '▼'} {Math.abs(simResult.delta).toFixed(1)} pts simulated
                </p>
              )}
            </div>
          </div>

          {/* Score Breakdown */}
          <div className="premium-card p-6">
            <h3 className="section-title mb-4 flex items-center gap-2 text-lg">
              <ShieldCheck className="w-4 h-4 text-gray-700" /> Score Breakdown
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Revenue Stability" value={Math.round(simValues?.revenue_stability_score ?? app.revenue_stability_score ?? 50)} />
              <StatCard label="Cashflow Health" value={Math.round(simValues?.cashflow_health_score ?? app.cashflow_health_score ?? 50)} />
              <StatCard label="Banking Discipline" value={Math.round(simValues?.banking_discipline_score ?? app.banking_discipline_score ?? 50)} />
              <StatCard label="GST Compliance" value={Math.round(simValues?.compliance_score ?? app.compliance_score ?? 50)} />
              <StatCard label="Employment" value={Math.round(simValues?.employment_stability_score ?? app.employment_stability_score ?? 50)} />
            </div>
          </div>

          {/* Score Radar */}
          <div className="premium-card p-5">
            <div className="w-full bg-gray-50/50 rounded-xl">
              <ChartRadarDots data={radarData} t={{ profileAnalysis: "Score Radar", trendingUp: "Analysis complete" }} />
            </div>
          </div>

          {/* Anomaly Flags */}
          <div className="premium-card p-5 space-y-3">
            <h3 className="section-title flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-amber-500" /> Risk Signal Alerts
            </h3>
            <AnomalyFlags app={app} />
          </div>

          {/* Quick facts */}
          <div className="premium-card p-5 space-y-3 text-sm">
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
                <span className="text-gray-500 text-xs">{k}</span>
                <span className="text-gray-900 font-semibold text-xs">{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right column — LLM + Simulator + Chat */}
        <div className="lg:col-span-2 space-y-5">
          {/* Loan Application Status Action Card */}
          <div className="premium-card p-6 border-l-4 border-l-brand-500">
            <h3 className="section-title mb-3 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-brand-600" /> Loan Application Action
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Review the applicant's profile and decide whether to approve or reject their loan request.
            </p>
            <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4 border border-gray-100">
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Current Status</span>
                {loanStatus === 'approved' && <span className="text-emerald-600 font-bold flex items-center gap-1"><CheckCircle className="w-4 h-4"/> Approved</span>}
                {loanStatus === 'rejected' && <span className="text-red-600 font-bold flex items-center gap-1"><AlertTriangle className="w-4 h-4"/> Rejected</span>}
                {loanStatus === 'none' && <span className="text-amber-600 font-bold flex items-center gap-1"><AlertTriangle className="w-4 h-4"/> Pending Decision</span>}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleRejectLoan}
                  disabled={loanStatus === 'rejected'}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    loanStatus === 'rejected' ? 'bg-red-50 text-red-300 cursor-not-allowed' : 'bg-white border border-red-200 text-red-600 hover:bg-red-50'
                  }`}
                >
                  Reject
                </button>
                <button
                  onClick={handleApproveLoan}
                  disabled={loanStatus === 'approved'}
                  className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${
                    loanStatus === 'approved' ? 'bg-emerald-50 text-emerald-300 cursor-not-allowed' : 'bg-emerald-600 text-white shadow-md hover:bg-emerald-700 hover:shadow-lg'
                  }`}
                >
                  Approve Loan
                </button>
              </div>
            </div>
          </div>

          {/* Time Machine Chart */}
          <div className="premium-card p-6">
            <TimeMachineChart applicantId={id} defaulted={!!app.defaulted_12m} />
          </div>

          {/* AI Credit Committee */}
          <div className="premium-card p-6">
            <CreditCommittee applicantId={id} />
          </div>

          {/* What-If Simulator */}
          <div className="premium-card p-6">
            <h3 className="font-semibold leading-none tracking-tight text-gray-900 text-lg mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-500" /> What-If Simulator
            </h3>
            <div className="space-y-6">
              {SIMULATE_FEATURES.map(feat => (
                <div key={feat.key} className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 font-medium">{feat.label}</span>
                    <span className="text-gray-900 font-bold">{Math.round(simValues[feat.key] ?? 50)}</span>
                  </div>
                  <input
                    id={`sim-${feat.key}`}
                    type="range"
                    min={feat.min}
                    max={feat.max}
                    step={1}
                    value={simValues[feat.key] ?? 50}
                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-900"
                    onChange={e => handleSimulate(feat.key, parseFloat(e.target.value))}
                  />
                </div>
              ))}
            </div>
            {simLoading && <p className="text-xs text-brand-600 mt-3 animate-pulse-soft">Computing simulated score…</p>}
            <AnimatePresence>
              {simResult && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-4 p-4 rounded-xl bg-gray-50 border border-gray-100"
                >
                  <div className="markdown-light markdown-content-compact">
                    <ReactMarkdown>{simResult.explanation}</ReactMarkdown>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Chat widget */}
          <div className="premium-card p-6 flex flex-col">
            <h3 className="section-title mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-purple-600" /> Ask About This Applicant
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
                      ? 'bg-black text-white rounded-tr-sm'
                      : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                  }`}>
                    {msg.role === 'user' ? (
                      msg.text
                    ) : (
                      <div className="markdown-light markdown-content-compact">
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-gray-500">
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

          {/* Loan Decision */}
          <div className="premium-card p-6">
            <h3 className="font-semibold leading-none tracking-tight text-gray-900 text-lg mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-indigo-500" /> Loan Application Decision
            </h3>
            
            {loanStatus === 'none' && (
              <p className="text-sm text-gray-500 bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
                The business owner has not submitted a loan application yet.
              </p>
            )}

            {loanStatus === 'pending' && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-center">
                <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-3" />
                <h4 className="text-amber-700 font-bold mb-1">Application Pending Review</h4>
                <p className="text-sm text-amber-600 mb-6">The business owner has requested a loan. Please review their profile and make a decision.</p>
                <div className="flex gap-4 justify-center">
                  <button onClick={handleRejectLoan} className="px-6 py-2.5 rounded-full font-semibold text-red-600 bg-white border border-red-200 hover:bg-red-50 transition-colors">
                    Reject Loan
                  </button>
                  <button onClick={handleApproveLoan} className="px-6 py-2.5 rounded-full font-semibold text-white bg-emerald-500 hover:bg-emerald-600 shadow-md transition-colors">
                    Approve Loan
                  </button>
                </div>
              </div>
            )}

            {loanStatus === 'approved' && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-center">
                <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <h4 className="text-emerald-700 font-bold mb-1">Loan Approved</h4>
                <p className="text-sm text-emerald-600">You have approved this applicant's loan request.</p>
              </div>
            )}

            {loanStatus === 'rejected' && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-center">
                <X className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <h4 className="text-red-700 font-bold mb-1">Loan Rejected</h4>
                <p className="text-sm text-red-600">You have rejected this applicant's loan request.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
