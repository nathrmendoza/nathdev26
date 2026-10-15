import { z } from 'zod';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const required = (max: number) =>
  z.string().trim().min(1, 'Required').max(max, `Keep it under ${max} characters`);

export const contactSchema = z.object({
  name: required(100),
  email: required(254).regex(EMAIL_RE, 'That address doesn’t look right'),
  // Phone is the one optional field -- email already covers "how to reach you".
  phone: z.string().trim().max(40, 'Keep it under 40 characters'),
  subject: required(150),
  message: required(5000),
});

export type ContactInput = z.infer<typeof contactSchema>;
export type ContactField = keyof ContactInput;

/** Honeypot input name. Hidden from people, so anything in it came from a bot. */
export const HONEYPOT_FIELD = 'website';

/** First error message per field, or '' -- the shape ContactForm renders. */
export function fieldErrors(error: z.ZodError<ContactInput>): Record<ContactField, string> {
  const flat = z.flattenError(error).fieldErrors;
  return {
    name: flat.name?.[0] ?? '',
    email: flat.email?.[0] ?? '',
    phone: flat.phone?.[0] ?? '',
    subject: flat.subject?.[0] ?? '',
    message: flat.message?.[0] ?? '',
  };
}
