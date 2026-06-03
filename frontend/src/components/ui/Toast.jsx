import { useState, useEffect, useCallback, createContext, useContext } from 'react';

const ToastContext = createContext(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

const ICONS = {
  success: 'check_circle',
  error: 'error',
  info: 'info',
  warning: 'warning',
};

const COLORS = {
  success: { bg: 'rgba(74,225,118,0.12)', border: 'rgba(74,225,118,0.25)', text: '#4ae176' },
  error: { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.25)', text: '#EF4444' },
  info: { bg: 'rgba(141,205,255,0.12)', border: 'rgba(141,205,255,0.25)', text: '#8dcdff' },
  warning: { bg: 'rgba(255,181,150,0.12)', border: 'rgba(255,181,150,0.25)', text: '#ffb596' },
};

const Toast = ({ id, message, type = 'info', onDismiss }) => {
  const [isExiting, setIsExiting] = useState(false);
  const color = COLORS[type] || COLORS.info;

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onDismiss(id), 300);
    }, 3500);
    return () => clearTimeout(timer);
  }, [id, onDismiss]);

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] min-w-[280px] max-w-[420px] transition-all duration-300 ${isExiting ? 'opacity-0 translate-x-8' : 'opacity-100 translate-x-0'}`}
      style={{ backgroundColor: color.bg, borderColor: color.border }}
    >
      <span className="material-symbols-outlined text-[20px] shrink-0" style={{ color: color.text }}>
        {ICONS[type]}
      </span>
      <p className="text-[13px] font-medium text-[#EEEEF0] flex-1">{message}</p>
      <button
        onClick={() => { setIsExiting(true); setTimeout(() => onDismiss(id), 300); }}
        className="text-[#6B6B80] hover:text-white transition-colors shrink-0"
      >
        <span className="material-symbols-outlined text-[16px]">close</span>
      </button>
    </div>
  );
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = {
    success: (msg) => addToast(msg, 'success'),
    error: (msg) => addToast(msg, 'error'),
    info: (msg) => addToast(msg, 'info'),
    warning: (msg) => addToast(msg, 'warning'),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto animate-fadeIn">
            <Toast id={t.id} message={t.message} type={t.type} onDismiss={dismissToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
