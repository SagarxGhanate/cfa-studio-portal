import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import useAuthStore from '../store/authStore';
import api from '../services/api';

const Login = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showLogoutSuccess, setShowLogoutSuccess] = useState(false);
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();
  const location = useLocation();

  // Check if user just logged out (passed via navigation state)
  useEffect(() => {
    if (location.state?.loggedOut) {
      setShowLogoutSuccess(true);
      // Clear the state so refresh doesn't re-trigger
      window.history.replaceState({}, document.title);
      setTimeout(() => setShowLogoutSuccess(false), 2500);
    }
  }, [location.state]);

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/auth/login', data);
      if (response.data.success) {
        login(response.data.data.token, response.data.data.user);
        // Show success state briefly before navigating
        setLoading(false);
        setShowSuccess(true);
        setTimeout(() => {
          navigate('/dashboard');
        }, 1800);
      }
    } catch (err) {
      if (err.code === 'ERR_NETWORK') {
        setError('Cannot reach the server. Please make sure the backend is running.');
      } else if (err.response?.status === 401) {
        setError('Invalid email or password.');
      } else {
        setError(err.response?.data?.message || 'Something went wrong. Please try again.');
      }
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/auth/google-login', {
        credential: credentialResponse.credential
      });
      if (response.data.success) {
        login(response.data.data.token, response.data.data.user);
        setLoading(false);
        setShowSuccess(true);
        setTimeout(() => {
          navigate('/dashboard');
        }, 1800);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Google login failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 relative overflow-hidden">
      {/* Subtle Radial Glow */}
      <div className="fixed bottom-[-300px] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(255,107,26,0.06)_0%,rgba(255,107,26,0)_70%)] pointer-events-none z-0"></div>
      
      {/* Login Success Overlay */}
      {showSuccess && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0e0e0e]">
          <div className="flex flex-col items-center animate-fadeIn">
            {/* Animated checkmark */}
            <div className="w-20 h-20 rounded-full bg-[#4ae176]/10 flex items-center justify-center mb-6 border-2 border-[#4ae176]/30 relative">
              <div className="absolute inset-0 rounded-full bg-[#4ae176]/5 animate-ping"></div>
              <span className="material-symbols-outlined text-[40px] text-[#4ae176] relative z-10">check_circle</span>
            </div>
            <h2 className="text-[22px] font-bold text-white mb-2">Welcome Back!</h2>
            <p className="text-[14px] text-[#6B6B80]">Login successful. Redirecting to dashboard...</p>
            {/* Loader bar */}
            <div className="mt-6 w-48 h-1 bg-[#333333] rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#4ae176] to-[#f97316] rounded-full animate-[loadBar_1.5s_ease-in-out_forwards]"></div>
            </div>
          </div>
        </div>
      )}

      {/* Logout Success Toast */}
      {showLogoutSuccess && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] animate-fadeIn">
          <div className="flex items-center gap-3 bg-[#1a1a1a] border border-[rgba(255,255,255,0.08)] rounded-xl px-5 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
            <div className="w-8 h-8 rounded-full bg-[#4ae176]/10 flex items-center justify-center border border-[#4ae176]/20">
              <span className="material-symbols-outlined text-[18px] text-[#4ae176]">check</span>
            </div>
            <div>
              <p className="text-[13px] font-bold text-white">Signed out successfully</p>
              <p className="text-[11px] text-[#6B6B80]">Your session has been closed securely.</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Main Login Canvas */}
      <main className="relative z-10 w-full max-w-[400px]">
        <div className="bg-[#1a1a1a] border border-[rgba(255,255,255,0.07)] rounded-[16px] px-[24px] py-[32px] w-full">
          {/* Header Section */}
          <div className="mb-8 text-center sm:text-left">
            <h1 className="font-display-lg text-[28px] leading-tight tracking-tight text-white mb-1">
              CFA<span className="text-[#f97316]"> Studio</span>
            </h1>
            <p className="font-body-md text-[13px] text-[#6B6B80] font-medium">
              Admin Portal
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-[12px] text-[#6B6B80] uppercase tracking-wider" htmlFor="email">
                Email
              </label>
              <input 
                {...register('email', { required: 'Email is required' })}
                className="bg-[#262626] border border-[rgba(255,255,255,0.08)] focus:border-[#f97316] focus:ring-[3px] focus:ring-[#f97316]/10 outline-none transition-all h-[40px] rounded-[8px] px-4 font-body-md text-[14px] text-[#EEEEF0] placeholder-[#6B6B80]/50" 
                id="email" 
                placeholder="admin@cfastudio.com" 
                type="email"
                disabled={showSuccess}
              />
              {errors.email && <span className="text-red-500 text-xs mt-1">{errors.email.message}</span>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-[12px] text-[#6B6B80] uppercase tracking-wider" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <input 
                  {...register('password', { required: 'Password is required' })}
                  className="w-full bg-[#262626] border border-[rgba(255,255,255,0.08)] focus:border-[#f97316] focus:ring-[3px] focus:ring-[#f97316]/10 outline-none transition-all h-[40px] rounded-[8px] px-4 font-body-md text-[14px] text-[#EEEEF0] placeholder-[#6B6B80]/50" 
                  id="password" 
                  placeholder="••••••••" 
                  type="password"
                  disabled={showSuccess}
                />
              </div>
              <div className="flex justify-between items-center mt-1">
                {errors.password ? <span className="text-red-500 text-xs">{errors.password.message}</span> : <span></span>}
                <Link to="/forgot-password" className="font-body-md text-[13px] text-[#f97316] hover:text-[#e85a0d] transition-colors font-medium">
                  Forgot password?
                </Link>
              </div>
            </div>
            
            <button 
              disabled={loading || showSuccess}
              className="w-full h-[40px] bg-[#f97316] hover:bg-[#e85a0d] active:scale-[0.98] transition-all rounded-[8px] mt-2 font-label-md text-[14px] text-white disabled:opacity-70 flex items-center justify-center gap-2" 
              type="submit"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                  Signing in...
                </>
              ) : showSuccess ? (
                <>
                  <span className="material-symbols-outlined text-[18px]">check</span>
                  Authenticated
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-[1px] bg-[rgba(255,255,255,0.05)]"></div>
            <span className="font-label-sm text-[12px] text-[#6B6B80] uppercase tracking-wider">OR</span>
            <div className="flex-1 h-[1px] bg-[rgba(255,255,255,0.05)]"></div>
          </div>

          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google Login failed.')}
              theme="filled_black"
              shape="rectangular"
              size="large"
              text="continue_with"
            />
          </div>

          {/* Footer Links */}
          <div className="mt-6 flex flex-col items-center gap-2">
            <div>
              <span className="font-body-md text-[13px] text-[#6B6B80]">Don't have an account? </span>
              <Link to="/signup" className="font-body-md text-[13px] text-[#f97316] hover:text-[#e85a0d] transition-colors font-bold">
                Sign Up
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="mt-8 flex items-center justify-center gap-6 opacity-30">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-on-surface">security</span>
            <span className="font-label-sm text-label-sm text-on-surface">Secure Session</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-on-surface">terminal</span>
            <span className="font-label-sm text-label-sm text-on-surface">v1.0.4</span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;
