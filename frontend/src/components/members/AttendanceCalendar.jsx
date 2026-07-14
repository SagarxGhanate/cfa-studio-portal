import { useState, useMemo } from 'react';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * AttendanceCalendar — Reusable calendar component for attendance visualization.
 * 
 * Props:
 *  - records: Array of { date: string, present: boolean }
 *  - onToggleDate?: (date: string) => void — callback when a day is clicked (for marking)
 *  - readOnly?: boolean — if true, no click interaction
 *  - showFullYear?: boolean — if true, shows all 12 months as mini calendars
 *  - accentColor?: string — primary accent (defaults to #f97316 for CFA)
 */
const AttendanceCalendar = ({ records = [], onToggleDate, readOnly = false, showFullYear = false, accentColor = '#f97316' }) => {
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());

  // Build lookup map: "YYYY-MM-DD" -> present boolean
  const recordMap = useMemo(() => {
    const map = {};
    records.forEach(r => {
      const d = new Date(r.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      map[key] = r.present;
    });
    return map;
  }, [records]);

  const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (month, year) => new Date(year, month, 1).getDay();

  const isToday = (day, month, year) => {
    return day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  };

  const isFutureDate = (day, month, year) => {
    const d = new Date(year, month, day);
    const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return d > t;
  };

  const getDateKey = (day, month, year) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const handlePrev = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNext = () => {
    // Don't go past current month
    if (viewYear === today.getFullYear() && viewMonth === today.getMonth()) return;
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const canGoNext = !(viewYear === today.getFullYear() && viewMonth === today.getMonth());

  // Render a single month grid
  const renderMonth = (month, year, compact = false) => {
    const daysInMonth = getDaysInMonth(month, year);
    const firstDay = getFirstDayOfMonth(month, year);
    const cells = [];

    // Empty cells for days before the 1st
    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`empty-${i}`} className="aspect-square" />);
    }

    // Day cells
    for (let day = 1; day <= daysInMonth; day++) {
      const key = getDateKey(day, month, year);
      const isPresent = recordMap[key] === true;
      const isTodayCell = isToday(day, month, year);
      const isFuture = isFutureDate(day, month, year);

      const handleClick = () => {
        if (readOnly || isFuture || !onToggleDate) return;
        onToggleDate(key);
      };

      cells.push(
        <button
          key={day}
          onClick={handleClick}
          disabled={isFuture || readOnly}
          className={`
            aspect-square rounded-lg flex items-center justify-center relative transition-all duration-200
            ${compact ? 'text-[10px]' : 'text-[13px]'} font-medium
            ${isFuture
              ? 'text-[#3A3A4A] cursor-default'
              : isPresent
                ? 'text-white font-bold'
                : 'text-[#9ca3af] hover:bg-white/[0.04]'
            }
            ${!readOnly && !isFuture ? 'cursor-pointer active:scale-90' : ''}
            ${isTodayCell ? 'ring-2 ring-offset-1 ring-offset-[#1a1a1a]' : ''}
          `}
          style={{
            backgroundColor: isPresent ? `${accentColor}30` : undefined,
            ...(isTodayCell ? { ringColor: accentColor } : {}),
          }}
          title={`${MONTH_NAMES[month]} ${day}, ${year}${isPresent ? ' — Present' : ''}`}
        >
          {isPresent && (
            <div
              className="absolute inset-[3px] rounded-md opacity-20"
              style={{ backgroundColor: accentColor }}
            />
          )}
          <span className="relative z-10">{day}</span>
          {isPresent && (
            <div
              className="absolute bottom-[3px] w-1 h-1 rounded-full"
              style={{ backgroundColor: accentColor }}
            />
          )}
        </button>
      );
    }

    return cells;
  };

  // Full year view — 12 mini calendars
  if (showFullYear) {
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    // Determine which months to show based on year boundary logic
    let monthsToShow = [];

    // If we're in Jan-Mar, also show Oct-Dec of previous year
    if (currentMonth <= 2) {
      for (let m = 9; m <= 11; m++) {
        monthsToShow.push({ month: m, year: currentYear - 1 });
      }
    }
    // Show all months of current year up to current month
    for (let m = 0; m <= currentMonth; m++) {
      monthsToShow.push({ month: m, year: currentYear });
    }

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {monthsToShow.map(({ month, year }) => (
            <div key={`${year}-${month}`} className="bg-[#141414] border border-white/[0.04] rounded-xl p-3">
              <h4 className="text-[12px] font-bold text-[#9ca3af] mb-2 text-center tracking-wider uppercase">
                {MONTH_NAMES[month]} {year !== currentYear ? year : ''}
              </h4>
              <div className="grid grid-cols-7 gap-0.5 mb-1">
                {DAY_LABELS.map(d => (
                  <div key={d} className="text-[8px] text-[#6B6B80] text-center font-bold">{d.charAt(0)}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-0.5">
                {renderMonth(month, year, true)}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 pt-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: `${accentColor}30` }} />
            <span className="text-[11px] text-[#9ca3af]">Present</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-[#141414] border border-white/[0.1]" />
            <span className="text-[11px] text-[#9ca3af]">Absent / Unmarked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded border-2" style={{ borderColor: accentColor }} />
            <span className="text-[11px] text-[#9ca3af]">Today</span>
          </div>
        </div>
      </div>
    );
  }

  // Single month interactive view
  return (
    <div className="w-full">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrev}
          className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center transition-colors"
        >
          <span className="material-symbols-outlined text-[18px] text-[#9ca3af]">chevron_left</span>
        </button>
        <h3 className="text-[15px] font-bold text-[#e5e2e1] tracking-tight">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </h3>
        <button
          onClick={handleNext}
          disabled={!canGoNext}
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
            canGoNext ? 'bg-white/[0.04] hover:bg-white/[0.08]' : 'opacity-30 cursor-not-allowed'
          }`}
        >
          <span className="material-symbols-outlined text-[18px] text-[#9ca3af]">chevron_right</span>
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAY_LABELS.map(d => (
          <div key={d} className="text-[11px] text-[#6B6B80] text-center font-bold uppercase tracking-wider">{d}</div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1">
        {renderMonth(viewMonth, viewYear)}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 pt-3 border-t border-white/[0.04]">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: `${accentColor}30` }} />
          <span className="text-[11px] text-[#9ca3af]">Present</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-transparent border border-white/[0.1]" />
          <span className="text-[11px] text-[#9ca3af]">Absent</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded border-2" style={{ borderColor: accentColor }} />
          <span className="text-[11px] text-[#9ca3af]">Today</span>
        </div>
      </div>
    </div>
  );
};

export default AttendanceCalendar;
