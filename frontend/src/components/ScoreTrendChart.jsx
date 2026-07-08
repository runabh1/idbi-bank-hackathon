import React, { useEffect, useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { getTrend } from '../api'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const val = payload[0].value
  return (
    <div className="glass-card px-3 py-2 border border-white/10 text-xs">
      <p className="text-gray-400">{label}</p>
      <p className="text-white font-semibold mt-0.5">Score: <span className="text-brand-400">{val}</span></p>
    </div>
  )
}

export default function ScoreTrendChart({ applicantId, currentScore }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!applicantId) return
    setLoading(true)
    getTrend(applicantId)
      .then(res => setData(res))
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [applicantId])

  if (loading) return (
    <div className="h-32 flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!data.length) return null

  const first = data[0]?.score ?? 0
  const last = data[data.length - 1]?.score ?? 0
  const delta = last - first
  const trend = delta > 2 ? 'up' : delta < -2 ? 'down' : 'flat'
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const trendColor = trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-gray-400'

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="section-title text-sm">12-Month Score Trend</h3>
        <div className={`flex items-center gap-1.5 text-xs font-semibold ${trendColor}`}>
          <TrendIcon className="w-3.5 h-3.5" />
          {delta > 0 ? '+' : ''}{Math.round(delta)} pts over 12 months
        </div>
      </div>
      <ResponsiveContainer width="100%" height={130}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
          <defs>
            <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6272f2" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6272f2" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 10 }} />
          <YAxis domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 10 }} />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={75} stroke="rgba(16,185,129,0.3)" strokeDasharray="4 4" />
          <ReferenceLine y={55} stroke="rgba(245,158,11,0.3)" strokeDasharray="4 4" />
          <Area
            type="monotone"
            dataKey="score"
            stroke="#6272f2"
            fill="url(#scoreGrad)"
            strokeWidth={2}
            dot={{ fill: '#6272f2', strokeWidth: 0, r: 3 }}
            activeDot={{ r: 5, fill: '#a5bbfc' }}
          />
        </AreaChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-4 mt-2 text-[10px] text-gray-500">
        <span className="flex items-center gap-1"><span className="w-3 h-px inline-block bg-emerald-400/50" /> Prime (≥75)</span>
        <span className="flex items-center gap-1"><span className="w-3 h-px inline-block bg-amber-400/50" /> Near-Prime (≥55)</span>
      </div>
    </div>
  )
}
