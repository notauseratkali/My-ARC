import React from 'react';
import { ShieldAlert, RefreshCw, LogOut } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  declare props: Props;
  state: State = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: React.ErrorInfo, errorInfo: React.ErrorInfo) {
    console.error('Unhandled Portal Error caught by ErrorBoundary:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleResetSession = () => {
    localStorage.clear();
    window.location.href = './';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0E1015] text-slate-100 flex items-center justify-center p-4">
          <div className="bg-[#161920] border border-red-500/30 rounded-2xl p-8 max-w-lg w-full space-y-6 shadow-2xl text-center">
            <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-center mx-auto text-red-400">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-100">Portal View Recovered</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                An unforeseen rendering state occurred in the current portal view. The error boundary prevented a system crash.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="bg-[#12151B] p-3 rounded-xl border border-slate-800 text-left font-mono text-[11px] text-red-300 overflow-x-auto max-h-32">
                {this.state.error.message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-lg"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Portal</span>
              </button>
              <button
                onClick={this.handleResetSession}
                className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-5 py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer border border-slate-700"
              >
                <LogOut className="w-4 h-4" />
                <span>Reset Local Cache</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
