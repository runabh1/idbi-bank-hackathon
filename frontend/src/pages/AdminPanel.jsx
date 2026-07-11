import React, { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts'
import { Shield, Brain, TrendingUp, AlertOctagon } from 'lucide-react'
import { getPortfolio } from '../api'

function MetricCard({ label, value, subtitle, color = 'text-brand-600' }) {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgb(0,0,0,0.12)]">
      <p className="text-xs font-bold text-gray-400 tracking-wider uppercase mb-3">{label}</p>
      <p className={`font-display text-4xl font-bold ${color} mb-1 leading-none`}>{value}</p>
      {subtitle && <p className="text-sm text-gray-500 font-medium mt-2">{subtitle}</p>}
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
        <h1 className="font-display text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Shield className="w-8 h-8 text-brand-600" /> Admin & Fairness Panel
        </h1>
        <p className="text-gray-500 mt-1">Model performance, bias monitoring, and portfolio analytics</p>
      </div>

      {/* Model metrics */}
      <section>
        <h2 className="section-title mb-4 flex items-center gap-2 text-gray-900">
          <Brain className="w-5 h-5 text-brand-500" /> ML Model Performance
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard label="XGBoost Accuracy" value={xgbMetrics.accuracy ? `${(xgbMetrics.accuracy * 100).toFixed(1)}%` : 'N/A'} subtitle="Test set" color="text-emerald-500" />
          <MetricCard label="XGBoost ROC-AUC" value={xgbMetrics.roc_auc ?? 'N/A'} subtitle="Higher is better" color="text-indigo-500" />
          <MetricCard label="XGBoost F1 Score" value={xgbMetrics.f1 ?? 'N/A'} subtitle="Balanced metric" color="text-amber-500" />
          <MetricCard label="LR Baseline AUC" value={lrMetrics.roc_auc ?? 'N/A'} subtitle="Comparison baseline" color="text-gray-500" />
        </div>

        {metrics.length > 0 && (
          <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-6 mt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Model', 'Accuracy', 'Precision', 'Recall', 'F1', 'ROC-AUC'].map(h => (
                    <th key={h} className="text-left py-4 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {metrics.map(m => (
                  <tr key={m.model} className="hover:bg-gray-50 transition-colors group">
                    <td className="py-4 px-4 font-semibold text-gray-900 capitalize">{m.model?.replace('_', ' ')}</td>
                    <td className="py-4 px-4 text-gray-500 font-medium">{m.accuracy ? `${(m.accuracy * 100).toFixed(1)}%` : '—'}</td>
                    <td className="py-4 px-4 text-gray-500 font-medium">{m.precision ?? '—'}</td>
                    <td className="py-4 px-4 text-gray-500 font-medium">{m.recall ?? '—'}</td>
                    <td className="py-4 px-4 text-gray-500 font-medium">{m.f1 ?? '—'}</td>
                    <td className="py-4 px-4">
                      <span className="text-indigo-500 font-bold">{m.roc_auc ?? '—'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Portfolio overview */}
      <div className="grid lg:grid-cols-3 gap-6">
        <MetricCard
          label="Total Applicants"
          value={portfolio?.total_applicants}
          subtitle="Across all sectors"
          color="text-gray-900"
        />
        <MetricCard
          label="Average Score"
          value={portfolio?.avg_score}
          subtitle="Portfolio mean (0-100)"
          color="text-indigo-500"
        />
        <MetricCard
          label="Prime Rate"
          value={portfolio?.tier_distribution?.Prime
            ? `${((portfolio.tier_distribution.Prime / portfolio.total_applicants) * 100).toFixed(1)}%`
            : 'N/A'}
          subtitle="Borrowers in Prime tier"
          color="text-emerald-500"
        />
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Risk tier pie */}
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-6">
          <h2 className="section-title mb-4 text-gray-900">Risk Tier Distribution</h2>
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
                contentStyle={{ background: '#ffffff', border: '1px solid #f3f4f6', borderRadius: 8, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                itemStyle={{ color: '#4b5563', fontWeight: 500 }}
                formatter={(value, name) => [`${value} applicants`, name]}
              />
              <Legend
                formatter={(v) => {
                  const entry = tierData.find(d => d.name === v)
                  const count = entry ? entry.value : 0
                  return (
                    <span style={{ color: '#6b7280', fontSize: 13, fontWeight: 500 }}>
                      {v}: <strong style={{ color: '#111827' }}>{count}</strong>
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
                <span key={d.name} className="text-xs text-gray-500 font-medium">
                  <span style={{ color: d.color }}>●</span> {d.name}: 0
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Score distribution */}
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-6">
          <h2 className="section-title mb-4 text-gray-900">Score Distribution Histogram</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={portfolio?.score_distribution || []} barSize={22}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="range" tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false} tickMargin={8} />
              <Tooltip
                cursor={false}
                contentStyle={{ background: '#ffffff', border: '1px solid #f3f4f6', borderRadius: 8, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                labelStyle={{ color: '#111827', fontWeight: 600, marginBottom: 4 }}
                itemStyle={{ color: '#4b5563' }}
              />
              <Bar dataKey="count" radius={6}>
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
        <h2 className="section-title mb-4 flex items-center gap-2 text-gray-900">
          <AlertOctagon className="w-5 h-5 text-amber-500" /> Fairness & Bias Monitoring
        </h2>
        <div className="grid lg:grid-cols-2 gap-6">
          {/* By sector */}
          <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-6">
            <h3 className="text-sm font-bold tracking-wide text-gray-500 uppercase mb-4">Avg Score by Sector</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={sectorData} layout="vertical" barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis dataKey="sector" type="category" width={100} tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip cursor={false} contentStyle={{ background: '#ffffff', border: '1px solid #f3f4f6', borderRadius: 8, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="score" radius={[0, 5, 5, 0]}>
                  {sectorData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* By region tier */}
          <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-6">
            <h3 className="text-sm font-bold tracking-wide text-gray-500 uppercase mb-4">Avg Score by City Tier</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={regionData} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="region" tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false} tickMargin={8} />
                <Tooltip cursor={false} contentStyle={{ background: '#ffffff', border: '1px solid #f3f4f6', borderRadius: 8, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="score" radius={6} fill="#6272f2" />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-gray-500 font-medium mt-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
              <span className="font-bold text-gray-700">Fairness check:</span> Score gap between Tier1 and Tier3 cities should be &lt;10 pts for unbiased model.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
