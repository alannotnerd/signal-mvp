/**
 * Signal Scoring Engine v1.0
 *
 * Computes risk scores from evidence (flags), not from declared labels.
 * Every rating traces back to specific findings with severity + confidence.
 *
 * Formula per dimension:
 *   dimension_score = max(indicator_severity) × 0.7 + weighted_avg × 0.3
 *
 * Why:
 *   - max @70%: worst finding dominates — one critical flag cannot be averaged away
 *   - weighted_avg @30%: pattern matters — three critical flags > one critical flag
 *   - weighted_avg uses (severity × confidence) as the weight — low-confidence
 *     findings contribute less even if severe
 *
 * Level thresholds:
 *   3.5–4.0 → CRITICAL
 *   2.5–3.4 → HIGH
 *   1.5–2.4 → MEDIUM
 *   0.5–1.4 → LOW
 *   0.0–0.4 → CLEAN
 *
 * R4 (Business Viability) and R5 (Listing Economics) are informational only —
 * they do not participate in the automated overall risk score. The exchange's
 * own BD team evaluates these dimensions.
 */

// ── Severity → numeric score ──────────────────────────────────────────────
const SEVERITY_SCORE = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
  info: 0,
  good: 0,
}

// ── Confidence inference ──────────────────────────────────────────────────
// Confidence answers: "how sure are we this finding is real?"
// 1.0 = on-chain verified / third-party confirmed
// 0.7 = partially verifiable / self-reported claim
// 0.4 = self-reported absence / low verifiability

function inferConfidence(flag) {
  // Third-party screening (Chainalysis, etc.)
  if (flag.screening?.provider) return 1.0

  // On-chain contract data with address
  if (flag.contract?.address) return 1.0

  // On-chain cluster analysis
  if (flag.cluster?.size) return 1.0

  // On-chain wallet data
  if (flag.wallet?.address) return 1.0
  if (flag.wallets && Array.isArray(flag.wallets) && flag.wallets.length > 0) return 1.0

  // Self-reported absence — low verifiability
  const title = (flag.title || '').toLowerCase()
  if (
    title.includes('no bug bounty') ||
    title.includes('no legal opinion') && !flag.detail?.toLowerCase().includes('on-chain')
  ) return 0.4

  // Self-reported claims — moderate confidence
  if (
    title.includes('no ') ||
    title.includes('not submitted') ||
    title.includes('not conducted') ||
    title.includes('not established') ||
    title.includes('self-reported')
  ) return 0.7

  // Team/financial self-reports
  if (
    title.includes('team') ||
    title.includes('headcount') ||
    flag.detail?.toLowerCase().includes('self-reported')
  ) return 0.7

  // Default: moderate confidence for analytical findings
  return 0.7
}

// ── Indicator extraction ──────────────────────────────────────────────────

function extractIndicators(project) {
  const flags = project.flags || []
  return flags.map(f => ({
    id: f.id,
    dimension: f.dimension,
    severity: SEVERITY_SCORE[f.severity] || 0,
    severityLabel: f.severity,
    confidence: inferConfidence(f),
    title: f.title,
    weightedScore: (SEVERITY_SCORE[f.severity] || 0) * inferConfidence(f),
  }))
}

// ── Dimension score ───────────────────────────────────────────────────────

const MAX_WEIGHT = 0.7
const AVG_WEIGHT = 0.3

function computeDimensionScore(indicators, hasStructuredData = false) {
  // No indicators at all
  if (indicators.length === 0) {
    // If structured section exists (e.g. sanctions checked, legal opinions reviewed,
    // contract analyzed) but no flags were raised → CLEAN, not PENDING.
    // PENDING means "we have no data yet." CLEAN means "we checked, found nothing."
    return hasStructuredData
      ? { raw: 0, level: 'clean', indicators: [], breakdown: { max: 0, weightedAvg: 0, formula: '0 × 0.7 + 0 × 0.3' } }
      : null
  }

  const max = Math.max(...indicators.map(i => i.severity))
  const weights = indicators.map(i => i.weightedScore)
  const totalWeight = weights.reduce((a, b) => a + b, 0)
  const weightedSum = indicators.reduce((sum, i) => sum + i.severity * i.weightedScore, 0)
  const weightedAvg = totalWeight > 0 ? weightedSum / totalWeight : 0

  return {
    raw: round(max * MAX_WEIGHT + weightedAvg * AVG_WEIGHT),
    level: levelFromScore(max * MAX_WEIGHT + weightedAvg * AVG_WEIGHT),
    indicators,
    breakdown: {
      max: round(max),
      weightedAvg: round(weightedAvg),
      formula: `${round(max)} × ${MAX_WEIGHT} + ${round(weightedAvg)} × ${AVG_WEIGHT}`,
    },
  }
}

function levelFromScore(score) {
  if (score >= 3.5) return 'critical'
  if (score >= 2.5) return 'high'
  if (score >= 1.5) return 'medium'
  if (score >= 0.5) return 'low'
  return 'clean'
}

// ── Overall risk ──────────────────────────────────────────────────────────
// Overall = worst of R1, R2, R3 (algorithmic dimensions only).
// R4 and R5 are informational and do not escalate overall risk.

function overallRisk(r1Level, r2Level, r3Level) {
  const LEVEL_RANK = { critical: 0, high: 1, medium: 2, low: 3, clean: 4 }
  const levels = [r1Level, r2Level, r3Level].filter(Boolean)
  if (levels.length === 0) return 'pending'
  levels.sort((a, b) => (LEVEL_RANK[a] ?? 99) - (LEVEL_RANK[b] ?? 99))
  return levels[0]
}

function round(n) { return Math.round(n * 100) / 100 }

// ── Public API ────────────────────────────────────────────────────────────

/**
 * computeRiskScores(project) → { overall, dimensions, _trace }
 *
 * @param {Object} project — full project stub object (with flags array)
 * @returns {Object} risk assessment with traceability data
 */
export function computeRiskScores(project) {
  const allIndicators = extractIndicators(project)

  const byDimension = {}
  for (const dim of ['R1', 'R2', 'R3', 'R4', 'R5']) {
    byDimension[dim] = allIndicators.filter(i => i.dimension === dim)
  }

  // Structured data check — dimension has analysis even if no flags were raised
  function hasData(dimKey) {
    const s = project[dimKey]
    if (!s) return false
    if (s.risk === 'pending' && !s.sanctions && !s.allocation_summary && !s.contract_analysis) return false
    return true
  }

  const r1 = computeDimensionScore(byDimension['R1'], hasData('r1_regulatory'))
  const r2 = computeDimensionScore(byDimension['R2'], hasData('r2_fraud'))
  const r3 = computeDimensionScore(byDimension['R3'], hasData('r3_integrity'))

  // R4 and R5 are informational — carry through from project data or default to 'info'
  const r4Level = project.r4_viability?.risk || 'info'
  const r5Level = project.r5_economics?.risk || 'info'

  // For PENDING projects (no data at all), all dimensions remain pending
  const isPending = project.status === 'pending' && allIndicators.length === 0

  const risk = {
    overall: isPending ? 'pending' : overallRisk(
      r1?.level ?? null,
      r2?.level ?? null,
      r3?.level ?? null
    ),
    r1_regulatory: isPending ? 'pending' : (r1?.level ?? 'pending'),
    r2_fraud: isPending ? 'pending' : (r2?.level ?? 'pending'),
    r3_integrity: isPending ? 'pending' : (r3?.level ?? 'pending'),
    r4_viability: r4Level,
    r5_economics: r5Level,
  }

  // Trace data for audit trail
  const _trace = {
    formula: 'dimension_score = max(severity) × 0.7 + weighted_avg(severity × confidence) × 0.3',
    thresholds: {
      critical: '≥ 3.5',
      high: '≥ 2.5',
      medium: '≥ 1.5',
      low: '≥ 0.5',
      clean: '< 0.5',
    },
    dimensions: {
      R1: r1,
      R2: r2,
      R3: r3,
      R4: { level: r4Level, note: 'INFORMATIONAL — exchange BD evaluates' },
      R5: { level: r5Level, note: 'INFORMATIONAL — exchange BD evaluates' },
    },
  }

  return { risk, _trace }
}

/**
 * computeRiskReasons(project) → { r1_regulatory: [...], r2_fraud: [...], ... }
 *
 * Extracts summary reasons from the computed indicators for display in RiskBar.
 * Returns top 3 indicators per dimension, sorted by weightedScore descending.
 */
export function computeRiskReasons(project) {
  const allIndicators = extractIndicators(project)
  const result = {}

  for (const dim of ['r1_regulatory', 'r2_fraud', 'r3_integrity', 'r4_viability', 'r5_economics']) {
    const dimKey = dim.replace('r1_', 'R1').replace('r2_', 'R2').replace('r3_', 'R3').replace('r4_', 'R4').replace('r5_', 'R5')
    const indicators = allIndicators.filter(i => i.dimension === dimKey)
    indicators.sort((a, b) => b.weightedScore - a.weightedScore)
    result[dim] = indicators.slice(0, 3).map(i => ({
      severity: i.severityLabel,
      text: i.title,
    }))
  }

  return result
}

/**
 * DEFAULT_RISK — used as fallback when scoring engine is unavailable
 */
export const DEFAULT_RISK = {
  overall: 'pending',
  r1_regulatory: 'pending',
  r2_fraud: 'pending',
  r3_integrity: 'pending',
  r4_viability: 'info',
  r5_economics: 'info',
}
