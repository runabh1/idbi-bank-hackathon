import React, { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { useParams, Link, Navigate } from 'react-router-dom'
import { ArrowLeft, Globe, TrendingUp, Download, Printer, ChevronDown, EyeOff, Shield, Clock, CheckCircle, XCircle } from 'lucide-react'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip
} from 'recharts'
import { getApplicant, explainOwner } from '../api'
import { RiskBadge } from '../components/RiskBadge'
import { ScoreGauge } from '../components/ScoreGauge'
import { useTranslation } from '../i18n'
import { useToast } from '../components/Toast'
import { useAuth } from '../AuthContext'

import { ChartRadarDots, StatCard } from '../components/SharedOwnerCards'

export default function OwnerView() {
  const { id } = useParams()
  const [app, setApp] = useState(null)
  const [ownerData, setOwnerData] = useState(null)
  const [lang, setLang] = useState('en')
  const [loanStatus, setLoanStatus] = useState(localStorage.getItem(`loanStatus_${id}`) || 'none')
  const t = useTranslation(lang)
  const addToast = useToast()
  const { user } = useAuth()

  if (user && user.role === 'applicant' && String(user.id) !== String(id)) {
    return <Navigate to={`/my-score/${user.id}`} replace />
  }

  useEffect(() => {
    let cancelled = false
    setApp(null)
    setOwnerData(null)
    Promise.all([getApplicant(id), explainOwner(id)]).then(([appData, ownerRes]) => {
      if (!cancelled) {
        setApp(appData)
        setOwnerData(ownerRes)
      }
    })
    return () => { cancelled = true }
  }, [id])

  useEffect(() => {
    setLoanStatus(localStorage.getItem(`loanStatus_${id}`) || 'none')
  }, [id])

  const handlePrint = () => {
    addToast('Preparing score card for printing…', 'info')
    setTimeout(() => window.print(), 400)
  }

  const handleApplyLoan = () => {
    setLoanStatus('pending')
    localStorage.setItem(`loanStatus_${id}`, 'pending')
    addToast('Loan application submitted! We will review your profile.', 'success')
  }

  if (!app) return (
    <div className="flex items-center justify-center h-screen bg-[#F7F8FA]">
      <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const radarData = [
    { subject: t.revenueStability, value: Math.round(app.revenue_stability_score ?? 50), fullMark: 100 },
    { subject: t.cashflowHealth, value: Math.round(app.cashflow_health_score ?? 50), fullMark: 100 },
    { subject: t.bankingDiscipline, value: Math.round(app.banking_discipline_score ?? 50), fullMark: 100 },
    { subject: t.compliance, value: Math.round(app.compliance_score ?? 50), fullMark: 100 },
    { subject: t.employmentStability, value: Math.round(app.employment_stability_score ?? 50), fullMark: 100 },
  ]

  const scoreValue = Math.round(app.blended_score ?? 50)
  const scoreChange = 15 // Mock trend for UI

  return (
    <div className="max-w-6xl mx-auto space-y-4 animate-fade-in pb-12 pt-4 px-4 font-sans text-gray-900">
      <style>{`
        body { background: #F7F8FA !important; }
        @media print {
          .no-print { display: none !important; }
          body { background: #fff !important; }
          .premium-card { border: 1px solid #e5e7eb !important; box-shadow: none !important; }
        }
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

      {/* Top Header Actions */}
      <div className="flex items-center justify-between no-print mb-4">
        <Link to={`/applicant/${id}`} className="flex items-center gap-2 text-gray-500 hover:text-black transition-colors font-medium">
          <ArrowLeft className="w-4 h-4" /> {t.back}
        </Link>
        <div className="flex items-center gap-3">
          {loanStatus === 'none' && (
            <button onClick={handleApplyLoan} className="bg-gray-900 text-white shadow-md rounded-full px-5 py-2 text-sm font-semibold hover:bg-black hover:shadow-lg transition-all flex items-center gap-2">
              {t.applyLoan}
            </button>
          )}
          {loanStatus === 'pending' && (
            <div className="bg-amber-50 text-amber-600 border border-amber-200 shadow-sm rounded-full px-4 py-2 text-sm font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4" /> Pending Review
            </div>
          )}
          {loanStatus === 'approved' && (
            <div className="bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-sm rounded-full px-4 py-2 text-sm font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> Loan Approved
            </div>
          )}
          {loanStatus === 'rejected' && (
            <div className="bg-red-50 text-red-600 border border-red-200 shadow-sm rounded-full px-4 py-2 text-sm font-semibold flex items-center gap-2">
              <XCircle className="w-4 h-4" /> Loan Rejected
            </div>
          )}
          
          <button onClick={handlePrint} className="bg-white border border-gray-200 shadow-sm rounded-full px-4 py-2 text-sm font-medium hover:bg-gray-50 flex items-center gap-2 transition-all">
            <Printer className="w-4 h-4" /> {t.print}
          </button>
          <div className="flex items-center bg-white border border-gray-200 rounded-full p-1 shadow-sm">
            {['en', 'hi'].map(l => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
                  lang === l ? 'bg-gray-100 text-black' : 'text-gray-500 hover:text-black'
                }`}
              >
                {l === 'en' ? 'EN' : 'HI'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loanStatus === 'approved' && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 mb-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-emerald-900">Congratulations! Your Loan Application is Approved</h3>
            <p className="text-sm text-emerald-700 font-medium">Your excellent credit profile qualifies you for premium terms. A loan officer will contact you shortly with the disbursement details.</p>
          </div>
        </div>
      )}
      
      {loanStatus === 'rejected' && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-red-900">Loan Application Status: Rejected</h3>
              <p className="text-sm text-red-700 font-medium">Unfortunately, we cannot proceed with your loan request at this time. Please review your AI Improvement Tips below to improve your score.</p>
            </div>
          </div>
          <button 
            onClick={handleApplyLoan} 
            className="bg-red-600 text-white shadow-md rounded-xl px-6 py-2.5 text-sm font-semibold hover:bg-red-700 hover:shadow-lg transition-all whitespace-nowrap self-start sm:self-center"
          >
            Re-apply for Loan
          </button>
        </div>
      )}

      {/* Row 1: Core Metrics & Tier (Score & Risk) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Balances Equivalent */}
        <div className="premium-card p-8 flex flex-col justify-between h-[160px]">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-gray-900">{t.creditScore}</h2>
              <div className="group relative flex items-center cursor-help">
                <div className="w-5 h-5 rounded-full border border-gray-300 text-gray-400 flex items-center justify-center text-[10px] font-bold">?</div>
                <div className="absolute z-50 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-opacity bottom-full mb-2 left-1/2 -translate-x-1/2 w-max max-w-[220px] text-center rounded-lg border border-gray-200 bg-white px-3 py-2.5 shadow-md text-xs font-semibold text-gray-600 pointer-events-none">
                  {t.ttCreditScore}
                </div>
              </div>
              <div className="flex gap-2">
                <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-3 py-1 rounded-full">{app.business_name}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-3 py-1 cursor-pointer">
              <span className="text-sm font-medium text-gray-600">{t.updated}</span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>
          </div>
          
          <div className="flex items-center gap-4 mt-2">
            <h1 className="text-[3.5rem] font-bold tracking-tight text-gray-900 leading-none">
              {scoreValue}<span className="text-3xl text-gray-300">/100</span>
            </h1>
            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100 cursor-pointer">
              <EyeOff className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Membership Tier Equivalent */}
        <div className="premium-card p-8 flex flex-col justify-center h-[160px]">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <span className="text-gray-500 font-semibold text-lg">{t.riskTier} :</span>
              <span className="text-4xl font-bold text-gray-900">{app.risk_tier ?? 'Near-Prime'}</span>
              <div className="group relative flex items-center cursor-help">
                <div className="w-5 h-5 rounded-full border border-gray-300 text-gray-400 flex items-center justify-center text-[10px] font-bold">?</div>
                <div className="absolute z-50 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-opacity bottom-full mb-2 left-1/2 -translate-x-1/2 w-max max-w-[220px] text-center rounded-lg border border-gray-200 bg-white px-3 py-2.5 shadow-md text-xs font-semibold text-gray-600 pointer-events-none">
                  {t.ttRiskTier}
                </div>
              </div>
            </div>
            <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Portfolio & Rewards (Breakdown & Insights) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Left Column: Breakdown Cards */}
        <div className="premium-card p-8 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                <Shield className="w-5 h-5 text-gray-700" />
              </div>
              <h3 className="text-xl font-bold">{t.scoreBreakdown}</h3>
            </div>
            <button 
              onClick={() => document.getElementById('ai-tips')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-sm font-semibold border border-gray-200 rounded-full px-5 py-2 hover:bg-gray-50 transition-colors"
            >
              {t.viewDetails}
            </button>
          </div>

          <div className="mb-8">
            <h2 className="text-4xl font-bold text-gray-900 flex items-baseline">
              {scoreValue}
            </h2>
            <div className="inline-flex items-center gap-1 bg-green-100/80 text-green-700 px-3 py-1 rounded-md text-sm font-bold mt-2">
              ▲ {scoreChange} <span className="font-medium text-green-600/80 ml-1">Last 30 Days</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 flex-1">
            <StatCard label={t.revenueStability} value={Math.round(app.revenue_stability_score ?? 50)} sub="GST Data" tooltip={t.ttRevenue} />
            <StatCard label={t.cashflowHealth} value={Math.round(app.cashflow_health_score ?? 50)} sub="UPI Records" tooltip={t.ttCashflow} />
            <StatCard label={t.bankingDiscipline} value={Math.round(app.banking_discipline_score ?? 50)} sub="AA Bank Data" tooltip={t.ttBanking} />
            <StatCard label={t.compliance} value={Math.round(app.compliance_score ?? 50)} sub="Filing History" tooltip={t.ttCompliance} />
            <StatCard label={t.employmentStability} value={Math.round(app.employment_stability_score ?? 50)} sub="EPFO Records" tooltip={t.ttEmployment} />
          </div>
        </div>

        {/* Right Column: Radar Chart */}
        <div className="premium-card p-8 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-gray-700" />
              </div>
              <h3 className="text-xl font-bold">{t.profileAnalysis}</h3>
            </div>
            <button className="text-sm font-semibold border border-gray-200 rounded-full px-5 py-2 hover:bg-gray-50 transition-colors">
              {t.refreshData}
            </button>
          </div>
          
          <div className="flex-1 w-full bg-gray-50/50 rounded-[20px] border border-gray-100 p-2">
            <ChartRadarDots data={radarData} t={t} />
          </div>
        </div>
      </div>

      {/* AI Tips Full Width Card */}
      <div id="ai-tips" className="premium-card p-8 mt-4">
        <h2 className="text-xl font-bold mb-4 text-gray-900">{t.improveTips}</h2>
        {ownerData ? (
          <div className="markdown-light max-w-4xl">
            <ReactMarkdown>{ownerData.tips}</ReactMarkdown>
          </div>
        ) : (
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded-full w-full" />
            <div className="h-4 bg-gray-200 rounded-full w-4/5" />
            <div className="h-4 bg-gray-200 rounded-full w-3/4" />
          </div>
        )}
      </div>

      <p className="text-center text-xs text-gray-400 pt-6 pb-2">
        This score is based on alternate data sources and is for informational purposes only.
      </p>
    </div>
  )
}
