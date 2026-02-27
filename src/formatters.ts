// Formatters convert API JSON responses to concise text for LLM consumption

function statusIcon(status: string): string {
  const s = status?.toLowerCase();
  if (s === "up" || s === "active" || s === "healthy" || s === "resolved") return "[UP]";
  if (s === "degraded" || s === "warning" || s === "caution") return "[DEGRADED]";
  if (s === "down" || s === "critical" || s === "detecting" || s === "investigating") return "[DOWN]";
  if (s === "paused") return "[PAUSED]";
  if (s === "maintenance") return "[MAINTENANCE]";
  return `[${(status || "unknown").toUpperCase()}]`;
}

function priorityLabel(p: string): string {
  return `[${(p || "unknown").toUpperCase()}]`;
}

function pct(n: number | null | undefined): string {
  return n != null ? `${Number(n).toFixed(1)}%` : "N/A";
}

function ms(n: number | null | undefined): string {
  return n != null ? `${Math.round(n)}ms` : "N/A";
}

function ago(date: string | Date | null | undefined): string {
  if (!date) return "N/A";
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function truncateList<T>(items: T[], max: number, formatter: (item: T) => string): string {
  const shown = items.slice(0, max).map(formatter);
  if (items.length > max) {
    shown.push(`... and ${items.length - max} more`);
  }
  return shown.join("\n");
}

// --- Tool formatters ---

export function formatServiceStatus(data: any): string {
  if (Array.isArray(data)) {
    if (data.length === 0) return "No services found.";
    const totalMonitors = data.reduce((sum: number, s: any) => sum + (s.serviceMonitors?.length || 0), 0);
    return `${data.length} services (${totalMonitors} monitors total):\n\n` + truncateList(data, 20, (s: any) => {
      const health = s.currentHealthScore != null ? ` | Health: ${pct(s.currentHealthScore)}` : "";
      const monitors = s.serviceMonitors || [];
      const monitorCount = monitors.length > 0 ? ` | ${monitors.length} monitors` : "";
      let line = `- ${s.name} (${s.environment || "unknown"})${health}${monitorCount} | ${s.criticality || "normal"} criticality\n  ID: ${s.id}`;
      if (monitors.length > 0) {
        line += "\n" + monitors.map((sm: any) => {
          const m = sm.monitor || sm;
          return `    ${statusIcon(m.operationalStatus || m.status)} ${m.name} (${m.type})`;
        }).join("\n");
      }
      return line;
    });
  }

  const s = data;
  const monitors = s.serviceMonitors || [];
  let text = `Service: ${s.name}\n`;
  text += `Environment: ${s.environment || "unknown"} | Criticality: ${s.criticality || "normal"}\n`;
  if (s.healthScore != null) text += `Health Score: ${pct(s.healthScore)}\n`;
  if (s.description) text += `Description: ${s.description}\n`;

  if (monitors.length > 0) {
    text += `\nMonitors (${monitors.length}):\n`;
    text += truncateList(monitors, 15, (sm: any) => {
      const m = sm.monitor || sm;
      return `  ${statusIcon(m.operationalStatus || m.status)} ${m.name} (${m.type}) | Response: ${ms(m.responseTime)} | Uptime: ${pct(m.uptimePercentage)}`;
    });
  }

  return text;
}

export function formatPredictions(predictions: any[]): string {
  if (!predictions || predictions.length === 0) return "No active predictions.";

  return `${predictions.length} active predictions:\n\n` + truncateList(predictions, 10, (p: any) => {
    const confidence = p.confidence != null ? `${Math.round((p.confidence > 1 ? p.confidence : p.confidence * 100))}%` : "N/A";
    const monitor = p.monitor?.name || p.monitorId || "unknown";
    return `- ${priorityLabel(p.severity || p.predictionType)} ${p.predictionType} | Monitor: ${monitor} | Confidence: ${confidence} | Window: ${p.timeWindow || "N/A"}`;
  });
}

export function formatIncidents(incidents: any[], rcas?: Map<string, any>): string {
  if (!incidents || incidents.length === 0) return "No incidents found.";

  return `${incidents.length} incidents:\n\n` + truncateList(incidents, 10, (inc: any) => {
    const dur = inc.downtimeDuration != null ? `${Math.round(inc.downtimeDuration / 60)}min` : "ongoing";
    let text = `- ${statusIcon(inc.status)} ${priorityLabel(inc.severity)} ${inc.title || "Untitled"}\n`;
    text += `  ID: ${inc.id} | Monitor: ${inc.monitor?.name || inc.monitorId || "unknown"} | Duration: ${dur} | Started: ${ago(inc.startTime || inc.createdAt)}`;
    if (inc.errorCode) text += ` | Error: ${inc.errorCode}`;

    const rca = rcas?.get(inc.id);
    if (rca) {
      text += `\n  RCA: ${rca.rootCauseSummary || "N/A"} (${rca.rootCauseType || "unknown"}, confidence: ${pct(rca.confidenceScore)})`;
      if (rca.cascadeDetected) text += ` [CASCADE]`;
      if (rca.correlatedDeploymentId) text += ` [DEPLOY-RELATED]`;
    }

    return text;
  });
}

export function formatMonitorHealth(monitor: any, predictions?: any[]): string {
  const m = monitor;
  let text = `Monitor: ${m.name}\n`;
  text += `ID: ${m.id}\n`;
  text += `Type: ${m.type} | Status: ${statusIcon(m.operationalStatus || m.status)} ${m.operationalStatus || m.status}\n`;
  text += `Response Time: ${ms(m.responseTime)} | Uptime: ${pct(m.uptimePercentage)}\n`;
  if (m.target) text += `Target: ${m.target}\n`;

  if (predictions && predictions.length > 0) {
    text += `\nActive Predictions (${predictions.length}):\n`;
    text += truncateList(predictions, 5, (p: any) => {
      const confidence = p.confidence != null ? `${Math.round((p.confidence > 1 ? p.confidence : p.confidence * 100))}%` : "N/A";
      return `  - ${p.predictionType} | Confidence: ${confidence} | Window: ${p.timeWindow || "N/A"}`;
    });
  }

  return text;
}

export function formatDeployments(deployments: any[]): string {
  if (!deployments || deployments.length === 0) return "No recent deployments.";

  return `${deployments.length} deployments:\n\n` + truncateList(deployments, 15, (d: any) => {
    const status = d.deploymentStatus || d.status || "unknown";
    const msg = (d.commitMessage || "").substring(0, 80);
    let text = `- ${statusIcon(status)} ${msg} (${d.branch || "N/A"})\n`;
    text += `  Author: ${d.commitAuthor || "unknown"} | SHA: ${(d.commitSha || "").substring(0, 8)} | ${ago(d.deployedAt)}`;
    if (d.filesChanged) text += ` | ${d.filesChanged} files`;

    const correlations = d.correlations || [];
    if (correlations.length > 0) {
      text += `\n  Correlations: ${correlations.map((c: any) => `score=${c.correlationScore} (${c.confidence})`).join(", ")}`;
    }

    return text;
  });
}

export function formatRca(rca: any): string {
  let text = `Root Cause Analysis\n`;
  text += `${"=".repeat(40)}\n\n`;
  text += `RCA ID: ${rca.id || "N/A"}\n`;
  text += `Summary: ${rca.rootCauseSummary || "N/A"}\n`;
  text += `Type: ${rca.rootCauseType || "unknown"} | Confidence: ${pct(rca.confidenceScore)}\n`;
  text += `Model: ${rca.aiModelUsed || "unknown"} | Duration: ${rca.analysisDurationMs ? `${Math.round(rca.analysisDurationMs / 1000)}s` : "N/A"}\n`;

  if (rca.cascadeDetected) {
    text += `\nCascade Detected: Yes | Origin: ${rca.cascadeOriginMonitorId || "unknown"}`;
    text += ` | Affected: ${rca.affectedMonitorsCount || 0} monitors, ${rca.affectedServicesCount || 0} services\n`;
  }

  if (rca.correlatedDeploymentId) {
    text += `\nDeploy Correlated: Yes | Score: ${rca.deployCorrelationScore || "N/A"}\n`;
  }

  const analysis = rca.detailedAnalysis;
  if (analysis) {
    if (analysis.timeline?.length) {
      text += `\nTimeline:\n`;
      text += truncateList(analysis.timeline, 8, (t: any) => `  ${t.time}: ${t.event}`);
    }

    if (analysis.deployAnalysis?.suspectedLines?.length) {
      text += `\n\nSuspected Code Changes:\n`;
      text += truncateList(analysis.deployAnalysis.suspectedLines, 5, (sl: any) =>
        `  - ${sl.filename}: ${sl.change}\n    Why: ${sl.explanation}\n    Fix: ${sl.suggestedFix}`
      );
    }
  }

  if (rca.suggestedActions?.length) {
    text += `\n\nSuggested Actions:\n`;
    text += truncateList(rca.suggestedActions, 5, (a: any) => `  [${a.urgency}] ${a.action}`);
  }

  if (rca.preventionRecommendations?.length) {
    text += `\n\nPrevention:\n`;
    text += truncateList(rca.preventionRecommendations, 5, (r: any) => `  [${r.priority}] ${r.action}`);
  }

  return text;
}

export function formatSafetyCheck(result: { safe: boolean; riskLevel: string; reason: string; activeIssues: any[]; recommendation: string }): string {
  const icon = result.safe ? "[SAFE]" : result.riskLevel === "high" ? "[UNSAFE]" : "[CAUTION]";
  let text = `${icon} Deploy Safety Check\n\n`;
  text += `Risk Level: ${result.riskLevel}\n`;
  text += `Recommendation: ${result.recommendation}\n\n`;
  text += `${result.reason}\n`;

  if (result.activeIssues.length > 0) {
    text += `\nActive Issues:\n`;
    text += truncateList(result.activeIssues, 10, (i: any) =>
      `  - [${i.type}] ${i.message}${i.confidence ? ` (confidence: ${i.confidence}%)` : ""}`
    );
  }

  return text;
}

export function formatExecutiveSummary(data: any): string {
  let text = data.summary || "No summary available.";

  if (data.metrics) {
    const m = data.metrics;
    text += `\n\nMetrics:\n`;
    text += `  Overall Health: ${pct(m.overallHealth)}\n`;
    text += `  Monitors: ${m.totalMonitors || 0} total (${m.monitorsUp || 0} up, ${m.monitorsDegraded || 0} degraded, ${m.monitorsDown || 0} down)\n`;
    text += `  Incidents: ${m.incidentsInPeriod || 0} | Predictions: ${m.predictionsActive || 0} | Deployments: ${m.deploymentsInPeriod || 0}`;
  }

  if (data.highlights?.length) {
    text += `\n\nHighlights:\n`;
    text += truncateList(data.highlights, 5, (h: any) => `  - [${h.type}] ${h.message}`);
  }

  if (data.suggestedQuestions?.length) {
    text += `\n\nSuggested Questions:\n`;
    text += data.suggestedQuestions.map((q: string) => `  - ${q}`).join("\n");
  }

  return text;
}

export function formatMonitors(monitors: any[]): string {
  if (!monitors || monitors.length === 0) return "No monitors found.";

  // Effective status: use administrative status (paused/maintenance) when not active,
  // otherwise use operationalStatus (up/down/degraded)
  function effectiveStatus(m: any): string {
    const admin = (m.status || "active").toLowerCase();
    if (admin === "paused" || admin === "maintenance") return admin;
    return (m.operationalStatus || "up").toLowerCase();
  }

  const statusCounts: Record<string, number> = {};
  const typeCounts: Record<string, number> = {};
  for (const m of monitors) {
    const s = effectiveStatus(m);
    statusCounts[s] = (statusCounts[s] || 0) + 1;
    const t = (m.type || "unknown").toLowerCase();
    typeCounts[t] = (typeCounts[t] || 0) + 1;
  }

  const statusParts = Object.entries(statusCounts).map(([s, c]) => `${c} ${s}`).join(", ");
  const typeParts = Object.entries(typeCounts).map(([t, c]) => `${c} ${t}`).join(", ");

  // Sort: down first, then degraded, then paused, then up
  const order: Record<string, number> = { down: 0, critical: 0, degraded: 1, warning: 1, paused: 2, maintenance: 3, up: 4 };
  const sorted = [...monitors].sort((a, b) => {
    return (order[effectiveStatus(a)] ?? 5) - (order[effectiveStatus(b)] ?? 5);
  });

  let text = `${monitors.length} monitors (${statusParts}):\n`;
  text += `By type: ${typeParts}\n\n`;
  text += truncateList(sorted, 20, (m: any) => {
    const es = effectiveStatus(m);
    const icon = statusIcon(es === "paused" ? "paused" : es === "maintenance" ? "maintenance" : (m.operationalStatus || "unknown"));
    return `- ${icon} ${m.name} (${m.type || "unknown"}) | Response: ${ms(m.responseTime)} | Uptime: ${pct(m.uptimePercentage)}\n  ID: ${m.id}`;
  });

  return text;
}

export function formatMonitorMetrics(summary: any): string {
  const m = summary.monitor || summary;
  const cs = summary.currentStatus || {};
  const rt = summary.responseTime || {};
  const up = summary.uptime || {};
  const checks = summary.checks || {};
  const ssl = summary.sslCertificate || null;

  let text = `Monitor: ${m.name || "Unknown"} (${m.type || "unknown"})\n`;
  text += `Status: ${statusIcon(cs.operationalStatus || m.operationalStatus || m.status || "unknown")} | Target: ${m.target || "N/A"}\n`;
  text += `ID: ${m.id || "N/A"}\n`;

  text += `\nResponse Time:\n`;
  text += `  Current: ${ms(rt.current ?? cs.lastResponseTime)} | Day avg: ${ms(rt.avgDay)} | Week avg: ${ms(rt.avgWeek)} | Month avg: ${ms(rt.avgMonth)} | Year avg: ${ms(rt.avgYear)}\n`;

  text += `\nUptime:\n`;
  text += `  Day: ${pct(up.day)} | Week: ${pct(up.week)} | Month: ${pct(up.month)} | Year: ${pct(up.year)}\n`;

  if (checks.day || checks.week || checks.month || checks.year) {
    text += `\nChecks:\n`;
    if (checks.day) {
      text += `  Last 24h: ${checks.day.total || 0} total | ${checks.day.up || 0} up | ${checks.day.down || 0} down\n`;
    }
    if (checks.week) {
      text += `  Last 7d: ${checks.week.total || 0} total | ${checks.week.up || 0} up | ${checks.week.down || 0} down\n`;
    }
    if (checks.month) {
      text += `  Last 30d: ${checks.month.total || 0} total | ${checks.month.up || 0} up | ${checks.month.down || 0} down\n`;
    }
    if (checks.year) {
      text += `  Last 365d: ${checks.year.total || 0} total | ${checks.year.up || 0} up | ${checks.year.down || 0} down\n`;
    }
  }

  if (ssl) {
    const expiresAt = ssl.expiresAt || ssl.validUntil;
    const daysRemaining = ssl.daysRemaining != null
      ? ssl.daysRemaining
      : (expiresAt ? Math.floor((new Date(expiresAt).getTime() - Date.now()) / 86400000) : null);
    text += `\nSSL Certificate:\n`;
    text += `  Status: ${ssl.status || "unknown"} | Issuer: ${ssl.issuer || "N/A"}`;
    if (expiresAt) text += ` | Expires: ${expiresAt}`;
    if (daysRemaining != null) text += ` | Days remaining: ${daysRemaining}`;
  }

  return text;
}
