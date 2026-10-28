import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z
    .string()
    .default('postgresql://postgres:postgres@localhost:5432/javamifi_compass'),
  JWT_SECRET: z.string().min(8).default('development-jwt-secret-not-for-production'),
  APP_URL: z.string().url().default('http://localhost:3000'),
  ADMIN_URL: z.string().url().default('http://localhost:3002'),
  REDIS_URL: z.string().optional(),
  MOCK_PAYMENT_URL: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  MIDTRANS_SERVER_KEY: z.string().optional(),
  MIDTRANS_CLIENT_KEY: z.string().optional(),
  MIDTRANS_IS_PRODUCTION: z.coerce.boolean().default(false),
  WEBHOOK_SECRET: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  PAYMENT_GATEWAY_MODE: z.enum(['mock', 'midtrans', 'stripe']).default('mock'),
  ESIM_PROVIDER_MODE: z.enum(['mock', 'live']).default('mock'),
  AUTOMATION_ENABLED: z.coerce.boolean().default(true),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function parseEnv(raw: Record<string, string | undefined> = process.env): EnvConfig {
  const parsed = envSchema.safeParse(raw);
  if (!parsed.success) {
    const errorDetails = parsed.error.issues
      .map((issue) => ` - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`[Config] Environment validation failed fast on boot:\n${errorDetails}`);
  }

  // Production security guardrail: Secrets must NOT use development defaults in production
  if (parsed.data.NODE_ENV === 'production') {
    if (parsed.data.JWT_SECRET === 'development-jwt-secret-not-for-production') {
      throw new Error('[Config] JWT_SECRET cannot use development fallback in production mode.');
    }
  }

  return Object.freeze(parsed.data);
}

export const config: EnvConfig = parseEnv();
export default config;
