# UptimeBolt MCP Server

AI-powered infrastructure monitoring tools for [Claude](https://claude.ai), [Claude Code](https://claude.ai/code), [Cursor](https://cursor.com), and any MCP-compatible client.

[UptimeBolt](https://uptimebolt.com) is an AI-first monitoring platform that groups monitors into logical business services, predicts cascade failures before they happen, and automatically identifies which deploy caused each incident — including the commit, files, and lines of code responsible.

Built by [CLM Cloud Solutions](https://clmcloudsolutions.es) in Madrid, Spain.

## Why UptimeBolt MCP Server?

Ask your infrastructure questions in natural language. Instead of navigating dashboards, let your AI assistant query real-time monitoring data directly:

- *"Is it safe to deploy right now?"* — get a data-driven answer based on health scores, active incidents, and predictions
- *"What caused the last incident?"* — AI-powered root cause analysis with deploy correlation
- *"Give me an executive summary of the last 24 hours"* — ready for your standup or status report
- *"Show me monitors that are degraded"* — instant filtered view across your infrastructure

## Features

- **10 monitoring tools** — service status, incidents, predictions, RCA, deploy safety, and more
- **Dual transport** — stdio (local) + HTTP (remote/CI-CD)
- **API key authentication** — secure per-request access to your UptimeBolt data
- **Works everywhere** — Claude Desktop, Claude Code, Cursor, Cline, and any MCP client
- **CI/CD ready** — deploy safety checks directly in your pipeline

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

### Claude Code / Cursor

Add to your project's `.mcp.json`:

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
| `get_service_status` | Health status of business services with health score (0-100), monitor breakdown, and active incidents |
| `get_monitors` | List all monitors with operational status, response time, and uptime percentage |
| `get_monitor_health` | Detailed health for a specific monitor including response time trends and active predictions |
| `get_monitor_metrics` | Response time stats (avg, p95, p99), uptime percentage, and error breakdown |
| `get_incidents` | Active and resolved incidents with optional AI root cause analysis details |
| `get_predictions` | AI predictions for upcoming issues with confidence levels and predicted impact |
| `get_deployments` | Recent deployments with automatic incident correlation (GitHub/GitLab) |
| `run_root_cause_analysis` | AI-powered RCA using multi-model analysis (Claude, GPT) with deploy correlation |
| `is_safe_to_deploy` | CI/CD deploy safety check based on health scores, predictions, and active incidents |
| `get_executive_summary` | Infrastructure health summary for standups, weekly reports, or status updates |

## Authentication

Get your API key at [app.uptimebolt.io/settings/api-keys](https://app.uptimebolt.io/settings/api-keys).

- **stdio mode**: Set `UPTIMEBOLT_API_KEY` environment variable
- **HTTP mode**: Pass `x-api-key` header with each request (no startup key required)

## CI/CD Integration

Use `is_safe_to_deploy` as a gate in your deployment pipeline:

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

The response includes a risk level (`low`, `medium`, `high`), active issues, and a recommendation (`proceed`, `proceed_with_caution`, `wait_and_monitor`).

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
git clone https://github.com/clm-cloud-solutions/uptimebolt-mcp-server.git
cd uptimebolt-mcp-server
cp .env.example .env          # configure your environment
npm install
npm run dev          # stdio mode
npm run dev:http     # HTTP mode
npm run build        # compile TypeScript
npm run typecheck    # type check without emitting
```

## About UptimeBolt

[UptimeBolt](https://uptimebolt.com) is an AI-first SaaS monitoring platform for DevOps teams and SREs. Key capabilities:

- **Cascade failure prediction** — dependency graph with what-if analysis, downtime cost estimation, and proactive mitigations
- **Deploy correlation + RCA 2.0** — automatically correlates GitHub/GitLab deploys with incidents, identifies the responsible commit and files
- **AI Copilot** — conversational assistant with real-time infrastructure context
- **8 monitor types** — HTTP, TCP, DNS, Database, Email, Synthetic, Push, Ping

## About CLM Cloud Solutions

[CLM Cloud Solutions S.L.](https://clmcloudsolutions.es) is a technology company based in Madrid, Spain, building SaaS products for engineering teams to operate with confidence, speed, and security.

- [LinkedIn](https://www.linkedin.com/company/clm-cloud-solutions/)
- [GitHub](https://github.com/clm-cloud-solutions)
- Contact: info@clmcloudsolutions.es

## License

MIT
