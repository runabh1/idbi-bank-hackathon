import React from 'react'

const TIER_CONFIG = {
  'Prime': { color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/30', dot: 'bg-emerald-400' },
  'Near-Prime': { color: 'text-amber-400', bg: 'bg-amber-500/15 border-amber-500/30', dot: 'bg-amber-400' },
  'Sub-Prime': { color: 'text-orange-400', bg: 'bg-orange-500/15 border-orange-500/30', dot: 'bg-orange-400' },
  'Decline': { color: 'text-red-400', bg: 'bg-red-500/15 border-red-500/30', dot: 'bg-red-400' },
}

export function RiskBadge({ tier, size = 'md' }) {
  const cfg = TIER_CONFIG[tier] || TIER_CONFIG['Sub-Prime']
  const sizeClass = size === 'lg'
    ? 'px-4 py-1.5 text-sm font-semibold'
    : size === 'sm'
    ? 'px-2.5 py-0.5 text-xs font-medium'
    : 'px-3 py-1 text-xs font-semibold'

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${cfg.bg} ${cfg.color} ${sizeClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} animate-pulse`} />
      {tier}
    </span>
  )
}

export function getTierColor(tier) {
  const map = {
    'Prime': '#10b981',
    'Near-Prime': '#f59e0b',
    'Sub-Prime': '#f97316',
    'Decline': '#ef4444',
  }
  return map[tier] || '#6b7280'
}

export function getScoreColor(score) {
  if (score >= 75) return '#10b981'
  if (score >= 55) return '#f59e0b'
  if (score >= 35) return '#f97316'
  return '#ef4444'
}
