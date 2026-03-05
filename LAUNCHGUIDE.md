# UptimeBolt MCP Server

## Tagline
AI-powered infrastructure monitoring tools for Claude, Cursor, and MCP clients.

## Description
UptimeBolt MCP Server connects your AI assistant to your infrastructure monitoring stack. Query service health, response time metrics (p95/p99), active incidents, AI predictions, root cause analysis, deployment correlations, and deploy safety checks — all through natural language. Built for DevOps engineers, SREs, and developers who want real-time infrastructure insights without leaving their IDE or AI assistant.

## Setup Requirements
- `UPTIMEBOLT_API_KEY` (required): Your UptimeBolt API key. Get one at https://app.uptimebolt.io/settings/api-keys
- `UPTIMEBOLT_API_URL` (optional): API base URL. Defaults to `https://api.uptimebolt.io`.

## Category
Cloud & DevOps

## Features
- Query real-time service health with health scores (0-100) and monitor breakdowns
- List and filter monitors by status (up/down/degraded) and type (HTTP, TCP, DNS, ping)
- Get detailed monitor metrics: response time (avg, p95, p99), uptime percentage, error breakdown
- View active and resolved incidents with optional root cause analysis
- AI-powered predictions for upcoming issues with confidence scores
- Run multi-model root cause analysis on incidents (basic, standard, deep, premium tiers)
- Deploy safety gate: check if it's safe to deploy based on health score, active incidents, and predictions
- Track recent deployments with incident correlation scores
- Generate executive summaries of infrastructure health for reports
- Monitor health trends over configurable periods (1h, 6h, 24h, 7d, 30d)
- Supports both stdio (local) and HTTP (remote/CI-CD) transports
- Available as npm package, Docker image, and hosted service

## Getting Started
- "Is it safe to deploy the payments service right now?"
- "What incidents happened in the last 24 hours?"
- "Show me the response time metrics for my API monitor"
- "Give me an executive summary of our infrastructure"
- "Are there any AI predictions for upcoming issues?"
- "Run a root cause analysis on the latest incident"
- Tool: get_service_status — Check health score, monitors, and incidents for a service
- Tool: get_monitors — List all monitors with filtering by status and type
- Tool: get_monitor_metrics — Response time stats (avg, p95, p99), uptime, SSL info
- Tool: get_monitor_health — Detailed health with predictions and trends for a specific monitor
- Tool: get_incidents — Active/resolved incidents with optional inline RCA
- Tool: get_predictions — AI predictions for upcoming issues filtered by confidence
- Tool: get_deployments — Recent deployments with incident correlation
- Tool: run_root_cause_analysis — AI-powered multi-model root cause analysis
- Tool: is_safe_to_deploy — CI/CD deploy safety gate with risk assessment
- Tool: get_executive_summary — Infrastructure health summary for reports

## Tags
monitoring, uptime, infrastructure, devops, sre, observability, incidents, predictions, root-cause-analysis, deploy-safety, health-check, metrics, ai-monitoring, claude, mcp, express, nodejs

## Documentation URL
https://github.com/clm-cloud-solutions/uptimebolt-mcp-server

## Health Check URL
https://mcp.uptimebolt.io/health
