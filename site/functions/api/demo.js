// POST /api/demo — the "Book a demo" form in every contact band. Stores the
// request in the private D1 table `demo_requests` (see schema.sql), then, if
// RESEND_API_KEY is set, emails a notification to DEMO_NOTIFY_TO (default
// license@provisa.dev). Same conventions as /api/subscribe: JSON in, JSON out,
// a honeypot field (`website`) that silently drops bots.
import { isValidEmail, sendEmail } from "../_lib/license.js";

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }

  if (String(body.website ?? "").trim()) return json({ ok: true });

  const fields = {
    name: String(body.name ?? "").trim(),
    email: String(body.email ?? "").trim().toLowerCase(),
    company: String(body.company ?? "").trim(),
    title: String(body.title ?? "").trim() || null,
    message: String(body.message ?? "").trim() || null,
  };

  if (!fields.name || fields.name.length > 200) return json({ error: "Please enter your name." }, 400);
  if (!isValidEmail(fields.email)) return json({ error: "Please enter a valid work email." }, 400);
  if (!fields.company || fields.company.length > 200) return json({ error: "Please enter your company." }, 400);
  if (fields.title && fields.title.length > 200) return json({ error: "Please shorten your job title." }, 400);
  if (fields.message && fields.message.length > 4000) return json({ error: "Please keep the message under 4,000 characters." }, 400);

  let page = null;
  try {
    page = new URL(request.headers.get("referer") ?? "").pathname;
  } catch {
    // No or malformed Referer: store the request without it.
  }

  try {
    await env.DB.prepare(
      "INSERT INTO demo_requests (name, email, company, title, message, page) VALUES (?, ?, ?, ?, ?, ?)"
    )
      .bind(fields.name, fields.email, fields.company, fields.title, fields.message, page)
      .run();
  } catch {
    return json({ error: "Could not save right now. Please email license@provisa.dev." }, 500);
  }

  if (env.RESEND_API_KEY) {
    try {
      await sendEmail(env, {
        to: env.DEMO_NOTIFY_TO || "license@provisa.dev",
        subject: `Demo request: ${fields.company}`,
        text:
          `Name: ${fields.name}\n` +
          `Email: ${fields.email}\n` +
          `Company: ${fields.company}\n` +
          `Title: ${fields.title ?? "—"}\n` +
          `Page: ${page ?? "—"}\n\n` +
          (fields.message ?? "(no message)"),
      });
    } catch {
      // The request is stored; a failed notification must not fail the visitor.
    }
  }

  return json({ ok: true });
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json" },
  });
}
