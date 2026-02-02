import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

// Custom metrics
const errorRate = new Rate("errors");
const responseTime = new Trend("response_time");

export const options = {
  stages: [
    { duration: "30s", target: 10 }, // Ramp up
    { duration: "60s", target: 25 }, // Hold
    { duration: "30s", target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ["p(99)<1000"], // 99% of requests should be below 1000ms
    http_req_failed: ["rate<0.1"], // Error rate should be below 10%
    errors: ["rate<0.1"], // Custom error rate
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:4173";

export default function () {
  // Test public pages
  const homeResponse = http.get(`${BASE_URL}/`, { redirects: 5 });
  check(homeResponse, {
    "homepage status is 200": r => r.status === 200,
    "homepage loads within 1000ms": r => r.timings.duration < 1000,
  }) || errorRate.add(1);
  responseTime.add(homeResponse.timings.duration);

  sleep(Math.random() * 2 + 1); // Random sleep between 1-3 seconds

  const authResponse = http.get(`${BASE_URL}/auth`, { redirects: 5 });
  check(authResponse, {
    "auth page loads": r => r.status === 200,
  }) || errorRate.add(1);
  responseTime.add(authResponse.timings.duration);

  sleep(Math.random() * 2 + 1);

  const pricingResponse = http.get(`${BASE_URL}/pricing`, { redirects: 5 });
  check(pricingResponse, {
    "pricing page loads": r => r.status === 200,
  }) || errorRate.add(1);
  responseTime.add(pricingResponse.timings.duration);

  sleep(Math.random() * 3 + 1);
}

export function handleSummary(data) {
  return {
    stdout: textSummary(data, { indent: " ", enableColors: true }),
    "performance-report.json": JSON.stringify(data, null, 2),
  };
}
