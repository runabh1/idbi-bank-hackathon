import React, { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts'
import { Search, SortAsc, SortDesc, ChevronRight, TrendingUp, Users, AlertTriangle, CheckCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { getApplicants, getPortfolio } from '../api'
import { RiskBadge, getTierColor } from '../components/RiskBadge'
import { ScoreGauge } from '../components/ScoreGauge'

const TIER_ORDER = ['Prime', 'Near-Prime', 'Sub-Prime', 'Decline']

export default function Dashboard() {
  const navigate = useNavigate()
  const [applicants, setApplicants] = useState([])
  const [portfolio, setPortfolio] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sectorFilter, setSectorFilter] = useState('all')
  const [tierFilter, setTierFilter] = useState('all')
  const [sortKey, setSortKey] = useState('blended_score')
  const [sortDir, setSortDir] = useState('desc')

  useEffect(() => {
    Promise.all([getApplicants(), getPortfolio()])
      .then(([apps, port]) => {
        setApplicants(apps)
        setPortfolio(port)
      })
      .finally(() => setLoading(false))
  }, [])

  const sectors = useMemo(() =>
    ['all', ...new Set(applicants.map(a => a.sector))], [applicants])

  const filtered = useMemo(() => {
    let res = applicants
    if (search) res = res.filter(a =>
      a.business_name.toLowerCase().includes(search.toLowerCase()) ||
      a.region.toLowerCase().includes(search.toLowerCase())
    )
    if (sectorFilter !== 'all') res = res.filter(a => a.sector === sectorFilter)
    if (tierFilter !== 'all') res = res.filter(a => a.risk_tier === tierFilter)
    res = [...res].sort((a, b) => {
      const av = a[sortKey] ?? 0, bv = b[sortKey] ?? 0
      return sortDir === 'asc' ? av - bv : bv - av
    })
    return res
  }, [applicants, search, sectorFilter, tierFilter, sortKey, sortDir])

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">Loading portfolio data…</p>
      </div>
    </div>
  )

  const tierDist = portfolio?.tier_distribution || {}
  const tierCards = [
    { tier: 'Prime', count: tierDist.Prime || 0, icon: CheckCircle, color: 'text-emerald-400' },
    { tier: 'Near-Prime', count: tierDist['Near-Prime'] || 0, icon: TrendingUp, color: 'text-amber-400' },
    { tier: 'Sub-Prime', count: tierDist['Sub-Prime'] || 0, icon: AlertTriangle, color: 'text-orange-400' },
    { tier: 'Decline', count: tierDist.Decline || 0, icon: AlertTriangle, color: 'text-red-400' },
  ]

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold text-white">Loan Officer Dashboard</h1>
        <p className="text-gray-400 mt-1">
          {portfolio?.total_applicants} MSME applicants · Avg score: <span className="text-brand-400 font-semibold">{portfolio?.avg_score}</span>
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {tierCards.map(({ tier, count, icon: Icon, color }, i) => (
          <motion.div
            key={tier}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.3 }}
            className="glass-card p-5 flex items-center gap-4 cursor-pointer hover:bg-white/8 transition-all duration-200"
            onClick={() => setTierFilter(tierFilter === tier ? 'all' : tier)}
          >
            <div className={`p-3 rounded-xl bg-white/5 ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-display font-bold text-white">{count}</p>
              <p className="text-xs text-gray-400">{tier}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Score distribution chart */}
      {portfolio?.score_distribution && (
        <div className="glass-card p-6">
          <h2 className="section-title mb-4">Score Distribution</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={portfolio.score_distribution} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="range" tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#1a1040', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }}
                labelStyle={{ color: '#e5e7eb' }}
                itemStyle={{ color: '#a5bbfc' }}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {portfolio.score_distribution.map((entry, i) => {
                  const mid = (parseInt(entry.range.split('-')[0]) + parseInt(entry.range.split('-')[1])) / 2
                  return <Cell key={i} fill={
                    mid >= 75 ? '#10b981' : mid >= 55 ? '#f59e0b' : mid >= 35 ? '#f97316' : '#ef4444'
                  } />
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            id="search-applicants"
            className="input-field pl-10 w-full"
            placeholder="Search by name or city…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          id="sector-filter"
          className="input-field capitalize"
          value={sectorFilter}
          onChange={e => setSectorFilter(e.target.value)}
        >
          {sectors.map(s => <option key={s} value={s} className="bg-gray-900">{s === 'all' ? 'All Sectors' : s.replace('_', ' ')}</option>)}
        </select>
        <select
          id="tier-filter"
          className="input-field"
          value={tierFilter}
          onChange={e => setTierFilter(e.target.value)}
        >
          <option value="all" className="bg-gray-900">All Tiers</option>
          {TIER_ORDER.map(t => <option key={t} value={t} className="bg-gray-900">{t}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8">
                {[
                  { key: 'business_name', label: 'Business' },
                  { key: 'sector', label: 'Sector' },
                  { key: 'region', label: 'Region' },
                  { key: 'entity_type', label: 'Type' },
                  { key: 'blended_score', label: 'Score' },
                  { key: 'risk_tier', label: 'Tier' },
                ].map(col => (
                  <th
                    key={col.key}
                    className="text-left px-5 py-4 text-xs text-gray-400 uppercase tracking-wider font-medium cursor-pointer hover:text-white transition-colors"
                    onClick={() => toggleSort(col.key)}
                  >
                    <span className="flex items-center gap-1">
                      {col.label}
                      {sortKey === col.key && (
                        sortDir === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />
                      )}
                    </span>
                  </th>
                ))}
                <th className="px-5 py-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map(app => (
                <tr
                  key={app.applicant_id}
                  className="hover:bg-white/4 transition-colors cursor-pointer group"
                  onClick={() => navigate(`/applicant/${app.applicant_id}`)}
                >
                  <td className="px-5 py-4">
                    <p className="font-medium text-white group-hover:text-brand-400 transition-colors">
                      {app.business_name}
                    </p>
                    <p className="text-xs text-gray-500">{app.years_in_business}y active · #{app.applicant_id}</p>
                  </td>
                  <td className="px-5 py-4 capitalize text-gray-300">{(app.sector || '').replace('_', ' ')}</td>
                  <td className="px-5 py-4 text-gray-300">{app.region}</td>
                  <td className="px-5 py-4">
                    <span className="text-xs px-2 py-0.5 rounded-md bg-white/8 text-gray-300">{app.entity_type}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${app.blended_score}%`,
                            background: getTierColor(app.risk_tier)
                          }}
                        />
                      </div>
                      <span className="font-semibold text-white">{Math.round(app.blended_score)}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <RiskBadge tier={app.risk_tier} size="sm" />
                  </td>
                  <td className="px-5 py-4">
                    <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-brand-400 transition-colors" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-white/5 text-xs text-gray-500">
          Showing {filtered.length} of {applicants.length} applicants
        </div>
      </div>
    </div>
  )
}
