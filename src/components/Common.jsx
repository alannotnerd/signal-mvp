import React, { useState } from 'react'

const LABELS = { critical: 'CRITICAL', high: 'HIGH', medium: 'MEDIUM', low: 'LOW', clean: 'CLEAN', info: 'INFO', pending: 'PENDING', good: 'GOOD' }

export default function RiskBadge({ risk, size, onClick }) {
  const cls = `risk-badge risk-badge-${risk || 'info'}`
  const s = size === 'sm' ? { fontSize: 10, padding: '2px 8px' } : {}
  const badgeOnClick = onClick ? { cursor: 'pointer' } : {}
  return <span className={cls} style={{ ...s, ...badgeOnClick }} onClick={onClick}>{LABELS[risk] || (risk || '?').toUpperCase()}</span>
}

export function FlagPill({ severity, text }) {
  return <span className={`flag-pill flag-pill-${severity}`}>
    <span className={`dot dot-${severity === 'critical' ? 'red' : severity === 'high' ? 'orange' : 'yellow'}`} />{text}
  </span>
}

export function RiskBar({ risk, reasons, onDimensionClick }) {
  const dims = [
    { key: 'r1_regulatory', label: 'R1 REGULATORY' },
    { key: 'r2_fraud', label: 'R2 FRAUD' },
    { key: 'r3_integrity', label: 'R3 INTEGRITY' },
    { key: 'r4_viability', label: 'R4 VIABILITY' },
    { key: 'r5_economics', label: 'R5 ECONOMICS' },
  ]
  const COLORS = { critical: 'var(--red)', high: 'var(--orange)', medium: 'var(--yellow)', low: 'var(--green)', clean: 'var(--green)', good: 'var(--green)', pending: 'var(--blue)', info: 'var(--text-dim)' }
  const SEV_DOT = { critical: 'dot-red', high: 'dot-orange', medium: 'dot-yellow', low: 'dot-green' }

  return dims.map(d => {
    const v = risk?.[d.key] || 'info'
    const dimReasons = reasons?.[d.key] || []
    const isInfo = v === 'info' || d.key === 'r4_viability' || d.key === 'r5_economics'
    return <div key={d.key} className={`risk-dim risk-dim-${v}`} onClick={() => onDimensionClick?.(d.key)}>
      <div className="risk-dim-label">
        {d.label}
        {isInfo && <span className="info-tag">INFO</span>}
      </div>
      <div className="risk-dim-value" style={{ color: COLORS[v] }}>{LABELS[v]}</div>
      {dimReasons.length > 0 && <div style={{ marginTop: 6, textAlign: 'left' }}>
        {dimReasons.slice(0, 3).map((r, i) => (
          <div key={i} style={{ fontSize: 10, color: 'var(--text-dim)', lineHeight: 1.5, display: 'flex', alignItems: 'flex-start', gap: 4 }}>
            {r.severity && <span className={`dot ${SEV_DOT[r.severity] || 'dot-dim'}`} style={{ marginTop: 3 }} />}
            <span>{r.text}</span>
          </div>
        ))}
      </div>}
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

/**
 * ScoreTrace — expandable panel showing how each dimension score was computed.
 * Pass the _trace object from computeRiskScores().
 */
export function ScoreTrace({ trace, onClose }) {
  if (!trace) return null

  const dimColors = { critical: 'var(--red)', high: 'var(--orange)', medium: 'var(--yellow)', low: 'var(--green)', clean: 'var(--green)' }

  return <div className="score-trace-overlay" onClick={onClose}>
    <div className="score-trace-panel" onClick={e => e.stopPropagation()}>
      <div className="score-trace-header">
        <h3>Scoring Trace</h3>
        <button className="btn btn-sm" onClick={onClose}>✕ Close</button>
      </div>

      <div className="score-trace-formula">
        <strong>Formula:</strong> <code>{trace.formula}</code>
      </div>

      <div className="score-trace-thresholds">
        <strong>Thresholds:</strong>{' '}
        {Object.entries(trace.thresholds).map(([k, v]) => (
          <span key={k} className="threshold-badge">{k.toUpperCase()}: {v}</span>
        ))}
      </div>

      {['R1', 'R2', 'R3', 'R4', 'R5'].map(dim => {
        const d = trace.dimensions[dim]
        if (!d) return null

        // R4/R5 are informational
        if (dim === 'R4' || dim === 'R5') {
          return <div key={dim} className="trace-dim trace-dim-info">
            <div className="trace-dim-header">
              <span className="trace-dim-label">{dim} — {LABELS[d.level]?.toUpperCase() || d.level?.toUpperCase()}</span>
              <span className="info-tag">INFORMATIONAL</span>
            </div>
            <div className="trace-dim-note">{d.note}</div>
          </div>
        }

        const score = d.raw
        const level = d.level
        const indicators = d.indicators || []

        return <div key={dim} className={`trace-dim trace-dim-${level}`}>
          <div className="trace-dim-header">
            <span className="trace-dim-label">{dim} — <span style={{ color: dimColors[level] }}>{LABELS[level]}</span></span>
            <span className="trace-dim-score">score: {score}</span>
          </div>

          <div className="trace-dim-breakdown">
            <code>{d.breakdown?.formula} = {score} → {LABELS[level]}</code>
          </div>

          {indicators.length > 0 && <div className="trace-indicators">
            <div className="trace-indicators-header">Indicators ({indicators.length}):</div>
            {indicators.map((ind, i) => (
              <div key={i} className="trace-indicator">
                <span className={`dot dot-${ind.severityLabel === 'critical' ? 'red' : ind.severityLabel === 'high' ? 'orange' : ind.severityLabel === 'medium' ? 'yellow' : 'green'}`} />
                <span className="trace-ind-severity">[{ind.severityLabel?.toUpperCase()}]</span>
                <span className="trace-ind-title">{ind.title}</span>
                <span className="trace-ind-meta">conf: {ind.confidence} → weighted: {ind.weightedScore}</span>
              </div>
            ))}
          </div>}
        </div>
      })}
    </div>
  </div>
}
