import React, { useState } from 'react'

// ── Color palette ─────────────────────────────────────────────────────────
const GREEN = '#3fb950'
const BLUE = '#58a6ff'
const ORANGE = '#d29922'
const RED = '#f85149'
const DIM = '#6b7280'
const BG = '#0a0e14'
const BORDER = '#1e2533'
const TBRIGHT = '#e6edf3'

// ── GitHub Sparkline ──────────────────────────────────────────────────────

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
        {[0.25, 0.5, 0.75].map(pct => (
          <line key={pct} x1={pad.left} y1={pad.top + chartH * (1 - pct)} x2={pad.left + chartW} y2={pad.top + chartH * (1 - pct)}
            stroke={BORDER} strokeWidth={0.5} strokeDasharray="3,3" />
        ))}
        {bars.map((b, i) => (
          <g key={i}>
            <rect x={b.x} y={b.y} width={b.barW} height={b.barH} rx={2}
              fill={i >= commits.length - 2 ? BLUE : GREEN} opacity={b.opacity} />
            <title>{b.week}: {b.commits} commits · {b.contributors} contributors</title>
          </g>
        ))}
        {weeks?.filter((_, i) => i % 3 === 0).map((w, i) => (
          <text key={i} x={pad.left + (i * 3) * gap + gap / 2} y={height - 4}
            fill={DIM} fontSize={9} textAnchor="middle" fontFamily="var(--mono)">{w}</text>
        ))}
        <text x={pad.left - 4} y={pad.top - 2} fill={DIM} fontSize={9} textAnchor="end">{maxCommits}</text>
      </svg>
      <div className="chart-meta">
        <span>{commits.reduce((a, b) => a + b, 0)} commits</span><span>·</span>
        <span>{lines?.reduce((a, b) => a + b, 0)?.toLocaleString()} lines changed</span><span>·</span>
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
                <div className="milestone-title" style={{ color: isPlanned ? DIM : TBRIGHT }}>
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

// ── Social Bar Chart ──────────────────────────────────────────────────────

export function SocialBarChart({ data, width = 520, height = 180 }) {
  if (!data) return null

  const platforms = [
    { key: 'twitter', label: 'Twitter / X', icon: '🐦', getCount: d => d.followers, getVerified: d => d.followers_verified },
    { key: 'discord', label: 'Discord', icon: '💬', getCount: d => d.members, getVerified: d => d.members_verified },
    { key: 'telegram', label: 'Telegram', icon: '📱', getCount: d => d.members, getVerified: d => d.members_verified },
  ].filter(p => data[p.key])

  const entries = platforms.map(p => {
    const d = data[p.key]
    return {
      ...p,
      count: p.getCount(d) || 0,
      verified: p.getVerified(d),
      dailyActivity: d.daily_posts_avg || d.daily_messages_avg || 0,
      growth: d.follower_growth_30d || d.member_growth_30d || 0,
      note: d.note,
      suspicious: d.suspicious_followers_pct,
      engagement: d.daily_engagement_avg,
    }
  })

  const maxCount = Math.max(...entries.map(e => e.count), 1)
  const pad = { top: 10, right: 20, bottom: 10, left: 90 }
  const chartW = width - pad.left - pad.right
  const chartH = height - pad.top - pad.bottom
  const barH = Math.min(22, (chartH / entries.length) * 0.55)
  const gap = chartH / entries.length

  return (
    <div className="chart-wrap">
      <div className="chart-label">Social Activity — Claimed vs. Observable</div>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {entries.map((e, i) => {
          const y = pad.top + i * gap + (gap - barH) / 2
          const barW = (e.count / maxCount) * chartW
          const barColor = e.verified ? GREEN : ORANGE
          const verifiedLabel = e.verified ? 'verified' : 'claimed'

          return (
            <g key={e.key}>
              {/* Label */}
              <text x={pad.left - 8} y={y + barH / 2 + 4} fill={TBRIGHT} fontSize={12}
                textAnchor="end" fontFamily="var(--font)">{e.icon} {e.label}</text>
              {/* Bar background */}
              <rect x={pad.left} y={y} width={chartW} height={barH} rx={3} fill={BG} />
              {/* Bar fill */}
              <rect x={pad.left} y={y} width={barW} height={barH} rx={3} fill={barColor} opacity={0.6} />
              {/* Count label */}
              <text x={pad.left + barW + 6} y={y + barH / 2 + 4} fill={TBRIGHT} fontSize={11}
                fontFamily="var(--mono)">{e.count.toLocaleString()}</text>
              {/* Verified tag */}
              <text x={pad.left + barW + 6} y={y + barH / 2 + 18} fill={barColor} fontSize={9}
                fontFamily="var(--font)">{verifiedLabel}</text>
              {/* Growth arrow */}
              {e.growth > 0 && (
                <text x={pad.left + chartW - 10} y={y + barH / 2 + 4} fill={e.growth > 3000 ? GREEN : DIM} fontSize={10}
                  textAnchor="end" fontFamily="var(--mono)">+{e.growth.toLocaleString()} (30d)</text>
              )}
              {/* Bot flag */}
              {e.suspicious > 10 && (
                <text x={pad.left + chartW - 10} y={y + barH / 2 + 16} fill={RED} fontSize={9}
                  textAnchor="end" fontFamily="var(--font)">🤖 {e.suspicious}% bots</text>
              )}
              <title>{e.label}: {e.count.toLocaleString()} · {verifiedLabel} · Growth: {e.growth}</title>
            </g>
          )
        })}
      </svg>
      {entries.find(e => e.note) && (
        <div className="chart-note">{entries.find(e => e.note).note}</div>
      )}
    </div>
  )
}

// ── DAU Sparkline ─────────────────────────────────────────────────────────

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

// ── Team Member Card ──────────────────────────────────────────────────────

export function TeamMemberCard({ member }) {
  const [expanded, setExpanded] = useState(false)

  const verifiedCount = (member.education || []).filter(e => e.verified).length
    + Object.values(member.social || {}).filter(s => s?.verified).length
    + (member.experience || []).filter(e => e.verified).length
  const totalClaims = (member.education?.length || 0) + Object.keys(member.social || {}).length + (member.experience?.length || 0)
  const verifyPct = totalClaims > 0 ? Math.round((verifiedCount / totalClaims) * 100) : 0
  const verifyColor = verifyPct >= 70 ? GREEN : verifyPct >= 40 ? ORANGE : RED

  return (
    <div className={`team-card ${member.flag ? 'team-card-flagged' : ''}`}>
      <div className="team-card-header" onClick={() => setExpanded(!expanded)}>
        <div className="team-card-avatar" style={{ background: member.wallet ? `#${member.wallet.slice(2, 8)}` : BORDER }}>
          {member.name?.charAt(0)}
        </div>
        <div className="team-card-info">
          <div className="team-card-name">
            {member.name}
            {member.kyc_verified ? <span className="tag tag-verified" style={{ marginLeft: 6 }}>KYC ✓</span> : <span className="tag tag-flagged" style={{ marginLeft: 6 }}>KYC ✗</span>}
          </div>
          <div className="team-card-role">{member.role}</div>
        </div>
        <div className="team-card-meta">
          <span className="team-verify-badge" style={{ color: verifyColor, borderColor: verifyColor }}>
            {verifyPct}% verified ({verifiedCount}/{totalClaims})
          </span>
          <span style={{ color: DIM, transform: expanded ? 'rotate(180deg)' : '', transition: 'transform .2s', marginLeft: 8 }}>▼</span>
        </div>
      </div>

      {expanded && (
        <div className="team-card-body">
          {/* Social links */}
          <div className="team-section-label">Social Links</div>
          <div className="team-links">
            {member.social?.linkedin?.url && (
              <a className={`team-link ${member.social.linkedin.verified ? 'team-link-verified' : 'team-link-claimed'}`}
                href={`https://${member.social.linkedin.url}`} target="_blank" rel="noreferrer">
                🔗 LinkedIn {member.social.linkedin.verified ? '✓' : '◯'}
              </a>
            )}
            {member.social?.twitter?.handle && (
              <span className={`team-link ${member.social.twitter.verified ? 'team-link-verified' : 'team-link-claimed'}`}>
                🐦 {member.social.twitter.handle} {member.social.twitter.verified ? '✓' : '◯'}
              </span>
            )}
            {member.social?.github?.handle && (
              <span className={`team-link ${member.social.github.verified ? 'team-link-verified' : 'team-link-claimed'}`}>
                <span style={{ fontFamily: 'var(--mono)' }}>gh:</span>{member.social.github.handle} {member.social.github.verified ? '✓' : '◯'}
                {member.social.github.commits_90d != null && <span style={{ color: DIM, fontSize: 10 }}> · {member.social.github.commits_90d} commits</span>}
              </span>
            )}
            {member.social?.github?.note && (
              <div className="team-link-note">{member.social.github.note}</div>
            )}
          </div>

          {/* Education */}
          {member.education?.length > 0 && (
            <>
              <div className="team-section-label">Education</div>
              {member.education.map((e, i) => (
                <div key={i} className="team-edu-item">
                  <span className={`dot ${e.verified ? 'dot-green' : 'dot-orange'}`} />
                  <span className="team-edu-school">{e.school}</span>
                  <span className="team-edu-degree">{e.degree}</span>
                  <span className="team-edu-year">({e.year})</span>
                  {e.note && <span className="tag tag-self" style={{ marginLeft: 6, fontSize: 10 }}>{e.note}</span>}
                </div>
              ))}
            </>
          )}

          {/* Experience */}
          {member.experience?.length > 0 && (
            <>
              <div className="team-section-label">Experience</div>
              {member.experience.map((e, i) => (
                <div key={i} className="team-exp-item">
                  <span className={`dot ${e.verified === true ? 'dot-green' : e.verified === false ? 'dot-orange' : 'dot-dim'}`} />
                  <span className="team-exp-role">{e.role}</span>
                  <span className="team-exp-company">@ {e.company}</span>
                  <span className="team-exp-years">{e.years}</span>
                  {e.note && <div className="team-exp-note">{e.note}</div>}
                </div>
              ))}
            </>
          )}

          {member.flag && (
            <div className="team-flag">⚠ {member.flag}</div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Token Pie Chart ───────────────────────────────────────────────────────

export function TokenPieChart({ allocation, size = 200 }) {
  if (!allocation?.categories?.length) return null

  const categories = allocation.categories
  const cx = size / 2
  const cy = size / 2
  const outerR = size / 2 - 4
  const innerR = outerR * 0.55  // donut hole
  let angle = -Math.PI / 2  // start from top

  const slices = categories.map(cat => {
    const sliceAngle = (cat.pct / 100) * Math.PI * 2
    const startAngle = angle
    angle += sliceAngle
    return { ...cat, startAngle, endAngle: angle, sliceAngle }
  })

  function arcPath(startAngle, endAngle, r) {
    const x1 = cx + r * Math.cos(startAngle)
    const y1 = cy + r * Math.sin(startAngle)
    const x2 = cx + r * Math.cos(endAngle)
    const y2 = cy + r * Math.sin(endAngle)
    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`
  }

  return (
    <div className="pie-wrap">
      <div className="chart-label">Token Allocation</div>
      <div className="pie-chart-row">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {slices.map((s, i) => (
            <g key={i}>
              <path
                d={`${arcPath(s.startAngle, s.endAngle, outerR)} L ${cx + innerR * Math.cos(s.endAngle)} ${cy + innerR * Math.sin(s.endAngle)} ${arcPath(s.endAngle, s.startAngle, innerR)} Z`}
                fill={s.color} opacity={0.85} stroke={BG} strokeWidth={1.5}
              />
              <title>{s.name}: {s.pct}% ({s.tokens})</title>
            </g>
          ))}
          {/* Center label */}
          <text x={cx} y={cy - 4} fill={TBRIGHT} fontSize={13} fontWeight={700} textAnchor="middle" fontFamily="var(--mono)">
            {allocation.total_supply?.split(' ')[0]}
          </text>
          <text x={cx} y={cy + 12} fill={DIM} fontSize={9} textAnchor="middle" fontFamily="var(--font)">
            Total Supply
          </text>
        </svg>
        {/* Legend */}
        <div className="pie-legend">
          {slices.map((s, i) => (
            <div key={i} className="pie-legend-item">
              <span className="pie-legend-dot" style={{ background: s.color }} />
              <span className="pie-legend-label">{s.name}</span>
              <span className="pie-legend-pct">{s.pct}%</span>
              {s.cliff_months != null && s.vesting_months != null && (
                <span className="pie-legend-vest">{s.cliff_months === 0 ? 'TGE unlock' : `${s.cliff_months}mo cliff / ${s.vesting_months}mo vest`}</span>
              )}
              {s.cliff_months == null && <span className="pie-legend-vest">No lockup</span>}
            </div>
          ))}
        </div>
      </div>
      {allocation.note && <div className="chart-note" style={{ marginTop: 10 }}>{allocation.note}</div>}
    </div>
  )
}
