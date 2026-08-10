import React from 'react'

// ── Color palette ─────────────────────────────────────────────────────────
const GREEN = '#3fb950'
const BLUE = '#58a6ff'
const ORANGE = '#d29922'
const RED = '#f85149'
const DIM = '#6b7280'
const BG = '#0a0e14'
const BORDER = '#1e2533'

// ── GitHub Sparkline ──────────────────────────────────────────────────────
// Weekly commit activity as a compact SVG bar chart

export function GitHubSparkline({ data, width = 520, height = 80 }) {
  if (!data?.commits_per_week?.length) return null

  const { commits_per_week: commits, contributors_per_week: contributors, lines_changed_per_week: lines, weeks } = data

  const pad = { top: 8, right: 10, bottom: 22, left: 10 }
  const chartW = width - pad.left - pad.right
  const chartH = height - pad.top - pad.bottom
  const barW = Math.max(4, (chartW / commits.length) * 0.6)
  const gap = chartW / commits.length
  const maxCommits = Math.max(...commits, 1)

  const bars = commits.map((c, i) => {
    const barH = (c / maxCommits) * (chartH - 16)
    const x = pad.left + i * gap + (gap - barW) / 2
    const y = pad.top + chartH - barH
    const contrib = contributors?.[i] || 1
    const opacity = 0.4 + (contrib / Math.max(...(contributors || [1]), 1)) * 0.6
    return { x, y, barH, barW, commits: c, contributors: contrib, week: weeks?.[i] || `W${i + 1}`, opacity }
  })

  return (
    <div className="chart-wrap">
      <div className="chart-label">GitHub Activity — Last 12 Weeks</div>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map(pct => (
          <line key={pct} x1={pad.left} y1={pad.top + chartH * (1 - pct)} x2={pad.left + chartW} y2={pad.top + chartH * (1 - pct)}
            stroke={BORDER} strokeWidth={0.5} strokeDasharray="3,3" />
        ))}
        {/* Bars */}
        {bars.map((b, i) => (
          <g key={i}>
            <rect x={b.x} y={b.y} width={b.barW} height={b.barH} rx={2}
              fill={i >= commits.length - 2 ? BLUE : GREEN} opacity={b.opacity} />
            <title>{b.week}: {b.commits} commits · {b.contributors} contributors</title>
          </g>
        ))}
        {/* X-axis labels */}
        {weeks?.filter((_, i) => i % 3 === 0).map((w, i) => (
          <text key={i} x={pad.left + (i * 3) * gap + gap / 2} y={height - 4}
            fill={DIM} fontSize={9} textAnchor="middle" fontFamily="var(--mono)">{w}</text>
        ))}
        {/* Y-axis label */}
        <text x={pad.left - 4} y={pad.top - 2} fill={DIM} fontSize={9} textAnchor="end">{maxCommits}</text>
      </svg>
      <div className="chart-meta">
        <span>{commits.reduce((a, b) => a + b, 0)} commits</span>
        <span>·</span>
        <span>{lines?.reduce((a, b) => a + b, 0)?.toLocaleString()} lines changed</span>
        <span>·</span>
        <span>Avg {Math.round(commits.reduce((a, b) => a + b, 0) / commits.length)}/wk</span>
      </div>
      {data.note && <div className="chart-note">{data.note}</div>}
    </div>
  )
}

// ── Milestone Timeline ────────────────────────────────────────────────────

export function MilestoneTimeline({ roadmap }) {
  if (!roadmap?.length) return null

  return (
    <div className="milestone-wrap">
      <div className="chart-label">Roadmap Timeline</div>
      <div className="milestone-timeline">
        {roadmap.map((m, i) => {
          const isCompleted = m.status === 'completed'
          const isPlanned = m.status === 'planned'
          const isDelayed = m.status === 'delayed'
          const color = isCompleted ? GREEN : isDelayed ? ORANGE : DIM

          return (
            <div key={i} className={`milestone-item ${isCompleted ? 'milestone-done' : ''} ${isDelayed ? 'milestone-delayed' : ''}`}>
              <div className="milestone-dot-wrap">
                <div className="milestone-dot" style={{ background: color, borderColor: color }} />
                {i < roadmap.length - 1 && <div className="milestone-line" style={{ background: isCompleted ? GREEN : BORDER }} />}
              </div>
              <div className="milestone-body">
                <div className="milestone-title" style={{ color: isPlanned ? DIM : 'var(--text-bright)' }}>
                  {m.title}
                  {!isPlanned && <span className={`tag ${isCompleted ? 'tag-verified' : ''}`} style={{ marginLeft: 6 }}>{m.status}</span>}
                </div>
                <div className="milestone-dates">
                  <span>Target: {m.target}</span>
                  {m.actual && <span> · Actual: <span style={{ color: m.actual > m.target ? RED : GREEN }}>{m.actual}</span></span>}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Social Activity Table ─────────────────────────────────────────────────

export function SocialActivityTable({ data }) {
  if (!data) return null

  const platforms = [
    { key: 'twitter', label: 'Twitter / X', icon: '🐦' },
    { key: 'discord', label: 'Discord', icon: '💬' },
    { key: 'telegram', label: 'Telegram', icon: '📱' },
  ]

  return (
    <div className="social-activity-wrap">
      <div className="chart-label">Social Activity — Claimed vs. Observable</div>
      <table className="social-table">
        <thead>
          <tr>
            <th>Platform</th>
            <th>Claimed Members</th>
            <th>Verified?</th>
            <th>Daily Posts</th>
            <th>Daily Engagement</th>
            <th>Growth (30d)</th>
            <th>Flags</th>
          </tr>
        </thead>
        <tbody>
          {platforms.map(p => {
            const d = data[p.key]
            if (!d) return null
            const verifiedIcon = d.followers_verified || d.members_verified ? '✓' : '◯'
            const verifiedColor = d.followers_verified || d.members_verified ? GREEN : ORANGE
            const verifiedLabel = d.followers_verified || d.members_verified ? 'verified' : 'claimed'

            return (
              <tr key={p.key}>
                <td><span style={{ marginRight: 6 }}>{p.icon}</span><strong>{p.label}</strong></td>
                <td>{(d.followers || d.members)?.toLocaleString()}</td>
                <td><span className="tag" style={{ color: verifiedColor, borderColor: verifiedColor }}>{verifiedIcon} {verifiedLabel}</span></td>
                <td>{d.daily_posts_avg != null ? `${d.daily_posts_avg}/day` : '—'}</td>
                <td>{d.daily_engagement_avg != null ? d.daily_engagement_avg.toLocaleString() : d.daily_messages_avg != null ? `${d.daily_messages_avg} msgs` : '—'}</td>
                <td>
                  <span style={{ color: (d.follower_growth_30d || d.member_growth_30d) > 3000 ? GREEN : DIM }}>
                    {((d.follower_growth_30d || d.member_growth_30d) || 0).toLocaleString()}
                  </span>
                </td>
                <td>
                  {d.suspicious_followers_pct > 10 && <span className="tag tag-flagged">🤖 {d.suspicious_followers_pct}% bots</span>}
                  {d.note && <span className="tag" style={{ marginLeft: 4, fontSize: 10, maxWidth: 200, display: 'inline-block', whiteSpace: 'normal' }}>⚠ {d.note}</span>}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ── DAU Sparkline — daily active users over the last week ─────────────────

export function DAUSparkline({ data }) {
  if (!data?.discord?.daily_active_users_avg) return null

  const dau = data.discord.daily_active_users_avg
  const members = data.discord.members || 1
  const ratio = ((dau / members) * 100).toFixed(1)

  return (
    <div className="dau-indicator">
      <div className="dau-stat">
        <span className="dau-value">{dau.toLocaleString()}</span>
        <span className="dau-label">DAU (Discord)</span>
      </div>
      <div className="dau-stat">
        <span className="dau-value">{ratio}%</span>
        <span className="dau-label">DAU/Member ratio</span>
      </div>
      <div className="dau-bar-wrap">
        <div className="dau-bar-fill" style={{ width: `${Math.min(ratio * 10, 100)}%`, background: ratio > 5 ? GREEN : ratio > 2 ? ORANGE : RED }} />
      </div>
      <div className="dau-note">{ratio > 5 ? '✓ Healthy engagement' : ratio > 2 ? '⚠ Below average' : '🔴 Low engagement — possible bot/airdrop farming'}</div>
    </div>
  )
}
