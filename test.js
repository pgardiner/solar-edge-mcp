#!/usr/bin/env node

// Test script for SolarEdge MCP
import dotenv from 'dotenv';
dotenv.config();

console.log('Testing SolarEdge MCP...');

// Test the SolarEdge client directly
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
    
    console.log(`Making request to: ${urlWithKey.replace(this.apiKey, '[API_KEY_HIDDEN]')}`);
    
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

  async getSiteOverview(siteId) {
    const id = siteId || this.siteId;
    return this.makeRequest(`/site/${id}/overview`);
  }

  async getSiteDetails(siteId) {
    const id = siteId || this.siteId;
    return this.makeRequest(`/site/${id}/details`);
  }
}

async function testClient() {
  console.log('Creating SolarEdge client...');
  
  const client = new SolarEdgeClient({
    apiKey: process.env.SOLAREDGE_API_KEY,
    siteId: 561703
  });

  try {
    console.log('Testing site details...');
    const details = await client.getSiteDetails();
    console.log('Site details success:', details.details?.name || 'Unknown site name');
    
    console.log('Testing site overview...');
    const overview = await client.getSiteOverview();
    console.log('Site overview success:', overview.overview?.currentPower?.power || 'No power data', 'W');
    
    console.log('All tests passed!');
    return true;
  } catch (error) {
    console.error('Test failed:', error.message);
    return false;
  }
}

async function main() {
  try {
    const success = await testClient();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('Test runner failed:', error);
    process.exit(1);
  }
}

main();
