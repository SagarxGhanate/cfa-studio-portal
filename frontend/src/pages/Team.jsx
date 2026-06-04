import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import BottomNav from '../components/layout/BottomNav';
import useAuthStore from '../store/authStore';
import useThemeStore from '../store/themeStore';
import { useToast } from '../components/ui/Toast';
import api from '../services/api';

const ROLE_CONFIG = {
  OWNER:   { label: 'Owner',   color: 'bg-[#f97316]/10 text-[#f97316] border-[#f97316]/20' },
  MANAGER: { label: 'Manager', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  VIEWER:  { label: 'Viewer',  color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
};

const Team = () => {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const user = useAuthStore((s) => s.user);
  const toast = useToast();

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', name: '', role: 'MANAGER' });
  const [inviting, setInviting] = useState(false);
  const [tempPassword, setTempPassword] = useState(null);
  const [confirmRemove, setConfirmRemove] = useState(null);

  const isOwner = user?.role === 'OWNER';

  const fetchTeam = async () => {
    try {
      const res = await api.get('/team');
      if (res.data.success) setMembers(res.data.data);
    } catch (err) {
      console.error('Failed to fetch team:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTeam(); }, []);

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviting(true);
    try {
      const res = await api.post('/team/invite', inviteForm);
      if (res.data.success) {
        setTempPassword(res.data.data.tempPassword);
        toast.success(`${inviteForm.email} invited as ${inviteForm.role}`);
        setInviteForm({ email: '', name: '', role: 'MANAGER' });
        fetchTeam();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to invite');
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (id) => {
    try {
      await api.delete(`/team/${id}`);
      toast.success('Team member removed');
      setConfirmRemove(null);
      fetchTeam();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove');
    }
  };

  const handleRoleChange = async (id, newRole) => {
    try {
      await api.patch(`/team/${id}/role`, { role: newRole });
      toast.success(`Role updated to ${newRole}`);
      fetchTeam();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update role');
    }
  };

  if (!isOwner) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-[#0e0e0e]' : 'bg-[#F5F5F7]'}`}>
        <Navbar />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <span className="material-symbols-outlined text-[48px] text-[#333]">lock</span>
            <p className={`mt-3 text-[15px] font-medium ${isDark ? 'text-[#666]' : 'text-[#999]'}`}>Owner Access Only</p>
            <p className="text-[13px] text-[#555] mt-1">Only the account owner can manage the team.</p>
            <Link to="/dashboard" className="inline-block mt-4 text-[13px] text-[#f97316] hover:underline">← Back to Dashboard</Link>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-[#0e0e0e]' : 'bg-[#F5F5F7]'}`}>
      <Navbar />

      <main className="max-w-[800px] mx-auto px-4 md:px-8 py-8 pb-24">
        {/* Header */}
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link to="/settings" className="text-[#6B6B80] hover:text-[#f97316] transition-colors">
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              </Link>
              <h1 className={`text-[24px] md:text-[28px] font-headline font-bold ${isDark ? 'text-white' : 'text-[#1a1a2e]'}`}>
                Team Management
              </h1>
            </div>
            <p className="text-[13px] text-[#6B6B80]">Invite managers and viewers to help run your studio.</p>
          </div>
          <button
            onClick={() => { setShowInvite(!showInvite); setTempPassword(null); }}
            className="px-4 py-2 bg-[#f97316] text-white font-headline font-bold text-[13px] rounded-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center gap-1.5 shadow-[0_4px_14px_rgba(249,115,22,0.3)]"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            Invite
          </button>
        </div>

        {/* Invite Form */}
        {showInvite && (
          <div className={`rounded-2xl p-6 mb-6 transition-colors duration-300 ${
            isDark ? 'bg-[#1a1a1a] border border-white/[0.06]' : 'bg-white border border-gray-100'
          }`}>
            <h3 className={`text-[14px] font-bold mb-4 ${isDark ? 'text-white' : 'text-[#1a1a2e]'}`}>
              Invite Team Member
            </h3>

            {/* Temp password display */}
            {tempPassword && (
              <div className="mb-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <p className="text-emerald-400 text-[13px] font-medium mb-1">✓ Invite Successful!</p>
                <p className="text-[12px] text-[#78716c] mb-2">Share this temporary password with the team member:</p>
                <div className="flex items-center gap-2">
                  <code className="px-3 py-1.5 bg-[#0e0e0e] rounded-lg text-[16px] font-mono font-bold text-[#f97316] tracking-wider">
                    {tempPassword}
                  </code>
                  <button
                    onClick={() => { navigator.clipboard.writeText(tempPassword); toast.success('Copied!'); }}
                    className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px] text-[#78716c]">content_copy</span>
                  </button>
                </div>
                <p className="text-[11px] text-[#555] mt-2">They can change it in Settings after logging in.</p>
              </div>
            )}

            <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                value={inviteForm.email}
                onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                className={`flex-1 h-[40px] rounded-xl px-3 outline-none text-[13px] transition-all focus:ring-2 focus:ring-[#f97316]/30 ${
                  isDark ? 'bg-[#262626] border border-white/[0.08] text-[#EEEEF0]' : 'bg-[#F0F0F5] border border-gray-200 text-[#1a1a2e]'
                }`}
                placeholder="Email address"
                required
              />
              <input
                type="text"
                value={inviteForm.name}
                onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                className={`w-full sm:w-[140px] h-[40px] rounded-xl px-3 outline-none text-[13px] transition-all focus:ring-2 focus:ring-[#f97316]/30 ${
                  isDark ? 'bg-[#262626] border border-white/[0.08] text-[#EEEEF0]' : 'bg-[#F0F0F5] border border-gray-200 text-[#1a1a2e]'
                }`}
                placeholder="Name (optional)"
              />
              <select
                value={inviteForm.role}
                onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                className={`w-full sm:w-[130px] h-[40px] rounded-xl px-3 outline-none text-[13px] font-medium ${
                  isDark ? 'bg-[#262626] border border-white/[0.08] text-[#EEEEF0]' : 'bg-[#F0F0F5] border border-gray-200 text-[#1a1a2e]'
                }`}
              >
                <option value="MANAGER">Manager</option>
                <option value="VIEWER">Viewer</option>
              </select>
              <button
                type="submit"
                disabled={inviting}
                className="h-[40px] px-5 bg-[#f97316] text-white font-bold text-[13px] rounded-xl hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-70"
              >
                {inviting ? 'Sending...' : 'Send Invite'}
              </button>
            </form>

            {/* Role explainer */}
            <div className={`mt-4 p-3 rounded-xl text-[12px] ${isDark ? 'bg-white/[0.02] text-[#78716c]' : 'bg-gray-50 text-[#666]'}`}>
              <p><strong className="text-blue-400">Manager</strong> — Can add, edit, and delete members. Cannot wipe data or manage team.</p>
              <p className="mt-1"><strong className="text-emerald-400">Viewer</strong> — Read-only access. Can view members and analytics.</p>
            </div>
          </div>
        )}

        {/* Owner card */}
        <div className={`rounded-2xl p-4 mb-3 flex items-center gap-4 ${
          isDark ? 'bg-[#1a1a1a] border border-[#f97316]/20' : 'bg-white border border-[#f97316]/20'
        }`}>
          <div className="w-10 h-10 rounded-full bg-[#f97316]/10 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-[20px] text-[#f97316]">shield_person</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-[14px] font-bold truncate ${isDark ? 'text-white' : 'text-[#1a1a2e]'}`}>{user?.name || 'You'}</p>
            <p className="text-[12px] text-[#6B6B80] truncate">{user?.email}</p>
          </div>
          <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold border ${ROLE_CONFIG.OWNER.color}`}>Owner</span>
        </div>

        {/* Team members list */}
        {loading ? (
          <div className="space-y-3 mt-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className={`h-16 rounded-xl animate-pulse ${isDark ? 'bg-[#1a1a1a]' : 'bg-white'}`} />
            ))}
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-16">
            <span className="material-symbols-outlined text-[48px] text-[#333]">group</span>
            <p className={`mt-3 text-[15px] font-medium ${isDark ? 'text-[#666]' : 'text-[#999]'}`}>No team members yet</p>
            <p className="text-[13px] text-[#555] mt-1">Invite managers or viewers to help run your studio.</p>
          </div>
        ) : (
          <div className="space-y-2 mt-2">
            {members.map((m) => (
              <div
                key={m.id}
                className={`rounded-xl p-4 flex items-center gap-4 transition-colors ${
                  isDark ? 'bg-[#1a1a1a] border border-white/[0.04] hover:border-white/[0.08]' : 'bg-white border border-gray-100 hover:border-gray-200'
                }`}
              >
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-[14px] font-bold ${
                  m.role === 'MANAGER' ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'
                }`}>
                  {(m.name || m.email)[0].toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <p className={`text-[14px] font-medium truncate ${isDark ? 'text-[#e5e2e1]' : 'text-[#1a1a2e]'}`}>{m.name || m.email.split('@')[0]}</p>
                    
                    {/* Permanent Temp Password Display */}
                    {m.initialPassword && (
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#f97316]/10 border border-[#f97316]/20">
                        <span className="text-[10px] text-[#f97316] font-bold uppercase tracking-wider">Pass:</span>
                        <code className="text-[11px] text-[#f97316] font-mono font-bold tracking-widest">{m.initialPassword}</code>
                        <button
                          onClick={() => { navigator.clipboard.writeText(m.initialPassword); toast.success('Password copied!'); }}
                          className="ml-1 p-0.5 rounded text-[#f97316] hover:bg-[#f97316]/20 transition-colors"
                          title="Copy Password"
                        >
                          <span className="material-symbols-outlined text-[12px]">content_copy</span>
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="text-[12px] text-[#6B6B80] truncate mt-0.5">{m.email}</p>
                </div>

                {/* Role selector */}
                <select
                  value={m.role}
                  onChange={(e) => handleRoleChange(m.id, e.target.value)}
                  className={`h-[32px] rounded-lg px-2 text-[12px] font-bold outline-none ${
                    isDark ? 'bg-[#262626] border border-white/[0.08] text-[#e5e2e1]' : 'bg-[#F0F0F5] border border-gray-200 text-[#1a1a2e]'
                  }`}
                >
                  <option value="MANAGER">Manager</option>
                  <option value="VIEWER">Viewer</option>
                </select>

                {/* Remove */}
                {confirmRemove === m.id ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleRemove(m.id)}
                      className="px-2.5 py-1 rounded-lg bg-red-500/10 text-red-400 text-[11px] font-bold hover:bg-red-500/20 transition-colors"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setConfirmRemove(null)}
                      className="px-2 py-1 rounded-lg text-[#6B6B80] text-[11px] font-bold hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmRemove(m.id)}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-[#6B6B80] hover:text-red-400 transition-all"
                  >
                    <span className="material-symbols-outlined text-[18px]">person_remove</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Team;
