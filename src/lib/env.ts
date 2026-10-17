import { z } from 'zod';

/**
 * Server-only environment. Values are validated on first use so that `next build`
 * does not require production secrets. Never import this module from client components.
 */
const schema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  APP_URL: z.string().url().default('http://localhost:3000'),
  MEDIA_DIR: z.string().min(1).default('./storage/media'),
  NOMINATIM_BASE_URL: z.string().url().default('https://nominatim.openstreetmap.org'),
  NOMINATIM_USER_AGENT: z
    .string()
    .min(8)
    .default('AlbarkaPropertiesPlatform/1.0 (set NOMINATIM_USER_AGENT to a real contact)'),
  SESSION_IDLE_MINUTES: z.coerce.number().int().min(5).max(1440).default(120),
  SESSION_MAX_HOURS: z.coerce.number().int().min(1).max(168).default(12),
  TRUST_PROXY: z.enum(['true', 'false']).default('false'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

export type Env = z.infer<typeof schema>;

let cached: Env | undefined;

export function getEnv(): Env {
  if (!cached) {
    const parsed = schema.safeParse(process.env);
    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
      throw new Error(`Invalid server environment: ${issues}`);
    }
    cached = parsed.data;
  }
  return cached;
}

/** Test helper to reset cached env between tests. */
export function resetEnvForTests() {
  cached = undefined;
}
