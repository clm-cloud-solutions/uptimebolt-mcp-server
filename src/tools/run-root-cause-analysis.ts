import { apiClient, ApiError } from "../api-client";
import { formatRca } from "../formatters";


export async function handleRunRootCauseAnalysis(args: {
  incident_id?: string;
  service_id?: string;
  language?: string;
  tier?: string;
}, context?: { authToken?: string }) {
  try {
    if (!args.incident_id && !args.service_id) {
      return { content: [{ type: "text" as const, text: "Please provide either incident_id or service_id." }] };
    }

    // Check if RCA already exists for this incident
    if (args.incident_id) {
      try {
        const existing = await apiClient.get(`/rca/incident/${args.incident_id}`, undefined, undefined, context?.authToken);
        if (existing && (Array.isArray(existing) ? existing.length > 0 : existing.id)) {
          const rca = Array.isArray(existing) ? existing[0] : existing;
          return { content: [{ type: "text" as const, text: "[CACHED] Existing RCA found:\n\n" + formatRca(rca) }] };
        }
      } catch {
        // No existing RCA, proceed to generate
      }
    }

    const body: any = {
      language: args.language || "es",
      tier: args.tier || "standard",
    };
    if (args.incident_id) body.incidentId = args.incident_id;
    if (args.service_id) body.serviceId = args.service_id;

    const rca = await apiClient.post("/rca/analyze", body, 300000, context?.authToken);

    return { content: [{ type: "text" as const, text: "[NEW] RCA generated:\n\n" + formatRca(rca) }] };
  } catch (err) {
    const message = err instanceof ApiError ? err.message : (err as Error).message;
    return { content: [{ type: "text" as const, text: `Error: ${message}` }], isError: true };
  }
}
