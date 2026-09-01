// test/k6/scenarios/08-ai-operations.js
// Phase 4E — AI Operations (Summarization, Key-Points, RAG Q&A, and Provider Emulation)
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Counter } from 'k6/metrics';
import { BASE_URL } from '../config.js';
import { getUserForVU, getAuthHeaders } from '../utils/auth-helper.js';

const aiSummarizeDuration = new Trend('ai_summarize_duration');
const aiKeypointsDuration = new Trend('ai_keypoints_duration');
const aiRagAskDuration = new Trend('ai_rag_ask_duration');
const aiProviderErrors = new Counter('ai_provider_errors');

export const options = {
  stages: [
    { duration: '20s', target: 2 },
    { duration: '40s', target: 5 },
    { duration: '15s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.10'], // Allow provider network variance
    ai_summarize_duration: ['p(95)<15000'],
  },
};

export default function () {
  const user = getUserForVU(__VU);
  const authHeaders = getAuthHeaders(user.token);

  // 1. AI Service Status Check
  const resStatus = http.get(`${BASE_URL}/ai/status`);
  check(resStatus, {
    'ai status is 200': (r) => r.status === 200,
  });

  // 2. Direct Text Summarization
  const summarizePayload = JSON.stringify({
    text: 'Artificial Intelligence and PostgreSQL vector search enable high performance retrieval augmented generation architectures. By embedding documents into high-dimensional vector spaces, systems can perform semantic searches with low latency when indexed properly using Hierarchical Navigable Small World graphs.',
    length: 'short',
  });

  const t0 = Date.now();
  const resSummarize = http.post(`${BASE_URL}/ai/summarize`, summarizePayload, authHeaders);
  aiSummarizeDuration.add(Date.now() - t0);

  check(resSummarize, {
    'ai summarize status 200': (r) => r.status === 200,
    'ai provider is openrouter': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data && body.data.provider === 'openrouter';
      } catch (e) {
        return false;
      }
    },
  });
  if (resSummarize.status !== 200) {
    aiProviderErrors.add(1);
  }

  sleep(1);

  // 3. Extract Key Points
  const keyPointsPayload = JSON.stringify({
    text: 'Database connection pooling is essential for high concurrency applications. Prisma default pool size is limited to 9 connections, which requires tuning when concurrency exceeds 25 virtual users.',
    maxPoints: 3,
  });

  const t1 = Date.now();
  const resKeypoints = http.post(`${BASE_URL}/ai/extract-key-points`, keyPointsPayload, authHeaders);
  aiKeypointsDuration.add(Date.now() - t1);

  check(resKeypoints, {
    'ai extract keypoints status 200': (r) => r.status === 200,
  });

  sleep(1);

  // 4. RAG Question & Answer
  const askPayload = JSON.stringify({
    question: 'How does vector indexing improve similarity search?',
    limit: 3,
    threshold: 0.3,
  });

  const t2 = Date.now();
  const resAsk = http.post(`${BASE_URL}/ai/ask`, askPayload, authHeaders);
  aiRagAskDuration.add(Date.now() - t2);

  check(resAsk, {
    'ai ask status 200': (r) => r.status === 200,
  });

  sleep(1);
}
