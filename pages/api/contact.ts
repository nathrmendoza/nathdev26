import type { NextApiRequest, NextApiResponse } from "next";
import { Resend } from "resend";
import { HONEYPOT_FIELD, contactSchema, fieldErrors, type ContactField } from "@/lib/contact-schema";

// Flat, not a union: with `strict` off, TS can't narrow on `ok`.
export interface ContactResponse {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<ContactField, string>;
}

// Resend's shared sender only delivers to the account owner. Set
// CONTACT_FROM_EMAIL once a domain is verified.
const DEFAULT_FROM = "Portfolio contact <onboarding@resend.dev>";

export const config = {
  api: { bodyParser: { sizeLimit: "16kb" } },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<ContactResponse>) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  // Honeypot tripped -- report success so the bot moves on instead of retrying.
  if (req.body?.[HONEYPOT_FIELD]) {
    return res.status(200).json({ ok: true });
  }

  const parsed = contactSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: "Some fields need another look.",
      fieldErrors: fieldErrors(parsed.error),
    });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  if (!apiKey || !to) {
    console.error("[contact] RESEND_API_KEY or CONTACT_TO_EMAIL is not set");
    return res.status(500).json({ ok: false, error: "The form isn’t set up yet — email me directly instead." });
  }

  const { name, email, phone, subject, message } = parsed.data;

  // Plain text, not HTML, so nothing a visitor types can render as markup.
  const { error } = await new Resend(apiKey).emails.send({
    from: process.env.CONTACT_FROM_EMAIL || DEFAULT_FROM,
    to,
    replyTo: email,
    subject: `[nathdev] ${subject.replace(/\s+/g, " ")}`,
    text: [
      `Name:    ${name}`,
      `Email:   ${email}`,
      `Phone:   ${phone || "--"}`,
      "",
      message,
    ].join("\n"),
  });

  if (error) {
    console.error("[contact] Resend rejected the send:", error);
    return res.status(502).json({ ok: false, error: "Couldn’t send just now — try again, or email me directly." });
  }

  return res.status(200).json({ ok: true });
}
