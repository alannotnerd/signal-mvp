import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { fetchProject } from '../stubs/api'
import { computeRiskScores, computeRiskReasons } from '../engine/scoring'
import RiskBadge, { RiskBar, FlagCard, Section, ScoreTrace } from './Common'
import { GitHubSparkline, MilestoneTimeline, SocialBarChart, DAUSparkline, TeamMemberCard, TokenPieChart } from './Charts'

export default function ProjectDetail() {
  const { id } = useParams()
  const [p, setP] = useState(null)
  const [loading, setLoading] = useState(true)
  const [traceOpen, setTraceOpen] = useState(false)

  useEffect(() => { fetchProject(id).then(data => { setP(data); setLoading(false) }) }, [id])

  if (loading) return <div className="loading">Loading project...</div>
  if (!p) return <div className="loading" style={{ color: 'var(--red)' }}>Project not found: {id}</div>

  const { risk, _trace } = computeRiskScores(p)
  const reasons = computeRiskReasons(p)

  const statusLabels = { in_review: 'In Review', approved: 'Approved', rejected: 'Rejected', pending: 'Pending' }

  return <>
    <Link to="/" className="back-link">← Back to Projects</Link>

    <div className="project-header">
      <div className="project-title">
        <h2>{p.name} ({p.symbol})</h2>
        <div className="meta">
          <span>{p.category}</span><span>·</span>
          <span>Intake v{p.version} · {p.submitted_at?.split('T')[0]}</span><span>·</span>
          <span style={{ color: p.status === 'approved' ? 'var(--green)' : 'var(--yellow)' }}>{statusLabels[p.status] || p.status}</span>
        </div>
      </div>
      <div className="project-actions">
        <button className="btn btn-danger btn-sm">Reject</button>
        <button className="btn btn-sm">Request Info</button>
        <button className="btn btn-primary btn-sm">Approve</button>
        <button className="btn btn-sm">Export PDF</button>
        <button className="btn btn-sm" onClick={() => setTraceOpen(true)} title="View scoring breakdown">🔍 Trace</button>
      </div>
    </div>

    <div className="risk-bar"><RiskBar risk={risk} reasons={reasons} onDimensionClick={() => setTraceOpen(true)} /></div>

    <div className="flags-section">
      <h3 style={{ fontSize: 14, marginBottom: 10, color: 'var(--text-bright)' }}>
        ⚠ {p.flags?.length || 0} flags · {p.flags?.filter(f => f.severity === 'critical').length || 0} critical · {p.flags?.filter(f => f.severity === 'high').length || 0} high · {p.flags?.filter(f => f.severity === 'medium').length || 0} medium
      </h3>
      {p.flags?.map(f => <FlagCard key={f.id} flag={f} />)}
    </div>

    {p.team_members?.length > 0 && <TeamDDSection members={p.team_members} />}

    {p.r1_regulatory && <R1Section r1={p.r1_regulatory} riskLevel={risk.r1_regulatory} />}
    {p.r2_fraud && <R2Section r2={p.r2_fraud} riskLevel={risk.r2_fraud} />}
    {p.r3_integrity && <R3Section r3={p.r3_integrity} riskLevel={risk.r3_integrity} />}
    {p.r4_viability && <R4Section r4={p.r4_viability} riskLevel={risk.r4_viability} />}
    {p.r5_economics && <R5Section r5={p.r5_economics} riskLevel={risk.r5_economics} />}

    {traceOpen && <ScoreTrace trace={_trace} onClose={() => setTraceOpen(false)} />}
  </>
}

function R1Section({ r1, riskLevel }) {
  return <Section title="R1 — REGULATORY RISK" risk={riskLevel}>
    <div className="info-grid">
      <div className="info-item"><div className="info-label">Sanctions Screening</div><div className="info-value" style={{ color: r1.sanctions?.status === 'clean' ? 'var(--green)' : 'var(--red)' }}>{r1.sanctions?.status === 'clean' ? '✓ Clean — 0 matches' : '🔴 Flagged'}</div></div>
      <div className="info-item"><div className="info-label">Legal Opinions</div><div className="info-value">{r1.legal_opinions?.opinions?.length || 0} submitted{r1.legal_opinions?.missing?.length ? ' · ' + r1.legal_opinions.missing.length + ' missing' : ''}</div></div>
      <div className="info-item"><div className="info-label">Token Classification</div><div className="info-value">{r1.token_characteristics?.privacy_enhancing ? '⚠ Privacy features' : '✓ Standard token'}</div></div>
      <div className="info-item"><div className="info-label">Entity</div><div className="info-value">{r1.entity?.name || '—'} · {r1.entity?.jurisdiction || '—'} <span className="tag tag-self">self-reported</span></div></div>
    </div>
    {r1.legal_opinions?.opinions?.length > 0 && <>
      <div style={{ marginTop: 12 }}><strong style={{ fontSize: 12 }}>Legal Opinions:</strong></div>
      <table style={{ marginTop: 6 }}><thead><tr><th>Firm</th><th>Jurisdiction</th><th>Topic</th><th>Date</th></tr></thead><tbody>
        {r1.legal_opinions.opinions.map((o, i) => <tr key={i}><td>{o.firm}</td><td>{o.jurisdiction}</td><td>{o.topic}</td><td>{o.date}</td></tr>)}
      </tbody></table>
    </>}
    {r1.legal_opinions?.missing?.length > 0 && <div style={{ marginTop: 8, color: 'var(--orange)', fontSize: 12 }}>⚠ Missing: {r1.legal_opinions.missing.join(', ')}</div>}
    {r1.sanctions?.matches?.length > 0 && <>
      <div style={{ marginTop: 12 }}><strong style={{ fontSize: 12, color: 'var(--red)' }}>Sanctions Matches:</strong></div>
      <table style={{ marginTop: 6 }}><thead><tr><th>Entity</th><th>List</th><th>Reason</th></tr></thead><tbody>
        {r1.sanctions.matches.map((m, i) => <tr key={i}><td><code>{m.entity}</code></td><td>{m.list}</td><td>{m.reason}</td></tr>)}
      </tbody></table>
    </>}
  </Section>
}

function R2Section({ r2, riskLevel }) {
  const cats = [
    { key: 'team', label: 'TEAM', data: r2.wallet_map?.team },
    { key: 'investors', label: 'INVESTORS', data: r2.wallet_map?.investors },
    { key: 'ecosystem', label: 'ECOSYSTEM', data: r2.wallet_map?.ecosystem },
    { key: 'treasury', label: 'TREASURY', data: r2.wallet_map?.treasury }
  ].filter(c => c.data?.wallets)

  return <Section title="R2 — FRAUD DETECTION" risk={riskLevel}>
    {r2.allocation_summary && <div style={{ marginBottom: 12, fontSize: 12, color: 'var(--text-dim)' }}>
      {r2.allocation_summary.total_wallets} wallets · {r2.allocation_summary.verified} verified · {r2.allocation_summary.flagged} flagged
      {r2.allocation_summary.sybil_clusters > 0 && ` · ${r2.allocation_summary.sybil_clusters} Sybil clusters`}
    </div>}
    {cats.map(cat => (
      <div className="wallet-category" key={cat.key}>
        <div className="wallet-category-header">
          <strong>{cat.label}</strong>
          <span>{cat.data.total} wallets · {cat.data.verified || 0} verified · {(cat.data.misattributed || 0) + (cat.data.sybil || 0) + (cat.data.sanctioned || 0)} flagged</span>
        </div>
        <table className="wallet-table"><thead><tr><th>Address</th><th>Label</th><th>Entity</th><th>Freshness</th><th>Risk</th></tr></thead><tbody>
          {cat.data.wallets.map((w, i) => <tr key={i}>
            <td><code style={{ fontSize: 11 }}>{w.address}</code></td><td>{w.label}</td><td>{w.entity}</td><td>{w.freshness}</td>
            <td><span className={`dot dot-sm dot-${w.risk}`} /></td>
          </tr>)}
        </tbody></table>
      </div>
    ))}
    {r2.sybil_clusters?.map((c, i) => (
      <div key={i} className="flag-card flag-card-critical" style={{ marginTop: 8 }}>
        <div className="flag-card-header"><span className="dot dot-red" /><span className="flag-card-title">Sybil Cluster: {c.size} wallets</span></div>
        <div className="flag-card-detail">Created: {c.created} · Funded: {c.funding_source}<br />Pattern: {c.pattern}<br />Declared as: {c.declared_as?.join(', ')}</div>
        <div className="flag-card-action flag-card-action-critical">→ {c.severity === 'critical' ? 'REJECT or require re-disclosure' : 'Investigate'}</div>
      </div>
    ))}
    {r2.contract_analysis && (() => { const ca = r2.contract_analysis; return <>
      <div style={{ marginTop: 16 }}><strong style={{ fontSize: 13 }}>Smart Contract</strong></div>
      <div className="info-grid" style={{ marginTop: 8 }}>
        <div className="info-item"><div className="info-label">Deployment</div><div className="info-value">{ca.deployed ? `✓ Deployed on ${ca.chain}` : '⚠ Not deployed'}</div></div>
        <div className="info-item"><div className="info-label">Proxy</div><div className="info-value">{ca.proxy?.type} — {ca.proxy?.upgrade_control} <span className={`tag ${ca.proxy?.risk === 'high' ? 'tag-flagged' : 'tag-verified'}`}>{ca.proxy?.risk}</span></div></div>
        <div className="info-item"><div className="info-label">Mint</div><div className="info-value">{ca.mint?.cap} · {ca.mint?.access} <span className={`tag ${ca.mint?.risk === 'critical' ? 'tag-flagged' : 'tag-verified'}`}>{ca.mint?.risk}</span></div></div>
        <div className="info-item"><div className="info-label">Audit</div><div className="info-value">{ca.audit?.exists ? `✓ ${ca.audit.auditor} (${ca.audit.date})` : '🔴 None submitted'}</div></div>
      </div>
    </>})()}
  </Section>
}

function R3Section({ r3, riskLevel }) {
  const colorFor = (val, warn, crit) => val > crit ? 'var(--red)' : val > warn ? 'var(--orange)' : 'var(--green)'
  return <Section title="R3 — MARKET INTEGRITY" risk={riskLevel}>
    <div className="note-dim">⚠ Most claims unverifiable pre-TGE. Based on self-reported data + contract analysis only.</div>
    <div style={{ marginBottom: 16 }}><strong style={{ fontSize: 13 }}>Vesting Schedule</strong></div>
    <table><thead><tr><th>Category</th><th>Cliff</th><th>Vesting</th><th>Schedule</th><th>First Unlock</th></tr></thead><tbody>
      {r3.vesting?.categories?.map((c, i) => <tr key={i}><td>{c.name}</td><td>{c.cliff_months ? c.cliff_months + 'mo' : '—'}</td><td>{c.vesting_months ? c.vesting_months + 'mo' : '—'}</td><td>{c.schedule}</td><td>{c.first_unlock || '—'}</td></tr>)}
    </tbody></table>
    {r3.vesting?.contract_deployed ? <div style={{ marginTop: 8 }}><span className="tag tag-verified">✓ Vesting contract deployed</span></div> : <div style={{ marginTop: 8, color: 'var(--orange)', fontSize: 12 }}>⚠ Vesting contract not deployed — enforcement unverifiable</div>}

    <div style={{ marginTop: 16 }}><strong style={{ fontSize: 13 }}>Concentration</strong></div>
    {r3.concentration && <>
      <Gauge label="Gini" value={r3.concentration.gini * 100} bench={r3.concentration.gini_benchmark * 100} warn={75} crit={85} />
      <Gauge label="Top 3" value={r3.concentration.top3_pct} bench={r3.concentration.top3_benchmark} suffix="%" warn={45} crit={60} />
      <Gauge label="Largest" value={r3.concentration.largest_single_pct} bench={r3.concentration.largest_single_benchmark} suffix="%" warn={25} crit={30} />
    </>}

    {r3.supply_controls && <>
      <div style={{ marginTop: 16 }}><strong style={{ fontSize: 13 }}>Supply Controls (on-chain verified)</strong></div>
      <div className="info-grid" style={{ marginTop: 8 }}>
        <div className="info-item"><div className="info-label">Burn</div><div className="info-value">{r3.supply_controls.burn?.rate || r3.supply_controls.burn?.type} <span className="tag tag-verified">✓</span></div></div>
        <div className="info-item"><div className="info-label">Inflation</div><div className="info-value">{r3.supply_controls.inflation?.rate} · {r3.supply_controls.inflation?.mechanism} <span className="tag tag-verified">✓</span></div></div>
        <div className="info-item"><div className="info-label">Mint</div><div className="info-value">{r3.supply_controls.mint?.cap} · {r3.supply_controls.mint?.access} <span className={`tag ${r3.supply_controls.mint?.risk === 'low' ? 'tag-verified' : 'tag-flagged'}`}>{r3.supply_controls.mint?.risk}</span></div></div>
      </div>
    </>}

    {r3.unlock_calendar?.length > 0 && <>
      <div style={{ marginTop: 16 }}><strong style={{ fontSize: 13 }}>Unlock Calendar</strong></div>
      {r3.unlock_calendar.map((e, i) => <div key={i} className="unlock-event">
        <span className="unlock-date">{e.date}</span>
        <div className="unlock-bar-wrap"><div className="unlock-bar-fill" style={{ width: Math.max(parseFloat(e.pct) * 3, 8) + '%' }}>{e.tokens} ({e.pct})</div></div>
        <span className="unlock-info">{e.category}</span>
      </div>)}
      <div style={{ marginTop: 8 }}><span className="tag tag-self">◯ All unlock data self-reported</span></div>
    </>}
  </Section>
}

function Gauge({ label, value, bench, suffix, warn, crit }) {
  const pct = Math.min(value, 100)
  const color = value > crit ? 'var(--red)' : value > warn ? 'var(--orange)' : 'var(--green)'
  return <div className="gauge">
    <span style={{ fontSize: 11, width: 80, color: 'var(--text-dim)' }}>{label}</span>
    <div className="gauge-bar"><div className="gauge-fill" style={{ width: pct + '%', background: color }} /></div>
    <span className="gauge-value">{Math.round(value)}{suffix}</span>
    <span className="gauge-benchmark">&lt;{bench}{suffix}</span>
  </div>
}

function R4Section({ r4, riskLevel }) {
  return <Section title="R4 — BUSINESS VIABILITY" risk={riskLevel}>
    <div className="note-dim">◯ INFORMATIONAL — most data self-reported. Exchange's own business analysis required.</div>
    <div className="info-grid">
      <div className="info-item"><div className="info-label">Product</div><div className="info-value">{r4.product?.url_reachable ? '✓ ' + r4.product.url : '⚠ URL unreachable'} · {r4.product?.status}</div></div>
      <div className="info-item"><div className="info-label">GitHub</div><div className="info-value">{r4.github?.stars?.toLocaleString()} ⭐ · {r4.github?.contributors} contributors · {r4.github?.commits_90d} commits (90d)</div></div>
      <div className="info-item"><div className="info-label">Team</div><div className="info-value">{r4.team?.headcount} total ({r4.team?.engineering} eng) <span className="tag tag-self">self-reported</span></div></div>
      <div className="info-item"><div className="info-label">Financials</div><div className="info-value">Raised: {r4.financials?.total_raised} · Burn: {r4.financials?.burn_rate} · Runway: {r4.financials?.runway_months}mo</div></div>
      {r4.financials?.treasury_onchain && <div className="info-item"><div className="info-label">Treasury (on-chain)</div><div className="info-value">{r4.financials.treasury_onchain} <span className="tag tag-verified">✓ verified</span></div></div>}
    </div>
    {r4.github_activity && <GitHubSparkline data={r4.github_activity} />}
    {r4.roadmap?.length > 0 && <MilestoneTimeline roadmap={r4.roadmap} />}
  </Section>
}

function R5Section({ r5, riskLevel }) {
  return <Section title="R5 — LISTING ECONOMICS" risk={riskLevel}>
    <div className="note-dim">◯ INFORMATIONAL — Exchange BD team evaluation. Signal verifies factual claims.</div>
    <div className="info-grid">
      <div className="info-item"><div className="info-label">CEX Listings</div><div className="info-value">{r5.market_presence?.cex_listings?.length ? r5.market_presence.cex_listings.map(l => `✓ ${l.exchange} (${l.pair})`).join(', ') : 'None (pre-launch)'}</div></div>
      <div className="info-item"><div className="info-label">DEX Listings</div><div className="info-value">{r5.market_presence?.dex_listings?.length ? r5.market_presence.dex_listings.map(l => `✓ ${l.dex} ${l.pair}`).join(', ') : 'None'}</div></div>
      {r5.market_presence?.cmc_rank && <div className="info-item"><div className="info-label">Market Data</div><div className="info-value">CMC #{r5.market_presence.cmc_rank} · MCap {r5.market_presence.market_cap} · FDV {r5.market_presence.fdv}</div></div>}
      <div className="info-item"><div className="info-label">Market Makers</div><div className="info-value">{r5.market_makers?.map(m => `${m.wallet_verified ? '✓' : '◯'} ${m.name}`).join(', ') || 'None confirmed'}</div></div>
      <div className="info-item"><div className="info-label">Community</div><div className="info-value">Twitter {r5.community?.twitter?.followers?.toLocaleString()} · Discord {r5.community?.discord?.members?.toLocaleString()} · TG {r5.community?.telegram?.members?.toLocaleString()}</div></div>
      <div className="info-item"><div className="info-label">Listing Prefs</div><div className="info-value">{r5.listing_preferences?.program} · FDV {r5.listing_preferences?.target_fdv} · {r5.listing_preferences?.target_date}</div></div>
    </div>
    {r5.social_activity && <SocialBarChart data={r5.social_activity} />}
    {r5.social_activity && <DAUSparkline data={r5.social_activity} />}
    {r5.token_allocation && <TokenPieChart allocation={r5.token_allocation} />}
  </Section>
}

// ── Team DD Section ─────────────────────────────────────────────────────

function TeamDDSection({ members }) {
  return <div className="section">
    <div className="section-header" style={{ cursor: 'default' }}>
      <div className="section-header-left">
        <h3>👥 TEAM DUE DILIGENCE</h3>
        <span className="tag" style={{ color: DIM }}>{members.length} members</span>
      </div>
    </div>
    <div className="section-body">
      {members.map((m, i) => <TeamMemberCard key={i} member={m} />)}
    </div>
  </div>
}

const DIM = '#6b7280'
