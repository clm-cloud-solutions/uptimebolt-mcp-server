import { apiClient, ApiError } from "../api-client";
import { formatDeployments } from "../formatters";


export async function handleGetDeployments(args: { service_id?: string; hours?: number; include_correlations?: boolean }, context?: { authToken?: string }) {
  try {
    const deployments = await apiClient.get<any[]>("/deployments", { limit: 20 }, undefined, context?.authToken);
    if (!Array.isArray(deployments) || deployments.length === 0) {
      return { content: [{ type: "text" as const, text: "No recent deployments." }] };
    }

    // Filter by time window
    const hours = args.hours ?? 24;
    const cutoff = new Date(Date.now() - hours * 3600000);
    let filtered = deployments.filter((d: any) => new Date(d.deployedAt) >= cutoff);

    // Filter by service
    if (args.service_id) {
      filtered = filtered.filter((d: any) => d.serviceId === args.service_id);
    }

    return { content: [{ type: "text" as const, text: formatDeployments(filtered) }] };
  } catch (err) {
    const message = err instanceof ApiError ? err.message : (err as Error).message;
    return { content: [{ type: "text" as const, text: `Error: ${message}` }], isError: true };
  }
}
