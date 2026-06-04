import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1=email, 2=otp, 3=new password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/forgot-password', { email });
      setSuccess('OTP sent! Check your email inbox.');
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.post('/auth/verify-otp', { email, otp });
      if (res.data.success) {
        setResetToken(res.data.data.resetToken);
        setSuccess('OTP verified! Set your new password.');
        setStep(3);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await api.post('/auth/reset-password', { resetToken, newPassword });
      setSuccess('Password reset successfully!');
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const stepTitles = {
    1: { title: 'Forgot Password', sub: 'Enter your email to receive a 6-digit OTP' },
    2: { title: 'Enter OTP', sub: `We sent a code to ${email}` },
    3: { title: 'New Password', sub: 'Choose a strong password for your account' },
  };

  return (
    <div className="min-h-screen bg-[#0e0e0e] flex items-center justify-center px-4">
      <div className="w-full max-w-[400px]">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-[32px] font-headline font-black text-[#f97316] italic tracking-tighter mb-1">CFA</h1>
          <p className="text-[10px] uppercase tracking-[4px] text-[#666] font-headline">Studio Admin Portal</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold transition-all duration-300 ${
                step >= s 
                  ? 'bg-[#f97316] text-white' 
                  : 'bg-[#1a1a1a] border border-white/[0.08] text-[#666]'
              }`}>
                {step > s ? (
                  <span className="material-symbols-outlined text-[16px]">check</span>
                ) : s}
              </div>
              {s < 3 && (
                <div className={`w-8 h-[2px] transition-all duration-300 ${step > s ? 'bg-[#f97316]' : 'bg-white/[0.06]'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-[#1a1a1a] rounded-2xl border border-white/[0.06] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
          <h2 className="text-[18px] font-headline font-bold text-white mb-1">{stepTitles[step].title}</h2>
          <p className="text-[13px] text-[#78716c] mb-6">{stepTitles[step].sub}</p>

          {/* Error / Success */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[13px] flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[13px] flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              {success}
            </div>
          )}

          {/* Step 1: Email */}
          {step === 1 && (
            <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-[#6B6B80]">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-[44px] rounded-xl px-4 bg-[#262626] border border-white/[0.08] text-[#EEEEF0] outline-none focus:ring-2 focus:ring-[#f97316]/30 focus:border-[#f97316] transition-all text-[14px]"
                  placeholder="admin@example.com"
                  required
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full h-[44px] bg-[#f97316] text-white font-headline font-bold text-[14px] rounded-xl hover:bg-[#e85a0d] active:scale-[0.98] transition-all disabled:opacity-70 shadow-[0_4px_14px_rgba(249,115,22,0.3)]"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </span>
                ) : 'Send OTP'}
              </button>
            </form>
          )}

          {/* Step 2: OTP */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-[#6B6B80]">6-Digit OTP</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full h-[52px] rounded-xl px-4 bg-[#262626] border border-white/[0.08] text-[#EEEEF0] outline-none focus:ring-2 focus:ring-[#f97316]/30 focus:border-[#f97316] transition-all text-[24px] text-center tracking-[8px] font-mono font-bold"
                  placeholder="• • • • • •"
                  maxLength={6}
                  required
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full h-[44px] bg-[#f97316] text-white font-headline font-bold text-[14px] rounded-xl hover:bg-[#e85a0d] active:scale-[0.98] transition-all disabled:opacity-70 shadow-[0_4px_14px_rgba(249,115,22,0.3)]"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Verifying...
                  </span>
                ) : 'Verify OTP'}
              </button>
              <button
                type="button"
                onClick={() => { setStep(1); setOtp(''); setError(''); setSuccess(''); }}
                className="text-[13px] text-[#78716c] hover:text-[#f97316] transition-colors"
              >
                ← Resend to a different email
              </button>
            </form>
          )}

          {/* Step 3: New Password */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-[#6B6B80]">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full h-[44px] rounded-xl px-4 bg-[#262626] border border-white/[0.08] text-[#EEEEF0] outline-none focus:ring-2 focus:ring-[#f97316]/30 focus:border-[#f97316] transition-all text-[14px]"
                  placeholder="At least 6 characters"
                  required
                  autoFocus
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-[#6B6B80]">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full h-[44px] rounded-xl px-4 bg-[#262626] border border-white/[0.08] text-[#EEEEF0] outline-none focus:ring-2 focus:ring-[#f97316]/30 focus:border-[#f97316] transition-all text-[14px]"
                  placeholder="Re-enter password"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full h-[44px] bg-[#f97316] text-white font-headline font-bold text-[14px] rounded-xl hover:bg-[#e85a0d] active:scale-[0.98] transition-all disabled:opacity-70 shadow-[0_4px_14px_rgba(249,115,22,0.3)]"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Resetting...
                  </span>
                ) : 'Reset Password'}
              </button>
            </form>
          )}
        </div>

        {/* Back to login */}
        <div className="text-center mt-6">
          <Link to="/" className="text-[13px] text-[#78716c] hover:text-[#f97316] transition-colors">
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
