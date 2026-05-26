import { prisma } from '../db.js';

interface ResolveParams {
  email: string;
  fingerprintToken: string;
  ipAddress: string;
  userAgent: string;
  extraMeta?: Record<string, unknown>;
}

export async function resolveOrCreateUser(params: ResolveParams) {
  const { email, fingerprintToken, ipAddress, userAgent, extraMeta } = params;

  // 1. Lookup by fingerprint
  const existingFp = await prisma.deviceFingerprint.findUnique({
    where: { token: fingerprintToken },
    include: { user: true },
  });
  if (existingFp) {
    await prisma.deviceFingerprint.update({
      where: { id: existingFp.id },
      data: { lastSeenAt: new Date(), ipAddress, userAgent },
    });
    return existingFp.user;
  }

  // 2. Lookup by email
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    await prisma.deviceFingerprint.create({
      data: { userId: existingUser.id, token: fingerprintToken, ipAddress, userAgent, extraMeta: extraMeta as any },
    });
    return existingUser;
  }

  // 3. Create new user + fingerprint
  return prisma.$transaction(async (tx: any) => {
    const user = await tx.user.create({ data: { email } });
    await tx.deviceFingerprint.create({
      data: { userId: user.id, token: fingerprintToken, ipAddress, userAgent, extraMeta },
    });
    return user;
  });
}
