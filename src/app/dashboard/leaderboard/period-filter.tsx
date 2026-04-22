'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar } from 'lucide-react';

const MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

interface PeriodFilterProps {
  initialView: 'monthly' | 'yearly';
  initialMonth: number;
  initialYear: number;
  availableYears: number[];
  staffId?: string | null;
}

export default function PeriodFilter({
  initialView,
  initialMonth,
  initialYear,
  availableYears,
  staffId,
}: PeriodFilterProps) {
  const router = useRouter();
  const [view, setView] = useState(initialView);
  const [month, setMonth] = useState(initialMonth);
  const [year, setYear] = useState(initialYear);

  const navigate = useCallback(
    (v: 'monthly' | 'yearly', m: number, y: number) => {
      const qp = new URLSearchParams();
      qp.set('view', v);
      if (v === 'monthly') qp.set('month', String(m));
      qp.set('year', String(y));
      if (staffId) qp.set('staff', staffId);
      router.push(`/dashboard/leaderboard?${qp.toString()}`);
    },
    [router, staffId]
  );

  function handleViewChange(newView: 'monthly' | 'yearly') {
    setView(newView);
    navigate(newView, month, year);
  }

  function handleMonthChange(newMonth: number) {
    setMonth(newMonth);
    navigate(view, newMonth, year);
  }

  function handleYearChange(newYear: number) {
    setYear(newYear);
    navigate(view, month, newYear);
  }

  return (
    <div className="rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 theme-card">
      <div className="space-y-3 sm:space-y-0 sm:flex sm:flex-row sm:gap-3 sm:items-end">
        {/* View Toggle */}
        <div className="sm:flex-1 sm:min-w-0">
          <label className="block text-xs font-semibold text-theme-text-muted uppercase tracking-wider mb-1.5">
            Tampilan
          </label>
          <div className="flex rounded-xl overflow-hidden border border-theme-text-muted/20">
            <button
              type="button"
              onClick={() => handleViewChange('monthly')}
              className={`flex-1 text-center px-3 py-2 sm:px-4 sm:py-2.5 text-sm font-semibold cursor-pointer transition-all duration-200 ${
                view === 'monthly'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                  : 'bg-theme-option-bg text-theme-text-secondary hover:text-theme-text-primary'
              }`}
            >
              Bulanan
            </button>
            <button
              type="button"
              onClick={() => handleViewChange('yearly')}
              className={`flex-1 text-center px-3 py-2 sm:px-4 sm:py-2.5 text-sm font-semibold cursor-pointer transition-all duration-200 ${
                view === 'yearly'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                  : 'bg-theme-option-bg text-theme-text-secondary hover:text-theme-text-primary'
              }`}
            >
              Tahunan
            </button>
          </div>
        </div>

        {/* Month & Year row on mobile */}
        <div className="flex gap-3 sm:contents">
          {/* Month Selector - only for monthly view */}
          {view === 'monthly' && (
            <div className="flex-1 min-w-0 sm:flex-1">
              <label
                htmlFor="filter-month"
                className="block text-xs font-semibold text-theme-text-muted uppercase tracking-wider mb-1.5"
              >
                Bulan
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-text-icon pointer-events-none" />
                <select
                  id="filter-month"
                  value={month}
                  onChange={(e) => handleMonthChange(Number(e.target.value))}
                  className="w-full pl-10 pr-4 py-2 sm:py-2.5 rounded-xl text-sm appearance-none cursor-pointer theme-input"
                >
                  {MONTH_NAMES.map((name, idx) => (
                    <option
                      key={idx}
                      value={idx + 1}
                      className="bg-theme-option-bg text-theme-text-primary"
                    >
                      {name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Year Selector */}
          <div className="flex-1 min-w-0 sm:flex-1">
            <label
              htmlFor="filter-year"
              className="block text-xs font-semibold text-theme-text-muted uppercase tracking-wider mb-1.5"
            >
              Tahun
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-text-icon pointer-events-none" />
              <select
                id="filter-year"
                value={year}
                onChange={(e) => handleYearChange(Number(e.target.value))}
                className="w-full pl-10 pr-4 py-2 sm:py-2.5 rounded-xl text-sm appearance-none cursor-pointer theme-input"
              >
                {availableYears.map((y) => (
                  <option
                    key={y}
                    value={y}
                    className="bg-theme-option-bg text-theme-text-primary"
                  >
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
