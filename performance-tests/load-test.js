import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate, Trend } from 'k6/metrics'

// Custom metrics
const errorRate = new Rate('errors')
const responseTime = new Trend('response_time')

export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users over 2 minutes
    { duration: '5m', target: 100 }, // Stay at 100 users for 5 minutes
    { duration: '2m', target: 200 }, // Ramp up to 200 users over 2 minutes
    { duration: '5m', target: 200 }, // Stay at 200 users for 5 minutes
    { duration: '2m', target: 0 },   // Ramp down to 0 users over 2 minutes
  ],
  thresholds: {
    http_req_duration: ['p(99)<1000'], // 99% of requests should be below 1000ms
    http_req_failed: ['rate<0.1'],     // Error rate should be below 10%
    errors: ['rate<0.1'],              // Custom error rate
  },
}

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4173'

export default function () {
  // Test homepage load
  const homeResponse = http.get(`${BASE_URL}/`)
  check(homeResponse, {
    'homepage status is 200': (r) => r.status === 200,
    'homepage loads within 1000ms': (r) => r.timings.duration < 1000,
  }) || errorRate.add(1)
  responseTime.add(homeResponse.timings.duration)

  sleep(Math.random() * 2 + 1) // Random sleep between 1-3 seconds

  // Test scanner page (if authenticated)
  const scannerResponse = http.get(`${BASE_URL}/scanner`)
  check(scannerResponse, {
    'scanner page loads': (r) => r.status === 200 || r.status === 401, // 401 is expected for unauthenticated users
  }) || errorRate.add(1)
  responseTime.add(scannerResponse.timings.duration)

  sleep(Math.random() * 2 + 1)

  // Test API health check (if available)
  const healthResponse = http.get(`${BASE_URL}/api/health`)
  if (healthResponse.status !== 404) { // Only check if endpoint exists
    check(healthResponse, {
      'health check passes': (r) => r.status === 200,
    }) || errorRate.add(1)
    responseTime.add(healthResponse.timings.duration)
  }

  sleep(Math.random() * 3 + 1)
}

export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'performance-report.json': JSON.stringify(data, null, 2),
  }
}
