import { apiClient, ApiError } from "../api-client";
import { formatServiceStatus } from "../formatters";


export async function handleGetServiceStatus(args: { service_id?: string; service_name?: string }, context?: { authToken?: string }) {
  try {
    if (args.service_id) {
      const [service, health] = await Promise.all([
        apiClient.get(`/services/${args.service_id}`, undefined, undefined, context?.authToken),
        apiClient.get(`/services/${args.service_id}/health`, undefined, undefined, context?.authToken).catch(() => null),
      ]);
      if (health?.healthScore != null) service.healthScore = health.healthScore;
      return { content: [{ type: "text" as const, text: formatServiceStatus(service) }] };
    }

    const services = await apiClient.get<any[]>("/services", undefined, undefined, context?.authToken);

    if (args.service_name) {
      const query = args.service_name.toLowerCase();
      const exact = services.find((s: any) => s.name.toLowerCase() === query);
      if (exact) {
        const health = await apiClient.get(`/services/${exact.id}/health`, undefined, undefined, context?.authToken).catch(() => null);
        if (health?.healthScore != null) exact.healthScore = health.healthScore;
        return { content: [{ type: "text" as const, text: formatServiceStatus(exact) }] };
      }

      const matches = services.filter((s: any) => s.name.toLowerCase().includes(query));
      if (matches.length === 1) {
        const health = await apiClient.get(`/services/${matches[0].id}/health`, undefined, undefined, context?.authToken).catch(() => null);
        if (health?.healthScore != null) matches[0].healthScore = health.healthScore;
        return { content: [{ type: "text" as const, text: formatServiceStatus(matches[0]) }] };
      }
      if (matches.length > 1) {
        const names = matches.map((s: any) => `  - ${s.name} (id: ${s.id})`).join("\n");
        return { content: [{ type: "text" as const, text: `Multiple services match "${args.service_name}":\n${names}\n\nPlease use service_id or a more specific name.` }] };
      }
      return { content: [{ type: "text" as const, text: `No service found matching "${args.service_name}".` }] };
    }

    return { content: [{ type: "text" as const, text: formatServiceStatus(services) }] };
  } catch (err) {
    const message = err instanceof ApiError ? err.message : (err as Error).message;
    return { content: [{ type: "text" as const, text: `Error: ${message}` }], isError: true };
  }
}
