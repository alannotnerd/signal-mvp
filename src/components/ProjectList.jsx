import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { fetchProjects } from '../stubs/api'
import { computeRiskScores } from '../engine/scoring'
import RiskBadge, { FlagPill } from './Common'

export default function ProjectList() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchProjects().then(p => { setProjects(p); setLoading(false) }) }, [])

  if (loading) return <div className="loading">Loading projects...</div>

  const priority = { critical: 0, high: 1, medium: 2, low: 3, clean: 4, pending: 5 }

  // Compute risk scores for each project.
  // If full data available (flags array) → use scoring engine.
  // If only summary (from projects.json) → use declared risk as fallback.
  const scored = projects.map(p => {
    let risk, topFlag
    if (p.flags && p.flags.length > 0) {
      try {
        const result = computeRiskScores(p)
        risk = result.risk
      } catch {
        risk = p.risk  // fallback to declared
      }
    } else {
      risk = p.risk  // summary — use declared risk
    }

    // Derive top flag from the first critical/high flag, or first flag
    const flags = p.flags || []
    const worst = flags.find(f => f.severity === 'critical') || flags.find(f => f.severity === 'high') || flags[0]
    topFlag = worst?.title || p.top_flag || null

    return { ...p, _risk: risk, _topFlag: topFlag }
  })

  const sorted = [...scored].sort((a, b) => (priority[a._risk.overall] ?? 99) - (priority[b._risk.overall] ?? 99))

  // Count
  const counts = { critical: 0, high: 0, medium: 0, low: 0, clean: 0, pending: 0 }
  scored.forEach(p => {
    const r = p._risk.overall
    if (counts[r] !== undefined) counts[r]++
  })

  // Severity for FlagPill
  function flagSeverity(riskLevel) {
    if (riskLevel === 'critical') return 'critical'
    if (riskLevel === 'high') return 'high'
    return 'medium'
  }

  return <>
    <div className="header">
      <div className="header-left"><h1>Signal</h1><span className="badge">Pre-TGE DD</span></div>
      <div className="header-right"><span className="count">{scored.length} projects in queue</span></div>
    </div>

    <div className="stats-bar">
      <div className="stat"><div className="stat-icon risk-critical">🔴</div><div><div className="stat-label">Critical</div><div className="stat-value">{counts.critical}</div></div></div>
      <div className="stat"><div className="stat-icon risk-high">🟠</div><div><div className="stat-label">High</div><div className="stat-value">{counts.high}</div></div></div>
      <div className="stat"><div className="stat-icon risk-medium">🟡</div><div><div className="stat-label">Medium</div><div className="stat-value">{counts.medium}</div></div></div>
      <div className="stat"><div className="stat-icon risk-low">🟢</div><div><div className="stat-label">Low / Clean</div><div className="stat-value">{counts.low + counts.clean}</div></div></div>
      <div className="stat"><div className="stat-icon risk-pending">🔵</div><div><div className="stat-label">Pending</div><div className="stat-value">{counts.pending}</div></div></div>
    </div>

    <div className="table-wrap">
      <table>
        <thead><tr><th>Project</th><th>Category</th><th>Submitted</th><th>Risk</th><th>Top Flag</th><th></th></tr></thead>
        <tbody>
          {sorted.map(p => (
            <tr key={p.id} className="clickable" onClick={() => window.location.href = `/project/${p.id}`}>
              <td><strong style={{ color: 'var(--text-bright)' }}>{p.name}</strong> <span style={{ color: 'var(--text-dim)' }}>{p.symbol}</span></td>
              <td>{p.category}</td>
              <td style={{ color: 'var(--text-dim)' }}>{p.submitted_at}</td>
              <td><RiskBadge risk={p._risk.overall} /></td>
              <td>{p._topFlag ? <FlagPill severity={flagSeverity(p._risk.overall)} text={p._topFlag} /> : <span style={{ color: 'var(--text-dim)' }}>—</span>}</td>
              <td><Link to={`/project/${p.id}`} className="btn btn-sm">View →</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </>
}
