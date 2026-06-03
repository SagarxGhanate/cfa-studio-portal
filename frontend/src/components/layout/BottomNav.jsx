import { Link, useLocation } from 'react-router-dom';

const BottomNav = () => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <>
      {/* Content Spacer for Mobile Nav */}
      <div className="h-[52px] md:hidden"></div>
      
      <nav className="fixed bottom-0 w-full z-50 md:hidden bg-surface border-t border-outline-variant backdrop-blur-lg bg-surface/90 h-[52px]">
        <div className="flex justify-around items-center h-full px-4 pb-safe">
          <Link 
            to="/dashboard" 
            className={`flex flex-col items-center justify-center px-4 py-1 active:bg-surface-variant transition-transform active:scale-95 ${isActive('/dashboard') ? 'bg-primary-container/20 text-primary rounded-xl' : 'text-on-surface-variant'}`}
          >
            <span className="material-symbols-outlined text-[24px]">home</span>
            <span className="font-label-sm text-label-sm">Home</span>
          </Link>
          
          <Link 
            to="/members" 
            className={`flex flex-col items-center justify-center px-4 py-1 active:bg-surface-variant transition-transform active:scale-95 ${isActive('/members') ? 'bg-primary-container/20 text-primary rounded-xl' : 'text-on-surface-variant'}`}
          >
            <span className="material-symbols-outlined text-[24px]">group</span>
            <span className="font-label-sm text-label-sm">Members</span>
          </Link>
          
          <Link 
            to="/analytics" 
            className={`flex flex-col items-center justify-center px-4 py-1 active:bg-surface-variant transition-transform active:scale-95 ${isActive('/analytics') ? 'bg-primary-container/20 text-primary rounded-xl' : 'text-on-surface-variant'}`}
          >
            <span className="material-symbols-outlined text-[24px]">bar_chart</span>
            <span className="font-label-sm text-label-sm">Analytics</span>
          </Link>
        </div>
      </nav>
    </>
  );
};

export default BottomNav;
