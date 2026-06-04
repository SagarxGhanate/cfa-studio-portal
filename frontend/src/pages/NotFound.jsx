import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-[#0e0e0e] flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        {/* 404 number */}
        <h1 className="text-[120px] md:text-[160px] font-headline font-black leading-none bg-gradient-to-b from-[#f97316] to-[#ea580c]/30 bg-clip-text text-transparent select-none">
          404
        </h1>

        {/* Message */}
        <h2 className="text-[22px] font-headline font-bold text-[#e5e2e1] -mt-4 mb-3">
          Page not found
        </h2>
        <p className="text-[14px] text-[#78716c] leading-relaxed mb-8">
          The page you're looking for doesn't exist or has been moved. Let's get you back on track.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link 
            to="/dashboard" 
            className="px-6 py-2.5 bg-[#f97316] text-white font-headline font-bold text-[13px] rounded-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">dashboard</span>
            Go to Dashboard
          </Link>
          <Link 
            to="/members" 
            className="px-6 py-2.5 bg-[#1a1a1a] border border-white/[0.08] text-[#e5e2e1] font-headline font-bold text-[13px] rounded-lg hover:bg-white/[0.04] transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">group</span>
            View Members
          </Link>
        </div>

        {/* Decorative gradient glow */}
        <div className="mt-16 w-48 h-1 mx-auto rounded-full bg-gradient-to-r from-transparent via-[#f97316]/30 to-transparent"></div>
      </div>
    </div>
  );
};

export default NotFound;
