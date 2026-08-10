// Component renderers for the Signal dashboard
const Components = {
  riskBadge(risk) {
    const map = {
      critical: 'risk-critical', high: 'risk-high', medium: 'risk-medium',
      low: 'risk-low', info: 'risk-info', pending: 'risk-pending',
      good: 'risk-good', approved: 'risk-low'
    };
    const labels = {
      critical: 'CRITICAL', high: 'HIGH', medium: 'MEDIUM',
      low: 'LOW', info: 'INFO', pending: 'PENDING', good: 'GOOD'
    };
    return `<span class="risk-badge ${map[risk] || 'risk-info'}">${labels[risk] || risk.toUpperCase()}</span>`;
  },

  flagPill(severity, text) {
    const cls = `flag-${severity}`;
    return `<span class="flag-pill ${cls}"><span class="dot dot-${severity === 'critical' ? 'red' : severity === 'high' ? 'orange' : 'yellow'}"></span>${text}</span>`;
  },

  flagCard(flag) {
    const cls = `flag-card-${flag.severity}`;
    const dotCls = `dot-${flag.severity === 'critical' ? 'red' : flag.severity === 'high' ? 'orange' : 'yellow'}`;
    const actionCls = `flag-card-action-${flag.severity}`;
    const dimBadge = Components.riskBadge(flag.dimension === 'R1' ? 'critical' : flag.dimension === 'R2' ? 'high' : 'medium');
    return `
      <div class="flag-card ${cls}">
        <div class="flag-card-header">
          <span class="dot ${dotCls}"></span>
          <span class="flag-card-title">${flag.title}</span>
          <span style="margin-left:auto;font-size:10px;color:var(--text-dim)">${flag.dimension}</span>
        </div>
        <div class="flag-card-detail">${flag.detail}</div>
        ${flag.recommendation ? `<div class="flag-card-action ${actionCls}">→ ${flag.recommendation}</div>` : ''}
      </div>`;
  },

  riskBar(risk) {
    const dims = [
      { key: 'r1_regulatory', label: 'R1 REGULATORY' },
      { key: 'r2_fraud', label: 'R2 FRAUD' },
      { key: 'r3_integrity', label: 'R3 INTEGRITY' },
      { key: 'r4_viability', label: 'R4 VIABILITY' },
      { key: 'r5_economics', label: 'R5 ECONOMICS' }
    ];
    const labels = {
      critical: 'CRITICAL', high: 'HIGH', medium: 'MEDIUM',
      low: 'LOW', info: 'INFO', pending: 'PENDING', good: 'GOOD'
    };
    return dims.map(d => {
      const v = risk[d.key] || 'info';
      const cls = v === 'critical' ? 'critical' : v === 'high' ? 'high' : v === 'medium' ? 'medium' : v === 'low' ? 'low' : v === 'good' ? 'good' : v === 'pending' ? 'pending' : 'info';
      return `<div class="risk-dim risk-dim-${cls}">
        <div class="risk-dim-label">${d.label}</div>
        <div class="risk-dim-value" style="color:var(--${cls === 'critical' ? 'red' : cls === 'high' ? 'orange' : cls === 'medium' ? 'yellow' : cls === 'low' || cls === 'good' ? 'green' : cls === 'pending' ? 'blue' : 'text-dim'})">${labels[v]}</div>
      </div>`;
    }).join('');
  },

  walletRow(w) {
    const dotCls = `dot-${w.risk}`;
    return `<tr>
      <td><code style="font-size:11px">${w.address}</code></td>
      <td>${w.label}</td>
      <td>${w.entity}</td>
      <td>${w.freshness}</td>
      <td><span class="dot ${dotCls}"></span></td>
    </tr>`;
  },

  claimRow(claim, verdict, cls) {
    return `<tr>
      <td>${claim}</td>
      <td>${verdict}</td>
      <td class="claim-verdict claim-verdict-${cls}">${cls === 'ok' ? '✓' : cls === 'flag' ? '⚠' : cls === 'warn' ? '🔴' : '◯'}</td>
    </tr>`;
  }
};
