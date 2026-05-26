import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().default('postgresql://localhost:5432/gymify_dev'),
  ANTHROPIC_API_KEY: z.string().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MOCK_ANTHROPIC: z.string().transform(v => v === 'true').default('false'),
});

export const env = envSchema.parse(process.env);
