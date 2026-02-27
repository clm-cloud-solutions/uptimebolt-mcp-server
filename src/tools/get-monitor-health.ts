import { apiClient, ApiError } from "../api-client";
import { formatMonitorHealth } from "../formatters";


export async function handleGetMonitorHealth(args: { monitor_id?: string; monitor_name?: string; period?: string }, context?: { authToken?: string }) {
  try {
    let monitorId = args.monitor_id;

    if (!monitorId && args.monitor_name) {
      const monitorsResponse = await apiClient.get<any>("/monitors", undefined, undefined, context?.authToken);
      const monitors = Array.isArray(monitorsResponse) ? monitorsResponse : (monitorsResponse?.monitors || []);
      const query = args.monitor_name.toLowerCase();

      const exact = monitors.find((m: any) => m.name.toLowerCase() === query);
      if (exact) {
        monitorId = exact.id;
      } else {
        const matches = monitors.filter((m: any) => m.name.toLowerCase().includes(query));
        if (matches.length === 1) {
          monitorId = matches[0].id;
        } else if (matches.length > 1) {
          const names = matches.map((m: any) => `  - ${m.name} (id: ${m.id}, type: ${m.type})`).join("\n");
          return { content: [{ type: "text" as const, text: `Multiple monitors match "${args.monitor_name}":\n${names}\n\nPlease use monitor_id or a more specific name.` }] };
        } else {
          return { content: [{ type: "text" as const, text: `No monitor found matching "${args.monitor_name}".` }] };
        }
      }
    }

    if (!monitorId) {
      return { content: [{ type: "text" as const, text: "Please provide either monitor_id or monitor_name." }] };
    }

    const [monitor, predictions] = await Promise.all([
      apiClient.get(`/monitors/${monitorId}`, undefined, undefined, context?.authToken),
      apiClient.get(`/monitors/${monitorId}/predictions`, undefined, undefined, context?.authToken).catch(() => []),
    ]);

    const activePredictions = Array.isArray(predictions)
      ? predictions.filter((p: any) => p.status === "active")
      : [];

    return { content: [{ type: "text" as const, text: formatMonitorHealth(monitor, activePredictions) }] };
  } catch (err) {
    const message = err instanceof ApiError ? err.message : (err as Error).message;
    return { content: [{ type: "text" as const, text: `Error: ${message}` }], isError: true };
  }
}
