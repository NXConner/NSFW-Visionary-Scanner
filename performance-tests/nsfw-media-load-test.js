import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

const errorRate = new Rate("errors");
const responseTime = new Trend("response_time");

export const options = {
  stages: [
    { duration: "30s", target: 5 },
    { duration: "60s", target: 15 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<1200"],
    http_req_failed: ["rate<0.1"],
    errors: ["rate<0.1"],
  },
};

const SUPABASE_URL = __ENV.SUPABASE_URL;
const SUPABASE_ANON_KEY = __ENV.SUPABASE_ANON_KEY;
const SUPABASE_TEST_TOKEN = __ENV.SUPABASE_TEST_TOKEN;
const NSFW_PACKAGE_ID = __ENV.NSFW_PACKAGE_ID;
const NSFW_ASSET_PATH = __ENV.NSFW_ASSET_PATH;
const DEVICE_ID = __ENV.NSFW_DEVICE_ID || "k6-device";
const DEVICE_PLATFORM = __ENV.NSFW_DEVICE_PLATFORM || "web";

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_TEST_TOKEN) {
  throw new Error("Missing SUPABASE_URL, SUPABASE_ANON_KEY, or SUPABASE_TEST_TOKEN");
}
if (!NSFW_PACKAGE_ID || !NSFW_ASSET_PATH) {
  throw new Error("Missing NSFW_PACKAGE_ID or NSFW_ASSET_PATH");
}

export default function () {
  const url = `${SUPABASE_URL}/functions/v1/get-dlc-signed-url`;
  const payload = JSON.stringify({
    packageId: NSFW_PACKAGE_ID,
    assetPath: NSFW_ASSET_PATH,
    expiresInSeconds: 300,
    deviceId: DEVICE_ID,
    devicePlatform: DEVICE_PLATFORM,
  });

  const res = http.post(url, payload, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_TEST_TOKEN}`,
      apikey: SUPABASE_ANON_KEY,
    },
  });

  let signedUrl = "";
  try {
    signedUrl = String(res.json("signedUrl") || "");
  } catch {
    signedUrl = "";
  }

  check(res, {
    "signed url status 200": r => r.status === 200,
    "signed url returned": () => Boolean(signedUrl),
  }) || errorRate.add(1);

  responseTime.add(res.timings.duration);
  sleep(Math.random() * 0.5 + 0.25);
}

export function handleSummary(data) {
  return {
    stdout: textSummary(data, { indent: " ", enableColors: true }),
    "performance-report-nsfw-media.json": JSON.stringify(data, null, 2),
  };
}
