import Anthropic from '@anthropic-ai/sdk';
import { env } from '../env.js';
import { logger } from '../logger.js';

const MOCK_PLAN = {
  mesocycle: {
    weeks: 4,
    deloadWeekIndex: 4,
    schedule: [
      {
        weekIndex: 1,
        days: [
          {
            dayIndex: 1,
            focus: 'Upper Push',
            exercises: [
              {
                exerciseSlug: 'barbell-bench-press',
                sets: 4,
                repsTarget: '6-8',
                rpeTarget: 8,
                restSeconds: 180,
                progression: '+2.5kg per week',
              },
              {
                exerciseSlug: 'barbell-overhead-press',
                sets: 3,
                repsTarget: '8-10',
                rpeTarget: 8,
                restSeconds: 120,
              },
              {
                exerciseSlug: 'dumbbell-lateral-raise',
                sets: 3,
                repsTarget: '12-15',
                rpeTarget: 7,
                restSeconds: 60,
              },
            ],
          },
          {
            dayIndex: 2,
            focus: 'Lower',
            exercises: [
              {
                exerciseSlug: 'barbell-back-squat',
                sets: 4,
                repsTarget: '6-8',
                rpeTarget: 8,
                restSeconds: 240,
                progression: '+5kg per week',
              },
              {
                exerciseSlug: 'romanian-deadlift',
                sets: 3,
                repsTarget: '10-12',
                rpeTarget: 7,
                restSeconds: 120,
              },
            ],
          },
        ],
      },
    ],
  },
  generalNotes: 'Mock plan for testing. Focus on progressive overload each week.',
};

interface ClaudeCallParams {
  system: Array<{ type: 'text'; text: string; cache_control?: { type: 'ephemeral' } }>;
  messages: Array<{ role: 'user'; content: string }>;
  jobId: string;
}

const MAX_RETRIES = 3;
const INITIAL_DELAY_MS = 1000;

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function callClaude(params: ClaudeCallParams): Promise<{ content: string; inputTokens: number; outputTokens: number }> {
  if (env.MOCK_ANTHROPIC) {
    logger.info({ jobId: params.jobId }, 'Using mock Anthropic response');
    return {
      content: JSON.stringify(MOCK_PLAN),
      inputTokens: 0,
      outputTokens: 0,
    };
  }

  const client = new Anthropic({
    apiKey: env.ANTHROPIC_API_KEY,
  });

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await Promise.race([
        client.messages.create({
          model: 'claude-sonnet-4-5',
          max_tokens: 8192,
          system: params.system as any,
          messages: params.messages,
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Claude request timeout')), 90000)
        ),
      ]);

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      return {
        content: content.text,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      };
    } catch (err: unknown) {
      lastError = err as Error;
      const isRetryable =
        err instanceof Anthropic.RateLimitError ||
        err instanceof Anthropic.InternalServerError ||
        (err instanceof Error && err.message.includes('529'));

      if (isRetryable && attempt < MAX_RETRIES - 1) {
        const delay = INITIAL_DELAY_MS * Math.pow(2, attempt);
        logger.warn({ attempt, delay, jobId: params.jobId }, 'Claude error, retrying...');
        await sleep(delay);
        continue;
      }
      break;
    }
  }

  throw lastError ?? new Error('Claude call failed after retries');
}
