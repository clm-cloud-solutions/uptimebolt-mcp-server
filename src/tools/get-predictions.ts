import { apiClient, ApiError } from "../api-client";
import { formatPredictions } from "../formatters";


export async function handleGetPredictions(args: { service_id?: string; monitor_id?: string; min_confidence?: number }, context?: { authToken?: string }) {
  try {
    let predictions: any[];

    if (args.monitor_id) {
      predictions = await apiClient.get(`/monitors/${args.monitor_id}/predictions`, undefined, undefined, context?.authToken);
    } else {
      predictions = await apiClient.get("/predictive/alerts", undefined, undefined, context?.authToken);
    }

    if (!Array.isArray(predictions)) predictions = [];

    // Filter by confidence
    const minConf = args.min_confidence ?? 60;
    predictions = predictions.filter((p: any) => {
      const conf = p.confidence != null ? (p.confidence > 1 ? p.confidence : p.confidence * 100) : 0;
      return conf >= minConf;
    });

    // Filter by service if needed
    if (args.service_id) {
      predictions = predictions.filter((p: any) => p.serviceId === args.service_id);
    }

    // Only active
    predictions = predictions.filter((p: any) => p.status === "active" || !p.status);

    return { content: [{ type: "text" as const, text: formatPredictions(predictions) }] };
  } catch (err) {
    const message = err instanceof ApiError ? err.message : (err as Error).message;
    return { content: [{ type: "text" as const, text: `Error: ${message}` }], isError: true };
  }
}
