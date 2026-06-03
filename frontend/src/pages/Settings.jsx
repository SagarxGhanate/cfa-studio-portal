import { useState } from 'react';
import Navbar from '../components/layout/Navbar';
import BottomNav from '../components/layout/BottomNav';
import { useToast } from '../components/ui/Toast';
import useThemeStore from '../store/themeStore';
import api from '../services/api';

const Settings = () => {
  const toast = useToast();
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === 'dark';
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwords.newPass !== passwords.confirm) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwords.newPass.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const res = await api.patch('/auth/change-password', {
        currentPassword: passwords.current,
        newPassword: passwords.newPass,
      });
      if (res.data.success) {
        toast.success('Password changed successfully');
        setPasswords({ current: '', newPass: '', confirm: '' });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-[#0A0A0F]' : 'bg-[#F5F5F7]'}`}>
      <Navbar />

      <main className="max-w-[1440px] mx-auto px-container-margin py-8 pb-24">
        <div className="mb-8 text-center">
          <h1 className={`font-display-lg text-display-lg ${isDark ? 'text-on-surface' : 'text-[#1a1a2e]'}`}>Settings</h1>
          <p className={`font-body-md text-body-md mt-1 ${isDark ? 'text-on-surface-variant' : 'text-[#6B6B80]'}`}>Manage your account and studio preferences.</p>
        </div>

        <div className="max-w-[600px] mx-auto space-y-6">
          {/* Preferences */}
          <div className={`rounded-2xl p-6 transition-colors duration-300 ${isDark ? 'bg-[#111118] border border-[rgba(255,255,255,0.05)] shadow-[0_8px_32px_rgba(0,0,0,0.2)]' : 'bg-white border border-[rgba(0,0,0,0.06)] shadow-[0_2px_12px_rgba(0,0,0,0.06)]'}`}>
            <div className={`border-b pb-3 mb-6 ${isDark ? 'border-[rgba(255,255,255,0.05)]' : 'border-[rgba(0,0,0,0.06)]'}`}>
              <h3 className="text-[13px] uppercase tracking-wider text-[#6B6B80] font-bold">App Preferences</h3>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border transition-colors duration-300 ${isDark ? 'bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.05)]' : 'bg-[#F0F0F5] border-[rgba(0,0,0,0.06)]'}`}>
                  <span className={`material-symbols-outlined text-[20px] ${isDark ? 'text-[#e2e2e4]' : 'text-[#FF6B1A]'}`}>
                    {isDark ? 'dark_mode' : 'light_mode'}
                  </span>
                </div>
                <div>
                  <p className={`text-[15px] font-bold ${isDark ? 'text-white' : 'text-[#1a1a2e]'}`}>
                    {isDark ? 'Dark Mode' : 'Light Mode'}
                  </p>
                  <p className={`text-[12px] ${isDark ? 'text-on-surface-variant' : 'text-[#6B6B80]'}`}>
                    Switch between light and dark themes
                  </p>
                </div>
              </div>
              
              {/* Custom Toggle Switch */}
              <button 
                onClick={toggleTheme}
                className={`relative w-12 h-[26px] rounded-full transition-all duration-300 ${isDark ? 'bg-[#FF6B1A]' : 'bg-[#d1d5db]'}`}
              >
                <div className={`absolute top-[3px] w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 ${isDark ? 'left-[26px]' : 'left-[3px]'}`}></div>
              </button>
            </div>
          </div>

          {/* Change Password */}
          <form onSubmit={handlePasswordChange} className={`rounded-2xl p-6 transition-colors duration-300 ${isDark ? 'bg-[#111118] border border-[rgba(255,255,255,0.05)] shadow-[0_8px_32px_rgba(0,0,0,0.2)]' : 'bg-white border border-[rgba(0,0,0,0.06)] shadow-[0_2px_12px_rgba(0,0,0,0.06)]'}`}>
            <div className={`border-b pb-2 mb-5 ${isDark ? 'border-[rgba(255,255,255,0.05)]' : 'border-[rgba(0,0,0,0.06)]'}`}>
              <h3 className="text-[11px] uppercase tracking-wider text-[#6B6B80] font-bold">Change Password</h3>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-[#6B6B80]">Current Password</label>
                <input
                  type="password"
                  value={passwords.current}
                  onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                  className={`w-full h-[40px] rounded-xl px-3 outline-none transition-all focus:ring-2 focus:ring-[#FF6B1A]/30 focus:border-[#FF6B1A] ${isDark ? 'bg-[#16161F] border border-[rgba(255,255,255,0.08)] text-[#EEEEF0]' : 'bg-[#F0F0F5] border border-[rgba(0,0,0,0.08)] text-[#1a1a2e]'}`}
                  placeholder="••••••••"
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-[#6B6B80]">New Password</label>
                <input
                  type="password"
                  value={passwords.newPass}
                  onChange={(e) => setPasswords({ ...passwords, newPass: e.target.value })}
                  className={`w-full h-[40px] rounded-xl px-3 outline-none transition-all focus:ring-2 focus:ring-[#FF6B1A]/30 focus:border-[#FF6B1A] ${isDark ? 'bg-[#16161F] border border-[rgba(255,255,255,0.08)] text-[#EEEEF0]' : 'bg-[#F0F0F5] border border-[rgba(0,0,0,0.08)] text-[#1a1a2e]'}`}
                  placeholder="At least 6 characters"
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-[#6B6B80]">Confirm New Password</label>
                <input
                  type="password"
                  value={passwords.confirm}
                  onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                  className={`w-full h-[40px] rounded-xl px-3 outline-none transition-all focus:ring-2 focus:ring-[#FF6B1A]/30 focus:border-[#FF6B1A] ${isDark ? 'bg-[#16161F] border border-[rgba(255,255,255,0.08)] text-[#EEEEF0]' : 'bg-[#F0F0F5] border border-[rgba(0,0,0,0.08)] text-[#1a1a2e]'}`}
                  placeholder="Re-enter new password"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full h-[40px] bg-[#FF6B1A] text-white font-bold rounded-xl hover:bg-[#e85a0d] active:scale-[0.98] transition-all disabled:opacity-70 mt-2 shadow-[0_4px_14px_rgba(255,107,26,0.3)]"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>

          {/* App Info */}
          <div className={`rounded-2xl p-6 transition-colors duration-300 ${isDark ? 'bg-[#111118] border border-[rgba(255,255,255,0.05)] shadow-[0_8px_32px_rgba(0,0,0,0.2)]' : 'bg-white border border-[rgba(0,0,0,0.06)] shadow-[0_2px_12px_rgba(0,0,0,0.06)]'}`}>
            <div className={`border-b pb-2 mb-5 ${isDark ? 'border-[rgba(255,255,255,0.05)]' : 'border-[rgba(0,0,0,0.06)]'}`}>
              <h3 className="text-[11px] uppercase tracking-wider text-[#6B6B80] font-bold">Application</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-[#6B6B80]">Version</span>
                <span className={`text-[13px] font-medium ${isDark ? 'text-[#EEEEF0]' : 'text-[#1a1a2e]'}`}>1.0.4</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-[#6B6B80]">Database</span>
                <span className={`text-[13px] font-medium ${isDark ? 'text-[#EEEEF0]' : 'text-[#1a1a2e]'}`}>Supabase (PostgreSQL)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-[#6B6B80]">Environment</span>
                <span className="px-2 py-0.5 rounded bg-secondary/15 text-secondary text-[11px] font-bold border border-secondary/20">Development</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-[#6B6B80]">Theme</span>
                <span className={`text-[13px] font-medium ${isDark ? 'text-[#EEEEF0]' : 'text-[#1a1a2e]'}`}>{isDark ? 'Dark' : 'Light'}</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Settings;
