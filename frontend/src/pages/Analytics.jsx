import { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Navbar from '../components/layout/Navbar';
import BottomNav from '../components/layout/BottomNav';
import api from '../services/api';
import useChartData from '../hooks/useChartData';

const CHART_COLORS = ['#f97316', '#4ae176', '#8dcdff', '#ffb596', '#ffb4ab', '#6bff8f', '#00a2eb', '#a98a7e'];

const Analytics = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartPeriod, setChartPeriod] = useState('weekly');

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const res = await api.get('/members?limit=9999');
        if (res.data.success) {
          setMembers(res.data.data.members);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // ============ COMPUTED ANALYTICS ============

  // Shared chart hook
  const { chartData, chartTitles } = useChartData(members, chartPeriod);

  // Class type distribution
  const classTypeData = useMemo(() => {
    const counts = {};
    members.forEach(m => {
      counts[m.classType] = (counts[m.classType] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [members]);

  // Most popular class type
  const popularClassType = useMemo(() => {
    if (classTypeData.length === 0) return '-';
    return classTypeData.reduce((a, b) => a.value > b.value ? a : b).name;
  }, [classTypeData]);

  // Location wise count
  const locationData = useMemo(() => {
    const counts = {};
    members.forEach(m => {
      counts[m.location] = (counts[m.location] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [members]);

  // Category distribution
  const categoryData = useMemo(() => {
    const counts = {};
    members.forEach(m => {
      counts[m.category] = (counts[m.category] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [members]);

  // New members this month
  const newMembersThisMonth = useMemo(() => {
    const now = new Date();
    return members.filter(m => {
      const jd = new Date(m.joiningDate);
      return jd.getMonth() === now.getMonth() && jd.getFullYear() === now.getFullYear();
    });
  }, [members]);

  const activeCount = members.filter(m => m.isActive).length;
  const inactiveCount = members.filter(m => !m.isActive).length;

  // ============ EXPORT FUNCTIONS ============

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const exportAllMembersExcel = () => {
    const data = members.map(m => ({
      'Name': m.name,
      'Phone': m.phone,
      'Age': m.age,
      'Location': m.location,
      'Society': m.society || '',
      'Joining Date': formatDate(m.joiningDate),
      'Class Type': m.classType,
      'Category': m.category,
      'Guardian Name': m.guardianName || '',
      'Guardian Phone': m.guardianPhone || '',
      'Status': m.isActive ? 'Active' : 'Inactive',
      'Avatar': m.avatar || '',
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 6 }, { wch: 18 }, { wch: 18 }, { wch: 14 }, { wch: 12 }, { wch: 10 }, { wch: 18 }, { wch: 15 }, { wch: 10 }, { wch: 15 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'All Members');
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([buf], { type: 'application/octet-stream' }), `CFA_All_Members_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const exportNewMembersExcel = () => {
    const now = new Date();
    const monthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const data = newMembersThisMonth.map(m => ({
      'Name': m.name,
      'Phone': m.phone,
      'Age': m.age,
      'Location': m.location,
      'Society': m.society || '',
      'Joining Date': formatDate(m.joiningDate),
      'Class Type': m.classType,
      'Category': m.category,
      'Guardian Name': m.guardianName || '',
      'Guardian Phone': m.guardianPhone || '',
      'Status': m.isActive ? 'Active' : 'Inactive',
      'Avatar': m.avatar || '',
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 6 }, { wch: 18 }, { wch: 18 }, { wch: 14 }, { wch: 12 }, { wch: 10 }, { wch: 18 }, { wch: 15 }, { wch: 10 }, { wch: 15 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `New Members - ${monthName}`);
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([buf], { type: 'application/octet-stream' }), `CFA_New_Members_${now.toISOString().slice(0,7)}.xlsx`);
  };

  const exportAnalyticsPDF = () => {
    const doc = new jsPDF();
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

    // Header
    doc.setFillColor(10, 10, 15);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(249, 115, 22);
    doc.setFontSize(22);
    doc.text('CFA Studio', 14, 18);
    doc.setTextColor(200, 200, 200);
    doc.setFontSize(10);
    doc.text('Analytics Report', 14, 26);
    doc.text(`Generated: ${dateStr}`, 14, 33);

    // Summary stats
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(14);
    doc.text('Summary', 14, 50);

    autoTable(doc, {
      startY: 55,
      head: [['Metric', 'Value']],
      body: [
        ['Total Members', String(members.length)],
        ['Active Members', String(activeCount)],
        ['Inactive Members', String(inactiveCount)],
        ['New This Month', String(newMembersThisMonth.length)],
        ['Most Popular Class', popularClassType],
      ],
      theme: 'striped',
      headStyles: { fillColor: [249, 115, 22] },
    });

    // Location breakdown
    doc.setFontSize(14);
    doc.text('Location Breakdown', 14, doc.lastAutoTable.finalY + 15);

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 20,
      head: [['Location', 'Members']],
      body: locationData.map(l => [l.name, String(l.count)]),
      theme: 'striped',
      headStyles: { fillColor: [249, 115, 22] },
    });

    // Class type breakdown
    doc.setFontSize(14);
    doc.text('Class Type Breakdown', 14, doc.lastAutoTable.finalY + 15);

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 20,
      head: [['Class Type', 'Members']],
      body: classTypeData.map(c => [c.name, String(c.value)]),
      theme: 'striped',
      headStyles: { fillColor: [249, 115, 22] },
    });

    doc.save(`CFA_Analytics_${now.toISOString().slice(0,10)}.pdf`);
  };

  // ============ CUSTOM TOOLTIP ============

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#262626] border border-[rgba(255,255,255,0.1)] rounded-lg px-3 py-2 shadow-xl">
          <p className="text-[12px] text-[#6B6B80]">{label}</p>
          <p className="text-[14px] font-bold text-[#EEEEF0]">{payload[0].value} members</p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0e0e0e]">
        <Navbar />
        <main className="flex items-center justify-center h-[60vh] text-on-surface-variant">Loading analytics...</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0e0e0e]">
      <Navbar />

      <main className="max-w-[1440px] mx-auto px-container-margin py-8 space-y-6 pb-24">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="font-display-lg text-display-lg text-on-surface">Analytics</h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">Studio performance insights and data exports.</p>
          </div>

          {/* Export Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={exportAnalyticsPDF}
              className="flex items-center gap-2 px-4 py-2 h-[36px] bg-[#1a1a1a] border border-outline-variant rounded-lg font-label-md text-label-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
              Export PDF
            </button>
            <button
              onClick={exportAllMembersExcel}
              className="flex items-center gap-2 px-4 py-2 h-[36px] bg-[#1a1a1a] border border-outline-variant rounded-lg font-label-md text-label-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[16px]">table_view</span>
              All Members
            </button>
            <button
              onClick={exportNewMembersExcel}
              className="flex items-center gap-2 px-4 py-2 h-[36px] bg-primary-container text-white rounded-lg font-label-md text-label-md font-bold hover:opacity-90 transition-all active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              New This Month ({newMembersThisMonth.length})
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter">
          <div className="card-surface rounded-xl p-card-padding-y px-card-padding-x">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-[18px]">group</span>
              </div>
            </div>
            <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Total</p>
            <p className="font-stat-lg text-stat-lg text-on-surface mt-1">{members.length}</p>
          </div>

          <div className="card-surface rounded-xl p-card-padding-y px-card-padding-x">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-secondary text-[18px]">check_circle</span>
              </div>
            </div>
            <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Active</p>
            <p className="font-stat-lg text-stat-lg text-on-surface mt-1">{activeCount}</p>
          </div>

          <div className="card-surface rounded-xl p-card-padding-y px-card-padding-x">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary-container/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary-container text-[18px]">person_add</span>
              </div>
            </div>
            <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">New This Month</p>
            <p className="font-stat-lg text-stat-lg text-on-surface mt-1">{newMembersThisMonth.length}</p>
          </div>

          <div className="card-surface rounded-xl p-card-padding-y px-card-padding-x">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-tertiary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-tertiary text-[18px]">star</span>
              </div>
            </div>
            <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Top Class</p>
            <p className="font-stat-lg text-stat-lg text-on-surface mt-1 capitalize">{popularClassType.toLowerCase()}</p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">

          {/* New Members Bar Chart */}
          <div className="card-surface rounded-xl p-card-padding-y px-card-padding-x">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <h3 className="font-headline-sm text-headline-sm">{chartTitles[chartPeriod]}</h3>
              <div className="flex bg-[#262626] border border-[rgba(255,255,255,0.08)] rounded-lg p-0.5 flex-wrap">
                {[{key: 'weekly', label: 'W'}, {key: 'monthly', label: 'M'}, {key: 'quarterly', label: 'Q'}, {key: '6m', label: '6M'}, {key: '1y', label: '1Y'}, {key: 'all', label: 'All'}].map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => setChartPeriod(opt.key)}
                    className={`px-2.5 py-1.5 rounded-md text-[11px] font-bold transition-all ${chartPeriod === opt.key ? 'bg-primary-container text-white' : 'text-[#6B6B80] hover:text-[#EEEEF0]'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barSize={chartData.length > 20 ? undefined : 24}>
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#6B6B80', fontSize: chartData.length > 15 ? 9 : 11 }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.05)' }}
                    tickLine={false}
                    interval={chartData.length > 20 ? Math.floor(chartData.length / 10) : 0}
                  />
                  <YAxis
                    tick={{ fill: '#6B6B80', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Bar dataKey="count" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Class Type Pie Chart */}
          <div className="card-surface rounded-xl p-card-padding-y px-card-padding-x">
            <h3 className="font-headline-sm text-headline-sm mb-6">Class Type Distribution</h3>
            <div className="h-[280px] flex items-center">
              <div className="w-1/2 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={classTypeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                    >
                      {classTypeData.map((_, i) => (
                        <Cell key={`cell-${i}`} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-1/2 flex flex-col gap-3">
                {classTypeData.map((item, i) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}></div>
                      <span className="text-[13px] text-[#EEEEF0] capitalize">{item.name.toLowerCase()}</span>
                    </div>
                    <span className="text-[13px] font-bold text-[#EEEEF0]">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Location & Category Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">

          {/* Location Wise Members */}
          <div className="lg:col-span-2 card-surface rounded-xl p-card-padding-y px-card-padding-x">
            <h3 className="font-headline-sm text-headline-sm mb-6">Location Wise Members</h3>
            <div className="space-y-3">
              {locationData.map((loc, i) => {
                const pct = members.length > 0 ? (loc.count / members.length) * 100 : 0;
                return (
                  <div key={loc.name} className="flex items-center gap-4">
                    <div className="w-[140px] md:w-[180px] shrink-0">
                      <span className="text-[13px] text-[#EEEEF0] truncate block">{loc.name}</span>
                    </div>
                    <div className="flex-1 h-[28px] bg-[#262626] rounded-lg overflow-hidden relative">
                      <div
                        className="h-full rounded-lg transition-all duration-500"
                        style={{
                          width: `${Math.max(pct, 4)}%`,
                          backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                          opacity: 0.7,
                        }}
                      ></div>
                    </div>
                    <div className="w-[50px] text-right shrink-0">
                      <span className="text-[14px] font-bold text-[#EEEEF0]">{loc.count}</span>
                    </div>
                  </div>
                );
              })}
              {locationData.length === 0 && (
                <p className="text-[#6B6B80] text-[13px] text-center py-6">No location data available.</p>
              )}
            </div>
          </div>

          {/* Category Distribution */}
          <div className="card-surface rounded-xl p-card-padding-y px-card-padding-x">
            <h3 className="font-headline-sm text-headline-sm mb-6">Category Split</h3>
            <div className="space-y-4">
              {categoryData.map((cat, i) => {
                const pct = members.length > 0 ? Math.round((cat.value / members.length) * 100) : 0;
                return (
                  <div key={cat.name} className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] text-[#EEEEF0] capitalize">{cat.name.toLowerCase()}</span>
                      <span className="text-[13px] font-bold text-[#EEEEF0]">{cat.value} <span className="text-[#6B6B80] font-normal">({pct}%)</span></span>
                    </div>
                    <div className="h-2 bg-[#262626] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: CHART_COLORS[(i + 3) % CHART_COLORS.length],
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Active vs Inactive */}
            <div className="mt-8 pt-6 border-t border-[rgba(255,255,255,0.05)]">
              <h4 className="text-[11px] uppercase tracking-wider text-[#6B6B80] font-bold mb-4">Status Overview</h4>
              <div className="flex gap-4">
                <div className="flex-1 text-center p-3 rounded-lg bg-secondary/5 border border-secondary/15">
                  <p className="text-[20px] font-bold text-secondary">{activeCount}</p>
                  <p className="text-[11px] text-[#6B6B80] mt-1">Active</p>
                </div>
                <div className="flex-1 text-center p-3 rounded-lg bg-primary/5 border border-primary/15">
                  <p className="text-[20px] font-bold text-primary">{inactiveCount}</p>
                  <p className="text-[11px] text-[#6B6B80] mt-1">Inactive</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* New Members This Month Table */}
        <div className="card-surface rounded-xl overflow-hidden">
          <div className="px-card-padding-x py-4 flex items-center justify-between border-b border-outline-variant/30">
            <div className="flex items-center gap-3">
              <h3 className="font-headline-sm text-headline-sm">New Members This Month</h3>
              <span className="px-2 py-0.5 rounded-full bg-primary-container/15 text-primary-container text-[11px] font-bold">
                {newMembersThisMonth.length}
              </span>
            </div>
            <button
              onClick={exportNewMembersExcel}
              className="flex items-center gap-1.5 text-[12px] text-on-surface-variant hover:text-primary-container transition-colors font-medium"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              Export
            </button>
          </div>

          {newMembersThisMonth.length === 0 ? (
            <div className="px-card-padding-x py-10 text-center">
              <span className="material-symbols-outlined text-[40px] text-[#6B6B80]/30 mb-3 block">person_add</span>
              <p className="text-[14px] text-[#6B6B80]">No new members added this month yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="bg-surface-container-low/30">
                    <th className="px-card-padding-x py-3 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Name</th>
                    <th className="px-card-padding-x py-3 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Phone</th>
                    <th className="px-card-padding-x py-3 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Class</th>
                    <th className="px-card-padding-x py-3 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Category</th>
                    <th className="px-card-padding-x py-3 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/50">
                  {newMembersThisMonth.map(m => (
                    <tr key={m.id} className="hover:bg-surface-container-high/30 transition-colors">
                      <td className="px-card-padding-x py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-md bg-surface-container-highest flex items-center justify-center border border-outline-variant text-[11px] font-bold text-primary">
                            {m.name.substring(0, 2).toUpperCase()}
                          </div>
                          <span className="font-body-md text-body-md font-bold text-on-surface">{m.name}</span>
                        </div>
                      </td>
                      <td className="px-card-padding-x py-3 font-body-md text-body-md text-on-surface-variant">{m.phone}</td>
                      <td className="px-card-padding-x py-3">
                        <span className="px-2 py-0.5 rounded bg-primary-container/20 text-primary-container text-[11px] font-bold border border-primary-container/30 capitalize">
                          {m.classType.toLowerCase()}
                        </span>
                      </td>
                      <td className="px-card-padding-x py-3 font-body-md text-body-md text-on-surface capitalize">{m.category.toLowerCase()}</td>
                      <td className="px-card-padding-x py-3 font-body-md text-body-md text-on-surface-variant">{formatDate(m.joiningDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Analytics;
