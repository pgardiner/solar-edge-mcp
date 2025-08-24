#!/usr/bin/env node

// Comprehensive test for all SolarEdge MCP endpoints
import dotenv from 'dotenv';
dotenv.config();

console.log('Running comprehensive SolarEdge MCP tests...');

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
    
    try {
      const response = await fetch(urlWithKey);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      throw new Error(`Request failed: ${error.message}`);
    }
  }

  async getSiteOverview() {
    return this.makeRequest(`/site/${this.siteId}/overview`);
  }

  async getSiteDetails() {
    return this.makeRequest(`/site/${this.siteId}/details`);
  }

  async getSitePowerFlow() {
    return this.makeRequest(`/site/${this.siteId}/currentPowerFlow`);
  }

  async getSiteEnergy(startDate, endDate, timeUnit = 'DAY') {
    const params = new URLSearchParams({ startDate, endDate, timeUnit });
    return this.makeRequest(`/site/${this.siteId}/energy?${params}`);
  }

  async getSiteEnvironmentalBenefits() {
    return this.makeRequest(`/site/${this.siteId}/envBenefits`);
  }

  async getSiteInventory() {
    return this.makeRequest(`/site/${this.siteId}/inventory`);
  }
}

async function runTests() {
  const client = new SolarEdgeClient({
    apiKey: process.env.SOLAREDGE_API_KEY,
    siteId: 561703
  });

  const tests = [
    {
      name: 'Site Details',
      test: async () => {
        const result = await client.getSiteDetails();
        console.log(`✓ Site: ${result.details.name} (${result.details.peakPower} kW)`);
        console.log(`  Location: ${result.details.location.city}, ${result.details.location.country}`);
        console.log(`  Status: ${result.details.status}`);
        return true;
      }
    },
    {
      name: 'Site Overview', 
      test: async () => {
        const result = await client.getSiteOverview();
        console.log(`✓ Current Power: ${result.overview.currentPower.power} W`);
        console.log(`  Today: ${result.overview.lastDayData.energy} Wh`);
        console.log(`  This Month: ${(result.overview.lastMonthData.energy / 1000).toFixed(1)} kWh`);
        console.log(`  Lifetime: ${(result.overview.lifeTimeData.energy / 1000).toFixed(1)} kWh`);
        return true;
      }
    },
    {
      name: 'Power Flow',
      test: async () => {
        const result = await client.getSitePowerFlow();
        if (result.siteCurrentPowerFlow) {
          console.log(`✓ PV: ${result.siteCurrentPowerFlow.PV?.currentPower || 0} W (${result.siteCurrentPowerFlow.PV?.status || 'Unknown'})`);
          console.log(`  Load: ${result.siteCurrentPowerFlow.LOAD?.currentPower || 0} W`);
          console.log(`  Grid: ${result.siteCurrentPowerFlow.GRID?.currentPower || 0} W`);
        }
        return true;
      }
    },
    {
      name: 'Recent Energy Data',
      test: async () => {
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        const result = await client.getSiteEnergy(startDate, endDate, 'DAY');
        const validValues = result.energy.values.filter(v => v.value !== null);
        const total = validValues.reduce((sum, v) => sum + v.value, 0);
        
        console.log(`✓ Last 7 days: ${(total / 1000).toFixed(1)} kWh over ${validValues.length} days`);
        console.log(`  Average: ${(total / validValues.length / 1000).toFixed(1)} kWh/day`);
        return true;
      }
    },
    {
      name: 'Environmental Benefits',
      test: async () => {
        const result = await client.getSiteEnvironmentalBenefits();
        console.log(`✓ CO₂ Saved: ${result.envBenefits.gasEmissionSaved.co2.toFixed(1)} kg`);
        console.log(`  Trees Equivalent: ${result.envBenefits.treesPlanted.toFixed(1)}`);
        console.log(`  Light Bulbs Powered: ${Math.round(result.envBenefits.lightBulbs)}`);
        return true;
      }
    },
    {
      name: 'Site Equipment',
      test: async () => {
        const result = await client.getSiteInventory();
        if (result.Inventory.inverters) {
          console.log(`✓ Inverters: ${result.Inventory.inverters.length}`);
          result.Inventory.inverters.forEach((inv, i) => {
            console.log(`  ${i+1}. ${inv.model} (${inv.serialNumber})`);
          });
        }
        if (result.Inventory.meters) {
          console.log(`  Meters: ${result.Inventory.meters.length}`);
        }
        return true;
      }
    }
  ];

  console.log('\nRunning comprehensive tests...\n');
  
  let passed = 0;
  for (const testCase of tests) {
    try {
      console.log(`Testing: ${testCase.name}`);
      await testCase.test();
      passed++;
      console.log();
    } catch (error) {
      console.log(`✗ Failed: ${error.message}\n`);
    }
  }

  console.log(`\nTest Results: ${passed}/${tests.length} tests passed`);
  
  if (passed === tests.length) {
    console.log('🎉 All tests passed! Your SolarEdge MCP server is ready to use.');
    console.log('\nRestart Claude Desktop to start using the solar tools.');
  } else {
    console.log('⚠️  Some tests failed. Check your API connection.');
  }

  return passed === tests.length;
}

runTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
