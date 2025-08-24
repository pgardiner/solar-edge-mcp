#!/bin/bash

# Script to restart Claude Desktop to pick up new MCP server configuration

echo "Restarting Claude Desktop to load SolarEdge MCP server..."

# Kill Claude Desktop if it's running
pkill -f "Claude Desktop" 2>/dev/null

# Wait a moment
sleep 2

# Open Claude Desktop again
open -a "Claude Desktop" 2>/dev/null || open -a "Claude" 2>/dev/null

echo "Claude Desktop should restart with the new SolarEdge MCP server configuration."
echo ""
echo "Available solar tools:"
echo "- get_site_overview"
echo "- get_current_power_flow"
echo "- get_site_details" 
echo "- get_recent_energy_data"
echo "- get_recent_power_data"
echo "- get_environmental_benefits"
echo "- get_site_equipment"
echo "- analyze_daily_performance"
echo ""
echo "Try asking: 'What's my current solar power generation?'"
