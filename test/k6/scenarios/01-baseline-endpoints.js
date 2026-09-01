// test/k6/scenarios/01-baseline-endpoints.js
// Phase 3 — Baseline Tests (1 -> 5 -> 10 VUs)
import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, THRESHOLDS } from '../config.js';
import { getUserForVU, getAuthHeaders, getRandomDocId } from '../utils/auth-helper.js';

export const options = {
  stages: [
    { duration: '30s', target: 1 },
    { duration: '30s', target: 5 },
    { duration: '30s', target: 10 },
    { duration: '15s', target: 0 },
  ],
  thresholds: THRESHOLDS.crud_operations,
};

export default function () {
  const user = getUserForVU(__VU);
  const authHeaders = getAuthHeaders(user.token);

  // 1. Framework baseline (health)
  const resHealth = http.get(`${BASE_URL}/health`);
  check(resHealth, {
    'health status 200': (r) => r.status === 200,
  });

  // 2. Public docs list & pagination (requires JWT guard on DocsController)
  const resPublicDocs = http.get(`${BASE_URL}/docs?limit=10&offset=0`, authHeaders);
  check(resPublicDocs, {
    'public docs status 200': (r) => r.status === 200,
  });

  // 3. User authenticated docs
  const resMyDocs = http.get(`${BASE_URL}/docs/my-docs?limit=10`, authHeaders);
  check(resMyDocs, {
    'my-docs status 200': (r) => r.status === 200,
  });

  // 4. User profile
  const resProfile = http.get(`${BASE_URL}/users/profile`, authHeaders);
  check(resProfile, {
    'profile status 200': (r) => r.status === 200,
  });

  // 5. Doc detail
  const docId = getRandomDocId();
  const resDocDetail = http.get(`${BASE_URL}/docs/${docId}`, authHeaders);
  check(resDocDetail, {
    'doc detail status 200, 403 or 404': (r) => r.status === 200 || r.status === 403 || r.status === 404,
  });

  sleep(0.5);
}
