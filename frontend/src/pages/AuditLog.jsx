import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import BottomNav from '../components/layout/BottomNav';
import useThemeStore from '../store/themeStore';
import api from '../services/api';

const ACTION_CONFIG = {
  CREATE:        { label: 'Created',   color: 'emerald', icon: 'person_add' },
  UPDATE:        { label: 'Updated',   color: 'blue',    icon: 'edit' },
  DELETE:        { label: 'Deleted',   color: 'red',     icon: 'delete' },
  STATUS_TOGGLE: { label: 'Toggled',   color: 'amber',   icon: 'toggle_on' },
  BULK_IMPORT:   { label: 'Imported',  color: 'purple',  icon: 'upload_file' },
  WIPE_ALL:      { label: 'Wiped All', color: 'red',     icon: 'delete_sweep' },
  LOGIN:         { label: 'Logged In', color: 'sky',     icon: 'login' },
  INVITE:        { label: 'Invited',   color: 'orange',  icon: 'person_add' },
  REMOVE:        { label: 'Removed',   color: 'red',     icon: 'person_remove' },
};

const BADGE_STYLES = {
  emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  blue:    'bg-blue-500/10 text-blue-400 border-blue-500/20',
  red:     'bg-red-500/10 text-red-400 border-red-500/20',
  amber:   'bg-amber-500/10 text-amber-400 border-amber-500/20',
  purple:  'bg-purple-500/10 text-purple-400 border-purple-500/20',
  sky:     'bg-sky-500/10 text-sky-400 border-sky-500/20',
  orange:  'bg-orange-500/10 text-orange-400 border-orange-500/20',
};

const AuditLog = () => {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterAction, setFilterAction] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page, limit: 30 });
        if (filterAction) params.set('action', filterAction);
        const res = await api.get(`/audit-logs?${params}`);
        if (res.data.success) {
          setLogs(res.data.data.logs);
          setTotalPages(res.data.data.pagination.totalPages);
        }
      } catch (err) {
        console.error('Failed to fetch audit logs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [page, filterAction]);

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHrs < 24) return `${diffHrs}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const parseDetails = (details) => {
    if (!details) return null;
    try { return JSON.parse(details); } catch { return null; }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-[#0e0e0e]' : 'bg-[#F5F5F7]'}`}>
      <Navbar />

      <main className="max-w-[1440px] mx-auto px-4 md:px-8 py-8 pb-24">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link to="/settings" className="text-[#6B6B80] hover:text-[#f97316] transition-colors">
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              </Link>
              <h1 className={`text-[24px] md:text-[28px] font-headline font-bold ${isDark ? 'text-white' : 'text-[#1a1a2e]'}`}>
                Activity Log
              </h1>
            </div>
            <p className="text-[13px] text-[#6B6B80]">Track all actions performed in your studio.</p>
          </div>

          {/* Filter */}
          <select
            value={filterAction}
            onChange={(e) => { setFilterAction(e.target.value); setPage(1); }}
            className={`h-[36px] rounded-lg px-3 text-[13px] font-medium outline-none transition-all ${
              isDark 
                ? 'bg-[#1a1a1a] border border-white/[0.08] text-[#e5e2e1]' 
                : 'bg-white border border-gray-200 text-[#1a1a2e]'
            }`}
          >
            <option value="">All Actions</option>
            <option value="CREATE">Created</option>
            <option value="UPDATE">Updated</option>
            <option value="DELETE">Deleted</option>
            <option value="STATUS_TOGGLE">Status Toggle</option>
            <option value="BULK_IMPORT">Bulk Import</option>
            <option value="WIPE_ALL">Wipe All</option>
            <option value="LOGIN">Login</option>
            <option value="INVITE">Team Invite</option>
            <option value="REMOVE">Team Remove</option>
          </select>
        </div>

        {/* Logs */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className={`h-16 rounded-xl animate-pulse ${isDark ? 'bg-[#1a1a1a]' : 'bg-white'}`} />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-20">
            <span className="material-symbols-outlined text-[48px] text-[#333]">history</span>
            <p className={`mt-3 text-[15px] font-medium ${isDark ? 'text-[#666]' : 'text-[#999]'}`}>No activity yet</p>
            <p className="text-[13px] text-[#555] mt-1">Actions will appear here as you manage members.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => {
              const config = ACTION_CONFIG[log.action] || { label: log.action, color: 'blue', icon: 'info' };
              const details = parseDetails(log.details);
              const badgeStyle = BADGE_STYLES[config.color] || BADGE_STYLES.blue;

              return (
                <div
                  key={log.id}
                  className={`rounded-xl p-4 flex items-start gap-4 transition-colors ${
                    isDark 
                      ? 'bg-[#1a1a1a] border border-white/[0.04] hover:border-white/[0.08]' 
                      : 'bg-white border border-gray-100 hover:border-gray-200'
                  }`}
                >
                  {/* Icon */}
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 border ${badgeStyle}`}>
                    <span className="material-symbols-outlined text-[18px]">{config.icon}</span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${badgeStyle}`}>
                        {config.label}
                      </span>
                      <span className={`text-[13px] font-medium ${isDark ? 'text-[#e5e2e1]' : 'text-[#1a1a2e]'}`}>
                        {log.entity === 'MEMBER' && details?.name ? details.name : log.entity}
                      </span>
                    </div>

                    {/* Extra details */}
                    {details && (
                      <p className="text-[12px] text-[#6B6B80] mt-1">
                        {log.action === 'STATUS_TOGGLE' && `${details.from} → ${details.to}`}
                        {log.action === 'BULK_IMPORT' && `${details.imported} imported, ${details.skipped} skipped`}
                        {log.action === 'WIPE_ALL' && `${details.count} members deleted`}
                        {log.action === 'LOGIN' && `via ${details.method}`}
                        {log.action === 'INVITE' && `${details.email} as ${details.role}`}
                        {log.action === 'REMOVE' && `${details.email} (${details.role})`}
                      </p>
                    )}

                    {/* Admin + Time */}
                    <p className="text-[11px] text-[#555] mt-1.5">
                      by <span className={`font-medium ${isDark ? 'text-[#999]' : 'text-[#666]'}`}>{log.admin?.name || log.admin?.email}</span>
                      {log.admin?.role !== 'OWNER' && (
                        <span className="ml-1 text-[10px] text-[#78716c]">({log.admin.role})</span>
                      )}
                      <span className="mx-1.5">·</span>
                      {formatTime(log.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-8">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all disabled:opacity-30 ${
                isDark ? 'bg-[#1a1a1a] text-[#e5e2e1] hover:bg-white/[0.06]' : 'bg-white text-[#1a1a2e] hover:bg-gray-50'
              }`}
            >
              ← Prev
            </button>
            <span className="text-[13px] text-[#6B6B80]">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all disabled:opacity-30 ${
                isDark ? 'bg-[#1a1a1a] text-[#e5e2e1] hover:bg-white/[0.06]' : 'bg-white text-[#1a1a2e] hover:bg-gray-50'
              }`}
            >
              Next →
            </button>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default AuditLog;
