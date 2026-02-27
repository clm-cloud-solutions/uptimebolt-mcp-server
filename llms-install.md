# Installing UptimeBolt MCP Server

## Prerequisites
- Node.js 18+
- An UptimeBolt API key (get one at https://app.uptimebolt.io/settings/api-keys)

## Quick Install (stdio mode for Claude Desktop)
Add to your Claude Desktop config (~/.claude/claude_desktop_config.json):
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

## HTTP Mode (for remote access / CI/CD)
```bash
docker run -p 3100:3100 -e UPTIMEBOLT_API_URL=https://api.uptimebolt.io uptimebolt/mcp-server
```

## Available Tools
- get_service_status — Health status of services
- get_monitors — List all monitors with status
- get_monitor_health — Detailed monitor health
- get_monitor_metrics — Response time and uptime stats
- get_incidents — Active and resolved incidents
- get_predictions — AI predictions for upcoming issues
- get_deployments — Recent deployments with incident correlation
- run_root_cause_analysis — AI-powered root cause analysis
- is_safe_to_deploy — CI/CD deploy safety check
- get_executive_summary — Infrastructure health summary
