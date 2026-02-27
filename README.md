# UptimeBolt MCP Server

AI-powered infrastructure monitoring tools for Claude and MCP-compatible clients.

## Features

- **10 monitoring tools** — service status, incidents, predictions, RCA, deploy safety, and more
- **Dual transport** — stdio (local) + HTTP (remote/CI-CD)
- **API key authentication** — secure access to your UptimeBolt data
- **Works everywhere** — Claude Desktop, Claude.ai, Cline, and any MCP client

## Quick Start

### Claude Desktop (stdio)

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "uptimebolt": {
      "command": "npx",
      "args": ["-y", "@uptimebolt/mcp-server"],
      "env": {
        "UPTIMEBOLT_API_KEY": "your-api-key",
        "UPTIMEBOLT_API_URL": "https://api.uptimebolt.io"
      }
    }
  }
}
```

### Docker (HTTP)

```bash
docker run -p 3100:3100 \
  -e UPTIMEBOLT_API_URL=https://api.uptimebolt.io \
  uptimebolt/mcp-server:latest
```

Then connect via `mcp-remote`:

```json
{
  "mcpServers": {
    "uptimebolt": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "http://localhost:3100/mcp", "--header", "x-api-key:your-api-key"]
    }
  }
}
```

### npm (programmatic)

```bash
npm install @uptimebolt/mcp-server
```

```typescript
import { TOOLS, HANDLERS } from "@uptimebolt/mcp-server";

// TOOLS — MCP tool definitions (10 tools)
// HANDLERS — tool handler functions: (args, context?) => Promise<result>
```

## Available Tools

| Tool | Description |
|------|-------------|
| `get_service_status` | Health status of services with health score, monitors, and incidents |
| `get_monitors` | List all monitors with status, response time, and uptime |
| `get_monitor_health` | Detailed health for a specific monitor including predictions |
| `get_monitor_metrics` | Response time stats, uptime percentage, and error breakdown |
| `get_incidents` | Active and resolved incidents with optional RCA details |
| `get_predictions` | AI predictions for upcoming issues with confidence levels |
| `get_deployments` | Recent deployments with incident correlation analysis |
| `run_root_cause_analysis` | AI-powered root cause analysis for incidents or services |
| `is_safe_to_deploy` | CI/CD deploy safety check based on health, predictions, incidents |
| `get_executive_summary` | Infrastructure health summary for standups and reports |

## Authentication

Get your API key at [app.uptimebolt.io/settings/api-keys](https://app.uptimebolt.io/settings/api-keys).

- **stdio mode**: Set `UPTIMEBOLT_API_KEY` environment variable
- **HTTP mode**: Pass `x-api-key` header with each request

## CI/CD Integration

Use `is_safe_to_deploy` in your pipeline:

```bash
curl -X POST http://localhost:3100/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "x-api-key: your-api-key" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "is_safe_to_deploy",
      "arguments": { "service_name": "my-service" }
    }
  }'
```

## Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `UPTIMEBOLT_API_KEY` | Your UptimeBolt API key | (required for stdio) |
| `UPTIMEBOLT_API_URL` | UptimeBolt API base URL | `http://localhost:3200` |
| `MCP_HTTP_PORT` | HTTP server port | `3100` |
| `NODE_ENV` | Environment (`production` disables console logs) | `development` |
| `LOG_LEVEL` | Log level (error, warn, info, debug) | `debug` (dev) / `info` (prod) |

## Development

```bash
git clone https://github.com/uptimebolt/uptimebolt-mcp-server.git
cd uptimebolt-mcp-server
npm install
npm run dev          # stdio mode
npm run dev:http     # HTTP mode
npm run build        # compile TypeScript
npm run typecheck    # type check without emitting
```

## License

MIT
