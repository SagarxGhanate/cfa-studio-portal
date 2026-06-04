import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0e0e0e] flex items-center justify-center px-6">
          <div className="text-center max-w-md">
            {/* Error icon */}
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-red-400 text-[40px]">error</span>
            </div>

            <h2 className="text-[22px] font-headline font-bold text-[#e5e2e1] mb-3">
              Something went wrong
            </h2>
            <p className="text-[14px] text-[#78716c] leading-relaxed mb-2">
              The app encountered an unexpected error. This usually resolves after a refresh.
            </p>
            
            {/* Error details (collapsed) */}
            {this.state.error && (
              <details className="text-left mb-6 mt-4">
                <summary className="text-[12px] text-[#78716c] cursor-pointer hover:text-[#a8a29e] transition-colors">
                  Show error details
                </summary>
                <pre className="mt-2 p-3 bg-[#1a1a1a] border border-white/[0.06] rounded-lg text-[11px] text-red-400/80 overflow-x-auto whitespace-pre-wrap">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={this.handleReload}
                className="px-6 py-2.5 bg-[#f97316] text-white font-headline font-bold text-[13px] rounded-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">refresh</span>
                Reload App
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2.5 bg-[#1a1a1a] border border-white/[0.08] text-[#e5e2e1] font-headline font-bold text-[13px] rounded-lg hover:bg-white/[0.04] transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">restart_alt</span>
                Hard Refresh
              </button>
            </div>

            <div className="mt-12 w-48 h-1 mx-auto rounded-full bg-gradient-to-r from-transparent via-red-500/20 to-transparent"></div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
