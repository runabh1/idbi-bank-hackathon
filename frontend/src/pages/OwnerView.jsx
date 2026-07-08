import React, { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Globe, TrendingUp, Download, Printer } from 'lucide-react'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip
} from 'recharts'
import { getApplicant, explainOwner } from '../api'
import { RiskBadge } from '../components/RiskBadge'
import { ScoreGauge } from '../components/ScoreGauge'
import { useTranslation } from '../i18n'
import { useToast } from '../components/Toast'

function ProgressCard({ label, value, description }) {
  const color = value >= 75 ? '#10b981' : value >= 55 ? '#f59e0b' : value >= 35 ? '#f97316' : '#ef4444'
  return (
    <div className="glass-card p-5">
      <div className="flex justify-between items-start mb-3">
        <p className="text-sm font-medium text-gray-200">{label}</p>
        <span className="font-display font-bold text-xl" style={{ color }}>{Math.round(value)}</span>
      </div>
      <div className="w-full h-2 rounded-full bg-white/8 overflow-hidden mb-2">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${value}%`, background: color }} />
      </div>
      <p className="text-xs text-gray-400">{description}</p>
    </div>
  )
}

export default function OwnerView() {
  const { id } = useParams()
  const [app, setApp] = useState(null)
  const [ownerData, setOwnerData] = useState(null)
  const [lang, setLang] = useState('en')
  const t = useTranslation(lang)
  const addToast = useToast()

  useEffect(() => {
    getApplicant(id).then(setApp)
    explainOwner(id).then(setOwnerData)
  }, [id])

  const handlePrint = () => {
    addToast('Preparing score card for printing…', 'info')
    setTimeout(() => window.print(), 400)
  }

  if (!app) return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const radarData = [
    { subject: t.revenueStability, value: Math.round(app.revenue_stability_score ?? 50), fullMark: 100 },
    { subject: t.cashflowHealth, value: Math.round(app.cashflow_health_score ?? 50), fullMark: 100 },
    { subject: t.bankingDiscipline, value: Math.round(app.banking_discipline_score ?? 50), fullMark: 100 },
    { subject: t.compliance, value: Math.round(app.compliance_score ?? 50), fullMark: 100 },
    { subject: t.employmentStability, value: Math.round(app.employment_stability_score ?? 50), fullMark: 100 },
  ]

  const descriptions = {
    revenueStability: 'Based on 12 months of GST turnover data',
    cashflowHealth: 'Based on UPI inflow/outflow patterns',
    bankingDiscipline: 'Based on account behaviour & overdraft history',
    compliance: 'Based on GST return filing punctuality',
    employmentStability: 'Based on EPFO employee records',
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Print styles injected via style tag */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: #fff !important; color: #000 !important; }
          .glass-card { background: #f9fafb !important; border: 1px solid #e5e7eb !important; box-shadow: none !important; }
          .text-white { color: #111827 !important; }
          .text-gray-400, .text-gray-300 { color: #6b7280 !important; }
        }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between no-print">
        <Link to={`/applicant/${id}`} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" /> {t.back}
        </Link>
        <div className="flex items-center gap-3">
          {/* Print button */}
          <button
            id="btn-print-score"
            onClick={handlePrint}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <Printer className="w-4 h-4" /> Download Score Card
          </button>
          {/* Language toggle */}
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-gray-400" />
            <div className="flex rounded-xl overflow-hidden border border-white/10">
              {['en', 'hi'].map(l => (
                <button
                  key={l}
                  id={`lang-${l}`}
                  onClick={() => setLang(l)}
                  className={`px-3 py-1.5 text-xs font-medium transition-all ${
                    lang === l ? 'bg-brand-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  {l === 'en' ? t.english : t.hindi}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Business identity */}
      <div className="glass-card p-6 text-center space-y-3">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-800 mx-auto flex items-center justify-center text-2xl font-display font-bold text-white">
          {app.business_name?.[0] || 'B'}
        </div>
        <h1 className="font-display text-2xl font-bold text-white">{app.business_name}</h1>
        <p className="text-gray-400 text-sm capitalize">{(app.sector || '').replace('_', ' ')} · {app.region}</p>
        <div className="flex justify-center">
          <RiskBadge tier={app.risk_tier ?? 'Near-Prime'} size="lg" />
        </div>
      </div>

      {/* Big score */}
      <div className="glass-card p-8 flex flex-col items-center gap-4">
        <p className="label-text">{t.yourScore}</p>
        <ScoreGauge score={app.blended_score ?? 50} size={160} />
        <div className="text-center">
          <p className="text-4xl font-display font-bold text-white mt-2">{Math.round(app.blended_score ?? 50)}</p>
          <p className="text-gray-400 text-sm">{t.riskTier}: {app.risk_tier ?? 'Near-Prime'}</p>
        </div>
        <div className="text-center glass-card p-4 w-full">
          <p className="text-xs text-gray-400 mb-1">{t.poweredBy}</p>
          <p className="text-xs text-emerald-400">{t.verifiedData}: GST · UPI · AA · EPFO</p>
        </div>
      </div>

      {/* Sub-score cards */}
      <div>
        <h2 className="section-title mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-brand-400" /> Your Score Breakdown
        </h2>
        <div className="grid grid-cols-1 gap-3">
          <ProgressCard label={t.revenueStability} value={app.revenue_stability_score ?? 50} description={descriptions.revenueStability} />
          <ProgressCard label={t.cashflowHealth} value={app.cashflow_health_score ?? 50} description={descriptions.cashflowHealth} />
          <ProgressCard label={t.bankingDiscipline} value={app.banking_discipline_score ?? 50} description={descriptions.bankingDiscipline} />
          <ProgressCard label={t.compliance} value={app.compliance_score ?? 50} description={descriptions.compliance} />
          <ProgressCard label={t.employmentStability} value={app.employment_stability_score ?? 50} description={descriptions.employmentStability} />
        </div>
      </div>

      {/* Radar */}
      <div className="glass-card p-5">
        <ResponsiveContainer width="100%" height={200}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="rgba(255,255,255,0.08)" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 10 }} />
            <PolarRadiusAxis domain={[0, 100]} tick={{ fill: '#4b5563', fontSize: 9 }} />
            <Radar name="Score" dataKey="value" stroke="#6272f2" fill="#6272f2" fillOpacity={0.25} strokeWidth={2} />
            <Tooltip contentStyle={{ background: '#1a1040', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }} itemStyle={{ color: '#a5bbfc' }} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* AI Tips */}
      <div className="glass-card p-6">
        <h2 className="section-title mb-4">{t.improveTips}</h2>
        {ownerData ? (
          <div className="markdown-content">
            <ReactMarkdown>{ownerData.tips}</ReactMarkdown>
          </div>
        ) : (
          <div className="animate-pulse space-y-2">
            <div className="h-3 bg-white/8 rounded-full w-full" />
            <div className="h-3 bg-white/8 rounded-full w-4/5" />
            <div className="h-3 bg-white/8 rounded-full w-3/4" />
          </div>
        )}
      </div>

      {/* Footer */}
      <p className="text-center text-xs text-gray-600 pb-8">
        This score is based on alternate data sources and is for informational purposes only.
        Contact your bank for official credit decisions.
      </p>
    </div>
  )
}
