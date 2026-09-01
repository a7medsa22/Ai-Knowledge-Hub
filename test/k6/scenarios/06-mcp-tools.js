// test/k6/scenarios/06-mcp-tools.js
// Phase 4F — Model Context Protocol (MCP) Tools Benchmark
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';
import { BASE_URL } from '../config.js';
import { getUserForVU, getAuthHeaders } from '../utils/auth-helper.js';

const mcpSingleTrend = new Trend('mcp_single_duration');
const mcpBatchTrend = new Trend('mcp_batch_duration');

export const options = {
  stages: [
    { duration: '30s', target: 5 },
    { duration: '1m', target: 15 },
    { duration: '15s', target: 0 },
  ],
  thresholds: {
    mcp_single_duration: ['p(95)<600'],
    mcp_batch_duration: ['p(95)<1200'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const user = getUserForVU(__VU);
  const authHeaders = getAuthHeaders(user.token);

  // 1. Single tool execution
  const singlePayload = JSON.stringify({
    toolName: 'searchDocs',
    parameters: { query: 'machine learning', limit: 5 },
  });

  const startSingle = Date.now();
  const resSingle = http.post(`${BASE_URL}/mcp/execute`, singlePayload, authHeaders);
  mcpSingleTrend.add(Date.now() - startSingle);

  check(resSingle, {
    'mcp single tool status 200': (r) => r.status === 200,
  });

  // 2. Batch tool execution
  const batchPayload = JSON.stringify([
    { toolName: 'searchDocs', parameters: { query: 'performance' } },
    { toolName: 'listTasks', parameters: { status: 'TODO' } },
    { toolName: 'getUserStats', parameters: {} },
  ]);

  const startBatch = Date.now();
  const resBatch = http.post(`${BASE_URL}/mcp/execute-batch`, batchPayload, authHeaders);
  mcpBatchTrend.add(Date.now() - startBatch);

  check(resBatch, {
    'mcp batch tools status 200': (r) => r.status === 200,
  });

  sleep(1);
}
