import type { Handler, HandlerEvent } from "@netlify/functions";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface EmailAttachment {
  filename: string;
  content?: string; // base64
  path?: string; // URL for Resend to fetch
}

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
}

const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS_HEADERS, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "RESEND_API_KEY not configured" }),
    };
  }

  try {
    const { to, subject, html, attachments } = JSON.parse(
      event.body || "{}"
    ) as EmailRequest;

    if (!to || !subject || !html) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: "Missing required fields: to, subject, html" }),
      };
    }

    const resendPayload: Record<string, unknown> = {
      from: "TeamChallenge <noreply@eventday.dk>",
      to: [to],
      subject,
      html,
    };

    if (attachments && attachments.length > 0) {
      resendPayload.attachments = attachments.map((att) => {
        if (att.content) {
          return { filename: att.filename, content: att.content };
        }
        if (att.path) {
          return { filename: att.filename, path: att.path };
        }
        return att;
      });
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(resendPayload),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: result.message || "Resend API error", details: result }),
      };
    }

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ success: true, id: result.id }),
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: err.message || "Internal server error" }),
    };
  }
};

export { handler };
