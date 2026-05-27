export type Goal = 'LOSE_WEIGHT' | 'BUILD_MUSCLE' | 'IMPROVE_ENDURANCE' | 'STAY_FIT';
export type Sex = 'MALE' | 'FEMALE' | 'OTHER';
export type FitnessLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
export type UnitPreference = 'METRIC' | 'IMPERIAL';
export type EquipmentType = 'BARBELL' | 'DUMBBELL_PAIR' | 'DUMBBELL_ADJUSTABLE' | 'KETTLEBELL' | 'RACK' | 'BENCH_FLAT' | 'BENCH_ADJUSTABLE' | 'PULL_UP_BAR' | 'CABLE_MACHINE' | 'LEG_PRESS' | 'SMITH_MACHINE' | 'HACK_SQUAT' | 'TREADMILL' | 'BIKE' | 'ROWER' | 'RESISTANCE_BAND' | 'BODYWEIGHT_ONLY';
export type BodyArea = 'SHOULDER' | 'ELBOW' | 'WRIST' | 'LOWER_BACK' | 'UPPER_BACK' | 'HIP' | 'KNEE' | 'ANKLE' | 'NECK' | 'OTHER';
export type InjuryStatus = 'ACUTE' | 'RECOVERING' | 'CHRONIC' | 'RESOLVED';
export type JobStatus = 'QUEUED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED';
export type JobPhase = 'ANALYZING_PROFILE' | 'DESIGNING_SCHEDULE' | 'SELECTING_EXERCISES' | 'VALIDATING' | 'DONE';
export type SessionStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED' | 'CANCELLED';
export type SetType = 'WARMUP' | 'WORKING' | 'DROP' | 'AMRAP' | 'BACKOFF';
export type MuscleGroup = 'CHEST' | 'BACK' | 'LEGS' | 'SHOULDERS' | 'ARMS' | 'CORE' | 'GLUTES' | 'CALVES' | 'FULL_BODY' | 'CARDIO';
export interface User {
    id: string;
    email: string;
    isPremium: boolean;
    plansGenerated: number;
    createdAt: Date;
}
export interface JwtPayload {
    userId: string;
    isPremium: boolean;
    plansGenerated: number;
}
export interface ApiError {
    error: {
        code: string;
        message: string;
        details?: unknown;
    };
}
