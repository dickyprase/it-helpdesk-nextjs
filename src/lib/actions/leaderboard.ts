'use server';

import { prisma } from '@/lib/db';

export type LeaderboardEntry = {
  staff_id: string;
  staff_name: string;
  staff_email: string;
  total_points: number;
  tickets_closed: number;
};

export type StaffDetail = {
  id: string;
  name: string;
  email: string;
  total_points: number;
  tickets_closed: number;
  avg_difficulty: number;
  logs: {
    id: string;
    points: number;
    created_at: Date;
    ticket: { id: string; code: string; title: string; difficulty_level: number };
  }[];
};

// Get aggregated leaderboard for a period
export async function getLeaderboard(period: 'monthly' | 'yearly', month?: number, year?: number) {
  const now = new Date();
  const targetMonth = month ?? now.getMonth() + 1;
  const targetYear = year ?? now.getFullYear();

  const where: any = { period_year: targetYear };
  if (period === 'monthly') {
    where.period_month = targetMonth;
  }

  const logs = await prisma.leaderboardLog.findMany({
    where,
    include: {
      staff: { select: { id: true, name: true, email: true } },
    },
  });

  // Aggregate by staff
  const staffMap = new Map<string, LeaderboardEntry>();

  for (const log of logs) {
    const existing = staffMap.get(log.staff_id);
    if (existing) {
      existing.total_points += log.points;
      existing.tickets_closed += 1;
    } else {
      staffMap.set(log.staff_id, {
        staff_id: log.staff_id,
        staff_name: log.staff.name,
        staff_email: log.staff.email,
        total_points: log.points,
        tickets_closed: 1,
      });
    }
  }

  // Sort by total_points descending
  return Array.from(staffMap.values()).sort(
    (a, b) => b.total_points - a.total_points
  );
}

// Get detailed stats for a single staff member
export async function getStaffStats(
  staffId: string,
  period: 'monthly' | 'yearly',
  month?: number,
  year?: number
): Promise<StaffDetail | null> {
  const now = new Date();
  const targetMonth = month ?? now.getMonth() + 1;
  const targetYear = year ?? now.getFullYear();

  const staff = await prisma.user.findUnique({
    where: { id: staffId },
    select: { id: true, name: true, email: true },
  });

  if (!staff) return null;

  const where: any = { staff_id: staffId, period_year: targetYear };
  if (period === 'monthly') {
    where.period_month = targetMonth;
  }

  const logs = await prisma.leaderboardLog.findMany({
    where,
    include: {
      ticket: {
        select: { id: true, code: true, title: true, difficulty_level: true },
      },
    },
    orderBy: { created_at: 'desc' },
  });

  const totalPoints = logs.reduce((sum, l) => sum + l.points, 0);
  const avgDifficulty =
    logs.length > 0
      ? logs.reduce((sum, l) => sum + l.ticket.difficulty_level, 0) / logs.length
      : 0;

  return {
    id: staff.id,
    name: staff.name,
    email: staff.email,
    total_points: totalPoints,
    tickets_closed: logs.length,
    avg_difficulty: Math.round(avgDifficulty * 10) / 10,
    logs,
  };
}

// Get available periods (months/years that have data)
export async function getAvailablePeriods() {
  const logs = await prisma.leaderboardLog.findMany({
    select: { period_month: true, period_year: true },
    distinct: ['period_month', 'period_year'],
    orderBy: [{ period_year: 'desc' }, { period_month: 'desc' }],
  });

  return logs;
}
