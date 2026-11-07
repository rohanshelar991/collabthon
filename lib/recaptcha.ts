'use server';

export async function verifyRecaptcha(token: string) {
  const secret = process.env.GOOGLE_RECAPTCHA_SECRET;

  if (!secret) {
    return { success: false, reason: 'missing-secret' };
  }

  const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ secret, response: token }).toString()
  });

  return response.json() as Promise<{
    success: boolean;
    score?: number;
    action?: string;
    'error-codes'?: string[];
  }>;
}
