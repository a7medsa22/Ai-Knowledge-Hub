// test/k6/scenarios/03-docs-db-workload.js
// Phase 4B — Document Management & Relational Database Workload
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';
import { BASE_URL, THRESHOLDS } from '../config.js';
import { getUserForVU, getAuthHeaders, getRandomDocId } from '../utils/auth-helper.js';

const docReadTrend = new Trend('doc_read_duration');
const docWriteTrend = new Trend('doc_write_duration');

export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m', target: 25 },
    { duration: '1m', target: 50 },
    { duration: '15s', target: 0 },
  ],
  thresholds: {
    doc_read_duration: ['p(95)<500'],
    doc_write_duration: ['p(95)<800'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const user = getUserForVU(__VU);
  const authHeaders = getAuthHeaders(user.token);

  // 1. Pagination with offset & limit
  const startRead1 = Date.now();
  const resPagination = http.get(`${BASE_URL}/docs?limit=20&offset=20`, authHeaders);
  docReadTrend.add(Date.now() - startRead1);
  check(resPagination, {
    'pagination status 200': (r) => r.status === 200,
  });

  // 2. Substring ILIKE search
  const resSearch = http.get(`${BASE_URL}/docs?query=performance&tags=ai`, authHeaders);
  check(resSearch, {
    'search status 200': (r) => r.status === 200,
  });

  // 3. Detail lookup with nested relation includes
  const docId = getRandomDocId();
  const startRead2 = Date.now();
  const resDetail = http.get(`${BASE_URL}/docs/${docId}`, authHeaders);
  docReadTrend.add(Date.now() - startRead2);
  check(resDetail, {
    'detail status 200 or 404': (r) => r.status === 200 || r.status === 404,
  });

  // 4. Document creation write transaction
  const payloadCreate = JSON.stringify({
    title: `Benchmark Transient Doc ${Date.now()}`,
    content: 'Transient document created during high concurrency performance test.',
    tags: ['k6', 'transient'],
    isPublic: true,
  });

  const startWrite = Date.now();
  const resCreate = http.post(`${BASE_URL}/docs`, payloadCreate, authHeaders);
  docWriteTrend.add(Date.now() - startWrite);
  check(resCreate, {
    'create doc status 201': (r) => r.status === 201,
  });

  sleep(0.5);
}
