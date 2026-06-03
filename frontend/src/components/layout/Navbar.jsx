import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import useThemeStore from '../../store/themeStore';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [logoutCountdown, setLogoutCountdown] = useState(3);
  const [loggingOut, setLoggingOut] = useState(false);
  const profileRef = useRef(null);
  const timerRef = useRef(null);

  const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Admin')}&background=FF6B1A&color=fff&size=128&bold=true&font-size=0.4`;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Countdown timer for logout confirmation
  useEffect(() => {
    if (showLogoutConfirm) {
      setLogoutCountdown(3);
      timerRef.current = setInterval(() => {
        setLogoutCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
      setLogoutCountdown(3);
    }
    return () => clearInterval(timerRef.current);
  }, [showLogoutConfirm]);

  const handleLogoutClick = () => {
    setIsProfileOpen(false);
    setShowLogoutConfirm(true);
  };

  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false);
    setLoggingOut(true);
    // Show loader for 1.5s then logout
    setTimeout(() => {
      logout();
      navigate('/', { state: { loggedOut: true } });
    }, 1500);
  };

  const handleCancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <>
      {/* Logging Out Overlay */}
      {loggingOut && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-[#0A0A0F]">
          <div className="flex flex-col items-center animate-fadeIn">
            <div className="w-20 h-20 rounded-full bg-[#FF6B1A]/10 flex items-center justify-center mb-6 border-2 border-[#FF6B1A]/30 relative">
              <span className="material-symbols-outlined animate-spin text-[36px] text-[#FF6B1A]">progress_activity</span>
            </div>
            <h2 className="text-[20px] font-bold text-white mb-2">Signing out...</h2>
            <p className="text-[14px] text-[#6B6B80]">Ending your session securely</p>
            <div className="mt-6 w-48 h-1 bg-[#1a1a24] rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#FF6B1A] to-[#EF4444] rounded-full animate-[loadBar_1.3s_ease-in-out_forwards]"></div>
            </div>
          </div>
        </div>
      )}

      <header className={`sticky top-0 z-50 w-full h-[52px] backdrop-blur-[12px] border-b transition-colors duration-300 ${isDark ? 'bg-[#0A0A0F]/80 border-[rgba(255,255,255,0.06)]' : 'bg-white/85 border-[rgba(0,0,0,0.06)]'}`}>
        <div className="relative flex justify-between items-center px-container-margin w-full max-w-[1440px] mx-auto h-full">
          <div className="flex items-center gap-8 h-full">
            <span className={`font-headline-sm text-headline-sm font-bold ${isDark ? 'text-on-surface' : 'text-[#1a1a2e]'}`}>CFA Studio</span>
          </div>
            
          <nav className="hidden md:flex items-center gap-8 h-full absolute left-1/2 -translate-x-1/2">
            <Link 
              to="/dashboard" 
              className={`h-full flex items-center font-label-md text-[14px] transition-colors duration-200 relative group ${isActive('/dashboard') ? 'text-[#FF6B1A] font-bold' : isDark ? 'text-on-surface-variant hover:text-white' : 'text-[#6B6B80] hover:text-[#1a1a2e]'}`}
            >
              Dashboard
              {isActive('/dashboard') && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#FF6B1A] rounded-t-full shadow-[0_-2px_10px_rgba(255,107,26,0.5)]"></div>}
            </Link>
            <Link 
              to="/members" 
              className={`h-full flex items-center font-label-md text-[14px] transition-colors duration-200 relative group ${isActive('/members') ? 'text-[#FF6B1A] font-bold' : isDark ? 'text-on-surface-variant hover:text-white' : 'text-[#6B6B80] hover:text-[#1a1a2e]'}`}
            >
              Members
              {isActive('/members') && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#FF6B1A] rounded-t-full shadow-[0_-2px_10px_rgba(255,107,26,0.5)]"></div>}
            </Link>
            <Link 
              to="/analytics" 
              className={`h-full flex items-center font-label-md text-[14px] transition-colors duration-200 relative group ${isActive('/analytics') ? 'text-[#FF6B1A] font-bold' : isDark ? 'text-on-surface-variant hover:text-white' : 'text-[#6B6B80] hover:text-[#1a1a2e]'}`}
            >
              Analytics
              {isActive('/analytics') && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#FF6B1A] rounded-t-full shadow-[0_-2px_10px_rgba(255,107,26,0.5)]"></div>}
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <button className={`p-2 rounded-xl transition-all active:scale-95 relative hidden sm:block ${isDark ? 'hover:bg-white/5 text-on-surface-variant hover:text-white' : 'hover:bg-black/5 text-[#6B6B80] hover:text-[#1a1a2e]'}`}>
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 bg-[#FF6B1A] rounded-full border border-[#0A0A0F]"></span>
            </button>

            <div className="relative" ref={profileRef}>
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className={`flex items-center gap-2.5 p-1 pr-3 rounded-full transition-all group outline-none border ${isDark ? 'bg-[#16161F]/60 hover:bg-[#16161F] border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.12)]' : 'bg-[#F0F0F5]/80 hover:bg-[#E8E8ED] border-[rgba(0,0,0,0.06)] hover:border-[rgba(0,0,0,0.12)]'}`}
              >
                <div className="relative">
                  <div className={`h-8 w-8 rounded-full overflow-hidden ring-2 transition-all ${isDark ? 'ring-[#FF6B1A]/30 group-hover:ring-[#FF6B1A]/60' : 'ring-[#FF6B1A]/20 group-hover:ring-[#FF6B1A]/50'}`}>
                    <img 
                      alt="Profile" 
                      className="w-full h-full object-cover" 
                      src={user?.avatar || defaultAvatar}
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
                <div className="hidden md:flex flex-col items-start">
                  <span className={`text-[13px] font-bold leading-tight ${isDark ? 'text-white' : 'text-[#1a1a2e]'}`}>{user?.name || 'Admin User'}</span>
                  <span className="text-[11px] text-[#6B6B80] leading-tight">Manager</span>
                </div>
                <span className={`material-symbols-outlined text-[16px] transition-transform duration-300 ${isDark ? 'text-[#6B6B80]' : 'text-[#999]'} ${isProfileOpen ? 'rotate-180' : ''}`}>
                  expand_more
                </span>
              </button>

              {isProfileOpen && (
                <div className={`absolute right-0 mt-2 w-56 rounded-2xl overflow-hidden z-[100] animate-fadeIn flex flex-col border ${isDark ? 'bg-[#111118]/95 backdrop-blur-xl border-[rgba(255,255,255,0.08)] shadow-[0_8px_32px_rgba(0,0,0,0.4)]' : 'bg-white/95 backdrop-blur-xl border-[rgba(0,0,0,0.08)] shadow-[0_8px_32px_rgba(0,0,0,0.12)]'}`}>
                  <div className={`p-4 border-b ${isDark ? 'border-[rgba(255,255,255,0.05)]' : 'border-[rgba(0,0,0,0.05)]'}`}>
                    <p className={`text-[14px] font-bold ${isDark ? 'text-white' : 'text-[#1a1a2e]'}`}>{user?.name || 'Admin User'}</p>
                    <p className="text-[12px] text-[#6B6B80]">{user?.email || 'admin@cfastudio.com'}</p>
                  </div>
                  <div className="p-2 flex flex-col gap-0.5">
                    <button onClick={() => { navigate('/profile'); setIsProfileOpen(false); }} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-[13px] font-medium w-full text-left ${isDark ? 'hover:bg-[rgba(255,255,255,0.06)] text-[#6B6B80] hover:text-white' : 'hover:bg-[rgba(0,0,0,0.04)] text-[#6B6B80] hover:text-[#1a1a2e]'}`}>
                      <span className="material-symbols-outlined text-[18px]">person</span>
                      My Profile
                    </button>
                    <button onClick={() => { navigate('/settings'); setIsProfileOpen(false); }} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-[13px] font-medium w-full text-left ${isDark ? 'hover:bg-[rgba(255,255,255,0.06)] text-[#6B6B80] hover:text-white' : 'hover:bg-[rgba(0,0,0,0.04)] text-[#6B6B80] hover:text-[#1a1a2e]'}`}>
                      <span className="material-symbols-outlined text-[18px]">settings</span>
                      Settings
                    </button>
                  </div>
                  <div className={`p-2 border-t ${isDark ? 'border-[rgba(255,255,255,0.05)]' : 'border-[rgba(0,0,0,0.05)]'}`}>
                    <button 
                      onClick={handleLogoutClick}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-500/10 text-red-500 transition-colors text-[13px] font-medium w-full text-left"
                    >
                      <span className="material-symbols-outlined text-[18px]">logout</span>
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className={`rounded-2xl p-8 max-w-[380px] w-full mx-4 animate-fadeIn border ${isDark ? 'bg-[#111118] border-[rgba(255,255,255,0.08)] shadow-[0_16px_64px_rgba(0,0,0,0.6)]' : 'bg-white border-[rgba(0,0,0,0.08)] shadow-[0_16px_64px_rgba(0,0,0,0.15)]'}`}>
            <div className="flex flex-col items-center text-center">
              {/* Warning icon with pulse */}
              <div className="w-16 h-16 rounded-full bg-[#EF4444]/10 flex items-center justify-center mb-5 border border-[#EF4444]/20 relative">
                <div className="absolute inset-0 rounded-full bg-[#EF4444]/5 animate-ping"></div>
                <span className="material-symbols-outlined text-[32px] text-[#EF4444] relative z-10">logout</span>
              </div>

              <h3 className={`text-[18px] font-bold mb-2 ${isDark ? 'text-white' : 'text-[#1a1a2e]'}`}>Sign Out?</h3>
              <p className="text-[14px] text-[#6B6B80] mb-6 leading-relaxed">
                Are you sure you want to sign out of the admin portal? You'll need to log in again to access the dashboard.
              </p>

              {/* Countdown progress bar */}
              {logoutCountdown > 0 && (
                <div className="w-full mb-5">
                  <div className={`h-1 rounded-full overflow-hidden ${isDark ? 'bg-[#1a1a24]' : 'bg-[#E8E8ED]'}`}>
                    <div 
                      className="h-full bg-gradient-to-r from-[#EF4444] to-[#FF6B1A] rounded-full transition-all duration-1000 ease-linear"
                      style={{ width: `${((3 - logoutCountdown) / 3) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 w-full">
                <button
                  onClick={handleCancelLogout}
                  className={`flex-1 py-2.5 rounded-lg text-[13px] font-medium transition-colors active:scale-[0.98] border ${isDark ? 'border-outline-variant text-[#EEEEF0] hover:bg-surface-container-high' : 'border-[rgba(0,0,0,0.1)] text-[#1a1a2e] hover:bg-[#F0F0F5]'}`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmLogout}
                  disabled={logoutCountdown > 0}
                  className={`flex-1 py-2.5 rounded-lg text-[13px] font-bold transition-all flex items-center justify-center gap-2 ${
                    logoutCountdown > 0
                      ? `${isDark ? 'bg-[#1a1a24] text-[#6B6B80]' : 'bg-[#E8E8ED] text-[#999]'} cursor-not-allowed border border-[rgba(0,0,0,0.05)]`
                      : 'bg-[#EF4444] text-white hover:bg-[#DC2626] active:scale-[0.98] shadow-[0_0_20px_rgba(239,68,68,0.3)]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">logout</span>
                  {logoutCountdown > 0 ? `Wait ${logoutCountdown}s` : 'Sign Out'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
