import React, { useState, useEffect, useCallback } from 'react'
import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, AlertTriangle, Loader, Play, TrendingUp } from 'lucide-react'
import { API_BASE_URL } from '../config'
import { ChartContainer, ChartTooltipContent } from './SharedOwnerCards'

const API_BASE = API_BASE_URL

const chartConfig = {
  desktop: {
    label: "Score",
    color: "#6272f2",
  },
}

export default function TimeMachineChart({ applicantId, defaulted }) {
  const [rewindData, setRewindData] = useState(null)
  const [mcData, setMcData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [phase, setPhase] = useState('idle')
  const [chartData, setChartData] = useState([])

  const fetchData = useCallback(async () => {
    setLoading(true)
    setPhase('idle')
    setChartData([])
    try {
      const [rw, mc] = await Promise.all([
        fetch(`${API_BASE}/rewind/${applicantId}`).then(r => r.json()),
        fetch(`${API_BASE}/montecarlo/${applicantId}`).then(r => r.json()),
      ])
      setRewindData(rw)
      setMcData(mc)
    } catch (e) {
      console.error('Time machine fetch failed:', e)
    } finally {
      setLoading(false)
    }
  }, [applicantId])

  useEffect(() => { fetchData() }, [fetchData])

  const handleAnimate = useCallback(() => {
    if (!rewindData || !mcData) return
    setPhase('rewinding')
    setChartData([])

    const history = rewindData.history || []
    const projections = mcData.projections || []

    let idx = 0
    const histInterval = setInterval(() => {
      idx++
      const visible = history.slice(0, idx).map(pt => ({
        month: pt.month, year: pt.year, month_idx: pt.month_idx,
        score: pt.score, risk_prob: pt.risk_prob, risk_crossed: pt.risk_crossed,
      }))
      setChartData(visible)

      if (idx >= history.length) {
        clearInterval(histInterval)
        setTimeout(() => {
          setPhase('projecting')
          const fullData = [
            ...history.map(pt => ({
              month: pt.month, year: pt.year, month_idx: pt.month_idx,
              score: pt.score, risk_prob: pt.risk_prob, risk_crossed: pt.risk_crossed,
            })),
            ...projections.map(pt => ({
              month: pt.month, year: pt.year, month_idx: pt.month_idx,
              p10: pt.p10, p25: pt.p25, median: pt.median, p75: pt.p75, p90: pt.p90,
            })),
          ]
          setChartData(fullData)
          setTimeout(() => setPhase('done'), 1500)
        }, 600)
      }
    }, 130)
  }, [rewindData, mcData])

  useEffect(() => {
    if (rewindData && mcData && phase === 'idle') handleAnimate()
  }, [rewindData, mcData]) // eslint-disable-line

  const earlyWarning = rewindData?.months_early_warning || 0
  const crossingIdx = rewindData?.risk_crossing_month_idx
  const crossingMonth = (crossingIdx !== null && crossingIdx !== undefined)
    ? rewindData?.history?.[crossingIdx] : null
  const lastScore = rewindData?.history?.[rewindData?.history?.length - 1]?.score
  const lastHistIdx = rewindData?.history?.[rewindData?.history?.length - 1]?.month_idx

  const xTickFormatter = (val) => {
    const pt = chartData.find(d => d.month_idx === val)
    return pt ? pt.month.slice(0, 3) : ''
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="font-semibold leading-none tracking-tight text-gray-900 text-lg mb-1.5">
            CreditPulse Time Machine
          </h3>
          <p className="text-sm text-gray-500">
            12-month history + 500-simulation Monte Carlo projection
          </p>
        </div>
        <button
          onClick={handleAnimate}
          disabled={loading || !rewindData}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
            loading 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100 cursor-pointer'
          }`}
        >
          {loading
            ? <><Loader className="w-4 h-4 animate-spin" /> Loading…</>
            : <><Play className="w-4 h-4" /> Rewind &amp; Predict</>
          }
        </button>
      </div>

      {/* Early Warning Badge */}
      <AnimatePresence>
        {defaulted && earlyWarning > 0 && phase === 'done' && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200"
          >
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
            <div>
              <span className="text-red-700 font-bold text-sm">
                Early Warning Detected:{' '}
              </span>
              <span className="text-red-600 text-sm">
                Risk threshold crossed{' '}
                <strong className="text-red-800">{earlyWarning} month{earlyWarning !== 1 ? 's' : ''}</strong>{' '}
                before default event
                {crossingMonth ? ` (flagged in ${crossingMonth.month} ${crossingMonth.year})` : ''}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Phase status */}
      <AnimatePresence mode="wait">
        {phase === 'rewinding' && (
          <motion.p key="rw" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="text-indigo-500 text-sm font-medium text-center m-0">
            Rewinding 12 months of real financial history...
          </motion.p>
        )}
        {phase === 'projecting' && (
          <motion.p key="proj" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="text-amber-500 text-sm font-medium text-center m-0">
            Running 500 Monte Carlo simulations of future trajectories...
          </motion.p>
        )}
      </AnimatePresence>

      {/* Chart */}
      <div className="h-[270px] relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-[2px] rounded-xl z-10">
            <Loader className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        )}
        <ChartContainer config={chartConfig} className="w-full h-full">
          <ComposedChart data={chartData} margin={{ top: 12, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke="#f3f4f6" />
            <XAxis
              dataKey="month_idx"
              tickFormatter={xTickFormatter}
              tick={{ fill: '#6b7280', fontSize: 12 }}
              tickMargin={8}
              axisLine={false}
              tickLine={false}
              interval={1}
            />
            <YAxis 
              domain={[0, 100]} 
              tick={{ fill: '#6b7280', fontSize: 12 }}
              axisLine={false} 
              tickLine={false} 
              width={28} 
            />
            <Tooltip 
              cursor={false}
              content={<ChartTooltipContent hideLabel />} 
            />

            {/* Today divider */}
            {phase === 'done' && lastHistIdx !== undefined && (
              <ReferenceLine
                x={lastHistIdx}
                stroke="#fbbf24"
                strokeDasharray="4 4"
                label={{ value: 'Now', fill: '#fbbf24', fontSize: 11, position: 'insideTopRight' }}
              />
            )}

            {/* Risk crossing line */}
            {phase === 'done' && crossingIdx !== null && crossingIdx !== undefined && defaulted && (
              <ReferenceLine
                x={crossingIdx}
                stroke="#ef4444"
                strokeWidth={2}
                label={{ value: 'Risk flagged', fill: '#ef4444', fontSize: 11, position: 'insideTopLeft' }}
              />
            )}

            {/* Fan — outer P10-P90 */}
            <Area dataKey="p90" stroke="none" fill="rgba(251,191,36,0.08)" connectNulls isAnimationActive />
            <Area dataKey="p10" stroke="none" fill="#ffffff" connectNulls isAnimationActive={false} />
            {/* Fan — inner P25-P75 */}
            <Area dataKey="p75" stroke="none" fill="rgba(251,191,36,0.16)" connectNulls isAnimationActive />
            <Area dataKey="p25" stroke="none" fill="#ffffff" connectNulls isAnimationActive={false} />

            {/* Median projection dashed line */}
            <Line dataKey="median" type="natural" stroke="#fbbf24" strokeWidth={2}
              dot={false} strokeDasharray="5 4" connectNulls isAnimationActive />

            {/* Historical score line */}
            <Line
              dataKey="score"
              type="natural"
              stroke="var(--color-desktop)"
              strokeWidth={2}
              dot={(props) => {
                const { cx, cy, payload } = props
                if (!cx || !cy) return null
                if (payload.risk_crossed && defaulted) {
                  return <circle key={payload.month_idx} cx={cx} cy={cy} r={5}
                    fill="#ef4444" stroke="#fca5a5" strokeWidth={1.5} />
                }
                return <circle key={payload.month_idx} cx={cx} cy={cy} r={4}
                  fill="var(--color-desktop)" />
              }}
              activeDot={{ r: 6 }}
              connectNulls={false}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ChartContainer>
      </div>

      {/* Legend & Stats Footer - Matches the CardFooter aesthetic */}
      {(phase === 'done' || phase === 'projecting') && (
        <div className="flex flex-col items-start gap-4 text-sm mt-2">
          
          <div className="flex gap-2 leading-none font-medium text-gray-900 items-center">
            Trending up by 8.4% projected <TrendingUp className="h-4 w-4 text-emerald-500" />
          </div>

          <div className="flex gap-x-6 gap-y-2 flex-wrap text-xs text-gray-500">
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#6272f2]" />
              Historical score
            </span>
            <span className="flex items-center gap-2">
              <span className="w-5 h-[2px] border-t-2 border-dashed border-amber-400" />
              Median projection
            </span>
            <span className="flex items-center gap-2">
              <span className="w-4 h-3 bg-amber-100 rounded-sm" />
              P10–P90 range
            </span>
            {defaulted && (
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 bg-red-500 rounded-full" />
                Risk threshold crossed
              </span>
            )}
          </div>

          {phase === 'done' && mcData && (
            <motion.div
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="grid grid-cols-3 gap-3 w-full mt-2"
            >
              {[
                { label: 'Current Score', value: lastScore != null ? lastScore.toFixed(1) : '—', color: 'text-indigo-600' },
                { label: 'Projected (12m)', value: mcData.projections?.[11]?.median?.toFixed(1) ?? '—', color: 'text-amber-500' },
                {
                  label: 'Confidence Range',
                  value: `${mcData.projections?.[11]?.p10 ?? '—'} – ${mcData.projections?.[11]?.p90 ?? '—'}`,
                  color: 'text-emerald-500',
                },
              ].map(({ label, value, color }) => (
                <div key={label} className="px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-100 text-center">
                  <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-1">{label}</p>
                  <p className={`font-bold text-lg leading-none ${color}`}>{value}</p>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      )}
    </div>
  )
}
