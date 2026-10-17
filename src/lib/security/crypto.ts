import { createHash, randomBytes } from 'node:crypto';
import { hash as argonHash, verify as argonVerify } from '@node-rs/argon2';

/** Argon2id parameters (OWASP-recommended minimum class). */
const ARGON2_OPTIONS = { algorithm: 2, memoryCost: 19456, timeCost: 2, parallelism: 1 } as const;

export async function hashPassword(password: string): Promise<string> {
  return argonHash(password, ARGON2_OPTIONS);
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await argonVerify(hash, password);
  } catch {
    return false;
  }
}

/** Cryptographically random URL-safe token (256 bits). */
export function generateToken(): string {
  return randomBytes(32).toString('base64url');
}

/** Deterministic SHA-256 digest used for storing session and setup tokens. */
export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

/** Pseudonymous IP fingerprint for audit and rate limiting. Raw IPs are not stored. */
export function hashIp(ip: string | null | undefined): string | null {
  if (!ip) return null;
  return sha256(`ip-pepper-v1:${ip}`);
}

/** Random id for media storage names (never derived from user-supplied filenames). */
export function randomId(bytes = 16): string {
  return randomBytes(bytes).toString('hex');
}
