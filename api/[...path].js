// Vercel Edge Function proxying every /api/* request to the real backend.
//
// This exists instead of a static `rewrites` entry in vercel.json because
// vercel.json is static config with no environment-variable interpolation —
// the backend's URL has to be read at request time here, from BACKEND_URL
// (set in the Vercel project's Environment Variables, never committed — this
// repo is public, and the old rewrite leaked a live ngrok tunnel to it).
//
// The browser only ever talks to this project's own domain, so requests
// stay same-origin (no CORS needed) even though the real backend lives
// elsewhere (e.g. an ngrok tunnel to a local machine). Runs on the Edge
// runtime (not Node serverless) so both the request and response bodies can
// stream through — required for POST /api/v1/chat/stream's SSE tokens.
export const config = { runtime: "edge" };

export default async function handler(req) {
  const backendBase = process.env.BACKEND_URL;
  if (!backendBase) {
    return new Response("BACKEND_URL environment variable is not configured", { status: 500 });
  }

  const url = new URL(req.url);
  const target = new URL(url.pathname + url.search, backendBase);

  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.delete("connection");
  // Skips ngrok's free-tier browser-warning interstitial (an HTML page in
  // place of the real response) for requests that look browser-originated.
  headers.set("ngrok-skip-browser-warning", "true");

  const hasBody = req.method !== "GET" && req.method !== "HEAD";

  const backendRes = await fetch(target, {
    method: req.method,
    headers,
    body: hasBody ? req.body : undefined,
    duplex: hasBody ? "half" : undefined,
  });

  const resHeaders = new Headers(backendRes.headers);
  resHeaders.delete("content-encoding");
  resHeaders.delete("transfer-encoding");
  resHeaders.delete("connection");

  return new Response(backendRes.body, {
    status: backendRes.status,
    headers: resHeaders,
  });
}
