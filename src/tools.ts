import { handleGetServiceStatus } from "./tools/get-service-status";
import { handleGetPredictions } from "./tools/get-predictions";
import { handleGetIncidents } from "./tools/get-incidents";
import { handleGetMonitorHealth } from "./tools/get-monitor-health";
import { handleGetDeployments } from "./tools/get-deployments";
import { handleRunRootCauseAnalysis } from "./tools/run-root-cause-analysis";
import { handleIsSafeToDeploy } from "./tools/is-safe-to-deploy";
import { handleGetExecutiveSummary } from "./tools/get-executive-summary";
import { handleGetMonitors } from "./tools/get-monitors";
import { handleGetMonitorMetrics } from "./tools/get-monitor-metrics";

export const TOOLS = [
  {
    name: "get_service_status",
    description: "Get the current health status of a service or all services. Returns health score, monitor status, and active incidents.",
    inputSchema: {
      type: "object" as const,
      properties: {
        service_id: { type: "string", description: "UUID of the service. Omit to get all services." },
        service_name: { type: "string", description: "Name of the service (fuzzy match). Alternative to service_id." },
      },
    },
  },
  {
    name: "get_predictions",
    description: "Get active AI predictions for monitors or services. Shows predicted problems with confidence levels.",
    inputSchema: {
      type: "object" as const,
      properties: {
        service_id: { type: "string", description: "Filter predictions by service UUID." },
        monitor_id: { type: "string", description: "Filter predictions by monitor UUID." },
        min_confidence: { type: "number", description: "Minimum confidence threshold (0-100). Default: 60." },
      },
    },
  },
  {
    name: "get_incidents",
    description: "Get incidents with optional filters. Includes root cause analysis if available.",
    inputSchema: {
      type: "object" as const,
      properties: {
        service_id: { type: "string", description: "Filter incidents by service UUID." },
        monitor_id: { type: "string", description: "Filter incidents by monitor UUID." },
        status: { type: "string", enum: ["active", "resolved", "detecting", "investigating", "identified", "resolving", "monitoring", "all"], description: "Filter by status. 'active' = all non-resolved. Default: active." },
        hours: { type: "number", description: "Look back N hours. Default: 24." },
        include_rca: { type: "boolean", description: "Include root cause analysis details. Default: true." },
      },
    },
  },
  {
    name: "get_monitor_health",
    description: "Get detailed health information for a specific monitor including response time, uptime, and active predictions.",
    inputSchema: {
      type: "object" as const,
      properties: {
        monitor_id: { type: "string", description: "UUID of the monitor." },
        monitor_name: { type: "string", description: "Name of the monitor (fuzzy match). Alternative to monitor_id." },
        period: { type: "string", enum: ["1h", "6h", "24h", "7d", "30d"], description: "Time period for statistics. Default: 24h." },
      },
    },
  },
  {
    name: "get_deployments",
    description: "Get recent deployments and their correlation with incidents. Shows which deploys potentially caused issues.",
    inputSchema: {
      type: "object" as const,
      properties: {
        service_id: { type: "string", description: "Filter deployments by service UUID." },
        hours: { type: "number", description: "Look back N hours. Default: 24." },
        include_correlations: { type: "boolean", description: "Include incident correlations. Default: true." },
      },
    },
  },
  {
    name: "run_root_cause_analysis",
    description: "Run an AI-powered root cause analysis for an incident or service. Analyzes dependencies, cascading failures, and deployment correlations.",
    inputSchema: {
      type: "object" as const,
      properties: {
        incident_id: { type: "string", description: "UUID of the incident to analyze." },
        service_id: { type: "string", description: "UUID of the service to analyze (alternative to incident_id)." },
        language: { type: "string", enum: ["es", "en"], description: "Response language. Default: es." },
        tier: { type: "string", enum: ["basic", "standard", "deep", "premium"], description: "Analysis depth tier. Default: standard." },
      },
    },
  },
  {
    name: "is_safe_to_deploy",
    description: "Check if it's safe to deploy right now based on current service health, active predictions, and recent incidents. Useful for CI/CD pipeline integration.",
    inputSchema: {
      type: "object" as const,
      properties: {
        service_id: { type: "string", description: "UUID of the service to check." },
        service_name: { type: "string", description: "Name of the service (fuzzy match)." },
      },
    },
  },
  {
    name: "get_executive_summary",
    description: "Get an executive summary of infrastructure health for a time period. Ideal for daily standups, weekly reports, or status updates.",
    inputSchema: {
      type: "object" as const,
      properties: {
        hours: { type: "number", description: "Period to summarize in hours. Default: 12." },
        language: { type: "string", enum: ["es", "en"], description: "Response language. Default: es." },
      },
    },
  },
  {
    name: "get_monitors",
    description: "List all monitors with optional filtering by status or type. Returns name, URL, operational status, response time, and uptime for each monitor.",
    inputSchema: {
      type: "object" as const,
      properties: {
        status: { type: "string", enum: ["all", "up", "down", "degraded", "paused", "maintenance", "active"], description: "Filter by status. 'up/down/degraded' filter by operational status, 'paused/maintenance/active' by admin status. Default: all." },
        type: { type: "string", enum: ["http", "tcp", "dns", "database", "email", "synthetic", "push", "ping"], description: "Filter by monitor type." },
      },
    },
  },
  {
    name: "get_monitor_metrics",
    description: "Get detailed metrics summary for a specific monitor including response time stats, uptime percentage, and error breakdown.",
    inputSchema: {
      type: "object" as const,
      properties: {
        monitor_id: { type: "string", description: "UUID of the monitor." },
        monitor_name: { type: "string", description: "Name of the monitor (fuzzy match). Alternative to monitor_id." },
      },
    },
  },
];

export const HANDLERS: Record<string, (args: any, context?: { authToken?: string }) => Promise<any>> = {
  get_service_status: handleGetServiceStatus,
  get_predictions: handleGetPredictions,
  get_incidents: handleGetIncidents,
  get_monitor_health: handleGetMonitorHealth,
  get_deployments: handleGetDeployments,
  run_root_cause_analysis: handleRunRootCauseAnalysis,
  is_safe_to_deploy: handleIsSafeToDeploy,
  get_executive_summary: handleGetExecutiveSummary,
  get_monitors: handleGetMonitors,
  get_monitor_metrics: handleGetMonitorMetrics,
};
