// test/k6/scenarios/04-pgvector-rag.js
// Phase 4C — pgvector Vector Similarity Search & RAG Retrieval
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';
import { BASE_URL } from '../config.js';
import { getUserForVU, getAuthHeaders } from '../utils/auth-helper.js';

const pgvectorSearchTrend = new Trend('pgvector_search_duration');

export const options = {
  stages: [
    { duration: '30s', target: 5 },
    { duration: '1m', target: 15 },
    { duration: '1m', target: 30 },
    { duration: '15s', target: 0 },
  ],
  thresholds: {
    pgvector_search_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.01'],
  },
};

const sampleQueries = [
  'distributed system vector search architecture',
  'pgvector cosine similarity performance tuning',
  'NestJS rate limiting and throttler guards',
  'BullMQ Redis background worker queue processing',
  'machine learning embedding index optimization',
];

export default function () {
  const user = getUserForVU(__VU);
  const authHeaders = getAuthHeaders(user.token);

  const query = sampleQueries[Math.floor(Math.random() * sampleQueries.length)];
  const payload = JSON.stringify({ query, topK: 5 });

  const start = Date.now();
  const res = http.post(`${BASE_URL}/ai/search`, payload, authHeaders);
  pgvectorSearchTrend.add(Date.now() - start);

  check(res, {
    'vector search status 200': (r) => r.status === 200,
    'vector search returns array': (r) => {
      try {
        return Array.isArray(JSON.parse(r.body));
      } catch (e) {
        return false;
      }
    },
  });

  sleep(1);
}
