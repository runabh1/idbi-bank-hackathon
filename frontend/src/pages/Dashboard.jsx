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
    <div className="space-y-8 animate-fade-in p-6">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="h-10 w-48 bg-gray-200 rounded-lg animate-pulse mb-2"></div>
          <div className="h-5 w-64 bg-gray-200 rounded-md animate-pulse"></div>
        </div>
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white rounded-3xl p-6 flex items-center gap-5 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse"></div>
            <div className="flex flex-col gap-2">
              <div className="h-8 w-16 bg-gray-200 rounded-md animate-pulse"></div>
              <div className="h-4 w-24 bg-gray-200 rounded-md animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart Skeleton */}
      <div className="premium-card p-6 h-72 flex flex-col gap-4">
        <div className="h-6 w-40 bg-gray-200 rounded-md animate-pulse"></div>
        <div className="flex-1 bg-gray-100 rounded-lg animate-pulse"></div>
      </div>

      {/* Filters Skeleton */}
      <div className="flex flex-wrap gap-3">
        <div className="h-10 w-64 bg-gray-200 rounded-xl animate-pulse"></div>
        <div className="h-10 w-40 bg-gray-200 rounded-xl animate-pulse"></div>
        <div className="h-10 w-40 bg-gray-200 rounded-xl animate-pulse"></div>
      </div>

      {/* Table Skeleton */}
      <div className="premium-card overflow-hidden">
        <div className="w-full bg-gray-50/50 border-b border-gray-100 h-12 flex items-center px-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-4 w-20 bg-gray-200 rounded animate-pulse flex-1"></div>
          ))}
        </div>
        <div className="divide-y divide-gray-100">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-20 flex items-center px-6 gap-4">
              <div className="flex-1 space-y-2">
                <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-3 w-24 bg-gray-100 rounded animate-pulse"></div>
              </div>
              <div className="flex-1"><div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div></div>
              <div className="flex-1"><div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div></div>
              <div className="flex-1"><div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse"></div></div>
              <div className="flex-1 flex items-center gap-2">
                <div className="h-2 w-20 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="h-5 w-8 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="flex-1"><div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse"></div></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const tierDist = portfolio?.tier_distribution || {}
  const tierCards = [
    { tier: 'Prime', count: tierDist.Prime || 0, icon: CheckCircle, color: 'text-emerald-500', bgColor: 'bg-emerald-50' },
    { tier: 'Near-Prime', count: tierDist['Near-Prime'] || 0, icon: TrendingUp, color: 'text-amber-500', bgColor: 'bg-amber-50' },
    { tier: 'Sub-Prime', count: tierDist['Sub-Prime'] || 0, icon: AlertTriangle, color: 'text-orange-500', bgColor: 'bg-orange-50' },
    { tier: 'Decline', count: tierDist.Decline || 0, icon: AlertTriangle, color: 'text-red-500', bgColor: 'bg-red-50' },
  ]

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-gray-500 mt-2 text-sm">
            {portfolio?.total_applicants} Total Applicants · Average Score: <span className="text-gray-900 font-semibold">{portfolio?.avg_score}</span>
          </p>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {tierCards.map(({ tier, count, icon: Icon, color, bgColor }, i) => (
          <motion.div
            key={tier}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.3 }}
            className="bg-white rounded-3xl p-6 flex items-center gap-5 cursor-pointer hover:-translate-y-1 transition-all duration-300"
            style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}
            onClick={() => setTierFilter(tierFilter === tier ? 'all' : tier)}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${bgColor} ${color}`}>
              <Icon className="w-5 h-5" strokeWidth={2} />
            </div>
            <div className="flex flex-col">
              <p className="text-3xl font-display font-bold text-gray-900 mb-1 leading-none">{count}</p>
              <p className="text-sm font-medium text-gray-500">{tier}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Score distribution chart */}
      {portfolio?.score_distribution && (
        <div className="premium-card p-6">
          <div className="flex flex-col space-y-1.5 pb-6">
            <h2 className="font-semibold leading-none tracking-tight text-xl text-gray-900">Score Distribution</h2>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart accessibilityLayer data={portfolio.score_distribution} barSize={32}>
              <CartesianGrid vertical={false} stroke="#f3f4f6" />
              <XAxis 
                dataKey="range" 
                tick={{ fill: '#6b7280', fontSize: 12 }} 
                tickLine={false} 
                tickMargin={10} 
                axisLine={false} 
              />
              <YAxis 
                tick={{ fill: '#6b7280', fontSize: 12 }} 
                tickLine={false}
                tickMargin={10} 
                axisLine={false} 
              />
              <Tooltip
                cursor={false}
                contentStyle={{ background: '#ffffff', border: '1px solid #f3f4f6', borderRadius: 8, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                labelStyle={{ color: '#111827', fontWeight: 600, marginBottom: 4 }}
                itemStyle={{ color: '#4b5563' }}
              />
              <Bar dataKey="count" radius={8}>
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
          {sectors.map(s => <option key={s} value={s} className="bg-white text-gray-900">{s === 'all' ? 'All Sectors' : s.replace('_', ' ')}</option>)}
        </select>
        <select
          id="tier-filter"
          className="input-field"
          value={tierFilter}
          onChange={e => setTierFilter(e.target.value)}
        >
          <option value="all" className="bg-white text-gray-900">All Tiers</option>
          {TIER_ORDER.map(t => <option key={t} value={t} className="bg-white text-gray-900">{t}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="premium-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
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
                    className="text-left px-6 py-4 text-xs text-gray-500 uppercase tracking-wider font-semibold cursor-pointer hover:text-gray-900 transition-colors"
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
            <tbody className="divide-y divide-gray-100">
              {filtered.map(app => (
                <tr
                  key={app.applicant_id}
                  className="hover:bg-gray-50 transition-colors cursor-pointer group"
                  onClick={() => navigate(`/applicant/${app.applicant_id}`)}
                >
                  <td className="px-6 py-5">
                    <p className="font-semibold text-gray-900 group-hover:text-brand-600 transition-colors">
                      {app.business_name}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{app.years_in_business}y active · #{app.applicant_id}</p>
                  </td>
                  <td className="px-6 py-5 capitalize text-gray-600 font-medium">{(app.sector || '').replace('_', ' ')}</td>
                  <td className="px-6 py-5 text-gray-600 font-medium">{app.region}</td>
                  <td className="px-6 py-5">
                    <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 font-medium">{app.entity_type}</span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${app.blended_score}%`,
                            background: getTierColor(app.risk_tier)
                          }}
                        />
                      </div>
                      <span className="font-bold text-gray-900">{Math.round(app.blended_score)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <RiskBadge tier={app.risk_tier} size="md" />
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-200 transition-colors">
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-900 transition-colors" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 text-sm font-medium text-gray-500 text-center">
          Showing {filtered.length} of {applicants.length} applicants
        </div>
      </div>
    </div>
  )
}
