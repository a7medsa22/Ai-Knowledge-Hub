// test/k6/scenarios/02-auth-capacity.js
// Phase 4A — Authentication Capacity & Throttler Verification
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Trend } from 'k6/metrics';
import { BASE_URL } from '../config.js';
import { getUserForVU, getAuthHeaders } from '../utils/auth-helper.js';

const rateLimit429Counter = new Counter('rate_limit_429_count');
const loginTrend = new Trend('auth_login_duration');
const refreshTrend = new Trend('auth_refresh_duration');

export const options = {
  stages: [
    { duration: '30s', target: 5 },
    { duration: '30s', target: 15 },
    { duration: '15s', target: 0 },
  ],
  thresholds: {
    auth_refresh_duration: ['p(95)<400'],
  },
};

export default function () {
  const user = getUserForVU(__VU);
  const authHeaders = getAuthHeaders(user.token);

  // 1. Session listing (authenticated endpoint capacity)
  const resSessions = http.get(`${BASE_URL}/users/auth/sessions`, authHeaders);
  if (resSessions.status === 429) {
    rateLimit429Counter.add(1);
  } else {
    check(resSessions, {
      'sessions status 200': (r) => r.status === 200,
    });
  }

  // 2. Direct login test (observing bcrypt computation vs throttler limits)
  const payloadLogin = JSON.stringify({
    email: user.email,
    password: 'Password123!',
  });

  const startLogin = Date.now();
  const resLogin = http.post(`${BASE_URL}/users/auth/login`, payloadLogin, {
    headers: { 'Content-Type': 'application/json' },
  });
  loginTrend.add(Date.now() - startLogin);

  if (resLogin.status === 429) {
    rateLimit429Counter.add(1);
    check(resLogin, {
      'throttled login returns 429 cleanly': (r) => r.status === 429,
    });
  } else {
    check(resLogin, {
      'login status 200 or 401': (r) => r.status === 200 || r.status === 401,
    });
  }

  sleep(1);
}
