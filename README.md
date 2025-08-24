# SolarEdge MCP Server

This is a Model Context Protocol (MCP) server that provides access to SolarEdge monitoring API data for solar panel installations. It allows Claude to analyze solar energy production, power generation, and system performance.

## Features

The MCP server provides the following tools for solar data analysis:

### Current Status Tools
- `get_site_overview` - Get current power, energy production, and lifetime statistics
- `get_current_power_flow` - Get real-time power flow between PV, load, grid, and storage
- `get_site_details` - Get site information, location, and configuration

### Historical Data Tools
- `get_recent_energy_data` - Get recent energy production data (configurable timeframe)
- `get_recent_power_data` - Get recent power generation data (15-minute resolution)
- `get_energy_data` - Get energy data for specific date ranges
- `get_power_data` - Get power data for specific time ranges

### Equipment & Environmental Tools
- `get_environmental_benefits` - Get CO2 savings and environmental impact
- `get_site_equipment` - Get information about installed equipment
- `analyze_daily_performance` - Analyze performance patterns over time

### Cache Management Tools
- `clear_cache` - Clear all cached API data to force fresh requests

## Site Information

- **Site ID**: 561703
- **Site Name**: 833 Craig Carrier Crt 10 kW
- **System Size**: 10 kW solar installation

## Quick Start

### Step 1: Get Your SolarEdge API Credentials

1. **Get your SolarEdge API Key**:
   - Log in to your [SolarEdge monitoring portal](https://monitoring.solaredge.com)
   - Go to **Admin** → **Site Access** → **API Access**
   - Generate a new API key or copy your existing one
   - Keep this key secure - it provides access to your solar data

2. **Find your Site ID**:
   - In the SolarEdge portal, your Site ID is displayed in the URL or site details
   - It's a numeric value (e.g., 561703)
   - You can also find it in the site overview page

### Step 2: Configure the MCP Server

1. **Set up environment variables**:
   ```bash
   # Copy the example environment file
   cp .env.example .env
   ```

2. **Edit the `.env` file** with your actual credentials:
   ```bash
   # Edit with your favorite text editor
   nano .env
   ```

   Replace the placeholder values:
   ```bash
   # Your actual SolarEdge API key
   SOLAREDGE_API_KEY=ABC123DEF456GHI789JKL012MNO345PQR678STU
   
   # Your actual SolarEdge site ID (numeric)
   SOLAREDGE_SITE_ID=561703
   ```

3. **Verify your configuration**:
   ```bash
   # Test the API connection
   npm test
   ```

### Step 3: Configure Claude Desktop to Use the Server

1. **Locate Claude Desktop configuration**:
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

2. **Add the MCP server configuration**:
   Edit the `claude_desktop_config.json` file and add this server configuration:
   ```json
   {
     "mcpServers": {
       "solar-edge-mcp": {
         "command": "node",
         "args": ["/Users/pxgardiner/node/solar-edge-mcp/index.js"],
         "env": {
           "NODE_ENV": "production"
         }
       }
     }
   }
   ```

   **Note**: Update the path `/Users/pxgardiner/node/solar-edge-mcp/index.js` to match your actual installation directory.

3. **Restart Claude Desktop**:
   - Close Claude Desktop completely
   - Restart the application
   - The SolarEdge MCP server should now be available

### Step 4: Test the Connection

1. **In Claude Desktop**, try asking:
   - "What's my current solar power generation?"
   - "Show me today's solar energy production"
   - "What's the status of my solar system?"

2. **Verify the server is working** by looking for responses that include real data from your SolarEdge system.

### Troubleshooting

**If Claude can't connect to your solar data**:

1. **Check your API credentials**:
   ```bash
   # Test API connection manually
   cd /Users/pxgardiner/node/solar-edge-mcp
   npm test
   ```

2. **Verify environment variables are loaded**:
   ```bash
   # Check if .env file exists and has correct values
   cat .env
   ```

3. **Check Claude Desktop configuration**:
   - Ensure the path in `claude_desktop_config.json` is correct
   - Restart Claude Desktop after any configuration changes
   - Check Claude's settings for any MCP server errors

4. **Check server logs**:
   - Look for error messages when Claude tries to use the solar tools
   - Common issues: incorrect API key, wrong site ID, network connectivity

**Common Error Messages**:
- `Invalid API key`: Check your SOLAREDGE_API_KEY in .env
- `Site not found`: Verify your SOLAREDGE_SITE_ID is correct
- `Rate limit exceeded`: Wait a few minutes and try again

## Configuration Reference

## Usage Examples

Once installed, you can ask Claude to:

1. **Check current solar status**:
   "What's my current solar power generation and how much energy have I produced today?"

2. **Analyze recent performance**:
   "Show me my solar energy production for the last 30 days and analyze the trends"

3. **Compare time periods**:
   "Compare my solar production this month vs last month"

4. **Environmental impact**:
   "How much CO2 have I saved with my solar panels?"

5. **Equipment status**:
   "What equipment is installed at my solar site and what's the current status?"

6. **Performance analysis**:
   "Analyze my daily solar performance patterns and identify the best and worst performing days"

## API Endpoints Covered

The MCP server implements access to most SolarEdge monitoring API endpoints:

- Site overview and details
- Energy and power measurements  
- Detailed power flow analysis
- Storage/battery information (if available)
- Environmental benefits calculation
- Equipment inventory and status
- Historical performance data

## Data Types

The server handles various time units:
- QUARTER_OF_AN_HOUR (15-minute intervals)
- HOUR (hourly data)
- DAY (daily totals)
- WEEK (weekly totals) 
- MONTH (monthly totals)
- YEAR (yearly totals)

## Testing

Run the test suite to verify API connectivity:
```bash
cd /Users/pxgardiner/node/solar-edge-mcp
node test.js
```

## Caching

### Current Implementation
The MCP server now includes **persistent disk-based caching** that stores all API responses indefinitely on disk. This provides several benefits:

- **Reduced API calls**: Subsequent requests for the same data are served from cache
- **Improved performance**: Cached responses are served instantly without network delays
- **Cost efficiency**: Minimizes API usage and stays within rate limits
- **Offline capability**: Cached data remains available even when the SolarEdge API is unavailable
- **Persistent storage**: Cache survives server restarts and system reboots

### How It Works

1. **First Request**: When data is requested for the first time, the server:
   - Makes an API call to SolarEdge
   - Stores the response in a cache file on disk
   - Returns the data to Claude

2. **Subsequent Requests**: For the same data:
   - Server checks cache first
   - If found, returns cached data instantly (cache hit)
   - If not found, falls back to API call (cache miss)

### Cache Configuration

The cache system is configured in `src/index.ts`:
```javascript
const client = new SolarEdgeClient({
  apiKey: API_KEY,
  siteId: SITE_ID,
  cacheDir: './solaredge-cache'  // Cache directory
});
```

### Cache Storage

- **Location**: `./solaredge-cache/` directory (relative to project root)
- **Format**: Individual JSON files for each API endpoint
- **Naming**: MD5 hash of the endpoint URL (e.g., `a1b2c3d4e5f6.json`)
- **Persistence**: Files remain until manually cleared

### Cache Management

#### Manual Cache Clearing
You can clear all cached data using the `clear_cache` tool:

```
"Clear my solar data cache to get fresh information"
```

This will:
- Delete all cached files
- Force fresh API calls for subsequent requests
- Confirm successful cache clearing

#### Programmatic Cache Clearing
```javascript
// Clear cache programmatically
await client.clearCache();
```

### Cache Behavior

- **Indefinite storage**: Cached data never expires automatically
- **Endpoint-specific**: Each API endpoint + parameters combination is cached separately
- **Automatic creation**: Cache directory is created automatically if it doesn't exist
- **Graceful fallback**: If cache operations fail, the system falls back to direct API calls
- **Detailed logging**: Console shows cache hits/misses and storage operations

### Example Cache Flow

```
First request for site overview:
→ Cache miss for endpoint: /site/561703/overview
→ Making API request to: https://monitoringapi.solaredge.com/site/561703/overview?api_key=[HIDDEN]
→ Cached data for endpoint: /site/561703/overview

Second request for same data:
→ Cache hit for endpoint: /site/561703/overview
→ [Returns cached data instantly]
```

### Cache File Structure

Each cache file contains the complete JSON response from the SolarEdge API:
```json
{
  "overview": {
    "lastUpdateTime": "2025-01-23 10:30:00",
    "lifeTimeData": {
      "energy": 45678.9,
      "revenue": 3421.15
    },
    "currentPower": {
      "power": 2847.5
    }
  }
}
```

### When to Clear Cache

Consider clearing the cache when:
- You need the most recent real-time data
- Solar system configuration has changed
- Troubleshooting data inconsistencies
- After system maintenance or updates

## Security

The MCP server now uses environment variables for secure API key storage:

✅ **Implemented Security Measures:**
- API key stored in `.env` file (excluded from version control)
- Environment variable validation on startup
- No sensitive data in source code
- Proper error messages for missing configuration

**Additional Security Recommendations:**
- Keep your `.env` file permissions restricted (chmod 600)
- Never commit `.env` files to version control
- Rotate API keys periodically
- Monitor API usage for unusual activity
- Consider implementing additional authentication layers for production use
- Restrict network access as needed

## Support

The server provides comprehensive access to your SolarEdge monitoring data through Claude's natural language interface. You can ask questions about your solar system performance, and Claude will use the appropriate API endpoints to provide detailed analysis and insights.

## License

Copyright (C) 2025 Paul Gardiner

This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.

For the complete license text, see the [LICENSE](LICENSE) file in this repository.
