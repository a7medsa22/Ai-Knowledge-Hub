// test/k6/scenarios/07-realistic-user-journey.js
// Phase 5 & 6 — Primary Realistic Multi-User Workload & Saturation Discovery (5 -> 200 VUs)
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Counter } from 'k6/metrics';
import { BASE_URL, STAGED_STRESS_PROFILE } from '../config.js';
import { getUserForVU, getAuthHeaders, getRandomDocId } from '../utils/auth-helper.js';

// Custom metrics tagged per subsystem
const docReadTrend = new Trend('trend_doc_read_duration');
const docWriteTrend = new Trend('trend_doc_write_duration');
const notesTasksTrend = new Trend('trend_notes_tasks_duration');
const vectorSearchTrend = new Trend('trend_vector_search_duration');
const mcpToolTrend = new Trend('trend_mcp_tool_duration');
const rateLimit429Counter = new Counter('counter_rate_limit_429');
const serverError5xxCounter = new Counter('counter_server_error_5xx');

export const options = STAGED_STRESS_PROFILE;

export default function () {
  const user = getUserForVU(__VU);
  const authHeaders = getAuthHeaders(user.token);

  const roll = Math.random();

  // Traffic Weight Distribution Model:
  // 45%: Document Browsing & Search
  // 25%: Document Detail & Attached Notes
  // 15%: Interactive Notes & Tasks
  // 8%:  MCP Operations
  // 5%:  Semantic Vector Search
  // 2%:  Document Creation

  if (roll < 0.45) {
    // Flow A: Document Browsing & Pagination
    const start = Date.now();
    const offset = Math.floor(Math.random() * 5) * 10;
    const res = http.get(`${BASE_URL}/docs?limit=10&offset=${offset}`, authHeaders);
    docReadTrend.add(Date.now() - start);

    recordStatus(res, 'browse docs status 200');

  } else if (roll < 0.70) {
    // Flow B: Document Detail & Attached Notes
    const docId = getRandomDocId();
    const start = Date.now();
    const res = http.get(`${BASE_URL}/docs/${docId}`, authHeaders);
    docReadTrend.add(Date.now() - start);

    recordStatus(res, 'doc detail status 200 or 404', [200, 404]);

    if (res.status === 200 && Math.random() < 0.3) {
      // Also fetch notes for this document
      const resNotes = http.get(`${BASE_URL}/notes/document/${docId}`, authHeaders);
      recordStatus(resNotes, 'document notes status 200 or 404', [200, 404]);
    }

  } else if (roll < 0.85) {
    // Flow C: Interactive Notes & Tasks
    const start = Date.now();
    const resTasks = http.get(`${BASE_URL}/tasks?limit=10`, authHeaders);
    notesTasksTrend.add(Date.now() - start);

    recordStatus(resTasks, 'get tasks status 200');

    if (Math.random() < 0.3) {
      const taskPayload = JSON.stringify({
        title: `VU ${__VU} Task ${Date.now()}`,
        description: 'Created during staged concurrency load test',
      });
      const resCreateTask = http.post(`${BASE_URL}/tasks`, taskPayload, authHeaders);
      recordStatus(resCreateTask, 'create task status 201', [201]);
    }

  } else if (roll < 0.93) {
    // Flow D: MCP Operations
    const start = Date.now();
    const mcpPayload = JSON.stringify({
      toolName: 'searchDocs',
      parameters: { query: 'vector', limit: 5 },
    });
    const resMcp = http.post(`${BASE_URL}/mcp/execute`, mcpPayload, authHeaders);
    mcpToolTrend.add(Date.now() - start);

    recordStatus(resMcp, 'mcp status 200');

  } else if (roll < 0.98) {
    // Flow E: Semantic Vector Search
    const start = Date.now();
    const searchPayload = JSON.stringify({ query: 'database similarity search', topK: 5 });
    const resSearch = http.post(`${BASE_URL}/ai/search`, searchPayload, authHeaders);
    vectorSearchTrend.add(Date.now() - start);

    recordStatus(resSearch, 'vector search status 200');

  } else {
    // Flow F: Document Creation
    const start = Date.now();
    const docPayload = JSON.stringify({
      title: `VU ${__VU} Benchmark Doc ${Date.now()}`,
      content: 'Sample text content created during multi-user journey.',
      tags: ['k6', 'benchmark'],
      isPublic: true,
    });
    const resCreateDoc = http.post(`${BASE_URL}/docs`, docPayload, authHeaders);
    docWriteTrend.add(Date.now() - start);

    recordStatus(resCreateDoc, 'create doc status 201', [201]);
  }

  // Realistic human think-time pacing (0.5s -> 2.5s)
  sleep(0.5 + Math.random() * 2.0);
}

function recordStatus(res, checkLabel, acceptableCodes = [200]) {
  if (res.status === 429) {
    rateLimit429Counter.add(1);
    check(res, { 'rate limited (429)': (r) => r.status === 429 });
  } else if (res.status >= 500) {
    serverError5xxCounter.add(1);
    check(res, { 'server error (5xx)': () => false });
  } else {
    check(res, {
      [checkLabel]: (r) => acceptableCodes.includes(r.status),
    });
  }
}
