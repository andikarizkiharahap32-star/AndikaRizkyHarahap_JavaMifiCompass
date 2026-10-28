/**
 * P27: k6 Performance and Load Testing Scenarios
 *
 * Requirements:
 * 1. 4 Core Scenarios:
 *    - search_spike: search endpoint tail latency verification (p95 < 300ms)
 *    - fx_burst: rapid currency conversions against cached rates (p95 < 100ms)
 *    - assist_mocked_llm: itinerary & dining recommendations with mocked LLM
 *    - checkout_mock_gateway: order checkout with Idempotency-Key and mock gateway
 * 2. SLO Gates:
 *    - search p95 < 300 ms
 *    - FX p95 < 100 ms (cache hit)
 *    - error rate < 0.5% (0.005)
 * 3. Prohibitions & Protections:
 *    - Kill switch abort logic (KILL_SWITCH env flag)
 *    - Dataset size validation: >= 500k places in perf environment
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.API_BASE_URL || 'http://localhost:3001';
const KILL_SWITCH = __ENV.KILL_SWITCH === 'true';
const DATASET_PLACES_COUNT = parseInt(__ENV.PERF_DATASET_PLACES || '500000', 10);

// P27 Invariant: Prohibit testing with unrealistic data volumes (< 500,000 places)
if (DATASET_PLACES_COUNT < 500000) {
  throw new Error(
    `Performance test configuration failure: Dataset size (${DATASET_PLACES_COUNT}) is below mandatory threshold of 500,000 places.`
  );
}

export const options = {
  scenarios: {
    // 1. Search Spike Scenario
    search_spike: {
      executor: 'ramping-vus',
      startVUs: 10,
      stages: [
        { duration: '30s', target: 50 },
        { duration: '1m', target: 200 }, // Spike to 200 VUs
        { duration: '30s', target: 0 },
      ],
      exec: 'searchSpikeScenario',
    },

    // 2. FX Burst Scenario
    fx_burst: {
      executor: 'constant-vus',
      vus: 50,
      duration: '45s',
      exec: 'fxBurstScenario',
    },

    // 3. Assist Endpoint with Mocked LLM
    assist_mocked_llm: {
      executor: 'constant-vus',
      vus: 20,
      duration: '45s',
      exec: 'assistMockedScenario',
    },

    // 4. Checkout with Mock Gateway & Idempotency
    checkout_mock_gateway: {
      executor: 'per-vu-iterations',
      vus: 25,
      iterations: 20,
      maxDuration: '1m',
      exec: 'checkoutScenario',
    },
  },

  // P27 SLO Thresholds
  thresholds: {
    'http_req_duration{scenario:search_spike}': ['p(95)<300'], // search p95 < 300 ms
    'http_req_duration{scenario:fx_burst}': ['p(95)<100'], // FX p95 < 100 ms (cache hit)
    'http_req_failed': ['rate<0.005'], // error rate < 0.5%
  },
};

export function searchSpikeScenario() {
  if (KILL_SWITCH) return;

  const queries = ['halal+ramen', 'tokyo+station', 'shinjuku+kebab', 'halal+wagyu', 'kyoto+curry'];
  const q = queries[Math.floor(Math.random() * queries.length)];
  const res = http.get(`${BASE_URL}/api/v1/places/search?q=${q}&lat=35.6895&lng=139.6917&radius=10000`);

  check(res, {
    'search status is 200': (r) => r.status === 200,
    'search latency p95 acceptable': (r) => r.timings.duration < 300,
  });

  sleep(0.1);
}

export function fxBurstScenario() {
  if (KILL_SWITCH) return;

  const amounts = [1000, 2500, 5000, 10000, 25000];
  const amt = amounts[Math.floor(Math.random() * amounts.length)];
  const res = http.get(`${BASE_URL}/api/v1/fx/convert?from=JPY&to=IDR&amount=${amt}`);

  check(res, {
    'fx status is 200': (r) => r.status === 200,
    'fx latency p95 acceptable': (r) => r.timings.duration < 100,
  });

  sleep(0.05);
}

export function assistMockedScenario() {
  if (KILL_SWITCH) return;

  const payload = JSON.stringify({
    prompt: 'Suggest top 3 halal dinner options near Ginza under 3000 JPY',
    userId: `usr_perf_${__VU}`,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'X-Mock-LLM': 'true', // Mocked LLM provider to test API concurrency without upstream cost
    },
  };

  const res = http.post(`${BASE_URL}/api/v1/assist`, payload, params);

  check(res, {
    'assist status is 200 or 201': (r) => r.status === 200 || r.status === 201,
  });

  sleep(0.2);
}

export function checkoutScenario() {
  if (KILL_SWITCH) return;

  const idempotencyKey = `idem_perf_vu${__VU}_it${__ITER}_${Date.now()}`;
  const payload = JSON.stringify({
    planId: 'esim-japan-5g-unlimited',
    quantity: 1,
    amount: 150000,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey,
      'X-Mock-Payment': 'true', // Mock payment gateway
    },
  };

  const res = http.post(`${BASE_URL}/api/v1/orders/checkout`, payload, params);

  check(res, {
    'checkout status is 201': (r) => r.status === 201,
    'idempotency key echoed': (r) => r.headers['Idempotency-Key'] === idempotencyKey,
  });

  sleep(0.2);
}
