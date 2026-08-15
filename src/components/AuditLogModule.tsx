import React, { useState } from 'react';
import { AuditLogEntry, AuditLogCategory, Member } from '../types';
import {
  History,
  Search,
  Filter,
  Users,
  Shield,
  CreditCard,
  Vote,
  ShieldAlert,
  Calendar,
  Settings,
  Download,
  Clock,
  UserCheck,
  CheckCircle2,
  FileText,
  Sparkles,
} from 'lucide-react';

interface AuditLogModuleProps {
  currentMember: Member;
  auditLogs: AuditLogEntry[];
}

export const AuditLogModule: React.FC<AuditLogModuleProps> = ({
  currentMember,
  auditLogs = [],
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<AuditLogCategory | 'All'>('All');

  const isCouncil = currentMember.councilRole !== 'Member';

  if (!isCouncil) {
    return (
      <div className="bg-rose-50 border border-rose-200 p-6 rounded-2xl text-center space-y-3 text-slate-900">
        <ShieldAlert className="w-10 h-10 text-[#800020] mx-auto" />
        <h3 className="text-lg font-bold text-[#800020]">Access Restricted</h3>
        <p className="text-xs text-slate-600 max-w-md mx-auto">
          The Organisation Audit Trail is restricted to Executive Council officers to maintain governance transparency and security.
        </p>
      </div>
    );
  }

  const filteredLogs = auditLogs.filter((log) => {
    if (categoryFilter !== 'All' && log.category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        (log.action || '').toLowerCase().includes(q) ||
        (log.performedByMemberName || '').toLowerCase().includes(q) ||
        (log.performedByRole || '').toLowerCase().includes(q) ||
        (log.targetName && log.targetName.toLowerCase().includes(q)) ||
        (log.details || '').toLowerCase().includes(q) ||
        (log.timestamp || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getCategoryBadge = (category: AuditLogCategory) => {
    switch (category) {
      case 'Member Management':
        return (
          <span className="bg-emerald-50 text-[#006B3F] border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1">
            <Users className="w-3 h-3 text-[#006B3F]" />
            <span>Member Management</span>
          </span>
        );
      case 'Council Governance':
        return (
          <span className="bg-blue-50 text-[#002B7F] border border-blue-200 px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1">
            <Shield className="w-3 h-3 text-[#002B7F]" />
            <span>Council Governance</span>
          </span>
        );
      case 'Finance':
        return (
          <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1">
            <CreditCard className="w-3 h-3 text-amber-700" />
            <span>Finance & Dues</span>
          </span>
        );
      case 'Policy & Referendums':
        return (
          <span className="bg-blue-50 text-[#002B7F] border border-blue-200 px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1">
            <Vote className="w-3 h-3 text-[#002B7F]" />
            <span>Policy & Referendums</span>
          </span>
        );
      case 'Disciplinary':
        return (
          <span className="bg-rose-50 text-[#800020] border border-rose-200 px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-[#800020]" />
            <span>Disciplinary</span>
          </span>
        );
      case 'Events & Attendance':
        return (
          <span className="bg-emerald-50 text-[#006B3F] border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1">
            <Calendar className="w-3 h-3 text-[#006B3F]" />
            <span>Events & Attendance</span>
          </span>
        );
      default:
        return (
          <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1">
            <Settings className="w-3 h-3 text-slate-500" />
            <span>System</span>
          </span>
        );
    }
  };

  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      alert('No audit logs available to export.');
      return;
    }
    const headers = ['Timestamp', 'Category', 'Action', 'Performed By Name', 'Performed By Role', 'Target Member', 'Details'];
    const rows = filteredLogs.map((log) => [
      `"${log.timestamp}"`,
      `"${log.category}"`,
      `"${log.action}"`,
      `"${log.performedByMemberName}"`,
      `"${log.performedByRole}"`,
      `"${log.targetName || 'N/A'}"`,
      `"${log.details.replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `organisation_audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fadeIn text-slate-900">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-6 h-6 text-[#002B7F]" />
            <h2 className="text-xl font-bold text-slate-900 font-serif">
              Organisation Audit Trail & Change Logs
            </h2>
            <span className="bg-blue-50 text-[#002B7F] border border-blue-200 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <Shield className="w-3 h-3" />
              Council Visible
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Complete transparency record capturing who changed what in the organisation. All member detail updates, council position edits, financial drives, policy referendums, and disciplinary entries are logged in real-time.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="bg-[#002B7F] hover:bg-blue-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-2 transition self-start md:self-center cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Export Audit Log (CSV)</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by officer, action, target, or detail..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as AuditLogCategory | 'All')}
            className="bg-slate-50 border border-slate-300 text-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 font-semibold w-full sm:w-auto cursor-pointer"
          >
            <option value="All">All Categories ({auditLogs.length})</option>
            <option value="Member Management">Member Management</option>
            <option value="Council Governance">Council Governance</option>
            <option value="Finance">Finance & Dues</option>
            <option value="Policy & Referendums">Policy & Referendums</option>
            <option value="Disciplinary">Disciplinary</option>
            <option value="Events & Attendance">Events & Attendance</option>
            <option value="System">System & Settings</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-700 bg-slate-50/50">
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-[#002B7F]" />
            <span>Audit Records ({filteredLogs.length})</span>
          </span>
          <span className="text-slate-500 font-mono text-[11px]">
            Real-time Firestore Synchronized
          </span>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <FileText className="w-10 h-10 text-slate-400 mx-auto" />
            <p className="text-sm font-medium">No audit log entries found matching filter.</p>
            <p className="text-xs text-slate-500">
              When council members perform actions (editing member details, updating policy, logging payments, etc.), log records will automatically appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 max-h-[650px] overflow-y-auto">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 hover:bg-slate-50 transition flex flex-col md:flex-row md:items-start justify-between gap-3 text-xs"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {getCategoryBadge(log.category)}
                    <span className="font-bold text-slate-900 text-sm">{log.action}</span>
                    {log.targetName && (
                      <span className="bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1">
                        <Users className="w-3 h-3 text-[#006B3F]" />
                        Target: <strong className="text-[#006B3F]">{log.targetName}</strong>
                      </span>
                    )}
                  </div>

                  <p className="text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200 font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
                    {log.details}
                  </p>
                </div>

                <div className="md:text-right flex-shrink-0 space-y-1 text-[11px]">
                  <div className="text-slate-600 flex items-center md:justify-end gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-[#002B7F]" />
                    <span>By: </span>
                    <strong className="text-slate-900">{log.performedByMemberName}</strong>
                    <span className="text-[#800020] font-mono text-[10px] bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                      ({log.performedByRole})
                    </span>
                  </div>
                  <div className="text-slate-400 font-mono flex items-center md:justify-end gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{log.timestamp}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
