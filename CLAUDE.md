# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

UptimeBolt MCP Server — an MCP (Model Context Protocol) server that exposes infrastructure monitoring tools for Claude, Cursor, and any MCP-compatible client. It connects to the UptimeBolt API and provides 10 tools for monitoring, incident management, predictions, and deployment safety.

## Build & Development Commands

```bash
npm run build          # Compile TypeScript to dist/
npm run typecheck      # Type check without emitting (used in CI)
npm run lint           # ESLint
npm run start          # Run stdio server (requires UPTIMEBOLT_API_KEY env var)
npm run start:http     # Run HTTP server on port 3100
npm run dev            # Run stdio server via ts-node (development)
npm run dev:http       # Run HTTP server via ts-node (development)
```

CI runs `typecheck` and `build` only. No automated tests exist.

## Environment Variables

- `UPTIMEBOLT_API_KEY` — Required for stdio mode; HTTP mode receives it per-request via `x-api-key` header
- `UPTIMEBOLT_API_URL` — API base URL (default: `https://api.uptimebolt.io`)
- `MCP_HTTP_PORT` — HTTP server port (default: 3100)
- `LOG_LEVEL` — Winston log level (default: `debug` in dev, `info` in production)
- `NODE_ENV` — `development` or `production`

## Architecture

### Two Transport Modes

- **Stdio** (`src/server.ts`): Uses `StdioServerTransport` from MCP SDK. For local/CLI use and Claude Desktop. Validates API key once at startup.
- **HTTP** (`src/http-server.ts`): Express server with `StreamableHTTPServerTransport`. Stateless per-request model. Validates API key per request from `x-api-key` header. Has `/health` endpoint.

### Tool System (`src/tools.ts` + `src/tools/*.ts`)

Handler registry pattern: `TOOLS` array defines MCP tool schemas, `HANDLERS` object maps tool names to async handler functions. Each tool file in `src/tools/` exports a single handler function.

Tools accept an optional `context` parameter for passing auth tokens (used in HTTP mode). Many tools support fuzzy matching by name (e.g., `service_name`, `monitor_name`) with fallback to ID-based lookup.

### API Client (`src/api-client.ts`)

Wraps fetch with bearer/x-api-key auth, configurable timeouts (30s default, up to 300s for RCA), and automatic `.data` field unwrapping from responses. API prefix: `/api/v1`.

### Formatters (`src/formatters.ts`)

Converts API JSON responses to concise human-readable text for LLM consumption. All tool handlers return formatted text content, not raw JSON. Monitors are sorted by severity (down → degraded → paused → up).

### Logging (`src/logger.ts`)

Winston with daily rotating files. 20MB max size, 14-day retention, gzip compression. Console output disabled in production.

## Code Patterns

- Parallel API calls via `Promise.all()` with `.catch(() => null)` for optional/graceful degradation
- Tool handlers use parameter destructuring from `args` object
- Custom `ApiError` class wraps HTTP errors with status and body
- TypeScript strict mode, ES2022 target, CommonJS output
