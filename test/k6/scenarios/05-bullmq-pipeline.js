// test/k6/scenarios/05-bullmq-pipeline.js
// Phase 4D — BullMQ Ingestion Queue Throughput & Backlog Stress Test
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Trend } from 'k6/metrics';
import { BASE_URL } from '../config.js';
import { getUserForVU, getAuthHeaders } from '../utils/auth-helper.js';

const enqueuedJobsCounter = new Counter('bullmq_jobs_enqueued');
const enqueueDurationTrend = new Trend('bullmq_enqueue_duration');

export const options = {
  stages: [
    { duration: '30s', target: 5 },
    { duration: '1m', target: 20 },
    { duration: '15s', target: 0 },
  ],
  thresholds: {
    bullmq_enqueue_duration: ['p(95)<300'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const user = getUserForVU(__VU);
  const authHeaders = getAuthHeaders(user.token);

  const payload = JSON.stringify({
    title: `Ingestion Burst Document ${__VU}-${Date.now()}`,
    content: `Deep document text for chunking and embedding worker processing. ${'Sentence about database scaling and queue throughput. '.repeat(15)}`,
    tags: ['bullmq', 'ingestion-test'],
    isPublic: false,
  });

  const start = Date.now();
  const res = http.post(`${BASE_URL}/docs`, payload, authHeaders);
  enqueueDurationTrend.add(Date.now() - start);

  if (res.status === 201) {
    enqueuedJobsCounter.add(1);
    check(res, {
      'document queued successfully (201)': (r) => r.status === 201,
    });
  } else {
    check(res, {
      'ingestion submission status 201': (r) => r.status === 201,
    });
  }

  sleep(0.5);
}
