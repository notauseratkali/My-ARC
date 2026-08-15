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
        <div className="min-h-screen bg-slate-100 text-slate-900 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-lg w-full space-y-6 shadow-xl text-center">
            <div className="w-16 h-16 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-center mx-auto text-[#800020]">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-900">Portal View Recovered</h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                An unforeseen rendering state occurred in the current portal view. The error boundary prevented a system crash.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="bg-rose-50/50 p-3 rounded-xl border border-rose-200 text-left font-mono text-[11px] text-[#800020] overflow-x-auto max-h-32">
                {this.state.error.message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="w-full sm:w-auto bg-[#800000] hover:bg-[#6b0000] text-white !text-white font-bold px-5 py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <RefreshCw className="w-4 h-4 text-white" />
                <span>Reload Portal</span>
              </button>
              <button
                onClick={this.handleResetSession}
                className="w-full sm:w-auto bg-[#FFF0F0] hover:bg-white text-[#800000] font-bold px-5 py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer border border-[#FF9999] shadow-xs"
              >
                <LogOut className="w-4 h-4 text-[#800000]" />
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
