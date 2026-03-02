#!/usr/bin/env node
import "dotenv/config";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { validateApiKey } from "./api-client";
import { TOOLS, HANDLERS } from "./tools";

// Smithery sandbox: allows scanning tools without real credentials
export function createSandboxServer() {
  const server = new Server(
    { name: "uptimebolt", version: "1.0.0" },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOLS,
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name } = request.params;
    return {
      content: [{ type: "text", text: `Sandbox mode: tool ${name} is available but not connected to a live API.` }],
    };
  });

  return server;
}

async function main() {
  validateApiKey();

  const server = new Server(
    { name: "uptimebolt", version: "1.0.0" },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOLS,
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const handler = HANDLERS[name];

    if (!handler) {
      return {
        content: [{ type: "text", text: `Unknown tool: ${name}` }],
        isError: true,
      };
    }

    return handler(args || {});
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

// Only run main() when executed directly (not when imported by Smithery/tests)
if (require.main === module) {
  main().catch((err) => {
    process.stderr.write(`Fatal error: ${err.message}\n`);
    process.exit(1);
  });
}
