const isProduction = process.env.NODE_ENV === 'production';

export function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getAppBaseUrl() {
  const explicitUrl =
    process.env.APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() ||
    process.env.VERCEL_URL?.trim();

  if (explicitUrl) {
    return explicitUrl.startsWith('http') ? explicitUrl : `https://${explicitUrl}`;
  }

  if (isProduction) {
    throw new Error(
      'Missing APP_URL or NEXT_PUBLIC_APP_URL for production deployment.'
    );
  }

  return 'http://localhost:3000';
}

export function getOptionalEnv(name: string) {
  const value = process.env[name]?.trim();
  return value || undefined;
}

export function isProd() {
  return isProduction;
}
