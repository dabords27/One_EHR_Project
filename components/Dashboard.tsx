
import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  ChevronRight,
  ClipboardCheck,
  Activity,
  FilePlus,
  Calendar,
  Filter
} from 'lucide-react';
import { Patient, Department, OperativeRecord } from '../types';
import { StandardDateInput } from './StandardDateInput';

// Mock Admission Data
const ADMISSION_LIST: Patient[] = [
  {
    case_id: 'IP-2025-0001',
    mrn: '2025-0003',
    last_name: 'SAMPLE',
    first_name: 'INPATIENT',
    middle_name: 'GIT',
    extension: '',
    birthdate: '1999-12-12',
    sex: 'Female',
    patient_type: 'Inpatient',
    room_no: '412',
    bed_no: '2',
    date_admitted: '2025-12-13 08:00 AM',
    status: 'Active'
  },
  {
    case_id: 'IP-2025-0002',
    mrn: '2025-0004',
    last_name: 'PALISOC',
    first_name: 'JOHN JAYVEE',
    middle_name: 'B',
    extension: 'JR',
    birthdate: '1995-05-20',
    sex: 'Female',
    patient_type: 'Inpatient',
    room_no: '302',
    bed_no: '1',
    date_admitted: '2026-02-13 10:30 AM',
    status: 'Active'
  },
  {
    case_id: 'ER-2025-0003',
    mrn: '2025-0005',
    last_name: 'QUINTOS',
    first_name: 'MARK',
    middle_name: 'R',
    extension: '',
    birthdate: '1990-08-15',
    sex: 'Male',
    patient_type: 'Emergency',
    room_no: 'ER-1',
    bed_no: 'A',
    date_admitted: '2025-02-14 09:00 AM',
    status: 'Active'
  },
  {
    case_id: 'IP-2025-0004',
    mrn: '2025-0006',
    last_name: 'DELA CRUZ',
    first_name: 'ANA',
    middle_name: 'M',
    extension: '',
    birthdate: '1988-11-25',
    sex: 'Female',
    patient_type: 'Inpatient',
    room_no: '205',
    bed_no: '1',
    date_admitted: '2025-01-20 11:15 AM',
    status: 'Discharged'
  },
  {
    case_id: 'ER-2025-0005',
    mrn: '2025-0007',
    last_name: 'SANTOS',
    first_name: 'MARIA CLARA',
    middle_name: 'L',
    extension: '',
    birthdate: '1992-03-10',
    sex: 'Female',
    patient_type: 'Emergency',
    room_no: 'ER-2',
    bed_no: 'B',
    date_admitted: '2025-02-10 11:30 PM',
    status: 'Discharged'
  }
];

interface DashboardProps {
  onNavigate: (view: 'dashboard' | 'create' | 'view' | 'setup', id: number | null, patient: Patient | null) => void;
  department: Department;
  setActivePatient: (patient: Patient | null) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, department, setActivePatient }) => {
  const [patients, setPatients] = useState<Patient[]>(ADMISSION_LIST);
  const [searchTerm, setSearchTerm] = useState('');
  const [formsTodayCount, setFormsTodayCount] = useState(0);
  
  const [statusFilter, setStatusFilter] = useState('Active');
  const [typeFilter, setTypeFilter] = useState('Inpatient');
  
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  
  const [toDate, setToDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  useEffect(() => {
    // Calculate forms created today
    const storedRecords: OperativeRecord[] = JSON.parse(localStorage.getItem('operative_records') || '[]');
    const todayStr = new Date().toISOString().split('T')[0];
    
    const count = storedRecords.filter(record => {
      if (!record.record_datetime) return false;
      return record.record_datetime.startsWith(todayStr);
    }).length;
    
    setFormsTodayCount(count);
  }, []);

  const formatDateWithTime = (dateStr: string) => {
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

  const filteredPatients = patients.filter(p => {
    const fullName = `${p.last_name} ${p.first_name} ${p.middle_name} ${p.extension || ''}`.toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || p.mrn.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    const matchesType = typeFilter === 'All' || p.patient_type === typeFilter;
    
    const admitDate = new Date(p.date_admitted);
    admitDate.setHours(0, 0, 0, 0);
    
    let matchesDate = true;
    if (fromDate) {
      const start = new Date(fromDate);
      start.setHours(0, 0, 0, 0);
      if (admitDate < start) matchesDate = false;
    }
    if (toDate) {
      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);
      if (admitDate > end) matchesDate = false;
    }

    return matchesSearch && matchesStatus && matchesType && matchesDate;
  });

  // Calculate active admissions based on Inpatient active status only
  const activeAdmissionsCount = patients.filter(p => p.status === 'Active' && p.patient_type === 'Inpatient').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-full overflow-hidden">
      {/* Analytics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5">
          <div className="bg-blue-50 p-4 rounded-xl text-blue-600">
            <Users size={28} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-0.5">Active Admissions</p>
            <p className="text-3xl font-black text-slate-800 tracking-tighter leading-none">{activeAdmissionsCount}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5">
          <div className="bg-emerald-50 p-4 rounded-xl text-emerald-600">
            <ClipboardCheck size={28} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-0.5">Forms Today</p>
            <p className="text-3xl font-black text-slate-800 tracking-tighter leading-none">{formsTodayCount}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5">
          <div className="bg-sky-50 p-4 rounded-xl text-sky-600">
            <Activity size={28} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-0.5">Station</p>
            <p className="text-sm font-black text-sky-700 uppercase tracking-widest mt-1">
              {department}
            </p>
          </div>
        </div>
      </div>

      {/* Patient Finder Section */}
      <div className="bg-slate-100/80 p-6 rounded-[32px] border border-slate-200">
        <div className="flex flex-wrap items-end gap-3 mb-6">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[11px] font-bold text-slate-500 mb-2 pl-1 uppercase tracking-wider">Patient Name / MRN</label>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 pr-10 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all text-sm font-medium"
              />
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            </div>
          </div>
          
          <div className="w-36 flex-shrink-0">
            <label className="block text-[11px] font-bold text-slate-500 mb-2 pl-1 uppercase tracking-wider">Status</label>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm appearance-none font-medium text-sm"
            >
              <option value="Active">Active</option>
              <option value="Discharged">Discharged</option>
              <option value="All">All</option>
            </select>
          </div>

          <div className="w-36 flex-shrink-0">
            <label className="block text-[11px] font-bold text-slate-500 mb-2 pl-1 uppercase tracking-wider">Type</label>
            <select 
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm appearance-none font-medium text-sm"
            >
              <option value="All">All</option>
              <option value="Inpatient">Inpatient</option>
              <option value="Outpatient">Outpatient</option>
              <option value="Emergency">Emergency</option>
            </select>
          </div>

          <div className="flex items-end gap-2">
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

        {/* Patient Table */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-300 border-t-4 border-t-blue-500">
          <div className="w-full overflow-hidden">
            <table className="w-full text-left border-collapse table-auto">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-black text-slate-600 uppercase tracking-tight border-b border-slate-300">
                  <th className="px-3 py-4 whitespace-nowrap">Case ID</th>
                  <th className="px-3 py-4 whitespace-nowrap">MRN</th>
                  <th className="px-3 py-4 whitespace-nowrap">Patient Name</th>
                  <th className="px-3 py-4 whitespace-nowrap text-center">Birthdate</th>
                  <th className="px-2 py-4 whitespace-nowrap text-center">Sex</th>
                  <th className="px-3 py-4 whitespace-nowrap text-center">Type</th>
                  <th className="px-3 py-4 whitespace-nowrap text-center">Rm/Bed</th>
                  <th className="px-3 py-4 whitespace-nowrap">Date Admitted</th>
                  <th className="px-3 py-4 whitespace-nowrap text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPatients.map((patient) => (
                  <tr 
                    key={patient.case_id} 
                    onClick={() => {
                      setActivePatient(patient);
                      onNavigate('create', null, patient);
                    }}
                    className="hover:bg-blue-50 cursor-pointer transition-colors group"
                  >
                    <td className="px-3 py-4 text-xs font-bold text-slate-500 whitespace-nowrap">{patient.case_id}</td>
                    <td className="px-3 py-4 text-xs font-bold text-slate-600 whitespace-nowrap">{patient.mrn}</td>
                    <td className="px-3 py-4 text-sm font-black text-slate-900 uppercase whitespace-nowrap">
                      {patient.last_name}, {patient.first_name} {patient.middle_name ? patient.middle_name[0] + '.' : ''} {patient.extension || ''}
                    </td>
                    <td className="px-3 py-4 text-xs font-bold text-slate-600 whitespace-nowrap text-center">
                      {new Date(patient.birthdate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
                    </td>
                    <td className="px-2 py-4 text-xs font-black text-slate-600 whitespace-nowrap text-center">{patient.sex[0]}</td>
                    <td className="px-3 py-4 text-xs font-bold text-slate-500 whitespace-nowrap text-center">
                      {patient.patient_type === 'Inpatient' ? 'IP' : patient.patient_type === 'Emergency' ? 'ER' : 'OP'}
                    </td>
                    <td className="px-3 py-4 text-xs font-bold text-slate-600 text-center whitespace-nowrap">
                      {patient.room_no}{patient.bed_no ? `-${patient.bed_no}` : ''}
                    </td>
                    <td className="px-3 py-4 text-xs font-bold text-slate-500 whitespace-nowrap">
                      {formatDateWithTime(patient.date_admitted)}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ring-1 ${
                        patient.status === 'Active' 
                          ? 'bg-emerald-50 text-emerald-600 ring-emerald-100' 
                          : 'bg-slate-50 text-slate-400 ring-slate-100'
                      }`}>
                        {patient.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredPatients.length === 0 && (
            <div className="py-16 text-center text-slate-300">
              <FilePlus size={48} className="mx-auto mb-3 opacity-20" />
              <p className="font-black uppercase text-xs">No Patients Found for these Criteria</p>
            </div>
          )}
        </div>
        
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Filter size={14} className="text-slate-300" />
            Click on a patient row to initialize a new clinical form for that patient
          </p>
          <p className="text-xs font-black text-slate-300 uppercase tracking-tight">
            Displaying {filteredPatients.length} records
          </p>
        </div>
      </div>
    </div>
  );
};
