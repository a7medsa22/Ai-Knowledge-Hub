// test/k6/utils/auth-helper.js
import { SharedArray } from 'k6/data';

// Load pre-seeded user access tokens
const users = new SharedArray('users', function () {
  try {
    return JSON.parse(open('../data/test-users.json'));
  } catch (e) {
    // Fallback inline user if file not pre-seeded
    return [{ id: 'fallback-user-id', email: 'perf_user_1@benchmark.test', token: '' }];
  }
});

const docs = new SharedArray('docs', function () {
  try {
    return JSON.parse(open('../data/test-docs.json'));
  } catch (e) {
    return ['doc-fallback-id'];
  }
});

export function getRandomUser() {
  const index = Math.floor(Math.random() * users.length);
  return users[index];
}

export function getUserForVU(vuId) {
  const index = (vuId - 1) % users.length;
  return users[index];
}

export function getRandomDocId() {
  const index = Math.floor(Math.random() * docs.length);
  return docs[index];
}

export function getAuthHeaders(token) {
  return {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  };
}
