'use client';

import { useRef } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';

export function RecaptchaCheck({
  onToken
}: {
  onToken: (token: string | null) => void;
}) {
  const siteKey = process.env.NEXT_PUBLIC_GOOGLE_RECAPTCHA_SITE_KEY;
  const ref = useRef<ReCAPTCHA | null>(null);

  if (!siteKey) return null;

  return (
    <ReCAPTCHA
      ref={ref}
      sitekey={siteKey}
      size="invisible"
      onChange={onToken}
    />
  );
}
