#!/usr/bin/env node

// Complete MCP handshake test

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

async function fullHandshakeTest() {
  console.log('Running full MCP handshake test...');
  
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

  // Step 1: Initialize
  const initializeRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {
        roots: {
          listChanged: false
        }
      },
      clientInfo: {
        name: 'test-client',
        version: '1.0.0'
      }
    }
  };

  console.log('\n1. Sending initialize...');
  serverProcess.stdin.write(JSON.stringify(initializeRequest) + '\n');
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Step 2: Send initialized notification
  const initializedNotification = {
    jsonrpc: '2.0',
    method: 'notifications/initialized',
    params: {}
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

  // Step 4: Call a tool
  const toolCallRequest = {
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: {
      name: 'get_site_overview',
      arguments: {}
    }
  };

  console.log('\n4. Calling get_site_overview tool...');
  serverProcess.stdin.write(JSON.stringify(toolCallRequest) + '\n');
  await new Promise(resolve => setTimeout(resolve, 3000));

  serverProcess.kill();
  console.log('\n=== Test completed ===');
}

fullHandshakeTest().catch(console.error);
