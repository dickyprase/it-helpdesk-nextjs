import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { prisma } from './db';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'STAFF' | 'MANAGER';
};

const SESSION_COOKIE = 'helpdesk_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function generateSessionId(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function createSession(userId: string): Promise<string> {
  const sessionId = generateSessionId();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000);

  await prisma.session.create({
    data: {
      id: sessionId,
      user_id: userId,
      expires_at: expiresAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });

  return sessionId;
}

/**
 * Get session from cookie (for server components and server actions).
 * Optimized: single DB query with JOIN instead of two sequential queries.
 */
export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

  if (!sessionId) return null;

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      user: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  });

  if (!session) {
    cookieStore.delete(SESSION_COOKIE);
    return null;
  }

  if (new Date() > session.expires_at) {
    await prisma.session.delete({ where: { id: sessionId } }).catch(() => {});
    cookieStore.delete(SESSION_COOKIE);
    return null;
  }

  if (!session.user) {
    await prisma.session.delete({ where: { id: sessionId } }).catch(() => {});
    cookieStore.delete(SESSION_COOKIE);
    return null;
  }

  return session.user;
}

/**
 * Get session from a NextRequest object (for API route handlers).
 * Does NOT modify cookies -- read-only validation.
 */
export async function getSessionFromRequest(request: NextRequest): Promise<SessionUser | null> {
  const sessionId = request.cookies.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      user: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  });

  if (!session || !session.user) return null;
  if (new Date() > session.expires_at) return null;

  return session.user;
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

  if (sessionId) {
    await prisma.session.delete({ where: { id: sessionId } }).catch(() => {});
    cookieStore.delete(SESSION_COOKIE);
  }
}

/**
 * Remove all expired sessions from the database.
 * Call periodically (e.g., on login or via a cron endpoint).
 */
export async function cleanupExpiredSessions(): Promise<number> {
  const result = await prisma.session.deleteMany({
    where: { expires_at: { lt: new Date() } },
  });
  return result.count;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
