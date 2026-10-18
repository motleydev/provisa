// Optional HTTP basic auth for the whole site. A root _middleware.js runs before
// every request, static pages included. It is off unless both BASIC_AUTH_USER and
// BASIC_AUTH_PASS are set as Pages secrets, so a project without them (upstream's
// provisa-dev) is unaffected.
export async function onRequest({ request, env, next }) {
  const user = env.BASIC_AUTH_USER;
  const pass = env.BASIC_AUTH_PASS;
  if (!user || !pass) return next();

  const [scheme, encoded] = (request.headers.get("Authorization") || "").split(" ");
  if (scheme === "Basic" && encoded) {
    let decoded = "";
    try { decoded = atob(encoded); } catch {}
    const i = decoded.indexOf(":");
    // `&` rather than `&&`: always compare both, so timing does not reveal which was wrong.
    if (i >= 0 && (await same(decoded.slice(0, i), user)) & (await same(decoded.slice(i + 1), pass))) {
      return next();
    }
  }
  return new Response("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Provisa preview", charset="UTF-8"', "Cache-Control": "no-store" },
  });
}

// Constant-time comparison: compare SHA-256 digests byte by byte.
async function same(a, b) {
  const enc = new TextEncoder();
  const [x, y] = await Promise.all([a, b].map((s) => crypto.subtle.digest("SHA-256", enc.encode(s))));
  const u = new Uint8Array(x), v = new Uint8Array(y);
  let diff = 0;
  for (let k = 0; k < u.length; k++) diff |= u[k] ^ v[k];
  return diff === 0;
}
