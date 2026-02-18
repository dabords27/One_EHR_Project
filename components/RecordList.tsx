
import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Eye, 
  Edit3, 
  AlertTriangle,
  FileText,
  X,
  Printer,
  ChevronRight,
  ClipboardList,
  Filter,
  Calendar
} from 'lucide-react';
import { OperativeRecord, User, UserRole, FormType, FormTemplate } from '../types';
import { TransactionOverlay, TransactionStatus } from './TransactionOverlay';
import { StandardDateInput } from './StandardDateInput';

interface RecordListProps {
  user: User;
  onEdit: (id: number) => void;
}

export const RecordList: React.FC<RecordListProps> = ({ user, onEdit }) => {
  const [records, setRecords] = useState<OperativeRecord[]>([]);
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  
  // Advanced Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Date Range Filter for Created Forms (Default: 1 week back)
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [viewingRecord, setViewingRecord] = useState<OperativeRecord | null>(null);

  // Transaction State
  const [txStatus, setTxStatus] = useState<TransactionStatus>('idle');
  const [txMsg, setTxMsg] = useState('');

  useEffect(() => {
    const storedRecords = JSON.parse(localStorage.getItem('operative_records') || '[]');
    const storedTemplates = JSON.parse(localStorage.getItem('custom_form_templates') || '[]');
    setRecords(storedRecords.sort((a: any, b: any) => new Date(b.record_datetime || 0).getTime() - new Date(a.record_datetime || 0).getTime()));
    setTemplates(storedTemplates);
  }, []);

  const getTemplateInfo = (templateId?: string, type?: FormType) => {
    const template = templates.find(t => t.id === templateId);
    if (template) return { name: template.name, code: template.code };
    switch(type) {
      case FormType.OPERATIVE_TECHNIQUE: return { name: 'OPERATIVE TECHNIQUE', code: 'OTF-017' };
      case FormType.RECORD_OF_DELIVERY: return { name: 'RECORD OF DELIVERY', code: 'ROD-002' };
      case FormType.PATIENT_ASSESSMENT: return { name: 'PATIENT ASSESSMENT', code: 'PDAO-024' };
      default: return { name: 'LEGACY CLINICAL RECORD', code: 'LCR' };
    }
  };

  const filteredRecords = records.filter(r => {
    const fullName = `${r.last_name}, ${r.first_name}`.toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || r.mrn.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'All' || r.patient_type === typeFilter;
    const matchesStatus = statusFilter === 'All' || r.patient_status === statusFilter;
    
    // Created Date Range Filtering
    let matchesCreatedRange = true;
    if (r.record_datetime) {
      const createdDate = new Date(r.record_datetime);
      createdDate.setHours(0, 0, 0, 0);
      
      const start = new Date(fromDate);
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);
      
      matchesCreatedRange = createdDate >= start && createdDate <= end;
    }

    return matchesSearch && matchesType && matchesStatus && matchesCreatedRange;
  });

  const formatDateWithTime = (dateStr: string | undefined) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      
      return date.toLocaleString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight">EHR Repository</h2>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">Electronic Clinical Records • {user.department}</p>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="bg-slate-100/80 p-6 rounded-[32px] border border-slate-200">
        <div className="flex flex-wrap items-end gap-3">
          {/* Patient Name / MRN */}
          <div className="flex-1 min-w-[240px]">
            <label className="block text-[11px] font-black text-slate-500 mb-2 pl-1 uppercase tracking-wider">Patient Name / MRN</label>
            <div className="relative">
              <input 
                type="text" 
                placeholder="SEARCH..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 pr-10 outline-none focus:ring-2 focus:ring-sky-500 shadow-sm transition-all text-xs font-black uppercase"
              />
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            </div>
          </div>
          
          {/* Patient Type */}
          <div className="w-40 flex-shrink-0">
            <label className="block text-[11px] font-black text-slate-500 mb-2 pl-1 uppercase tracking-wider">Patient Type</label>
            <select 
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-sky-500 shadow-sm appearance-none font-black text-[11px] uppercase"
            >
              <option value="All">ALL TYPES</option>
              <option value="Inpatient">INPATIENT</option>
              <option value="Outpatient">OUTPATIENT</option>
              <option value="Emergency">EMERGENCY</option>
            </select>
          </div>

          {/* Patient Status - Removed Pending */}
          <div className="w-40 flex-shrink-0">
            <label className="block text-[11px] font-black text-slate-500 mb-2 pl-1 uppercase tracking-wider">Patient Status</label>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-sky-500 shadow-sm appearance-none font-black text-[11px] uppercase"
            >
              <option value="All">ALL STATUS</option>
              <option value="Active">ACTIVE</option>
              <option value="Discharged">DISCHARGED</option>
            </select>
          </div>

          {/* Form Creation Date Range */}
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

      {/* Records Table */}
      <div className="bg-white rounded-[32px] shadow-xl border border-slate-200 overflow-hidden border-t-8 border-t-sky-500">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Form Name</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Patient Details</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Admission Date</th>
                <th className="px-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Type</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((record) => {
                  const tInfo = getTemplateInfo(record.form_template_id, record.form_type);
                  return (
                    <tr key={record.id} className="hover:bg-sky-50/30 transition-colors group">
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl ${record.form_type === FormType.OPERATIVE_TECHNIQUE ? 'bg-sky-100 text-sky-600' : 'bg-blue-100 text-blue-600'}`}>
                            <FileText size={18} />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[11px] font-black uppercase tracking-tight text-slate-900 group-hover:text-sky-700 transition-colors">{tInfo.name}</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{tInfo.code}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <p className="text-[14px] font-black text-slate-900 uppercase tracking-tight leading-none mb-1">{record.last_name}, {record.first_name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{record.mrn}</p>
                      </td>
                      <td className="px-6 py-6 text-xs font-bold text-slate-500 whitespace-nowrap">
                        {formatDateWithTime(record.date_admitted)}
                      </td>
                      <td className="px-4 py-6 text-center">
                        <span className="px-2.5 py-1 bg-slate-100 text-[10px] font-black text-slate-500 rounded-md border border-slate-200 uppercase">
                          {record.patient_type === 'Inpatient' ? 'IP' : record.patient_type === 'Emergency' ? 'ER' : 'OP'}
                        </span>
                      </td>
                      <td className="px-6 py-6 whitespace-nowrap text-center">
                        <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase ring-1 ${
                          record.patient_status === 'Active' 
                            ? 'bg-emerald-100 text-emerald-700 ring-emerald-200' 
                            : 'bg-slate-100 text-slate-600 ring-slate-200'
                        }`}>
                          {record.patient_status || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button 
                            onClick={() => setViewingRecord(record)} 
                            className="p-2.5 text-sky-600 bg-white border border-slate-200 hover:bg-sky-50 hover:border-sky-200 rounded-xl transition-all shadow-sm"
                            title="View Document"
                          >
                            <Eye size={18} />
                          </button>
                          <button 
                            onClick={() => onEdit(record.id!)} 
                            className="p-2.5 text-emerald-600 bg-white border border-slate-200 hover:bg-emerald-50 hover:border-emerald-200 rounded-xl transition-all shadow-sm"
                            title="Edit Record"
                          >
                            <Edit3 size={18} />
                          </button>
                          {/* DELETE ACTION REMOVED AS PER REQUIREMENT */}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center opacity-20">
                      <ClipboardList size={64} className="mb-4" />
                      <p className="font-black uppercase text-xs tracking-[0.5em]">Clinical Repository Empty</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between px-2">
         <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Filter size={14} className="text-slate-300" />
            Showing {filteredRecords.length} synchronized clinical records
         </p>
         <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">
            Records are immutable after final medical validation
         </p>
      </div>

      <TransactionOverlay status={txStatus} message={txMsg} onClose={() => setTxStatus('idle')} />

      {/* View Record Modal */}
      {viewingRecord && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/95 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-white rounded-[40px] shadow-2xl max-w-5xl w-full animate-in slide-in-from-bottom-4 duration-500 relative my-auto print:shadow-none print:rounded-none">
             {/* Header */}
             <div className="sticky top-0 bg-slate-50 border-b border-slate-200 px-8 py-4 flex items-center justify-between rounded-t-[40px] z-10 print:hidden">
                <div className="flex items-center gap-4">
                   <div className={`${viewingRecord.form_type === FormType.OPERATIVE_TECHNIQUE ? 'bg-sky-600' : 'bg-emerald-600'} p-2.5 rounded-xl text-white`}>
                      <FileText size={20} />
                   </div>
                   <div className="flex flex-col">
                      <h3 className="font-black text-slate-800 uppercase tracking-tight text-sm leading-none mb-1">Document Archive</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">MRN: {viewingRecord.mrn}</p>
                   </div>
                </div>
                <div className="flex items-center gap-2">
                   <button onClick={() => window.print()} className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all shadow-sm"><Printer size={16} /> Print Document</button>
                   <button onClick={() => setViewingRecord(null)} className="p-2.5 text-slate-400 hover:bg-rose-50 hover:text-rose-500 rounded-xl transition-all"><X size={24} /></button>
                </div>
             </div>
             {/* Simple Body */}
             <div className="p-16 medical-font">
                <div className="text-center mb-12">
                   <h1 className="text-3xl font-black text-slate-900 uppercase mb-1 leading-none">Julius K. Quiambao Medical & Wellness Center</h1>
                   <p className="text-sm font-bold text-slate-500 uppercase tracking-[0.2em] mt-3">Clinical Operations Record</p>
                   <div className="h-0.5 bg-slate-900 w-full mt-8"></div>
                </div>
                <div className="border-[3px] border-slate-900 p-10 rounded-2xl">
                   <p className="text-[10px] font-black uppercase text-slate-500 mb-4 tracking-[0.2em]">Verified Patient Profile</p>
                   <p className="text-3xl font-black uppercase mb-10 tracking-tight">{viewingRecord.last_name}, {viewingRecord.first_name} • MRN {viewingRecord.mrn}</p>
                   
                   <div className="grid grid-cols-2 gap-8 mb-12 text-sm border-t border-slate-100 pt-8">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Date Admitted</p>
                        <p className="font-bold">{formatDateWithTime(viewingRecord.date_admitted)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Admission Type</p>
                        <p className="font-bold uppercase">{viewingRecord.patient_type}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Diagnosis</p>
                        <p className="font-medium uppercase">{viewingRecord.pre_operative_diagnosis || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Record Creation</p>
                        <p className="font-bold">{formatDateWithTime(viewingRecord.record_datetime)}</p>
                      </div>
                   </div>

                   <p className="text-[11px] text-slate-400 italic font-black uppercase tracking-widest border-t border-slate-100 pt-6">Medical validation completed. Data integrity locked in secure hospital archives.</p>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
