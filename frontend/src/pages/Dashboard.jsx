import { useState, useEffect, useMemo, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import Navbar from '../components/layout/Navbar';
import BottomNav from '../components/layout/BottomNav';
import { Link } from 'react-router-dom';
import api from '../services/api';
import useChartData from '../hooks/useChartData';
import useAuthStore from '../store/authStore';

const SkeletonPulse = ({ className }) => (
  <div className={`animate-pulse bg-[#333333] rounded ${className}`}></div>
);

const Dashboard = () => {
  const user = useAuthStore((s) => s.user);
  const isViewer = user?.role === 'VIEWER';
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartPeriod, setChartPeriod] = useState('weekly');
  const [showAddMenu, setShowAddMenu] = useState(false);
  const addMenuRef = useRef(null);

  // If loginCount is 1, it's their very first login across any device
  const isFirstVisit = user?.loginCount === 1;

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await api.get('/members?limit=9999');
        if (res.data.success) {
          setMembers(res.data.data.members);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMembers();
  }, []);

  // Close add menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target)) setShowAddMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const totalMembers = members.length;
  const activeCount = members.filter(m => m.isActive).length;
  const personalCount = members.filter(m => m.classType === 'PERSONAL').length;
  const groupCount = members.filter(m => m.classType === 'GROUP').length;

  const newMembersThisMonth = useMemo(() => {
    const now = new Date();
    return members.filter(m => {
      const jd = new Date(m.joiningDate);
      return jd.getMonth() === now.getMonth() && jd.getFullYear() === now.getFullYear();
    });
  }, [members]);

  // Recent members (last 5 added)
  const recentMembers = useMemo(() => {
    return [...members]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);
  }, [members]);

  // Shared chart hook
  const { chartData, chartTitles } = useChartData(members, chartPeriod);

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

  return (
    <div className="min-h-screen bg-[#0e0e0e]">
      <Navbar />

      <main className="max-w-[1440px] mx-auto px-container-margin py-8 space-y-section-gap pb-24">
        {/* Hero Section */}
        <section className="relative w-full rounded-xl bg-[#1a1a1a] card-border p-8 md:p-12">
          <div className="relative z-10 max-w-2xl">
            <h1 className="font-display-lg text-display-lg text-on-surface mb-4">
              {isFirstVisit ? 'Welcome' : 'Welcome back'}{user?.role !== 'OWNER' ? `, ${user?.role ? user.role.charAt(0) + user.role.slice(1).toLowerCase() : ''}` : ','} {user?.name || ''}
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant mb-8 max-w-lg">
              Monitor your studio's performance, manage active member sessions, and scale your creative portfolio from a single command center.
            </p>
            {!isViewer && (
              <div className="relative inline-block" ref={addMenuRef}>
                <button
                  onClick={() => setShowAddMenu(prev => !prev)}
                  className="inline-flex bg-primary-container text-[#EEEEF0] px-6 py-2 h-[36px] rounded-lg font-label-md text-label-md hover:opacity-90 transition-all items-center gap-2 active:scale-95"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Add Member
                  <span className="material-symbols-outlined text-[16px]">expand_more</span>
                </button>
                {showAddMenu && (
                  <div className="absolute left-[calc(100%+12px)] top-0 w-[220px] bg-[#1a1a1a] border border-[rgba(255,255,255,0.08)] rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] z-50 overflow-hidden">
                    <Link to="/members/add" onClick={() => setShowAddMenu(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-[rgba(255,255,255,0.05)] transition-colors text-[13px] text-[#EEEEF0] font-medium border-b border-[rgba(255,255,255,0.05)]">
                      <span className="material-symbols-outlined text-[18px] text-primary-container">person_add</span>
                      Add Manually
                    </Link>
                    <Link to="/members/import" onClick={() => setShowAddMenu(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-[rgba(255,255,255,0.05)] transition-colors text-[13px] text-[#EEEEF0] font-medium">
                      <span className="material-symbols-outlined text-[18px] text-secondary">upload_file</span>
                      Import from Excel
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
          {/* Abstract background element */}
          <div className="absolute right-0 top-0 w-1/3 h-full bg-gradient-to-l from-primary/10 to-transparent pointer-events-none rounded-r-xl"></div>
        </section>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
          {/* Total Members */}
          <Link to="/members" className="bg-[#1a1a1a] card-border p-card-padding-y px-card-padding-x rounded-xl hover:border-primary/30 hover:shadow-[0_0_20px_rgba(249,115,22,0.05)] transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">group</span>
              </div>
              <span className="material-symbols-outlined text-[18px] text-[#6B6B80] opacity-0 group-hover:opacity-100 transition-opacity -translate-x-1 group-hover:translate-x-0 transform duration-200">arrow_forward</span>
            </div>
            <div className="space-y-1">
              <p className="font-label-md text-label-md text-on-surface-variant">Total Members</p>
              {loading ? <SkeletonPulse className="h-8 w-20" /> : (
                <p className="font-stat-lg text-stat-lg text-on-surface">{totalMembers.toLocaleString()}</p>
              )}
            </div>
            {!loading && newMembersThisMonth.length > 0 && (
              <p className="mt-2 text-secondary font-label-sm text-label-sm">+{newMembersThisMonth.length} this month</p>
            )}
          </Link>

          {/* Active Members */}
          <Link to="/members?status=active" className="bg-[#1a1a1a] card-border p-card-padding-y px-card-padding-x rounded-xl hover:border-tertiary/30 hover:shadow-[0_0_20px_rgba(141,205,255,0.05)] transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-tertiary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-tertiary">bolt</span>
              </div>
              <span className="material-symbols-outlined text-[18px] text-[#6B6B80] opacity-0 group-hover:opacity-100 transition-opacity -translate-x-1 group-hover:translate-x-0 transform duration-200">arrow_forward</span>
            </div>
            <div className="space-y-1">
              <p className="font-label-md text-label-md text-on-surface-variant">Active Members</p>
              {loading ? <SkeletonPulse className="h-8 w-16" /> : (
                <p className="font-stat-lg text-stat-lg text-on-surface">{activeCount}</p>
              )}
            </div>
            {!loading && (
              <p className="mt-2 text-secondary font-label-sm text-label-sm">{totalMembers > 0 ? Math.round((activeCount / totalMembers) * 100) : 0}% of total</p>
            )}
          </Link>

          {/* Personal Training */}
          <Link to="/members?classType=PERSONAL" className="bg-[#1a1a1a] card-border p-card-padding-y px-card-padding-x rounded-xl hover:border-secondary/30 hover:shadow-[0_0_20px_rgba(253,186,116,0.05)] transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-secondary">fitness_center</span>
              </div>
              <span className="material-symbols-outlined text-[18px] text-[#6B6B80] opacity-0 group-hover:opacity-100 transition-opacity -translate-x-1 group-hover:translate-x-0 transform duration-200">arrow_forward</span>
            </div>
            <div className="space-y-1">
              <p className="font-label-md text-label-md text-on-surface-variant">Personal Training</p>
              {loading ? <SkeletonPulse className="h-8 w-24" /> : (
                <p className="font-stat-lg text-stat-lg text-on-surface">{personalCount} <span className="text-[14px] font-normal text-on-surface-variant">members</span></p>
              )}
            </div>
          </Link>

          {/* Group Training */}
          <Link to="/members?classType=GROUP" className="bg-[#1a1a1a] card-border p-card-padding-y px-card-padding-x rounded-xl hover:border-primary-container/30 hover:shadow-[0_0_20px_rgba(249,115,22,0.05)] transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary-container/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary-container">groups</span>
              </div>
              <span className="material-symbols-outlined text-[18px] text-[#6B6B80] opacity-0 group-hover:opacity-100 transition-opacity -translate-x-1 group-hover:translate-x-0 transform duration-200">arrow_forward</span>
            </div>
            <div className="space-y-1">
              <p className="font-label-md text-label-md text-on-surface-variant">Group Training</p>
              {loading ? <SkeletonPulse className="h-8 w-24" /> : (
                <p className="font-stat-lg text-stat-lg text-on-surface">{groupCount} <span className="text-[14px] font-normal text-on-surface-variant">members</span></p>
              )}
            </div>
          </Link>
        </div>

        {/* Dashboard Body Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
          {/* Activity Chart */}
          <div className="lg:col-span-2 bg-[#1a1a1a] card-border rounded-xl p-card-padding-y px-card-padding-x">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-3">
                <h3 className="font-headline-sm text-headline-sm">{chartTitles[chartPeriod]}</h3>
                <Link to="/analytics" className="text-[11px] text-primary-container hover:text-secondary font-bold flex items-center gap-0.5 transition-colors">
                  Full Analytics
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </Link>
              </div>
              <div className="flex bg-[#262626] border border-[rgba(255,255,255,0.08)] rounded-lg p-0.5 flex-wrap">
                {[{ key: 'weekly', label: 'W' }, { key: 'monthly', label: 'M' }, { key: 'quarterly', label: 'Q' }, { key: '6m', label: '6M' }, { key: '1y', label: '1Y' }, { key: 'all', label: 'All' }].map(opt => (
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
            {loading ? (
              <div className="h-[300px] flex items-end justify-between gap-2 pt-4">
                {[...Array(7)].map((_, i) => (
                  <SkeletonPulse key={i} className={`w-full rounded-t-lg`} style={{ height: `${30 + Math.random() * 60}%` }} />
                ))}
              </div>
            ) : (
              <div className="h-[300px]">
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
                      width={30}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                    <Bar dataKey="count" fill="#f97316" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-[#1a1a1a] card-border rounded-xl p-card-padding-y px-card-padding-x">
            <h3 className="font-headline-sm text-headline-sm mb-6">Recent Members</h3>
            <div className="space-y-4">
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-start gap-4 pb-4 border-b border-outline-variant/30 last:border-0">
                    <SkeletonPulse className="w-8 h-8 rounded-full shrink-0" />
                    <div className="flex-1 space-y-2">
                      <SkeletonPulse className="h-4 w-3/4" />
                      <SkeletonPulse className="h-3 w-1/2" />
                    </div>
                  </div>
                ))
              ) : recentMembers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <span className="material-symbols-outlined text-[40px] text-[#6B6B80]/30 mb-3">person_add</span>
                  <p className="text-[14px] text-[#6B6B80]">No members yet. Add your first member!</p>
                </div>
              ) : (
                recentMembers.map(member => (
                  <Link
                    key={member.id}
                    to={`/members/${member.id}`}
                    className="flex items-start gap-4 pb-4 border-b border-outline-variant/30 last:border-0 hover:bg-surface-container-high/20 -mx-2 px-2 rounded-lg transition-colors"
                  >
                    {member.avatar ? (
                      <img src={member.avatar} alt={member.name} className="mt-1 w-8 h-8 rounded-full object-cover shrink-0 border border-primary-container/20" />
                    ) : (
                      <div className="mt-1 w-8 h-8 rounded-full bg-primary-container/15 flex items-center justify-center shrink-0 border border-primary-container/20">
                        <span className="text-[11px] font-bold text-primary-container">{member.name.substring(0, 2).toUpperCase()}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-label-md text-label-md text-on-surface truncate">{member.name}</p>
                      <p className="font-label-sm text-label-sm text-on-surface-variant">
                        {new Date(member.joiningDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <span className={`mt-1 px-2 py-0.5 rounded text-[10px] font-bold ${member.isActive ? 'dim-success' : 'dim-warning'}`}>
                      {member.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </Link>
                ))
              )}
            </div>
            <Link to="/members" className="w-full mt-6 py-2 border border-outline-variant rounded-lg font-label-md text-label-md text-on-surface-variant hover:bg-surface-container-high transition-colors flex items-center justify-center gap-2">
              View All Members
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Dashboard;
