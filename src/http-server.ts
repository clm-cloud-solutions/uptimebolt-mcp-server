#!/usr/bin/env node
import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";
import crypto from "crypto";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { TOOLS, HANDLERS } from "./tools";
import { apiClient } from "./api-client";
import { createLogger } from "./logger";

const logger = createLogger("mcp-http-server");

const MCP_HTTP_PORT = parseInt(process.env.MCP_HTTP_PORT || "3100");

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

function summarizeArgs(args: Record<string, any>): Record<string, any> {
  const summary: Record<string, any> = {};
  for (const [key, value] of Object.entries(args)) {
    if (value === undefined || value === null) continue;
    if (typeof value === "string" && value.length > 100) {
      summary[key] = `${value.substring(0, 50)}...(${value.length} chars)`;
    } else {
      summary[key] = value;
    }
  }
  return summary;
}

function getResponseSize(result: any): number {
  try {
    const text = result?.content?.[0]?.text;
    return typeof text === "string" ? text.length : 0;
  } catch {
    return 0;
  }
}

// Health check
app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", server: "uptimebolt-mcp", timestamp: new Date().toISOString() });
});

// POST /mcp — MCP protocol messages (initialize, tools/list, tools/call)
app.post("/mcp", async (req: Request, res: Response) => {
  const requestId = crypto.randomUUID().substring(0, 8);
  const apiKey = req.headers["x-api-key"] as string;
  const clientIp = req.ip || req.headers["x-forwarded-for"] || "unknown";
  const userAgent = req.headers["user-agent"] || "unknown";
  const method = req.body?.method;

  if (!apiKey) {
    logger.warn("Request without API key", { requestId, clientIp, userAgent, method });
    res.status(401).json({ error: "x-api-key header required" });
    return;
  }

  const maskedKey = `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`;

  // Validate API key against the main API
  try {
    await apiClient.get("/monitors", { page: "1", limit: "1" }, 5000, apiKey);
  } catch (err) {
    logger.warn("API key validation failed", {
      requestId,
      maskedKey,
      clientIp,
      userAgent,
      error: err instanceof Error ? err.message : String(err),
    });
    res.status(401).json({ error: "Invalid or expired API key" });
    return;
  }

  logger.info("MCP request", { requestId, method, maskedKey, clientIp, userAgent });

  // Create stateless transport + server per request
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  const server = new Server(
    { name: "uptimebolt", version: "1.0.0" },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    logger.info("tools/list", { requestId, maskedKey, toolCount: TOOLS.length });
    return { tools: TOOLS };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const toolName = request.params.name;
    const toolArgs = request.params.arguments || {};
    const handler = HANDLERS[toolName];

    if (!handler) {
      logger.warn("Unknown tool called", { requestId, toolName, maskedKey, args: summarizeArgs(toolArgs) });
      return {
        content: [{ type: "text", text: `Unknown tool: ${toolName}` }],
        isError: true,
      };
    }

    const start = Date.now();
    try {
      const result = await handler(toolArgs, { authToken: apiKey });
      const duration = Date.now() - start;
      const responseSize = getResponseSize(result);
      logger.info("Tool call completed", {
        requestId,
        toolName,
        maskedKey,
        args: summarizeArgs(toolArgs),
        duration,
        responseSize,
        isError: false,
      });
      return result;
    } catch (err) {
      const duration = Date.now() - start;
      logger.error("Tool call failed", {
        requestId,
        toolName,
        maskedKey,
        args: summarizeArgs(toolArgs),
        duration,
        error: err instanceof Error ? err.message : String(err),
      });
      return {
        content: [{ type: "text", text: `Error: ${err instanceof Error ? err.message : String(err)}` }],
        isError: true,
      };
    }
  });

  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

// GET /mcp — SSE not supported in stateless mode
app.get("/mcp", (_req: Request, res: Response) => {
  res.status(405).json({ error: "SSE not supported in stateless mode. Use POST /mcp" });
});

// DELETE /mcp — session termination not applicable
app.delete("/mcp", (_req: Request, res: Response) => {
  res.status(405).json({ error: "Session termination not applicable in stateless mode" });
});

app.listen(MCP_HTTP_PORT, () => {
  const apiUrl = process.env.UPTIMEBOLT_API_URL || "http://localhost:3200";
  logger.info("MCP HTTP Server started", {
    port: MCP_HTTP_PORT,
    endpoint: `http://localhost:${MCP_HTTP_PORT}/mcp`,
    apiBackend: apiUrl,
    toolsAvailable: TOOLS.length,
  });
});
