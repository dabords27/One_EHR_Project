import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search,
  ClipboardCheck,
  Activity,
  FilePlus,
  Filter
} from 'lucide-react';
import { Patient, Department, OperativeRecord } from '../types';
import { StandardDateInput } from './StandardDateInput';

interface DashboardProps {
  onNavigate: (view: 'dashboard' | 'create' | 'view' | 'setup', id: number | null, patient: Patient | null) => void;
  department: Department;
  setActivePatient: (patient: Patient | null) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, department, setActivePatient }) => {

  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formsTodayCount, setFormsTodayCount] = useState(0);

  const [statusFilter, setStatusFilter] = useState('Active');
  const [typeFilter, setTypeFilter] = useState('Inpatient');

  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });

  const [toDate, setToDate] = useState(() =>
    new Date().toISOString().split('T')[0]
  );

  /* ================= FORMS TODAY ================= */

  useEffect(() => {
    const storedRecords: OperativeRecord[] =
      JSON.parse(localStorage.getItem('operative_records') || '[]');

    const todayStr = new Date().toISOString().split('T')[0];

    const count = storedRecords.filter(record =>
      record.record_datetime?.startsWith(todayStr)
    ).length;

    setFormsTodayCount(count);
  }, []);

  /* ================= FETCH ADMISSIONS ================= */

  const fetchAdmissions = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        status: statusFilter === 'All' ? '' : statusFilter,
        type: typeFilter === 'All' ? '' : typeFilter,
        search: searchTerm,
        dateFrom: fromDate,
        dateTo: toDate
      });

      const response = await fetch(`/api/admissions?${params.toString()}`);
      const data = await response.json();

const mapped = data.map((item: any) => ({
  case_id: item.RegistryNo,
  mrn: item.MRN,

  last_name: item.Lastname || '',
  first_name: item.Firstname || '',
  middle_name: item.Middlename || '',

  Age: item.Age ?? '',
  Age2: item.Age2 ?? null,
    extension: item.Extension || '',
  birthdate: item.Birthdate,
  sex: item.Sex,
  patient_type: item.PatientType,
  room_no: item.RoomBedNo ?? '',
  bed_no: '',
  date_admitted: item.AdmissionDateTime,
  status: item.Status
}));

      setPatients(mapped);
    } catch (error) {
      console.error('Error fetching admissions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmissions();
  }, [statusFilter, typeFilter, searchTerm, fromDate, toDate]);

  /* ================= ACTIVE COUNT ================= */

  const [activeAdmissionsCount, setActiveAdmissionsCount] = useState(0);

  const fetchActiveCount = async () => {
    try {
      const response = await fetch('/api/admissions/active-count');
      const data = await response.json();
      setActiveAdmissionsCount(data.count);
    } catch (error) {
      console.error('Error fetching active count:', error);
    }
  };

  useEffect(() => {
    fetchActiveCount();
    const interval = setInterval(fetchActiveCount, 30000);
    return () => clearInterval(interval);
  }, []);

  /* ================= DATE FORMAT ================= */

  const formatDateWithTime = (dateStr: string) => {
    if (!dateStr) return '';

    const clean = dateStr.replace('Z', '');
    const date = new Date(clean);

    return date.toLocaleString('en-US', {
      timeZone: 'Asia/Manila',
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  /* ================= UI ================= */

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-full overflow-hidden">

      {/* Analytics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5">
          <div className="bg-blue-50 p-4 rounded-xl text-blue-600">
            <Users size={28} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Active Admissions
            </p>
            <p className="text-3xl font-black text-slate-800">
              {activeAdmissionsCount}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5">
          <div className="bg-emerald-50 p-4 rounded-xl text-emerald-600">
            <ClipboardCheck size={28} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Forms Today
            </p>
            <p className="text-3xl font-black text-slate-800">
              {formsTodayCount}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-5">
          <div className="bg-sky-50 p-4 rounded-xl text-sky-600">
            <Activity size={28} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Station
            </p>
            <p className="text-sm font-black text-sky-700 uppercase tracking-widest mt-1">
              {department?.description}
            </p>
          </div>
        </div>
      </div>

      {/* FILTER SECTION RESTORED */}
      <div className="bg-slate-100/80 p-6 rounded-[32px] border border-slate-200">
        <div className="flex flex-wrap items-end gap-3 mb-6">

          {/* Search */}
         <div className="flex-1 min-w-[200px]">
  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">
    Patient Name / MRN
  </label>

  <div className="relative">
    <Search
      size={16}
      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
    />
    <input
      type="text"
      placeholder="Search Patient Name or MRN..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className="pl-10 pr-4 py-2.5 w-full bg-slate-100 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-0 focus:border-slate-300 transition-all"
    />
  </div>
</div>

          {/* Status */}
          <div className="w-36">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">
              Status
            </label>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm appearance-none text-sm font-black text-slate-800"
            >
              <option value="Active">Active</option>
              <option value="Discharge">Discharge</option>
              <option value="All">All</option>
            </select>
          </div>

          {/* Type */}
          <div className="w-36">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">
              Type
            </label>
            <select 
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm appearance-none text-sm font-black text-slate-800"
            >
              <option value="All">All</option>
              <option value="Inpatient">Inpatient</option>
              <option value="Outpatient">Outpatient</option>
              <option value="Emergency">Emergency</option>
            </select>
          </div>

          {/* Date Filters */}
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

        {/* TABLE */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-300 border-t-4 border-t-blue-500">
          <table className="w-full text-left border-collapse table-auto">
<thead>
  <tr className="bg-slate-50 border-b border-slate-200">
    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
      Case ID
    </th>
    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
      MRN
    </th>
    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
      Patient Name
    </th>
    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
      Birthdate
    </th>
    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
      Sex
    </th>
    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
      Type
    </th>
    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
      Rm/Bed
    </th>
    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
      Date Admitted
    </th>
    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
      Status
    </th>
  </tr>
</thead>

            <tbody className="divide-y divide-slate-100">
              {patients.map((patient) => (
                <tr
  key={patient.case_id}
  onDoubleClick={() => {
   onNavigate('select-form', null, patient)
  }}
  title="Double Click to Open"
  className="hover:bg-blue-50 cursor-pointer transition-colors"
>
                  <td className="px-3 py-4 text-xs font-bold text-slate-600 text-center">
                    {patient.case_id}
                  </td>

                  <td className="px-3 py-4 text-xs font-bold text-slate-600 text-center">
                    {patient.mrn}
                  </td>

                  <td className="px-3 py-4 text-sm font-black text-slate-900 uppercase group-hover:underline">
                    {patient.last_name}, {patient.first_name} {patient.middle_name} {patient.extension} 
                  </td>

                  <td className="px-3 py-4 text-xs font-bold text-slate-600 text-center">
                    {new Date(patient.birthdate).toLocaleDateString()}
                  </td>

                  <td className="px-3 py-4 text-xs font-bold text-slate-600 text-center">
                    {patient.sex[0]}
                  </td>

                  <td className="px-3 py-4 text-xs font-bold text-slate-600 text-center">
                    {patient.patient_type === 'Inpatient' ? 'IP' :
                     patient.patient_type === 'Emergency' ? 'ER' : 'OP'}
                  </td>

                  <td className="px-3 py-4 text-xs font-bold text-slate-600 text-center">
                    {patient.room_no}
                  </td>

                  <td className="px-3 py-4 text-xs font-bold text-slate-600">
                    {formatDateWithTime(patient.date_admitted)}
                  </td>

                  <td className="px-3 py-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                      patient.status === 'Active'
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {patient.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {patients.length === 0 && !loading && (
            <div className="py-16 text-center text-slate-300">
              <FilePlus size={48} className="mx-auto mb-3 opacity-20" />
              <p className="font-black uppercase text-xs">
                No Patients Found for these Criteria
              </p>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Filter size={14} />
            Double click on a patient row to initialize a new clinical form
          </p>
          <p className="text-xs font-black text-slate-300 uppercase tracking-tight">
            Displaying {patients.length} records
          </p>
        </div>

      </div>
    </div>
  );
};