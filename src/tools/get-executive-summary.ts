import { apiClient, ApiError } from "../api-client";
import { formatExecutiveSummary } from "../formatters";


export async function handleGetExecutiveSummary(args: { hours?: number; language?: string }, context?: { authToken?: string }) {
  try {
    const data = await apiClient.get("/executive-summary", {
      hours: args.hours || 12,
      language: args.language || "es",
    }, 60000, context?.authToken);

    return { content: [{ type: "text" as const, text: formatExecutiveSummary(data) }] };
  } catch (err) {
    const message = err instanceof ApiError ? err.message : (err as Error).message;
    return { content: [{ type: "text" as const, text: `Error: ${message}` }], isError: true };
  }
}
