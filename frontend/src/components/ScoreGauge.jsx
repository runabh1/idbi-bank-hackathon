import React, { useEffect, useState } from 'react'
import { getScoreColor } from './RiskBadge'

export function ScoreGauge({ score, size = 120 }) {
  const [animated, setAnimated] = useState(0)
  const radius = 45
  const circ = 2 * Math.PI * radius
  const strokeDashoffset = circ - (animated / 100) * circ
  const color = getScoreColor(score)

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(score), 100)
    return () => clearTimeout(timer)
  }, [score])

  return (
    <div className="flex flex-col items-center gap-2">
      <div style={{ width: size, height: size }} className="relative">
        <svg width={size} height={size} className="-rotate-90" viewBox="0 0 100 100">
          {/* Background track */}
          <circle
            cx="50" cy="50" r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="8"
          />
          {/* Score arc */}
          <circle
            cx="50" cy="50" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }}
          />
          {/* Glow */}
          <circle
            cx="50" cy="50" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={strokeDashoffset}
            opacity="0.3"
            style={{ filter: 'blur(4px)', transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-display font-bold" style={{ color }}>
            {Math.round(animated)}
          </span>
          <span className="text-xs text-gray-400">/100</span>
        </div>
      </div>
    </div>
  )
}
