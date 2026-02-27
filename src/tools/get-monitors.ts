import { apiClient, ApiError } from "../api-client";
import { formatMonitors } from "../formatters";


export async function handleGetMonitors(
  args: { status?: string; type?: string },
  context?: { authToken?: string }
) {
  try {
    const params: Record<string, string | number | boolean | undefined> = {
      limit: 100,
    };
    if (args.type) params.type = args.type;

    // The API's `status` param filters by administrative status (active/paused/maintenance),
    // NOT operational status (up/down/degraded).
    // Default: fetch ALL monitors so Claude always has the full picture (paused monitors shown with [PAUSED] tag).
    if (args.status === "paused") {
      params.status = "paused";
    } else if (args.status === "maintenance") {
      params.status = "maintenance";
    } else if (args.status === "active") {
      params.status = "active";
    }
    // For "all", "up", "down", "degraded", or no status: don't filter by admin status (fetch everything)

    const response = await apiClient.get<any>("/monitors", params, undefined, context?.authToken);
    const monitors = Array.isArray(response) ? response : (response?.monitors || []);

    // Client-side filter by operationalStatus (up/down/degraded) when requested
    let filtered = monitors;
    if (args.status && ["up", "down", "degraded"].includes(args.status)) {
      filtered = monitors.filter((m: any) =>
        (m.operationalStatus || m.status || "").toLowerCase() === args.status!.toLowerCase()
      );
    }

    if (filtered.length === 0) {
      const qualifier = args.status && args.status !== "all" ? ` with status "${args.status}"` : "";
      return { content: [{ type: "text" as const, text: `No monitors found${qualifier}.` }] };
    }

    return { content: [{ type: "text" as const, text: formatMonitors(filtered) }] };
  } catch (err) {
    const message = err instanceof ApiError ? err.message : (err as Error).message;
    return { content: [{ type: "text" as const, text: `Error: ${message}` }], isError: true };
  }
}
