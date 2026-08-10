import React, { useState } from 'react'

const LABELS = { critical: 'CRITICAL', high: 'HIGH', medium: 'MEDIUM', low: 'LOW', info: 'INFO', pending: 'PENDING', good: 'GOOD' }

export default function RiskBadge({ risk, size }) {
  const cls = `risk-badge risk-badge-${risk || 'info'}`
  const s = size === 'sm' ? { fontSize: 10, padding: '2px 8px' } : {}
  return <span className={cls} style={s}>{LABELS[risk] || (risk || '?').toUpperCase()}</span>
}

export function FlagPill({ severity, text }) {
  return <span className={`flag-pill flag-pill-${severity}`}>
    <span className={`dot dot-${severity === 'critical' ? 'red' : severity === 'high' ? 'orange' : 'yellow'}`} />{text}
  </span>
}

export function RiskBar({ risk }) {
  const dims = [
    { key: 'r1_regulatory', label: 'R1 REGULATORY' },
    { key: 'r2_fraud', label: 'R2 FRAUD' },
    { key: 'r3_integrity', label: 'R3 INTEGRITY' },
    { key: 'r4_viability', label: 'R4 VIABILITY' },
    { key: 'r5_economics', label: 'R5 ECONOMICS' }
  ]
  const COLORS = { critical: 'var(--red)', high: 'var(--orange)', medium: 'var(--yellow)', low: 'var(--green)', good: 'var(--green)', pending: 'var(--blue)', info: 'var(--text-dim)' }
  return dims.map(d => {
    const v = risk?.[d.key] || 'info'
    return <div key={d.key} className={`risk-dim risk-dim-${v}`}>
      <div className="risk-dim-label">{d.label}</div>
      <div className="risk-dim-value" style={{ color: COLORS[v] }}>{LABELS[v]}</div>
    </div>
  })
}

export function FlagCard({ flag }) {
  return <div className={`flag-card flag-card-${flag.severity}`}>
    <div className="flag-card-header">
      <span className={`dot dot-${flag.severity === 'critical' ? 'red' : flag.severity === 'high' ? 'orange' : 'yellow'}`} />
      <span className="flag-card-title">{flag.title}</span>
      <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-dim)' }}>{flag.dimension}</span>
    </div>
    <div className="flag-card-detail">{flag.detail}</div>
    {flag.recommendation && <div className={`flag-card-action flag-card-action-${flag.severity}`}>→ {flag.recommendation}</div>}
  </div>
}

export function Section({ title, risk, children, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen !== false)
  return <div className="section">
    <div className="section-header" onClick={() => setOpen(!open)}>
      <div className="section-header-left"><h3>{title}</h3><RiskBadge risk={risk} size="sm" /></div>
      <span style={{ color: 'var(--text-dim)', transform: open ? 'rotate(180deg)' : '', transition: 'transform .2s' }}>▼</span>
    </div>
    {open && <div className="section-body">{children}</div>}
  </div>
}


