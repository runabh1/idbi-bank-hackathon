import React, { useState, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Loader, Shield, TrendingUp, Scale, Crown, ChevronDown, ChevronUp } from 'lucide-react'
import { API_BASE_URL } from '../config'

const API_BASE = API_BASE_URL

const AGENTS = [
  {
    key: 'risk_officer',
    label: 'Risk Officer',
    subtitle: 'Red flag analyst',
    Icon: Shield,
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.1)',
    border: 'rgba(239,68,68,0.3)',
    avatarBg: 'linear-gradient(135deg, #ef4444, #b91c1c)',
    delay: 0,
  },
  {
    key: 'growth_officer',
    label: 'Growth Officer',
    subtitle: 'Opportunity analyst',
    Icon: TrendingUp,
    color: '#10b981',
    bg: 'rgba(16,185,129,0.1)',
    border: 'rgba(16,185,129,0.3)',
    avatarBg: 'linear-gradient(135deg, #10b981, #059669)',
    delay: 900,
  },
  {
    key: 'compliance_officer',
    label: 'Compliance Officer',
    subtitle: 'Regulatory & fairness',
    Icon: Scale,
    color: '#60a5fa',
    bg: 'rgba(96,165,250,0.1)',
    border: 'rgba(96,165,250,0.3)',
    avatarBg: 'linear-gradient(135deg, #60a5fa, #2563eb)',
    delay: 1800,
  },
]

const CHAIR = {
  key: 'chair_decision',
  label: "Chair's Decision",
  subtitle: 'Final recommendation',
  Icon: Crown,
  color: '#fbbf24',
  bg: 'rgba(251,191,36,0.1)',
  border: 'rgba(251,191,36,0.35)',
  avatarBg: 'linear-gradient(135deg, #fbbf24, #d97706)',
  delay: 2700,
}

// Detect the decision outcome from the chair text
function detectOutcome(text) {
  const upper = (text || '').toUpperCase()
  if (upper.includes('CONDITIONAL APPROVE') || upper.includes('CONDITIONAL APPROVAL')) {
    return { label: 'CONDITIONAL APPROVE', color: '#fbbf24', bg: 'rgba(251,191,36,0.15)' }
  }
  if (upper.includes('APPROVE') || upper.includes('APPROVAL')) {
    return { label: 'APPROVE', color: '#10b981', bg: 'rgba(16,185,129,0.15)' }
  }
  if (upper.includes('DECLINE') || upper.includes('REJECT')) {
    return { label: 'DECLINE', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' }
  }
  return null
}

function AgentBubble({ agent, text, visible, isChair }) {
  const { label, subtitle, Icon, color, bg, border, avatarBg, delay } = agent
  const outcome = isChair ? detectOutcome(text) : null

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          style={{
            display: 'flex', gap: 12, alignItems: 'flex-start',
            ...(isChair ? { marginTop: 8 } : {}),
          }}
        >
          {/* Avatar */}
          <div style={{ flexShrink: 0 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: avatarBg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 0 12px ${color}40`,
            }}>
              <Icon style={{ width: 18, height: 18, color: '#fff' }} />
            </div>
            <p style={{ color: '#6b7280', fontSize: 9, textAlign: 'center', margin: '3px 0 0', whiteSpace: 'nowrap' }}>
              {label.split(' ')[0]}
            </p>
          </div>

          {/* Bubble */}
          <div style={{
            flex: 1,
            padding: isChair ? '14px 16px' : '12px 14px',
            borderRadius: isChair ? 14 : 12,
            borderTopLeftRadius: 4,
            background: bg,
            border: `1px solid ${border}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ color, fontWeight: 700, fontSize: 12 }}>{label}</span>
              <span style={{ color: '#6b7280', fontSize: 10 }}>· {subtitle}</span>
              {isChair && outcome && (
                <span style={{
                  marginLeft: 'auto',
                  padding: '2px 10px', borderRadius: 20,
                  background: outcome.bg,
                  color: outcome.color,
                  fontWeight: 800, fontSize: 11,
                  border: `1px solid ${outcome.color}60`,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  {outcome.label}
                </span>
              )}
            </div>
            <div
              className="markdown-light markdown-content-compact"
              style={{ color: '#1f2937', fontSize: 13, lineHeight: 1.6 }}
            >
              <ReactMarkdown>{text}</ReactMarkdown>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function CreditCommittee({ applicantId }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [visibleAgents, setVisibleAgents] = useState([])
  const [convened, setConvened] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  const convene = useCallback(async () => {
    setLoading(true)
    setVisibleAgents([])
    setConvened(false)
    setCollapsed(false)
    try {
      const res = await fetch(`${API_BASE}/committee/${applicantId}`).then(r => r.json())
      setData(res)

      // Stagger reveal of each agent
      const allAgents = [...AGENTS, CHAIR]
      allAgents.forEach((agent, i) => {
        setTimeout(() => {
          setVisibleAgents(prev => [...prev, agent.key])
          if (i === allAgents.length - 1) setConvened(true)
        }, 400 + i * 900) // 900ms between each agent appearing
      })
    } catch (e) {
      console.error('Committee failed:', e)
    } finally {
      setLoading(false)
    }
  }, [applicantId])

  const hasAny = visibleAgents.length > 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h3 style={{ color: '#111827', fontWeight: 600, fontSize: 18, margin: '0 0 6px 0', lineHeight: 1 }}>
            AI Credit Committee
          </h3>
          <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>
            3 specialized agents debate · Chair decides
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {hasAny && (
            <button
              onClick={() => setCollapsed(c => !c)}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                background: '#f3f4f6',
                border: '1px solid #e5e7eb',
                color: '#4b5563', cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              {collapsed ? <ChevronDown style={{ width: 14, height: 14 }} /> : <ChevronUp style={{ width: 14, height: 14 }} />}
              {collapsed ? 'Show' : 'Hide'}
            </button>
          )}
          <button
            onClick={convene}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
              background: loading ? '#f3f4f6' : '#ede9fe',
              border: `1px solid ${loading ? '#e5e7eb' : '#ddd6fe'}`,
              color: loading ? '#9ca3af' : '#7c3aed',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? (
              <><Loader style={{ width: 14, height: 14 }} className="animate-spin" /> Convening…</>
            ) : (
              <><Users style={{ width: 14, height: 14 }} /> {hasAny ? 'Reconvene' : 'Convene Committee'}</>
            )}
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading && !hasAny && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
            padding: '28px 0', color: '#9ca3af', fontSize: 13,
          }}
        >
          <div style={{ display: 'flex', gap: 8 }}>
            {[0, 1, 2, 3].map(i => (
              <motion.div
                key={i}
                animate={{ scale: [1, 1.3, 1], opacity: [0.4, 1, 0.4] }}
                transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.25 }}
                style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: ['#ef4444', '#10b981', '#60a5fa', '#fbbf24'][i],
                }}
              />
            ))}
          </div>
          <p style={{ margin: 0 }}>Convening AI Credit Committee...</p>
        </motion.div>
      )}

      {/* Empty state */}
      {!loading && !hasAny && (
        <div
          onClick={convene}
          style={{
            borderRadius: 14, border: '1px dashed #d1d5db',
            padding: '40px 24px', display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 16, cursor: 'pointer',
            background: '#f9fafb',
            transition: 'all 0.2s',
          }}
          className="hover:bg-gray-50 hover:border-gray-400"
        >
          <div style={{ display: 'flex', gap: 12 }}>
            {[
              { Icon: Shield, c: '#ef4444' }, { Icon: TrendingUp, c: '#10b981' },
              { Icon: Scale, c: '#60a5fa' }, { Icon: Crown, c: '#fbbf24' },
            ].map(({ Icon, c }, i) => (
              <div key={i} style={{
                width: 40, height: 40, borderRadius: 12, opacity: 0.9,
                background: `${c}15`, border: `1px solid ${c}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon style={{ width: 20, height: 20, color: c }} />
              </div>
            ))}
          </div>
          <p style={{ color: '#4b5563', fontSize: 14, margin: 0, textAlign: 'center', fontWeight: 500 }}>
            Convene the committee to watch 3 AI agents argue this case
            <br />
            <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 400, marginTop: 4, display: 'inline-block' }}>Risk · Growth · Compliance · Chair's Decision</span>
          </p>
        </div>
      )}

      {/* Committee transcript */}
      {!collapsed && hasAny && data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {AGENTS.map(agent => (
            <AgentBubble
              key={agent.key}
              agent={agent}
              text={data[agent.key]}
              visible={visibleAgents.includes(agent.key)}
              isChair={false}
            />
          ))}

          {/* Divider before chair */}
          {visibleAgents.includes('chair_decision') && (
            <motion.div
              initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
              style={{
                height: 1, background: 'linear-gradient(90deg, transparent, rgba(251,191,36,0.4), transparent)',
                margin: '4px 0',
              }}
            />
          )}

          <AgentBubble
            agent={CHAIR}
            text={data.chair_decision}
            visible={visibleAgents.includes('chair_decision')}
            isChair
          />
        </div>
      )}

      {collapsed && hasAny && (
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ color: '#6b7280', fontSize: 12, textAlign: 'center', margin: '8px 0 0' }}
        >
          Committee transcript hidden — click Show to expand
        </motion.p>
      )}
    </div>
  )
}
