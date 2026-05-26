import type { UserProfile, Exercise, EquipmentAvailability, Injury, StrengthBenchmark } from '@prisma/client';

const SYSTEM_PROMPT = `You are an expert fitness coach and periodization specialist. Your task is to generate a personalized mesocycle workout plan based on the user's profile, available equipment, injuries, and strength benchmarks.

Generate a structured workout plan as a JSON object following this exact schema:
{
  "mesocycle": {
    "weeks": <number between 3-6>,
    "deloadWeekIndex": <optional number>,
    "schedule": [
      {
        "weekIndex": <number starting at 1>,
        "days": [
          {
            "dayIndex": <number starting at 1>,
            "focus": "<training focus e.g. Upper Push, Lower, Full Body>",
            "exercises": [
              {
                "exerciseSlug": "<exercise slug from catalog>",
                "sets": <number 1-10>,
                "repsTarget": "<e.g. 8-10 or 8 or AMRAP>",
                "rpeTarget": <number 5-10>,
                "restSeconds": <number 30-600>,
                "progression": "<optional progression scheme>",
                "notes": "<optional exercise notes>"
              }
            ]
          }
        ]
      }
    ]
  },
  "generalNotes": "<optional general program notes>"
}

Rules:
1. Only use exercise slugs from the provided exercise catalog
2. Match exercises to available equipment
3. Avoid exercises that aggravate injuries
4. Progress difficulty week over week (linear or wave loading)
5. Include a deload week if mesocycle is 4+ weeks
6. Match session count to daysPerWeek preference
7. Match session volume to sessionMinutes preference
8. Scale intensity to fitness level
9. Return ONLY valid JSON, no markdown, no explanations`;

interface BuildPromptParams {
  profile: UserProfile;
  equipment: EquipmentAvailability[];
  injuries: Injury[];
  benchmarks: (StrengthBenchmark & { exercise: { slug: string; name: string } })[];
  exercises: Exercise[];
  reason?: string | null;
}

export function buildPlanPrompt(params: BuildPromptParams) {
  const { profile, equipment, injuries, benchmarks, exercises, reason } = params;

  const exerciseCatalog = exercises.map(e => ({
    slug: e.slug,
    name: e.name,
    muscleGroup: e.muscleGroup,
    equipmentType: e.equipmentType,
    movementPattern: e.movementPattern,
    isCompound: e.isCompound,
    difficulty: e.difficulty,
    isCardio: e.isCardio,
  }));

  const userContext = {
    profile: {
      goal: profile.goal,
      sex: profile.sex,
      weightKg: profile.weightKg,
      heightCm: profile.heightCm,
      age: profile.age,
      unitPreference: profile.unitPreference,
      daysPerWeek: profile.daysPerWeek,
      sessionMinutes: profile.sessionMinutes,
      trainingYears: profile.trainingYears,
      fitnessSelfRating: profile.fitnessSelfRating,
      notes: profile.notes,
    },
    equipment: equipment.map(e => ({ type: e.type, maxWeightKg: e.maxWeightKg })),
    injuries: injuries.map(i => ({
      bodyArea: i.bodyArea,
      side: i.side,
      status: i.status,
      restriction: i.restriction,
    })),
    benchmarks: benchmarks.map(b => ({
      exerciseSlug: b.exercise.slug,
      exerciseName: b.exercise.name,
      estimated1RM: b.estimated1RM,
    })),
    reason: reason ?? undefined,
  };

  return {
    systemPrompt: SYSTEM_PROMPT,
    exerciseCatalog,
    userContext,
  };
}

export function buildAnthropicMessages(params: BuildPromptParams) {
  const { systemPrompt, exerciseCatalog, userContext } = buildPlanPrompt(params);

  return {
    system: [
      {
        type: 'text' as const,
        text: systemPrompt,
        cache_control: { type: 'ephemeral' as const },
      },
      {
        type: 'text' as const,
        text: JSON.stringify(exerciseCatalog),
        cache_control: { type: 'ephemeral' as const },
      },
    ],
    messages: [
      {
        role: 'user' as const,
        content: `Generate a personalized workout plan for the following user profile:\n\n${JSON.stringify(userContext, null, 2)}`,
      },
    ],
  };
}
