import { apiClient, ApiError } from "../api-client";
import { formatIncidents } from "../formatters";


export async function handleGetIncidents(args: {
  service_id?: string;
  monitor_id?: string;
  status?: string;
  hours?: number;
  include_rca?: boolean;
}, context?: { authToken?: string }) {
  try {
    const params: Record<string, string | number | boolean | undefined> = {
      limit: 10,
    };

    if (args.monitor_id) params.monitorId = args.monitor_id;
    // "active" is a virtual status meaning non-resolved — don't pass to API, filter client-side
    if (args.status && args.status !== "all" && args.status !== "active") {
      params.status = args.status;
    }

    const incidents = await apiClient.get<any[]>("/incidents", params, undefined, context?.authToken);
    if (!Array.isArray(incidents) || incidents.length === 0) {
      return { content: [{ type: "text" as const, text: "No incidents found." }] };
    }

    // Filter by time window
    const hours = args.hours ?? 24;
    const cutoff = new Date(Date.now() - hours * 3600000);
    let filtered = incidents.filter((inc: any) => {
      const created = new Date(inc.startTime || inc.createdAt);
      return created >= cutoff;
    });

    // "active" means non-resolved incidents
    if (!args.status || args.status === "active") {
      filtered = filtered.filter((inc: any) => inc.status !== "resolved" && inc.status !== "false-positive");
    }

    // Fetch RCA for first 5 incidents
    const includeRca = args.include_rca !== false;
    const rcas = new Map<string, any>();

    if (includeRca && filtered.length > 0) {
      const rcaPromises = filtered.slice(0, 5).map(async (inc: any) => {
        try {
          const rca = await apiClient.get(`/rca/incident/${inc.id}`, undefined, undefined, context?.authToken);
          const rcaData = Array.isArray(rca) ? rca[0] : rca;
          if (rcaData?.id) rcas.set(inc.id, rcaData);
        } catch {
          // No RCA for this incident
        }
      });
      await Promise.all(rcaPromises);
    }

    return { content: [{ type: "text" as const, text: formatIncidents(filtered, rcas) }] };
  } catch (err) {
    const message = err instanceof ApiError ? err.message : (err as Error).message;
    return { content: [{ type: "text" as const, text: `Error: ${message}` }], isError: true };
  }
}
