import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '5s', target: 10 },   // Ramp up to 10 VUs
    { duration: '15s', target: 30 },  // Stay at / ramp to 30 VUs
    { duration: '10s', target: 50 },  // Spike to 50 VUs
    { duration: '5s', target: 0 },    // Ramp down to 0
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'],    // Less than 5% errors
    http_req_duration: ['p(95)<500'],  // 95% of requests completed under 500ms
  },
};

export default function () {
  const BASE_URL = 'http://localhost:3000';

  // 1. Health check endpoint
  const resHealth = http.get(`${BASE_URL}/api/v1/health`);
  check(resHealth, {
    'health status is 200': (r) => r.status === 200,
  });

  // 2. Swagger docs endpoint
  const resDocs = http.get(`${BASE_URL}/api/docs`);
  check(resDocs, {
    'docs status is 200': (r) => r.status === 200,
  });

  sleep(0.2);
}
