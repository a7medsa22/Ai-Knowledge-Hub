// test/k6/config.js
// Central configuration for AI Knowledge Hub k6 load testing suite

export const BASE_URL = __ENV.BASE_URL || 'http://127.0.0.1:3000/api/v1';

export const THRESHOLDS = {
  // Healthy operating baseline targets (not production SLAs)
  framework_baseline: {
    http_req_duration: ['p(95)<50'], // Framework overhead target
    http_req_failed: ['rate<0.001'],
  },
  crud_operations: {
    http_req_duration: ['p(95)<500'], // CRUD target
    http_req_failed: ['rate<0.01'],    // Max 1.0% 5xx server errors
  },
  vector_search: {
    http_req_duration: ['p(95)<1000'], // Vector similarity target
    http_req_failed: ['rate<0.01'],
  },
  auth_capacity: {
    http_req_duration: ['p(95)<400'],  // Bcrypt/Token rotation target
    http_req_failed: ['rate<0.01'],
  },
  mcp_tools: {
    http_req_duration: ['p(95)<600'],  // MCP tool target
    http_req_failed: ['rate<0.01'],
  },
  ai_heavy_ops: {
    http_req_duration: ['p(95)<4000'], // LLM bound latency
    http_req_failed: ['rate<0.05'],    // Max 5.0% provider errors
  },
};

// Staged progressive concurrency profile (5 -> 10 -> 25 -> 50 -> 100 -> 200 VUs)
export const STAGED_STRESS_PROFILE = {
  stages: [
    { duration: '1m', target: 5 },   // Warm-up
    { duration: '2m', target: 10 },  // Low load
    { duration: '3m', target: 25 },  // Moderate load
    { duration: '3m', target: 50 },  // Peak load target
    { duration: '3m', target: 100 }, // High stress
    { duration: '2m', target: 200 }, // Saturation discovery
    { duration: '2m', target: 0 },   // Recovery / Cooldown
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'], // Stop escalation if system failure exceeds 5%
    http_req_duration: ['p(95)<3000'],
  },
};
