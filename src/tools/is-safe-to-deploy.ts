import { apiClient, ApiError } from "../api-client";
import { formatSafetyCheck } from "../formatters";


export async function handleIsSafeToDeploy(args: { service_id?: string; service_name?: string }, context?: { authToken?: string }) {
  try {
    // Resolve service
    let serviceId = args.service_id;
    let serviceName = "your infrastructure";

    if (!serviceId && args.service_name) {
      const services = await apiClient.get<any[]>("/services", undefined, undefined, context?.authToken);
      const query = args.service_name.toLowerCase();
      const match = services.find((s: any) => s.name.toLowerCase() === query) ||
        (() => {
          const partial = services.filter((s: any) => s.name.toLowerCase().includes(query));
          return partial.length === 1 ? partial[0] : null;
        })();

      if (!match) {
        return { content: [{ type: "text" as const, text: `No service found matching "${args.service_name}".` }] };
      }
      serviceId = match.id;
      serviceName = match.name;
    }

    // Gather data in parallel
    const [healthData, predictions, incidents] = await Promise.all([
      serviceId
        ? apiClient.get(`/services/${serviceId}/health`, undefined, undefined, context?.authToken).catch(() => ({ healthScore: null }))
        : Promise.resolve({ healthScore: null }),
      apiClient.get<any[]>("/predictive/alerts", undefined, undefined, context?.authToken).catch(() => []),
      apiClient.get<any[]>("/incidents", { limit: 10 }, undefined, context?.authToken).catch(() => []),
    ]);

    const healthScore = healthData?.healthScore;
    const activePredictions = Array.isArray(predictions)
      ? predictions.filter((p: any) => p.status === "active")
      : [];
    const activeIncidents = Array.isArray(incidents)
      ? incidents.filter((inc: any) =>
          inc.status !== "resolved" && inc.status !== "false-positive"
        )
      : [];

    // Filter by service if specified
    const relevantPredictions = serviceId
      ? activePredictions.filter((p: any) => p.serviceId === serviceId)
      : activePredictions;
    const relevantIncidents = serviceId
      ? activeIncidents.filter((inc: any) => inc.monitor?.serviceId === serviceId || inc.serviceId === serviceId)
      : activeIncidents;

    // Decision logic
    const activeIssues: Array<{ type: string; message: string; confidence?: number }> = [];
    let riskLevel = "low";
    let safe = true;

    // Check critical incidents
    const criticalIncidents = relevantIncidents.filter((inc: any) =>
      inc.severity === "critical" || inc.priority === "critical"
    );
    if (criticalIncidents.length > 0) {
      riskLevel = "high";
      safe = false;
      criticalIncidents.forEach((inc: any) => {
        activeIssues.push({
          type: "incident",
          message: `Critical incident: ${inc.title || "Unknown"} (${inc.status})`,
        });
      });
    }

    // Check non-critical incidents
    const otherIncidents = relevantIncidents.filter((inc: any) =>
      inc.severity !== "critical" && inc.priority !== "critical"
    );
    if (otherIncidents.length > 0) {
      if (riskLevel !== "high") riskLevel = "medium";
      otherIncidents.forEach((inc: any) => {
        activeIssues.push({
          type: "incident",
          message: `Active incident: ${inc.title || "Unknown"} (${inc.severity})`,
        });
      });
    }

    // Check high-confidence predictions
    const highConfPredictions = relevantPredictions.filter((p: any) => {
      const conf = p.confidence != null ? (p.confidence > 1 ? p.confidence : p.confidence * 100) : 0;
      return conf >= 80;
    });
    if (highConfPredictions.length > 0) {
      riskLevel = "high";
      safe = false;
      highConfPredictions.forEach((p: any) => {
        const conf = Math.round(p.confidence > 1 ? p.confidence : p.confidence * 100);
        activeIssues.push({
          type: "prediction",
          message: `${p.predictionType}: ${p.monitor?.name || p.monitorId || "unknown"}`,
          confidence: conf,
        });
      });
    }

    // Check medium-confidence predictions
    const mediumConfPredictions = relevantPredictions.filter((p: any) => {
      const conf = p.confidence != null ? (p.confidence > 1 ? p.confidence : p.confidence * 100) : 0;
      return conf >= 60 && conf < 80;
    });
    if (mediumConfPredictions.length > 0) {
      if (riskLevel === "low") riskLevel = "medium";
      mediumConfPredictions.forEach((p: any) => {
        const conf = Math.round(p.confidence > 1 ? p.confidence : p.confidence * 100);
        activeIssues.push({
          type: "prediction",
          message: `${p.predictionType}: ${p.monitor?.name || p.monitorId || "unknown"}`,
          confidence: conf,
        });
      });
    }

    // Check health score
    if (healthScore != null) {
      if (healthScore < 70) {
        riskLevel = "high";
        safe = false;
        activeIssues.push({ type: "health", message: `Service health score is ${healthScore.toFixed(1)}% (below 70% threshold)` });
      } else if (healthScore < 85) {
        if (riskLevel === "low") riskLevel = "medium";
        activeIssues.push({ type: "health", message: `Service health score is ${healthScore.toFixed(1)}% (below 85%)` });
      }
    }

    if (riskLevel === "medium" && safe) safe = true; // medium is cautionary, not blocking

    // Build reason
    let reason: string;
    let recommendation: string;
    if (safe && riskLevel === "low") {
      reason = `${serviceName} is stable with no active issues. Safe to deploy.`;
      recommendation = "proceed";
    } else if (riskLevel === "medium") {
      reason = `${serviceName} has minor issues. Deploy with caution and monitor closely.`;
      recommendation = "proceed_with_caution";
    } else {
      reason = `${serviceName} has critical issues. Deploying now could worsen the situation.`;
      recommendation = "wait_and_monitor";
    }

    return {
      content: [{ type: "text" as const, text: formatSafetyCheck({ safe, riskLevel, reason, activeIssues, recommendation }) }],
    };
  } catch (err) {
    const message = err instanceof ApiError ? err.message : (err as Error).message;
    return { content: [{ type: "text" as const, text: `Error: ${message}` }], isError: true };
  }
}
