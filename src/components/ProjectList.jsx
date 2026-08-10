import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { fetchProjects } from '../stubs/api'
import RiskBadge, { FlagPill } from './Common'

export default function ProjectList() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchProjects().then(p => { setProjects(p); setLoading(false) }) }, [])

  if (loading) return <div className="loading">Loading projects...</div>

  const priority = { critical: 0, high: 1, medium: 2, low: 3, pending: 4 }
  const sorted = [...projects].sort((a, b) => (priority[a.risk.overall] || 99) - (priority[b.risk.overall] || 99))
  const counts = { critical: 0, high: 0, medium: 0, low: 0, pending: 0 }
  projects.forEach(p => { const r = p.risk.overall; if (counts[r] !== undefined) counts[r]++ })

  return <>
    <div className="header">
      <div className="header-left"><h1>Signal</h1><span className="badge">Pre-TGE DD</span></div>
      <div className="header-right"><span className="count">{projects.length} projects in queue</span></div>
    </div>

    <div className="stats-bar">
      <div className="stat"><div className="stat-icon risk-critical">🔴</div><div><div className="stat-label">Critical</div><div className="stat-value">{counts.critical}</div></div></div>
      <div className="stat"><div className="stat-icon risk-high">🟠</div><div><div className="stat-label">High</div><div className="stat-value">{counts.high}</div></div></div>
      <div className="stat"><div className="stat-icon risk-medium">🟡</div><div><div className="stat-label">Medium</div><div className="stat-value">{counts.medium}</div></div></div>
      <div className="stat"><div className="stat-icon risk-low">🟢</div><div><div className="stat-label">Clean</div><div className="stat-value">{counts.low}</div></div></div>
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
              <td><RiskBadge risk={p.risk.overall} /></td>
              <td>{p.top_flag ? <FlagPill severity={p.risk.overall === 'critical' ? 'critical' : p.risk.overall === 'high' ? 'high' : 'medium'} text={p.top_flag} /> : <span style={{ color: 'var(--text-dim)' }}>—</span>}</td>
              <td><Link to={`/project/${p.id}`} className="btn btn-sm">View →</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </>
}
