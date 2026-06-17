import { SignJWT, jwtVerify } from 'jose';

const rawSecret = process.env.JWT_SECRET;
if (!rawSecret) {
  if (process.env.NODE_ENV === 'production') {
    console.error('FATAL: JWT_SECRET environment variable is not set. Refusing to start.');
    process.exit(1);
  }
  console.warn('WARN: JWT_SECRET not set. Using insecure fallback for development only.');
}
const JWT_SECRET = new TextEncoder().encode(
  rawSecret || 'fallback-super-secret-key-for-dev-only'
);

export async function signToken(payload: { sub: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch (error) {
    // In dev, log the specific error for debugging
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Token verification failed:', error instanceof Error ? error.message : error);
    }
    return null;
  }
}
