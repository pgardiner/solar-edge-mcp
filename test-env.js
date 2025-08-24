#!/usr/bin/env node

// Test with environment variables set (like Claude will do)

import dotenv from 'dotenv';
import { spawn } from 'child_process';

dotenv.config();

const serverProcess = spawn('node', ['dist/index.js'], {
  stdio: ['pipe', 'pipe', 'pipe'],
  cwd: '/Users/pxgardiner/node/solar-edge-mcp',
  env: {
    ...process.env,
    SOLAREDGE_API_KEY: process.env.SOLAREDGE_API_KEY,
    SOLAREDGE_SITE_ID: '561703'
  }
});

let hasStarted = false;

serverProcess.stdout.on('data', (data) => {
  const response = data.toString().trim();
  if (response) {
    console.log('✅ Server response:', response);
  }
});

serverProcess.stderr.on('data', (data) => {
  const message = data.toString().trim();
  if (message) {
    console.log('📡 Server stderr:', message);
    if (message.includes('SolarEdge MCP Server configured')) {
      hasStarted = true;
    }
  }
});

// Send initialize request
setTimeout(() => {
  const initRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2025-06-18',
      capabilities: {},
      clientInfo: { name: 'test-client', version: '1.0.0' }
    }
  };
  
  serverProcess.stdin.write(JSON.stringify(initRequest) + '\n');
  
  setTimeout(() => {
    serverProcess.kill();
    if (hasStarted) {
      console.log('\n🎉 SUCCESS: Server started successfully with environment variables!');
      console.log('✅ Claude should now be able to connect to your SolarEdge MCP server.');
      console.log('\n📝 Next steps:');
      console.log('1. Restart Claude Desktop app');
      console.log('2. The SolarEdge tools should now be available');
    } else {
      console.log('\n❌ Server failed to start properly');
    }
  }, 2000);
}, 1000);
