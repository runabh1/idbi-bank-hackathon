import React, { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts'
import { Shield, Brain, TrendingUp, AlertOctagon } from 'lucide-react'
import { getPortfolio } from '../api'

function MetricCard({ label, value, subtitle, color = 'text-brand-400' }) {
  return (
    <div className="glass-card p-5">
      <p className="label-text mb-2">{label}</p>
      <p className={`font-display text-3xl font-bold ${color}`}>{value}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  )
}

const TIER_COLORS = {
  Prime: '#10b981',
  'Near-Prime': '#f59e0b',
  'Sub-Prime': '#f97316',
  Decline: '#ef4444',
}

const SECTOR_COLORS = ['#6272f2', '#10b981', '#f59e0b', '#f97316', '#8b5cf6']

export default function AdminPanel() {
  const [portfolio, setPortfolio] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPortfolio()
      .then(setPortfolio)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const tierData = Object.entries(portfolio?.tier_distribution || {}).map(([k, v]) => ({
    name: k, value: v, color: TIER_COLORS[k]
  }))

  const sectorData = Object.entries(portfolio?.avg_score_by_sector || {}).map(([k, v], i) => ({
    sector: k.replace('_', ' '), score: v, color: SECTOR_COLORS[i % SECTOR_COLORS.length]
  }))

  const regionData = Object.entries(portfolio?.avg_score_by_region || {}).map(([k, v]) => ({
    region: k, score: v
  }))

  const metrics = portfolio?.model_metrics || []
  const xgbMetrics = metrics.find(m => m.model === 'xgboost') || {}
  const lrMetrics = metrics.find(m => m.model === 'logistic_regression') || {}

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold text-white flex items-center gap-3">
          <Shield className="w-8 h-8 text-brand-400" /> Admin & Fairness Panel
        </h1>
        <p className="text-gray-400 mt-1">Model performance, bias monitoring, and portfolio analytics</p>
      </div>

      {/* Model metrics */}
      <section>
        <h2 className="section-title mb-4 flex items-center gap-2">
          <Brain className="w-4 h-4 text-purple-400" /> ML Model Performance
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard label="XGBoost Accuracy" value={xgbMetrics.accuracy ? `${(xgbMetrics.accuracy * 100).toFixed(1)}%` : 'N/A'} subtitle="Test set" color="text-emerald-400" />
          <MetricCard label="XGBoost ROC-AUC" value={xgbMetrics.roc_auc ?? 'N/A'} subtitle="Higher is better" color="text-brand-400" />
          <MetricCard label="XGBoost F1 Score" value={xgbMetrics.f1 ?? 'N/A'} subtitle="Balanced metric" color="text-amber-400" />
          <MetricCard label="LR Baseline AUC" value={lrMetrics.roc_auc ?? 'N/A'} subtitle="Comparison baseline" color="text-gray-400" />
        </div>

        {metrics.length > 0 && (
          <div className="glass-card p-6 mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8">
                  {['Model', 'Accuracy', 'Precision', 'Recall', 'F1', 'ROC-AUC'].map(h => (
                    <th key={h} className="text-left py-3 px-4 label-text">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {metrics.map(m => (
                  <tr key={m.model} className="hover:bg-white/4 transition-colors">
                    <td className="py-3 px-4 font-medium text-white capitalize">{m.model?.replace('_', ' ')}</td>
                    <td className="py-3 px-4 text-gray-300">{m.accuracy ? `${(m.accuracy * 100).toFixed(1)}%` : '—'}</td>
                    <td className="py-3 px-4 text-gray-300">{m.precision ?? '—'}</td>
                    <td className="py-3 px-4 text-gray-300">{m.recall ?? '—'}</td>
                    <td className="py-3 px-4 text-gray-300">{m.f1 ?? '—'}</td>
                    <td className="py-3 px-4">
                      <span className="text-brand-400 font-semibold">{m.roc_auc ?? '—'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Portfolio overview */}
      <div className="grid lg:grid-cols-3 gap-4">
        <MetricCard
          label="Total Applicants"
          value={portfolio?.total_applicants}
          subtitle="Across all sectors"
          color="text-white"
        />
        <MetricCard
          label="Average Score"
          value={portfolio?.avg_score}
          subtitle="Portfolio mean (0-100)"
          color="text-brand-400"
        />
        <MetricCard
          label="Prime Rate"
          value={portfolio?.tier_distribution?.Prime
            ? `${((portfolio.tier_distribution.Prime / portfolio.total_applicants) * 100).toFixed(1)}%`
            : 'N/A'}
          subtitle="Borrowers in Prime tier"
          color="text-emerald-400"
        />
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Risk tier pie */}
        <div className="glass-card p-6">
          <h2 className="section-title mb-4">Risk Tier Distribution</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={tierData.filter(d => d.value > 0)}
                cx="50%" cy="50%"
                innerRadius={60}
                outerRadius={90}
                dataKey="value"
              >
                {tierData.filter(d => d.value > 0).map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#1a1040', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }}
                itemStyle={{ color: '#e5e7eb' }}
                formatter={(value, name) => [`${value} applicants`, name]}
              />
              <Legend
                formatter={(v) => {
                  const entry = tierData.find(d => d.name === v)
                  const count = entry ? entry.value : 0
                  return (
                    <span style={{ color: '#d1d5db', fontSize: 12 }}>
                      {v}: <strong style={{ color: '#fff' }}>{count}</strong>
                    </span>
                  )
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Zero-value tiers shown as text list so they're never lost */}
          {tierData.filter(d => d.value === 0).length > 0 && (
            <div className="flex flex-wrap gap-3 mt-1 justify-center">
              {tierData.filter(d => d.value === 0).map(d => (
                <span key={d.name} className="text-xs text-gray-500">
                  <span style={{ color: d.color }}>●</span> {d.name}: 0
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Score distribution */}
        <div className="glass-card p-6">
          <h2 className="section-title mb-4">Score Distribution Histogram</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={portfolio?.score_distribution || []} barSize={22}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="range" tick={{ fill: '#9ca3af', fontSize: 10 }} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} />
              <Tooltip
                contentStyle={{ background: '#1a1040', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }}
                labelStyle={{ color: '#e5e7eb' }}
                itemStyle={{ color: '#a5bbfc' }}
              />
              <Bar dataKey="count" radius={[5, 5, 0, 0]}>
                {(portfolio?.score_distribution || []).map((entry, i) => {
                  const mid = (parseInt(entry.range.split('-')[0]) + parseInt(entry.range.split('-')[1])) / 2
                  return <Cell key={i} fill={mid >= 75 ? '#10b981' : mid >= 55 ? '#f59e0b' : mid >= 35 ? '#f97316' : '#ef4444'} />
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Fairness section */}
      <section>
        <h2 className="section-title mb-4 flex items-center gap-2">
          <AlertOctagon className="w-4 h-4 text-amber-400" /> Fairness & Bias Monitoring
        </h2>
        <div className="grid lg:grid-cols-2 gap-6">
          {/* By sector */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-gray-300 mb-4">Avg Score by Sector</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={sectorData} layout="vertical" barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                <YAxis dataKey="sector" type="category" width={100} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: '#1a1040', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }} />
                <Bar dataKey="score" radius={[0, 5, 5, 0]}>
                  {sectorData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* By region tier */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-gray-300 mb-4">Avg Score by City Tier</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={regionData} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="region" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#1a1040', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }} />
                <Bar dataKey="score" radius={[6, 6, 0, 0]} fill="#6272f2" />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-gray-500 mt-3">
              Fairness check: Score gap between Tier1 and Tier3 cities should be &lt;10 pts for unbiased model.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
