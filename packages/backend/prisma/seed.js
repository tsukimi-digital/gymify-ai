"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const exercises = [
    { slug: 'barbell-back-squat', name: 'Barbell Back Squat', muscleGroup: 'LEGS', equipmentType: 'BARBELL', movementPattern: 'SQUAT', isCompound: true, difficulty: 'INTERMEDIATE', instructions: 'Stand with feet shoulder-width. Bar on traps. Squat until thighs parallel. Drive through heels to stand.' },
    { slug: 'barbell-bench-press', name: 'Barbell Bench Press', muscleGroup: 'CHEST', equipmentType: 'BARBELL', movementPattern: 'PUSH_H', isCompound: true, difficulty: 'BEGINNER', instructions: 'Lie on bench. Grip bar slightly wider than shoulders. Lower to chest, press to lockout.' },
    { slug: 'barbell-deadlift', name: 'Barbell Deadlift', muscleGroup: 'BACK', equipmentType: 'BARBELL', movementPattern: 'HINGE', isCompound: true, difficulty: 'INTERMEDIATE', instructions: 'Bar over mid-foot. Hip-hinge, grip bar. Drive floor away, keep bar close. Lock hips at top.' },
    { slug: 'barbell-overhead-press', name: 'Barbell Overhead Press', muscleGroup: 'SHOULDERS', equipmentType: 'BARBELL', movementPattern: 'PUSH_V', isCompound: true, difficulty: 'INTERMEDIATE', instructions: 'Bar at collarbone. Press overhead, lock out arms. Lower with control.' },
    { slug: 'barbell-row', name: 'Barbell Row', muscleGroup: 'BACK', equipmentType: 'BARBELL', movementPattern: 'PULL_H', isCompound: true, difficulty: 'INTERMEDIATE', instructions: 'Hinge to ~45°. Pull bar to lower chest. Squeeze shoulder blades. Lower with control.' },
    { slug: 'pull-up', name: 'Pull-Up', muscleGroup: 'BACK', equipmentType: 'PULL_UP_BAR', movementPattern: 'PULL_V', isCompound: true, difficulty: 'INTERMEDIATE', instructions: 'Hang from bar, overhand grip. Pull chin above bar. Lower with control.' },
    { slug: 'dumbbell-curl', name: 'Dumbbell Bicep Curl', muscleGroup: 'ARMS', equipmentType: 'DUMBBELL_PAIR', movementPattern: 'PULL_H', isCompound: false, difficulty: 'BEGINNER', instructions: 'Stand, arms at sides. Curl both dumbbells to shoulders. Lower with control.' },
    { slug: 'tricep-pushdown', name: 'Cable Tricep Pushdown', muscleGroup: 'ARMS', equipmentType: 'CABLE_MACHINE', movementPattern: 'PUSH_V', isCompound: false, difficulty: 'BEGINNER', instructions: 'Stand at cable, overhand grip. Extend arms down. Squeeze triceps. Return slowly.' },
    { slug: 'dumbbell-lateral-raise', name: 'Dumbbell Lateral Raise', muscleGroup: 'SHOULDERS', equipmentType: 'DUMBBELL_PAIR', movementPattern: 'PUSH_V', isCompound: false, difficulty: 'BEGINNER', instructions: 'Stand with dumbbells at sides. Raise arms to shoulder height. Lower with control.' },
    { slug: 'leg-press', name: 'Leg Press', muscleGroup: 'LEGS', equipmentType: 'LEG_PRESS', movementPattern: 'SQUAT', isCompound: true, difficulty: 'BEGINNER', instructions: 'Sit in machine. Feet shoulder-width on platform. Push platform away. Do not lock knees.' },
    { slug: 'romanian-deadlift', name: 'Romanian Deadlift', muscleGroup: 'LEGS', equipmentType: 'BARBELL', movementPattern: 'HINGE', isCompound: true, difficulty: 'INTERMEDIATE', instructions: 'Stand with bar. Push hips back, lower bar to shins. Feel hamstring stretch. Drive hips forward.' },
    { slug: 'dumbbell-row', name: 'Dumbbell Row', muscleGroup: 'BACK', equipmentType: 'DUMBBELL_PAIR', movementPattern: 'PULL_H', isCompound: false, difficulty: 'BEGINNER', instructions: 'One hand on bench. Pull dumbbell to hip. Squeeze back. Lower with control.' },
    { slug: 'incline-dumbbell-press', name: 'Incline Dumbbell Press', muscleGroup: 'CHEST', equipmentType: 'DUMBBELL_PAIR', movementPattern: 'PUSH_H', isCompound: true, difficulty: 'BEGINNER', instructions: 'Set bench to 30-45°. Press dumbbells up. Lower to chest level.' },
    { slug: 'cable-fly', name: 'Cable Chest Fly', muscleGroup: 'CHEST', equipmentType: 'CABLE_MACHINE', movementPattern: 'PUSH_H', isCompound: false, difficulty: 'BEGINNER', instructions: 'Stand between cables. Arms wide. Bring hands together in front of chest. Return slowly.' },
    { slug: 'plank', name: 'Plank', muscleGroup: 'CORE', equipmentType: 'BODYWEIGHT_ONLY', movementPattern: 'CORE', isCompound: false, difficulty: 'BEGINNER', instructions: 'Forearms and toes. Straight body. Hold without sagging hips.' },
    { slug: 'hip-thrust', name: 'Barbell Hip Thrust', muscleGroup: 'GLUTES', equipmentType: 'BARBELL', movementPattern: 'HINGE', isCompound: true, difficulty: 'BEGINNER', instructions: 'Shoulder-blades on bench. Bar over hips. Drive hips up. Squeeze glutes at top.' },
    { slug: 'lunges', name: 'Barbell Lunges', muscleGroup: 'LEGS', equipmentType: 'BARBELL', movementPattern: 'LUNGE', isCompound: true, difficulty: 'BEGINNER', instructions: 'Bar on traps. Step forward. Lower back knee to ground. Push off to stand. Alternate legs.' },
    { slug: 'treadmill-run', name: 'Treadmill Run', muscleGroup: 'CARDIO', equipmentType: 'TREADMILL', movementPattern: 'CARDIO_STEADY', isCompound: false, difficulty: 'BEGINNER', instructions: 'Set pace. Maintain steady effort. Land mid-foot.', isCardio: true },
    { slug: 'kettlebell-swing', name: 'Kettlebell Swing', muscleGroup: 'FULL_BODY', equipmentType: 'KETTLEBELL', movementPattern: 'HINGE', isCompound: true, difficulty: 'BEGINNER', instructions: 'Hip hinge to swing KB back, drive hips forward to swing to chest height.' },
    { slug: 'push-up', name: 'Push-Up', muscleGroup: 'CHEST', equipmentType: 'BODYWEIGHT_ONLY', movementPattern: 'PUSH_H', isCompound: true, difficulty: 'BEGINNER', instructions: 'Plank position, hands under shoulders. Lower chest to floor. Push up.' },
];
async function main() {
    for (const ex of exercises) {
        await prisma.exercise.upsert({
            where: { slug: ex.slug },
            update: ex,
            create: { ...ex, isCardio: ex.isCardio ?? false, movementPattern: ex.movementPattern },
        });
    }
    console.log('Seeded exercises');
}
main().finally(() => prisma.$disconnect());
