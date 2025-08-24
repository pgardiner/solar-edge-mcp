#!/usr/bin/env node

// Test the fixed MCP server with proper protocol version

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

async function testFixedServer() {
  console.log('Testing fixed MCP server...');
  
  const { spawn } = require('child_process');
  const serverProcess = spawn('node', ['dist/index.js'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: process.cwd()
  });

  let responseData = '';
  let errorData = '';

  serverProcess.stdout.on('data', (data) => {
    const response = data.toString().trim();
    if (response) {
      console.log('Server response:', response);
      responseData += response + '\n';
    }
  });

  serverProcess.stderr.on('data', (data) => {
    errorData += data.toString();
    console.error('Server stderr:', data.toString());
  });

  // Step 1: Initialize with Claude's expected protocol version
  const initializeRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2025-06-18',  // Using Claude's expected version
      capabilities: {
        roots: {
          listChanged: false
        }
      },
      clientInfo: {
        name: 'claude-ai',
        version: '0.1.0'
      }
    }
  };

  console.log('\n1. Testing initialize with Claude\'s protocol version...');
  serverProcess.stdin.write(JSON.stringify(initializeRequest) + '\n');
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Step 2: Send initialized notification
  const initializedNotification = {
    jsonrpc: '2.0',
    method: 'notifications/initialized'
  };

  console.log('\n2. Sending initialized notification...');
  serverProcess.stdin.write(JSON.stringify(initializedNotification) + '\n');
  await new Promise(resolve => setTimeout(resolve, 500));

  // Step 3: List tools
  const toolsRequest = {
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/list',
    params: {}
  };

  console.log('\n3. Listing tools...');
  serverProcess.stdin.write(JSON.stringify(toolsRequest) + '\n');
  await new Promise(resolve => setTimeout(resolve, 1000));

  serverProcess.kill();
  console.log('\n=== Test completed ===');
  
  // Check if protocol version matches
  const responses = responseData.split('\n').filter(line => line.trim());
  const initResponse = responses.find(line => line.includes('"id":1'));
  if (initResponse) {
    const parsed = JSON.parse(initResponse);
    if (parsed.result && parsed.result.protocolVersion === '2025-06-18') {
      console.log('✅ Protocol version fix successful!');
    } else {
      console.log('❌ Protocol version mismatch still exists');
      console.log('Expected: 2025-06-18, Got:', parsed.result?.protocolVersion);
    }
  }
}

testFixedServer().catch(console.error);
