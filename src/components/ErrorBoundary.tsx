import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends (Component as any) {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in application:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleResetCache = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.error('Failed to clear storage:', e);
    }
    window.location.reload();
  };

  render() {
    const { hasError, error, errorInfo } = this.state as State;

    if (hasError) {
      return (
        <div className="min-h-screen bg-[#0E1015] text-slate-100 flex items-center justify-center p-4 font-sans">
          <div className="max-w-lg w-full bg-[#161920] border border-amber-500/30 rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-100">My Rovers Portal Notice</h1>
                <p className="text-xs text-slate-400">An unexpected issue occurred while loading this view.</p>
              </div>
            </div>

            <div className="bg-[#101217] border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs">
              <div className="font-semibold text-rose-400 font-mono">
                {error?.name}: {error?.message || 'Unknown render exception'}
              </div>
              {errorInfo?.componentStack && (
                <div className="max-h-32 overflow-y-auto text-[10px] font-mono text-slate-500 bg-slate-950 p-2 rounded">
                  {errorInfo.componentStack}
                </div>
              )}
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              If this happened on GitHub Pages or a new environment, clearing the browser cache or reloading usually fixes state sync issues.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Application</span>
              </button>

              <button
                type="button"
                onClick={this.handleResetCache}
                className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-amber-400" />
                <span>Reset Local Cache</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (this.props as Props).children;
  }
}
