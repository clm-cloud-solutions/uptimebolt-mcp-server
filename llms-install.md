# Installing UptimeBolt MCP Server

UptimeBolt is an AI-first infrastructure monitoring platform by CLM Cloud Solutions (https://clmcloudsolutions.es). This MCP server provides 10 monitoring tools for querying service health, incidents, predictions, deployments, and more.

Product: https://uptimebolt.com
Repository: https://github.com/clm-cloud-solutions/uptimebolt-mcp-server

## Prerequisites
- Node.js 18+
- An UptimeBolt API key (get one at https://app.uptimebolt.io/settings/api-keys)

## Quick Install (stdio mode for Claude Desktop / Claude Code / Cursor)

Add to your MCP config:
```json
{
  "mcpServers": {
    "uptimebolt": {
      "command": "npx",
      "args": ["-y", "@uptimebolt/mcp-server"],
      "env": {
        "UPTIMEBOLT_API_KEY": "YOUR_KEY",
        "UPTIMEBOLT_API_URL": "https://api.uptimebolt.io"
      }
    }
  }
}
```

Config file locations:
- Claude Desktop: ~/Library/Application Support/Claude/claude_desktop_config.json
- Claude Code / Cursor: .mcp.json in your project root

## HTTP Mode (for remote access / CI/CD)
```bash
docker run -p 3100:3100 -e UPTIMEBOLT_API_URL=https://api.uptimebolt.io uptimebolt/mcp-server
```

No API key required at startup — clients pass their key via x-api-key header per request.

## Available Tools
- get_service_status — Health status of business services (health score 0-100, monitors, incidents)
- get_monitors — List all monitors with operational status, response time, uptime
- get_monitor_health — Detailed monitor health with response time trends and predictions
- get_monitor_metrics — Response time stats (avg, p95, p99), uptime, error breakdown
- get_incidents — Active and resolved incidents with AI root cause analysis
- get_predictions — AI predictions for upcoming issues with confidence levels
- get_deployments — Recent deployments with automatic incident correlation (GitHub/GitLab)
- run_root_cause_analysis — AI-powered RCA with multi-model analysis and deploy correlation
- is_safe_to_deploy — CI/CD deploy safety gate (risk level + recommendation)
- get_executive_summary — Infrastructure health summary for standups and reports

## Example Prompts
- "Is it safe to deploy my-service right now?"
- "What incidents happened in the last 24 hours?"
- "Show me the health of all monitors"
- "Run a root cause analysis on the latest incident"
- "Give me an executive summary for the weekly standup"
