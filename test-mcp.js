#!/usr/bin/env node

// Simple test script to check MCP server protocol compliance

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Test the MCP server by sending a basic request
async function testServer() {
  console.log('Testing MCP Server...');
  
  // Test initialize request
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

  console.log('Sending initialize request:');
  console.log(JSON.stringify(initializeRequest, null, 2));
  
  try {
    // Simulate sending this to the server
    const { spawn } = require('child_process');
    const serverProcess = spawn('node', ['dist/index.js'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: process.cwd()
    });

    let responseData = '';
    let errorData = '';

    serverProcess.stdout.on('data', (data) => {
      responseData += data.toString();
      console.log('Server response:', data.toString());
    });

    serverProcess.stderr.on('data', (data) => {
      errorData += data.toString();
      console.error('Server error:', data.toString());
    });

    // Send the initialize request
    serverProcess.stdin.write(JSON.stringify(initializeRequest) + '\n');

    // Wait a moment for response
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Send tools/list request
    const toolsRequest = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
      params: {}
    };

    console.log('Sending tools/list request:');
    console.log(JSON.stringify(toolsRequest, null, 2));
    
    serverProcess.stdin.write(JSON.stringify(toolsRequest) + '\n');

    // Wait for response
    await new Promise(resolve => setTimeout(resolve, 2000));

    serverProcess.kill();

    console.log('Test completed.');
    console.log('Response data:', responseData);
    if (errorData) {
      console.log('Error data:', errorData);
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testServer().catch(console.error);
