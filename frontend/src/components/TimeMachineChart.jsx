import React, { useState, useEffect, useCallback } from 'react'
import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, AlertTriangle, Loader, Play } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null
  const data = payload[0]?.payload || {}
  const isProjection = data.p10 !== undefined

  return (
    <div style={{
      background: 'rgba(15,10,40,0.95)',
      border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: 12, padding: '12px 16px', fontSize: 12, minWidth: 160,
    }}>
      <p style={{ color: '#a5bbfc', fontWeight: 700, marginBottom: 6 }}>
        {label} {data.year || ''}
      </p>
      {!isProjection && data.score !== undefined && (
        <>
          <div style={{ color: '#fff', marginBottom: 3 }}>Score: <strong>{data.score}</strong></div>
          {data.risk_prob !== undefined && (
            <div style={{ color: data.risk_crossed ? '#f87171' : '#6ee7b7' }}>
              Risk P: {(data.risk_prob * 100).toFixed(0)}%
              {data.risk_crossed ? ' WARNING' : ''}
            </div>
          )}
        </>
      )}
      {isProjection && (
        <>
          <div style={{ color: '#fbbf24' }}>Median: <strong>{data.median}</strong></div>
          <div style={{ color: '#94a3b8' }}>P90: {data.p90} | P10: {data.p10}</div>
        </>
      )}
    </div>
  )
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
    return pt ? pt.month : ''
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #6272f2, #a78bfa)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Clock style={{ width: 16, height: 16, color: '#fff' }} />
          </div>
          <div>
            <h3 style={{ color: '#fff', fontWeight: 700, fontSize: 15, margin: 0 }}>
              CreditPulse Time Machine
            </h3>
            <p style={{ color: '#9ca3af', fontSize: 11, margin: 0 }}>
              12-month history + 500-simulation Monte Carlo projection
            </p>
          </div>
        </div>
        <button
          onClick={handleAnimate}
          disabled={loading || !rewindData}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
            background: loading ? 'rgba(255,255,255,0.05)' : 'rgba(98,114,242,0.15)',
            border: '1px solid rgba(98,114,242,0.4)',
            color: loading ? '#6b7280' : '#a5bbfc',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading
            ? <><Loader style={{ width: 12, height: 12 }} /> Loading…</>
            : <><Play style={{ width: 12, height: 12 }} /> Rewind &amp; Predict</>
          }
        </button>
      </div>

      {/* Early Warning Badge */}
      <AnimatePresence>
        {defaulted && earlyWarning > 0 && phase === 'done' && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px', borderRadius: 12,
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.35)',
            }}
          >
            <AlertTriangle style={{ width: 16, height: 16, color: '#f87171', flexShrink: 0 }} />
            <div>
              <span style={{ color: '#f87171', fontWeight: 700, fontSize: 13 }}>
                Early Warning Detected:
              </span>
              <span style={{ color: '#fca5a5', fontSize: 13, marginLeft: 6 }}>
                Risk threshold crossed{' '}
                <strong style={{ color: '#fff' }}>{earlyWarning} month{earlyWarning !== 1 ? 's' : ''}</strong>{' '}
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
            style={{ color: '#a5bbfc', fontSize: 12, textAlign: 'center', margin: 0 }}>
            Rewinding 12 months of real financial history...
          </motion.p>
        )}
        {phase === 'projecting' && (
          <motion.p key="proj" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ color: '#fbbf24', fontSize: 12, textAlign: 'center', margin: 0 }}>
            Running 500 Monte Carlo simulations of future trajectories...
          </motion.p>
        )}
      </AnimatePresence>

      {/* Chart */}
      <div style={{ height: 270, position: 'relative' }}>
        {loading && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.3)', borderRadius: 12, zIndex: 10,
          }}>
            <Loader style={{ width: 28, height: 28, color: '#6272f2' }} />
          </div>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="month_idx"
              tickFormatter={xTickFormatter}
              tick={{ fill: '#6b7280', fontSize: 10 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
              tickLine={false}
              interval={1}
            />
            <YAxis domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 10 }}
              axisLine={false} tickLine={false} width={28} />
            <Tooltip content={<CustomTooltip />} />

            {/* Today divider */}
            {phase === 'done' && lastHistIdx !== undefined && (
              <ReferenceLine
                x={lastHistIdx}
                stroke="rgba(251,191,36,0.45)"
                strokeDasharray="4 4"
                label={{ value: 'Now', fill: '#fbbf24', fontSize: 10, position: 'insideTopRight' }}
              />
            )}

            {/* Risk crossing line */}
            {phase === 'done' && crossingIdx !== null && crossingIdx !== undefined && defaulted && (
              <ReferenceLine
                x={crossingIdx}
                stroke="rgba(239,68,68,0.65)"
                strokeWidth={2}
                label={{ value: 'Risk flagged', fill: '#f87171', fontSize: 9, position: 'insideTopLeft' }}
              />
            )}

            {/* Fan — outer P10-P90 */}
            <Area dataKey="p90" stroke="none" fill="rgba(251,191,36,0.08)" connectNulls isAnimationActive />
            <Area dataKey="p10" stroke="none" fill="rgba(10,5,30,1)" connectNulls isAnimationActive={false} />
            {/* Fan — inner P25-P75 */}
            <Area dataKey="p75" stroke="none" fill="rgba(251,191,36,0.16)" connectNulls isAnimationActive />
            <Area dataKey="p25" stroke="none" fill="rgba(10,5,30,1)" connectNulls isAnimationActive={false} />

            {/* Median projection dashed line */}
            <Line dataKey="median" stroke="#fbbf24" strokeWidth={2}
              dot={false} strokeDasharray="5 4" connectNulls isAnimationActive />

            {/* Historical score line */}
            <Line
              dataKey="score"
              stroke="#6272f2"
              strokeWidth={2.5}
              dot={(props) => {
                const { cx, cy, payload } = props
                if (!cx || !cy) return null
                if (payload.risk_crossed && defaulted) {
                  return <circle key={payload.month_idx} cx={cx} cy={cy} r={5}
                    fill="#ef4444" stroke="#fca5a5" strokeWidth={1.5} />
                }
                return <circle key={payload.month_idx} cx={cx} cy={cy} r={3}
                  fill="#6272f2" stroke="#a5bbfc" strokeWidth={1} />
              }}
              connectNulls={false}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      {(phase === 'done' || phase === 'projecting') && (
        <div style={{ display: 'flex', gap: 16, fontSize: 11, color: '#9ca3af', flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 20, height: 2, background: '#6272f2', display: 'inline-block', borderRadius: 2 }} />
            Historical score
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 20, height: 2, borderTop: '2px dashed #fbbf24', display: 'inline-block' }} />
            Median projection
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 20, height: 10, background: 'rgba(251,191,36,0.2)', borderRadius: 3, display: 'inline-block' }} />
            P10–P90 range (500 sims)
          </span>
          {defaulted && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 10, height: 10, background: '#ef4444', borderRadius: '50%', display: 'inline-block' }} />
              Risk threshold crossed
            </span>
          )}
        </div>
      )}

      {/* Stats row */}
      {phase === 'done' && mcData && (
        <motion.div
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}
        >
          {[
            { label: 'Current Score', value: lastScore != null ? lastScore.toFixed(1) : '—', color: '#a5bbfc' },
            { label: 'Projected (12m median)', value: mcData.projections?.[11]?.median?.toFixed(1) ?? '—', color: '#fbbf24' },
            {
              label: 'Confidence Range (P10–P90)',
              value: `${mcData.projections?.[11]?.p10 ?? '—'} – ${mcData.projections?.[11]?.p90 ?? '—'}`,
              color: '#6ee7b7',
            },
          ].map(({ label, value, color }) => (
            <div key={label} style={{
              padding: '10px 14px', borderRadius: 10,
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              textAlign: 'center',
            }}>
              <p style={{ color: '#6b7280', fontSize: 10, margin: '0 0 4px' }}>{label}</p>
              <p style={{ color, fontWeight: 700, fontSize: 15, margin: 0 }}>{value}</p>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
