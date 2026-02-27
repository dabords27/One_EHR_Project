
import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  Download, 
  Clock, 
  User as UserIcon, 
  Monitor, 
  ArrowRightLeft,
  FileText,
  Calendar
} from 'lucide-react';
import { StandardDateInput } from './StandardDateInput';

const MOCK_AUDIT_DATA = [
  {
    id: '1',
    timestamp: '2026-02-13 10:45:12',
    transaction: 'Finalize Progress Note',
    type: 'ADD',
    username: 'PALISOC, JOHN JAYVEE B JR',
    oldValue: '---',
    newValue: 'F - FOCUS: Active Labor...',
    module: 'PROGRESS_NOTES',
    pcName: 'NS-STATION-04-OB'
  },
  {
    id: '2',
    timestamp: '2026-02-13 09:30:05',
    transaction: 'Update Patient Assessment',
    type: 'UPDATE',
    username: 'ADMIN SUPERVISOR',
    oldValue: 'BP: 120/80',
    newValue: 'BP: 140/90',
    module: 'PATIENT_ASSESSMENT',
    pcName: 'ADM-OFFICE-01'
  },
  {
    id: '3',
    timestamp: '2026-02-13 08:15:44',
    transaction: 'Create Form Template',
    type: 'ADD',
    username: 'ADMIN SUPERVISOR',
    oldValue: '---',
    newValue: 'New Operative Record [OTF-V2]',
    module: 'SETUP_FORMS',
    pcName: 'ADM-OFFICE-01'
  },
  {
    id: '4',
    timestamp: '2026-02-12 22:10:19',
    transaction: 'User Activation',
    type: 'UPDATE',
    username: 'ADMIN SUPERVISOR',
    oldValue: 'Status: Deactivated',
    newValue: 'Status: Active',
    module: 'USER_MGMT',
    pcName: 'NS-STATION-01-ER'
  }
];

export const AuditTrail: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Area */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Audit Trail</h2>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">System Governance • Transaction History</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* Advanced Filters */}
      <div className="bg-slate-100/80 p-6 rounded-[32px] border border-slate-200">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[240px]">
            <label className="block text-[11px] font-black text-slate-500 mb-2 pl-1 uppercase tracking-wider">User Fullname</label>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search staff..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 pr-10 outline-none focus:ring-2 focus:ring-sky-500 shadow-sm transition-all text-xs font-black uppercase"
              />
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            </div>
          </div>

          <div className="w-44 flex-shrink-0">
            <label className="block text-[11px] font-black text-slate-500 mb-2 pl-1 uppercase tracking-wider">Module Scope</label>
            <select 
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-sky-500 shadow-sm appearance-none font-black text-[11px] uppercase"
            >
              <option value="All">All Modules</option>
              <option value="PROGRESS_NOTES">Progress Notes</option>
              <option value="PATIENT_ASSESSMENT">Assessment</option>
              <option value="USER_MGMT">User Mgmt</option>
            </select>
          </div>

          <div className="w-40 flex-shrink-0">
            <label className="block text-[11px] font-black text-slate-500 mb-2 pl-1 uppercase tracking-wider">Tx Type</label>
            <select 
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-sky-500 shadow-sm appearance-none font-black text-[11px] uppercase"
            >
              <option value="All">All Types</option>
              <option value="ADD">Additions</option>
              <option value="UPDATE">Updates</option>
            </select>
          </div>

          <div className="flex items-end gap-2 flex-shrink-0">
             <StandardDateInput 
               label="From"
               name="fromDate"
               value={fromDate}
               onChange={(e) => setFromDate(e.target.value)}
               className="w-40"
             />
             <StandardDateInput 
               label="To"
               name="toDate"
               value={toDate}
               onChange={(e) => setToDate(e.target.value)}
               className="w-40"
             />
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-[32px] shadow-xl border border-slate-200 overflow-hidden border-t-8 border-t-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date and Time</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Transaction</th>
                <th className="px-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Type</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Username</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Old Value</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">New Value</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">PC Name</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {MOCK_AUDIT_DATA.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <Clock size={12} className="text-slate-300" />
                      <span className="text-xs font-bold text-slate-600 whitespace-nowrap">{log.timestamp}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-black uppercase text-slate-900">{log.transaction}</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{log.module}</span>
                    </div>
                  </td>
                  <td className="px-4 py-5 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      log.type === 'ADD' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-blue-50 text-blue-600 border border-blue-100'
                    }`}>
                      {log.type}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <UserIcon size={12} className="text-slate-300" />
                      <span className="text-xs font-black text-slate-800 uppercase tracking-tight">{log.username}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="max-w-[150px] truncate text-[11px] font-medium text-slate-400 italic" title={log.oldValue}>
                      {log.oldValue}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="max-w-[150px] truncate text-[11px] font-black text-sky-700 uppercase" title={log.newValue}>
                      {log.newValue}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <Monitor size={12} className="text-slate-300" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase">{log.pcName}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between px-2">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
          <ShieldCheck size={14} className="text-emerald-500" />
          Tamper-evident system logs enabled
        </p>
        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">
          Logs are archived for a period of 10 years per hospital policy
        </p>
      </div>
    </div>
  );
};
