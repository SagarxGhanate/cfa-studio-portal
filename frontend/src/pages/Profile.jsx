import { useState, useEffect } from 'react';
import useAuthStore from '../store/authStore';
import useThemeStore from '../store/themeStore';
import Navbar from '../components/layout/Navbar';
import BottomNav from '../components/layout/BottomNav';
import api from '../services/api';

const Profile = () => {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const [profileData, setProfileData] = useState(null);
  const [nameInput, setNameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [timezoneInput, setTimezoneInput] = useState('India Standard Time (IST)');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Fetch fresh profile data from backend
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/auth/me');
        if (res.data.success) {
          setProfileData(res.data.data);
          setUser(res.data.data);
        }
      } catch (err) {
        // fallback to store data
      }
    };
    fetchProfile();
  }, []);

  const displayUser = profileData || user;

  useEffect(() => {
    if (displayUser?.name) setNameInput(displayUser.name);
    if (displayUser?.phone) setPhoneInput(displayUser.phone);
    if (displayUser?.timezone) setTimezoneInput(displayUser.timezone);
  }, [displayUser]);

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setSaveMessage('');
    try {
      const res = await api.patch('/auth/profile', {
        name: nameInput,
        phone: phoneInput,
        timezone: timezoneInput,
      });
      if (res.data.success) {
        setProfileData(res.data.data);
        setUser(res.data.data);
        setSaveMessage('Profile updated successfully! Dashboard will reflect instantly.');
        setTimeout(() => setSaveMessage(''), 4000);
      }
    } catch (err) {
      setSaveMessage(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const memberDate = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

  const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayUser?.name || 'Admin')}&background=FF6B1A&color=fff&size=200&bold=true&font-size=0.4`;

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-[#0e0e0e]' : 'bg-[#F5F5F7]'}`}>
      <Navbar />
      <main className="w-full max-w-[800px] mx-auto px-4 py-8 pb-24 animate-fadeIn">
        {/* Header section centered */}
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="relative group cursor-pointer mb-6">
            <div className={`w-[120px] h-[120px] rounded-full overflow-hidden border-[3px] shadow-[0_0_30px_rgba(255,107,26,0.15)] transition-transform duration-300 group-hover:scale-105 ${isDark ? 'border-[#f97316]/40' : 'border-[#f97316]/30'}`}>
              <img 
                src={displayUser?.avatar || defaultAvatar} 
                alt="Profile" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full">
              <span className="material-symbols-outlined text-white text-[28px]">photo_camera</span>
            </div>
            <div className={`absolute -bottom-1 -right-1 w-9 h-9 rounded-full flex items-center justify-center shadow-lg border-[3px] bg-[#f97316] ${isDark ? 'border-[#0e0e0e]' : 'border-[#F5F5F7]'}`}>
              <span className="material-symbols-outlined text-white text-[16px]">edit</span>
            </div>
          </div>

          <h1 className={`text-[28px] font-bold mb-2 tracking-tight ${isDark ? 'text-white' : 'text-[#1a1a2e]'}`}>
            {displayUser?.name || 'Admin User'}
          </h1>
          <p className={`text-[15px] px-5 py-1.5 rounded-full border ${isDark ? 'text-on-surface-variant bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.05)]' : 'text-[#6B6B80] bg-[rgba(0,0,0,0.02)] border-[rgba(0,0,0,0.06)]'}`}>
            {displayUser?.email || 'admin@cfastudio.com'}
          </p>
        </div>

        {/* Stats/Badges */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
          <div className={`rounded-2xl p-5 flex flex-col items-center justify-center transition-colors hover:border-[#f97316]/20 ${isDark ? 'bg-[#1a1a1a] border border-[rgba(255,255,255,0.05)] shadow-[0_8px_20px_rgba(0,0,0,0.2)]' : 'bg-white border border-[rgba(0,0,0,0.06)] shadow-[0_2px_10px_rgba(0,0,0,0.04)]'}`}>
            <span className="material-symbols-outlined text-[#f97316] text-[28px] mb-2">shield_person</span>
            <span className={`text-[18px] font-bold leading-none mb-1 ${isDark ? 'text-white' : 'text-[#1a1a2e]'}`}>Super Admin</span>
            <span className="text-[12px] text-[#6B6B80]">Role Level</span>
          </div>
          <div className={`rounded-2xl p-5 flex flex-col items-center justify-center transition-colors hover:border-[#f97316]/20 ${isDark ? 'bg-[#1a1a1a] border border-[rgba(255,255,255,0.05)] shadow-[0_8px_20px_rgba(0,0,0,0.2)]' : 'bg-white border border-[rgba(0,0,0,0.06)] shadow-[0_2px_10px_rgba(0,0,0,0.04)]'}`}>
            <span className="material-symbols-outlined text-[#4ae176] text-[28px] mb-2">verified</span>
            <span className={`text-[18px] font-bold leading-none mb-1 ${isDark ? 'text-white' : 'text-[#1a1a2e]'}`}>Verified</span>
            <span className="text-[12px] text-[#6B6B80]">Account Status</span>
          </div>
          <div className={`rounded-2xl p-5 flex flex-col items-center justify-center transition-colors hover:border-[#f97316]/20 col-span-2 md:col-span-1 ${isDark ? 'bg-[#1a1a1a] border border-[rgba(255,255,255,0.05)] shadow-[0_8px_20px_rgba(0,0,0,0.2)]' : 'bg-white border border-[rgba(0,0,0,0.06)] shadow-[0_2px_10px_rgba(0,0,0,0.04)]'}`}>
            <span className="material-symbols-outlined text-[#3b82f6] text-[28px] mb-2">event_available</span>
            <span className={`text-[18px] font-bold leading-none mb-1 ${isDark ? 'text-white' : 'text-[#1a1a2e]'}`}>{memberDate}</span>
            <span className="text-[12px] text-[#6B6B80]">Member Since</span>
          </div>
        </div>

        {/* Edit Profile Form */}
        <form onSubmit={handleSave} className={`rounded-3xl p-8 relative overflow-hidden transition-colors duration-300 ${isDark ? 'bg-[#1a1a1a] border border-[rgba(255,255,255,0.05)] shadow-[0_10px_40px_rgba(0,0,0,0.3)]' : 'bg-white border border-[rgba(0,0,0,0.06)] shadow-[0_4px_20px_rgba(0,0,0,0.06)]'}`}>
          {/* Decorative background glow */}
          <div className={`absolute top-0 right-0 w-[300px] h-[300px] rounded-full blur-[80px] pointer-events-none ${isDark ? 'bg-[#f97316]/5' : 'bg-[#f97316]/3'}`}></div>

          <h2 className={`text-[20px] font-bold mb-6 relative z-10 ${isDark ? 'text-white' : 'text-[#1a1a2e]'}`}>Personal Information</h2>
          
          {saveMessage && (
            <div className={`mb-6 p-4 rounded-xl text-[14px] font-medium transition-all relative z-10 ${saveMessage.includes('success') ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
              {saveMessage}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
            <div className="flex flex-col gap-2">
              <label className="text-[13px] text-[#6B6B80] font-medium">Full Name</label>
              <input 
                type="text" 
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className={`h-[44px] rounded-xl px-4 text-[14px] outline-none transition-all focus:ring-2 focus:ring-[#f97316]/20 focus:border-[#f97316] ${isDark ? 'bg-[#262626] border border-[rgba(255,255,255,0.08)] text-white' : 'bg-[#F0F0F5] border border-[rgba(0,0,0,0.08)] text-[#1a1a2e]'}`}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[13px] text-[#6B6B80] font-medium">Email Address</label>
              <input 
                type="email" 
                disabled
                defaultValue={displayUser?.email || 'admin@cfastudio.com'}
                className={`h-[44px] rounded-xl px-4 text-[14px] outline-none cursor-not-allowed ${isDark ? 'bg-[#262626]/50 border border-[rgba(255,255,255,0.04)] text-on-surface-variant' : 'bg-[#E8E8ED] border border-[rgba(0,0,0,0.04)] text-[#999]'}`}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[13px] text-[#6B6B80] font-medium">Phone Number (Optional)</label>
              <input 
                type="tel" 
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="+91 00000 00000"
                className={`h-[44px] rounded-xl px-4 text-[14px] outline-none transition-all focus:ring-2 focus:ring-[#f97316]/20 focus:border-[#f97316] ${isDark ? 'bg-[#262626] border border-[rgba(255,255,255,0.08)] text-white placeholder:text-[#555]' : 'bg-[#F0F0F5] border border-[rgba(0,0,0,0.08)] text-[#1a1a2e] placeholder:text-[#aaa]'}`}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[13px] text-[#6B6B80] font-medium">Timezone</label>
              <select 
                value={timezoneInput}
                onChange={(e) => setTimezoneInput(e.target.value)}
                className={`h-[44px] rounded-xl px-4 text-[14px] outline-none appearance-none cursor-pointer transition-all focus:ring-2 focus:ring-[#f97316]/20 focus:border-[#f97316] ${isDark ? 'bg-[#262626] border border-[rgba(255,255,255,0.08)] text-white' : 'bg-[#F0F0F5] border border-[rgba(0,0,0,0.08)] text-[#1a1a2e]'}`}
              >
                <option value="Pacific Time (US & Canada)">Pacific Time (US & Canada)</option>
                <option value="Eastern Time (US & Canada)">Eastern Time (US & Canada)</option>
                <option value="London">London</option>
                <option value="India Standard Time (IST)">India Standard Time (IST)</option>
              </select>
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3 relative z-10">
            <button 
              type="button"
              onClick={() => {
                setNameInput(displayUser?.name || '');
                setPhoneInput(displayUser?.phone || '');
                setTimezoneInput(displayUser?.timezone || 'India Standard Time (IST)');
                setSaveMessage('');
              }}
              className={`px-6 py-2.5 rounded-xl text-[14px] font-medium transition-colors ${isDark ? 'text-white hover:bg-[rgba(255,255,255,0.05)]' : 'text-[#1a1a2e] hover:bg-[rgba(0,0,0,0.04)]'}`}>
              Cancel
            </button>
            <button 
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-[#f97316] hover:bg-[#e85a0d] active:scale-[0.98] transition-all rounded-xl text-[14px] font-medium text-white shadow-[0_4px_14px_rgba(255,107,26,0.4)] disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </main>
      <BottomNav />
    </div>
  );
};

export default Profile;
