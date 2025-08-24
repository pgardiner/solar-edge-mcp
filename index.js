#!/usr/bin/env node

// Pure JavaScript version of the SolarEdge MCP server
// This avoids the need for TypeScript compilation and npm dependencies

import { createRequire } from 'module';
import dotenv from 'dotenv';

// Configure dotenv to load from .env file
dotenv.config();

// Validate required environment variables
if (!process.env.SOLAREDGE_API_KEY) {
  console.error('ERROR: SOLAREDGE_API_KEY environment variable is required');
  console.error('Please create a .env file with your API key.');
  process.exit(1);
}

if (!process.env.SOLAREDGE_SITE_ID) {
  console.error('ERROR: SOLAREDGE_SITE_ID environment variable is required');
  console.error('Please create a .env file with your site ID.');
  process.exit(1);
}

const require = createRequire(import.meta.url);

// We'll implement a minimal MCP server without external dependencies
class SolarEdgeClient {
  constructor(config) {
    this.apiKey = config.apiKey;
    this.siteId = config.siteId;
    this.baseUrl = config.baseUrl || 'https://monitoringapi.solaredge.com';
  }

  async makeRequest(endpoint) {
    const url = `${this.baseUrl}${endpoint}`;
    const urlWithKey = url.includes('?') 
      ? `${url}&api_key=${this.apiKey}`
      : `${url}?api_key=${this.apiKey}`;
    
    console.error(`Making request to: ${urlWithKey.replace(this.apiKey, '[API_KEY_HIDDEN]')}`);
    
    try {
      // Use dynamic import for node-fetch alternative
      const response = await fetch(urlWithKey);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      throw new Error(`Request failed: ${error.message}`);
    }
  }

  // Site Data APIs
  async getSiteOverview(siteId) {
    const id = siteId || this.siteId;
    return this.makeRequest(`/site/${id}/overview`);
  }

  async getSitePowerFlow(siteId) {
    const id = siteId || this.siteId;
    return this.makeRequest(`/site/${id}/currentPowerFlow`);
  }

  async getSiteDetails(siteId) {
    const id = siteId || this.siteId;
    return this.makeRequest(`/site/${id}/details`);
  }

  async getSiteEnergy(startDate, endDate, timeUnit, siteId) {
    const id = siteId || this.siteId;
    const params = new URLSearchParams({
      startDate,
      endDate
    });
    if (timeUnit) params.append('timeUnit', timeUnit);

    return this.makeRequest(`/site/${id}/energy?${params.toString()}`);
  }

  async getSitePower(startTime, endTime, siteId) {
    const id = siteId || this.siteId;
    const params = new URLSearchParams({
      startTime,
      endTime
    });

    return this.makeRequest(`/site/${id}/power?${params.toString()}`);
  }

  async getSiteEnergyDetails(startTime, endTime, timeUnit, meters, siteId) {
    const id = siteId || this.siteId;
    const params = new URLSearchParams({
      startTime,
      endTime
    });
    if (timeUnit) params.append('timeUnit', timeUnit);
    if (meters && meters.length > 0) {
      params.append('meters', meters.join(','));
    }

    return this.makeRequest(`/site/${id}/energyDetails?${params.toString()}`);
  }

  async getSitePowerDetails(startTime, endTime, meters, siteId) {
    const id = siteId || this.siteId;
    const params = new URLSearchParams({
      startTime,
      endTime
    });
    if (meters && meters.length > 0) {
      params.append('meters', meters.join(','));
    }

    return this.makeRequest(`/site/${id}/powerDetails?${params.toString()}`);
  }

  async getStorageData(startTime, endTime, serials, siteId) {
    const id = siteId || this.siteId;
    const params = new URLSearchParams({
      startTime,
      endTime
    });
    if (serials && serials.length > 0) {
      params.append('serials', serials.join(','));
    }

    return this.makeRequest(`/site/${id}/storageData?${params.toString()}`);
  }

  async getSiteEnvironmentalBenefits(systemUnits, siteId) {
    const id = siteId || this.siteId;
    const params = new URLSearchParams();
    if (systemUnits) params.append('systemUnits', systemUnits);

    const query = params.toString();
    const endpoint = `/site/${id}/envBenefits${query ? '?' + query : ''}`;
    
    return this.makeRequest(endpoint);
  }

  async getSiteInventory(siteId) {
    const id = siteId || this.siteId;
    return this.makeRequest(`/site/${id}/inventory`);
  }

  async getComponentsList(siteId) {
    const id = siteId || this.siteId;
    return this.makeRequest(`/equipment/${id}/list`);
  }

  async getInverterTechnicalData(serialNumber, startTime, endTime, siteId) {
    const id = siteId || this.siteId;
    const params = new URLSearchParams({
      startTime,
      endTime
    });

    return this.makeRequest(`/equipment/${id}/${serialNumber}/data?${params.toString()}`);
  }

  async getMetersData(startTime, endTime, timeUnit, meters, siteId) {
    const id = siteId || this.siteId;
    const params = new URLSearchParams({
      startTime,
      endTime
    });
    if (timeUnit) params.append('timeUnit', timeUnit);
    if (meters && meters.length > 0) {
      params.append('meters', meters.join(','));
    }

    return this.makeRequest(`/site/${id}/meters?${params.toString()}`);
  }

  async getSensorData(startDate, endDate, siteId) {
    const id = siteId || this.siteId;
    const params = new URLSearchParams({
      startDate,
      endDate
    });

    return this.makeRequest(`/site/${id}/sensors?${params.toString()}`);
  }

  // Utility methods
  async getRecentPowerData(days = 7) {
    const endTime = new Date();
    const startTime = new Date();
    startTime.setDate(startTime.getDate() - days);

    return this.getSitePower(
      startTime.toISOString().replace('T', ' ').substring(0, 19),
      endTime.toISOString().replace('T', ' ').substring(0, 19)
    );
  }

  async getRecentEnergyData(days = 30, timeUnit = 'DAY') {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.getSiteEnergy(
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0],
      timeUnit
    );
  }

  async getCurrentStatus() {
    const [overview, powerFlow, details] = await Promise.all([
      this.getSiteOverview(),
      this.getSitePowerFlow(),
      this.getSiteDetails()
    ]);

    return { overview, powerFlow, details };
  }
}

// Simple MCP Server implementation
class MCPServer {
  constructor() {
    this.tools = [
      {
        name: 'get_site_overview',
        description: 'Get current site overview including power generation, energy production, and lifetime statistics',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_current_power_flow',
        description: 'Get current power flow between PV, load, grid, and storage systems',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_site_details',
        description: 'Get detailed site information including location, status, and configuration',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_recent_energy_data',
        description: 'Get energy production data for recent days with specified time unit',
        inputSchema: {
          type: 'object',
          properties: {
            days: { type: 'number', description: 'Number of days to retrieve (1-365)', default: 30 },
            timeUnit: { 
              type: 'string', 
              enum: ['QUARTER_OF_AN_HOUR', 'HOUR', 'DAY', 'WEEK', 'MONTH', 'YEAR'],
              description: 'Time aggregation unit',
              default: 'DAY'
            },
          },
        },
      },
      {
        name: 'get_recent_power_data',
        description: 'Get power generation data for recent days (15-minute resolution)',
        inputSchema: {
          type: 'object',
          properties: {
            days: { type: 'number', description: 'Number of days to retrieve (1-30)', default: 7 },
          },
        },
      },
      {
        name: 'get_energy_data',
        description: 'Get energy production data for a specific date range',
        inputSchema: {
          type: 'object',
          properties: {
            startDate: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
            endDate: { type: 'string', description: 'End date (YYYY-MM-DD)' },
            timeUnit: { 
              type: 'string', 
              enum: ['QUARTER_OF_AN_HOUR', 'HOUR', 'DAY', 'WEEK', 'MONTH', 'YEAR'],
              description: 'Time aggregation unit',
              default: 'DAY'
            },
          },
          required: ['startDate', 'endDate'],
        },
      },
      {
        name: 'get_power_data',
        description: 'Get power generation data for a specific time range (15-minute resolution)',
        inputSchema: {
          type: 'object',
          properties: {
            startTime: { type: 'string', description: 'Start time (YYYY-MM-DD HH:MM:SS)' },
            endTime: { type: 'string', description: 'End time (YYYY-MM-DD HH:MM:SS)' },
          },
          required: ['startTime', 'endTime'],
        },
      },
      {
        name: 'get_current_status',
        description: 'Get comprehensive current status including overview, power flow, and site details',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_environmental_benefits',
        description: 'Get environmental benefits including CO2 savings and equivalent trees planted',
        inputSchema: {
          type: 'object',
          properties: {
            systemUnits: {
              type: 'string',
              enum: ['Metrics', 'Imperial'],
              description: 'Unit system for measurements',
              default: 'Metrics'
            },
          },
        },
      },
      {
        name: 'get_site_equipment',
        description: 'Get information about all equipment installed at the site',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'analyze_daily_performance',
        description: 'Analyze daily performance patterns over a specified period',
        inputSchema: {
          type: 'object',
          properties: {
            days: { type: 'number', description: 'Number of days to analyze (7-90)', default: 30 },
          },
        },
      }
    ];
  }

  async handleRequest(message) {
    let request;
    
    try {
      request = JSON.parse(message);
    } catch (parseError) {
      return {
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32700,
          message: 'Parse error'
        }
      };
    }
    
    // Ensure request has required fields
    if (!request || typeof request !== 'object' || !request.method) {
      return {
        jsonrpc: '2.0',
        id: request?.id || null,
        error: {
          code: -32600,
          message: 'Invalid Request'
        }
      };
    }
    
    const requestId = request.id || null;
    
    try {
      if (request.method === 'tools/list') {
        return {
          jsonrpc: '2.0',
          id: requestId,
          result: {
            tools: this.tools
          }
        };
      }
      
      if (request.method === 'tools/call') {
        if (!request.params || !request.params.name) {
          return {
            jsonrpc: '2.0',
            id: requestId,
            error: {
              code: -32602,
              message: 'Invalid params: name is required'
            }
          };
        }
        
        const { name, arguments: args } = request.params;
        const result = await this.callTool(name, args || {});
        
        return {
          jsonrpc: '2.0',
          id: requestId,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2)
              }
            ]
          }
        };
      }
      
      if (request.method === 'initialize') {
        return {
          jsonrpc: '2.0',
          id: requestId,
          result: {
            protocolVersion: '2025-06-18',
            capabilities: {
              tools: {}
            },
            serverInfo: {
              name: 'solar-edge-mcp',
              version: '1.0.0'
            }
          }
        };
      }
      
      if (request.method === 'notifications/initialized') {
        // No response needed for notifications
        return null;
      }
      
      return {
        jsonrpc: '2.0',
        id: requestId,
        error: {
          code: -32601,
          message: `Method not found: ${request.method}`
        }
      };
      
    } catch (error) {
      return {
        jsonrpc: '2.0',
        id: requestId,
        error: {
          code: -32603,
          message: error.message
        }
      };
    }
  }

  async callTool(name, args) {
    const client = new SolarEdgeClient({
      apiKey: process.env.SOLAREDGE_API_KEY,
      siteId: parseInt(process.env.SOLAREDGE_SITE_ID)
    });

    switch (name) {
      case 'get_site_overview':
        return await client.getSiteOverview();

      case 'get_current_power_flow':
        return await client.getSitePowerFlow();

      case 'get_site_details':
        return await client.getSiteDetails();

      case 'get_recent_energy_data': {
        const { days = 30, timeUnit = 'DAY' } = args;
        return await client.getRecentEnergyData(days, timeUnit);
      }

      case 'get_recent_power_data': {
        const { days = 7 } = args;
        return await client.getRecentPowerData(days);
      }

      case 'get_energy_data': {
        const { startDate, endDate, timeUnit } = args;
        return await client.getSiteEnergy(startDate, endDate, timeUnit);
      }

      case 'get_power_data': {
        const { startTime, endTime } = args;
        return await client.getSitePower(startTime, endTime);
      }

      case 'get_current_status':
        return await client.getCurrentStatus();

      case 'get_environmental_benefits': {
        const { systemUnits } = args;
        return await client.getSiteEnvironmentalBenefits(systemUnits);
      }

      case 'get_site_equipment':
        return await client.getSiteInventory();

      case 'analyze_daily_performance': {
        const { days = 30 } = args;
        
        // Get energy data for analysis
        const energyData = await client.getRecentEnergyData(days, 'DAY');
        
        // Calculate performance metrics
        const values = energyData.energy.values.filter(v => v.value !== null);
        const totalEnergy = values.reduce((sum, v) => sum + (v.value || 0), 0);
        const avgDaily = totalEnergy / values.length;
        const maxDaily = Math.max(...values.map(v => v.value || 0));
        const minDaily = Math.min(...values.map(v => v.value || 0));
        
        return {
          period: {
            days,
            totalMeasurements: values.length,
          },
          performance: {
            totalEnergyWh: totalEnergy,
            totalEnergyKWh: totalEnergy / 1000,
            averageDailyWh: avgDaily,
            averageDailyKWh: avgDaily / 1000,
            maxDailyWh: maxDaily,
            maxDailyKWh: maxDaily / 1000,
            minDailyWh: minDaily,
            minDailyKWh: minDaily / 1000,
          },
          rawData: energyData,
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }
}

// Main server loop
async function main() {
  const server = new MCPServer();
  
  console.error('SolarEdge MCP Server running on stdio');
  console.error(`Using API key: ${process.env.SOLAREDGE_API_KEY.substring(0, 4)}...${process.env.SOLAREDGE_API_KEY.slice(-4)}`);
  console.error(`Using site ID: ${process.env.SOLAREDGE_SITE_ID}`);
  
  process.stdin.setEncoding('utf8');
  
  let buffer = '';
  
  process.stdin.on('data', async (chunk) => {
    buffer += chunk;
    
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    
    for (const line of lines) {
      if (line.trim()) {
        try {
          const response = await server.handleRequest(line.trim());
          if (response !== null) {
            console.log(JSON.stringify(response));
          }
        } catch (error) {
          console.error('Error processing request:', error);
        }
      }
    }
  });
  
  process.stdin.on('end', () => {
    process.exit(0);
  });
}

main().catch((error) => {
  console.error('Server failed to start:', error);
  process.exit(1);
});