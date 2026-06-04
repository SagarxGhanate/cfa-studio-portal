import { useMemo } from 'react';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const CHART_TITLES = {
  weekly: 'New Joins — This Week',
  monthly: 'New Joins — This Month',
  quarterly: 'New Joins — Quarter',
  '6m': 'New Joins — 6 Months',
  '1y': 'New Joins — 1 Year',
  all: 'New Joins — All Time',
};

const getWeekLabel = (date) => {
  return `${date.getDate()} ${MONTH_NAMES[date.getMonth()]}`;
};

const useChartData = (members, chartPeriod) => {
  const chartData = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const result = [];

    if (chartPeriod === 'weekly') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
        const count = members.filter(m => new Date(m.joiningDate).toDateString() === d.toDateString()).length;
        result.push({ name: d.toDateString() === today.toDateString() ? 'Today' : DAY_NAMES[d.getDay()], count });
      }
    } else if (chartPeriod === 'monthly') {
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const d = new Date(now.getFullYear(), now.getMonth(), day);
        const count = members.filter(m => new Date(m.joiningDate).toDateString() === d.toDateString()).length;
        result.push({ name: String(day), count });
      }
    } else if (chartPeriod === 'quarterly') {
      const start = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate());
      const current = new Date(start);
      current.setDate(current.getDate() - ((current.getDay() + 6) % 7));
      while (current <= today) {
        const weekEnd = new Date(current.getFullYear(), current.getMonth(), current.getDate() + 6);
        const count = members.filter(m => {
          const jd = new Date(m.joiningDate);
          return jd >= current && jd <= new Date(weekEnd.getFullYear(), weekEnd.getMonth(), weekEnd.getDate(), 23, 59, 59);
        }).length;
        result.push({ name: getWeekLabel(current), count });
        current.setDate(current.getDate() + 7);
      }
    } else if (chartPeriod === '6m') {
      const start = new Date(today.getFullYear(), today.getMonth() - 6, today.getDate());
      const current = new Date(start);
      current.setDate(current.getDate() - ((current.getDay() + 6) % 7));
      while (current <= today) {
        const weekEnd = new Date(current.getFullYear(), current.getMonth(), current.getDate() + 6);
        const count = members.filter(m => {
          const jd = new Date(m.joiningDate);
          return jd >= current && jd <= new Date(weekEnd.getFullYear(), weekEnd.getMonth(), weekEnd.getDate(), 23, 59, 59);
        }).length;
        result.push({ name: getWeekLabel(current), count });
        current.setDate(current.getDate() + 7);
      }
    } else if (chartPeriod === '1y') {
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const count = members.filter(m => {
          const jd = new Date(m.joiningDate);
          return jd.getMonth() === d.getMonth() && jd.getFullYear() === d.getFullYear();
        }).length;
        result.push({ name: `${MONTH_NAMES[d.getMonth()]} '${String(d.getFullYear()).slice(-2)}`, count });
      }
    } else {
      // All time
      if (members.length > 0) {
        const dates = members.map(m => new Date(m.joiningDate));
        const earliest = new Date(Math.min(...dates));
        const start = new Date(earliest.getFullYear(), earliest.getMonth(), 1);
        const current = new Date(start);
        while (current <= now) {
          const count = members.filter(m => {
            const jd = new Date(m.joiningDate);
            return jd.getMonth() === current.getMonth() && jd.getFullYear() === current.getFullYear();
          }).length;
          result.push({ name: `${MONTH_NAMES[current.getMonth()]} '${String(current.getFullYear()).slice(-2)}`, count });
          current.setMonth(current.getMonth() + 1);
        }
      }
    }

    return result;
  }, [members, chartPeriod]);

  return { chartData, chartTitles: CHART_TITLES };
};

export default useChartData;
