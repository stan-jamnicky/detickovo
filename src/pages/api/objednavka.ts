import { createHmac } from 'node:crypto';
import type { APIRoute } from 'astro';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import nodemailer from 'nodemailer';
import { formatOrderEmail, normalizeOrderInquiry } from '../../lib/orderInquiry';

export const prerender = false;

const MAX_BODY_BYTES = 16_384;
const ORDER_SUBJECT = 'Nová nezáväzná objednávka z webu Detičkovo';

function json(status: number, success: boolean) {
  return new Response(JSON.stringify({ success }), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

function configured(name: string): string | undefined {
  const value = import.meta.env[name];
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function hashRateLimitKey(value: string, salt: string): string {
  return createHmac('sha256', salt).update(value).digest('hex');
}

async function verifyRecaptcha(token: string, secret: string, expectedHostname: string): Promise<boolean> {
  const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ secret, response: token }),
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) return false;

  const result = await response.json() as { success?: boolean; hostname?: string };
  return result.success === true && result.hostname === expectedHostname;
}

export const POST: APIRoute = async ({ request, clientAddress, url }) => {
  const origin = request.headers.get('origin');
  if (!origin || origin !== url.origin) return json(403, false);

  const contentType = request.headers.get('content-type') ?? '';
  const contentLength = Number(request.headers.get('content-length') ?? '0');
  if (!contentType.startsWith('application/json') || contentLength > MAX_BODY_BYTES) return json(415, false);

  let data: Record<string, unknown>;
  try {
    const body = await request.text();
    if (new TextEncoder().encode(body).byteLength > MAX_BODY_BYTES) return json(413, false);
    const parsed = JSON.parse(body);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return json(400, false);
    data = parsed as Record<string, unknown>;
  } catch {
    return json(400, false);
  }

  if (data.botcheck) return json(200, true);
  const inquiry = normalizeOrderInquiry(data);
  const recaptchaToken = typeof data.recaptchaToken === 'string' ? data.recaptchaToken : '';
  if (!inquiry || !recaptchaToken || recaptchaToken.length > 4_000) return json(422, false);

  const recaptchaSecret = configured('RECAPTCHA_SECRET_KEY');
  const rateLimitSalt = configured('RATE_LIMIT_SALT');
  const redisUrl = configured('UPSTASH_REDIS_REST_URL');
  const redisToken = configured('UPSTASH_REDIS_REST_TOKEN');
  const smtpHost = configured('SMTP_HOST');
  const smtpUser = configured('SMTP_USER');
  const smtpPassword = configured('SMTP_PASSWORD');
  const smtpFrom = configured('SMTP_FROM');
  const orderRecipient = configured('ORDER_RECIPIENT');
  if (!recaptchaSecret || !rateLimitSalt || !redisUrl || !redisToken || !smtpHost || !smtpUser || !smtpPassword || !smtpFrom || !orderRecipient) {
    return json(503, false);
  }

  const redis = new Redis({ url: redisUrl, token: redisToken });
  const ipLimit = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, '1 h'), prefix: 'detickovo:order:ip' });
  const emailLimit = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(3, '1 h'), prefix: 'detickovo:order:email' });
  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const ip = forwardedFor || clientAddress;

  try {
    const [ipResult, emailResult] = await Promise.all([
      ipLimit.limit(hashRateLimitKey(ip, rateLimitSalt)),
      emailLimit.limit(hashRateLimitKey(inquiry.email, rateLimitSalt)),
    ]);
    if (!ipResult.success || !emailResult.success) return json(429, false);
    if (!await verifyRecaptcha(recaptchaToken, recaptchaSecret, url.hostname)) return json(422, false);

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number(configured('SMTP_PORT') ?? '465'),
      secure: true,
      auth: { user: smtpUser, pass: smtpPassword },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    });
    await transporter.sendMail({
      from: smtpFrom,
      to: orderRecipient,
      replyTo: inquiry.email,
      subject: ORDER_SUBJECT,
      text: formatOrderEmail(inquiry),
    });
  } catch {
    return json(500, false);
  }

  return json(200, true);
};