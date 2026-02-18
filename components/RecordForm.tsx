
import React, { useState, useEffect } from 'react';
import { 
  Save, 
  ArrowLeft, 
  ArrowRight, 
  FileText, 
  Search, 
  X,
  FilePlus,
  AlertTriangle,
  Info
} from 'lucide-react';
import { OperativeRecord, FormType, Patient, Department, FormTemplate, FormStatus, AuditLog } from '../types';
import { OperativeTechniqueForm } from './forms/OperativeTechniqueForm';
import { PatientAssessmentForm } from './forms/PatientAssessmentForm';
import { RecordOfDeliveryForm } from './forms/RecordOfDeliveryForm';
import { StandardDateInput } from './StandardDateInput';
import { TransactionOverlay, TransactionStatus } from './TransactionOverlay';
import { CredentialConfirmationModal } from './CredentialConfirmationModal';

// Mock Admission Data (Consistent with Dashboard)
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
  }
];

interface RecordFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  editId: number | null;
  selectedPatient: Patient | null;
  department: Department;
  setActivePatient: (patient: Patient | null) => void;
  user: any; // Added user prop for credential check
}

export const RecordForm: React.FC<RecordFormProps> = ({ 
  onSuccess, 
  onCancel, 
  editId, 
  selectedPatient, 
  department,
  setActivePatient,
  user
}) => {
  const [localPatient, setLocalPatient] = useState<Patient | null>(selectedPatient);
  const [activeTemplate, setActiveTemplate] = useState<FormTemplate | null>(null);
  const [formType, setFormType] = useState<FormType | null>(null);
  const [page, setPage] = useState(1);
  const [availableTemplates, setAvailableTemplates] = useState<FormTemplate[]>([]);
  
  const [txStatus, setTxStatus] = useState<TransactionStatus>('idle');
  const [txMsg, setTxMsg] = useState('');
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [showCredentialModal, setShowCredentialModal] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Active');
  const [typeFilter, setTypeFilter] = useState('All');
  
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  
  const [toDate, setToDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [formData, setFormData] = useState<any>({
    date_time: new Date().toLocaleString(),
    pre_operative_diagnosis: '',
    post_operative_diagnosis: '',
    technique: '',
    operative_findings: '',
    reportable_events: 'false',
    ebl: '',
    urine_output: '',
    attending_surgeon_name: '',
    anesthesiologist_name: '',
    history_from: '',
    history_from_others: '',
    reliability: ''
  });

  useEffect(() => {
    const savedTemplates: FormTemplate[] = JSON.parse(localStorage.getItem('custom_form_templates') || '[]');
    const filtered = savedTemplates.filter(t => {
      const isTagged = (t.departmentTags || []).some(tag => 
        tag.trim().toUpperCase() === department.trim().toUpperCase()
      );
      const isActive = t.status === FormStatus.ACTIVE;
      return isTagged && isActive;
    });
    setAvailableTemplates(filtered);

    if (editId) {
      const stored = JSON.parse(localStorage.getItem('operative_records') || '[]');
      const record = stored.find((r: any) => r.id === editId);
      if (record) {
        setFormData(record);
        setFormType(record.form_type);
        const template = savedTemplates.find(t => t.id === record.form_template_id);
        if (template) setActiveTemplate(template);
      }
    } else if (localPatient) {
      setFormData((prev: any) => ({
        ...prev,
        last_name: localPatient.last_name,
        first_name: localPatient.first_name,
        middle_name: localPatient.middle_name,
        mrn: localPatient.mrn,
        birthdate: localPatient.birthdate,
        age: calculateAge(localPatient.birthdate),
        room_no: localPatient.room_no,
        sex: localPatient.sex,
        patient_type: localPatient.patient_type,
        date_admitted: localPatient.date_admitted,
        patient_status: localPatient.status
      }));
    }
  }, [localPatient, editId, department]);

  function calculateAge(dob: string) {
    if (!dob) return '';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const newErrs = { ...prev };
        delete newErrs[name];
        return newErrs;
      });
    }
  };

  const handleSelectTemplate = (template: FormTemplate) => {
    setActiveTemplate(template);
    setFormType(template.baseModule);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.pre_operative_diagnosis?.trim()) newErrors.pre_operative_diagnosis = 'Required';
    if (!formData.post_operative_diagnosis?.trim()) newErrors.post_operative_diagnosis = 'Required';
    
    if (formType === FormType.OPERATIVE_TECHNIQUE) {
      if (!formData.technique?.trim()) newErrors.technique = 'Technique description is required';
      if (!formData.attending_surgeon_name?.trim()) newErrors.attending_surgeon_name = 'Attending Surgeon is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) {
      setTxStatus('error');
      setTxMsg('Validation Failed: Please fill out all required fields marked in red.');
      return;
    }

    const stored = JSON.parse(localStorage.getItem('operative_records') || '[]');
    const duplicate = stored.find((r: any) => 
      r.mrn === formData.mrn && 
      r.form_template_id === activeTemplate?.id &&
      r.id !== editId
    );

    if (duplicate) {
      setShowDuplicateWarning(true);
    } else {
      setShowCredentialModal(true);
    }
  };

  const handleAuthenticatedSubmit = (password: string) => {
    // Demo password check
    const staffRegistry = JSON.parse(localStorage.getItem('hospital_staff_users') || '[]');
    const currentUserRegistry = staffRegistry.find((u: any) => u.id === user.id);
    const validPassword = currentUserRegistry ? currentUserRegistry.password : (user.username === 'admin' ? 'admin' : 'nurse');

    if (password === validPassword) {
      setShowCredentialModal(false);
      executeCommit();
    } else {
      alert("INVALID CLINICAL CREDENTIALS. SIGNATURE REJECTED.");
    }
  };

  const executeCommit = async () => {
    setShowDuplicateWarning(false);
    setTxStatus('loading');
    setTxMsg('Finalizing clinical data and committing to hospital repository...');
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      const stored = JSON.parse(localStorage.getItem('operative_records') || '[]');
      const newRecord = { 
        ...formData, 
        form_type: formType, 
        form_template_id: activeTemplate?.id,
        id: editId || Date.now(), 
        record_datetime: new Date().toISOString(),
        verifiedBy: user.fullName,
        verifiedAt: new Date().toISOString()
      };
      const updated = editId !== null ? stored.map((r: any) => r.id === editId ? newRecord : r) : [...stored, newRecord];
      localStorage.setItem('operative_records', JSON.stringify(updated));
      
      // Log for audit
      const log: AuditLog = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        userId: user.id,
        userName: user.fullName,
        action: editId ? 'UPDATE_RECORD' : 'CREATE_RECORD',
        targetId: (newRecord.id || '').toString(),
        module: formType || 'RECORD_ENTRY'
      };
      const logs = JSON.parse(localStorage.getItem('clinical_audit_logs') || '[]');
      localStorage.setItem('clinical_audit_logs', JSON.stringify([...logs, log]));

      setTxStatus('success');
      setTxMsg('Medical record finalized and archived successfully.');
      
      setTimeout(() => { 
        setTxStatus('idle');
        onSuccess(); 
      }, 1500);
    } catch (e) {
      setTxStatus('error');
      setTxMsg('Fatal storage error detected. Check system connectivity.');
    }
  };

  const filteredPatients = ADMISSION_LIST.filter(p => {
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

  if (!localPatient && !editId) {
    return (
      <div className="max-w-full mx-auto py-8 animate-in fade-in zoom-in-95 duration-500">
        <div className="flex items-center justify-between mb-8 px-4">
          <div>
            <h2 className="text-4xl font-black text-slate-800 uppercase tracking-tighter">Patient Discovery</h2>
            <p className="text-slate-500 font-black uppercase tracking-[0.4em] text-[11px] mt-1">
              Step 1: Locate Patient Profile for {department}
            </p>
          </div>
          <button onClick={onCancel} className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-slate-800 rounded-2xl transition-all shadow-sm">
            <X size={24} />
          </button>
        </div>

        <div className="bg-slate-100/80 p-6 rounded-[48px] border border-slate-200">
          <div className="flex flex-wrap items-end gap-3 mb-8">
            <div className="flex-1 min-w-[320px]">
              <label className="block text-[11px] font-black text-slate-500 mb-2 pl-2 uppercase tracking-[0.2em]">Search Name / MRN</label>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="E.G. PALISOC OR 2025-0004..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-2xl px-6 py-4 pr-12 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all text-sm font-bold uppercase"
                />
                <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
              </div>
            </div>
            
            <div className="w-48 flex-shrink-0">
              <label className="block text-[11px] font-black text-slate-500 mb-2 pl-2 uppercase tracking-[0.2em]">Status</label>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm font-black text-xs uppercase"
              >
                <option value="Active">ACTIVE</option>
                <option value="Discharged">DISCHARGED</option>
                <option value="All">ALL</option>
              </select>
            </div>

            <div className="flex items-end gap-3 flex-shrink-0">
               <StandardDateInput 
                  label="From"
                  name="fromDate"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-44"
               />
               <StandardDateInput 
                  label="To"
                  name="toDate"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-44"
               />
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200 border-t-8 border-t-blue-500 transition-all duration-500">
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left border-collapse table-auto">
                <thead>
                  <tr className="bg-slate-50/50 text-[11px] font-black text-slate-400 uppercase tracking-tight border-b border-slate-200">
                    <th className="px-6 py-5 whitespace-nowrap">Case ID</th>
                    <th className="px-6 py-5 whitespace-nowrap">MRN</th>
                    <th className="px-6 py-5 whitespace-nowrap">Patient Name</th>
                    <th className="px-6 py-5 whitespace-nowrap text-center">Birthdate</th>
                    <th className="px-4 py-5 whitespace-nowrap text-center">Sex</th>
                    <th className="px-6 py-5 whitespace-nowrap text-center">Type</th>
                    <th className="px-6 py-5 whitespace-nowrap text-center">Rm/Bed</th>
                    <th className="px-6 py-5 whitespace-nowrap">Date Admitted</th>
                    <th className="px-6 py-5 whitespace-nowrap text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPatients.map((patient) => (
                    <tr 
                      key={patient.case_id} 
                      onClick={() => setLocalPatient(patient)}
                      className="hover:bg-blue-50 cursor-pointer transition-all group"
                    >
                      <td className="px-6 py-6 text-xs font-bold text-slate-500 whitespace-nowrap">{patient.case_id}</td>
                      <td className="px-6 py-6 text-xs font-bold text-slate-500 whitespace-nowrap">{patient.mrn}</td>
                      <td className="px-6 py-6">
                        <span className="text-sm font-black text-slate-900 uppercase tracking-tight group-hover:text-blue-700">
                          {patient.last_name}, {patient.first_name}
                        </span>
                      </td>
                      <td className="px-6 py-6 text-xs font-bold text-slate-500 text-center">{patient.birthdate}</td>
                      <td className="px-4 py-6 text-xs font-black text-slate-700 text-center uppercase">{patient.sex[0]}</td>
                      <td className="px-6 py-6 text-center">
                        <span className="px-2.5 py-1 bg-slate-100 text-[10px] font-black text-slate-500 rounded-md border border-slate-200 uppercase">
                          {patient.patient_type === 'Inpatient' ? 'IP' : 'ER'}
                        </span>
                      </td>
                      <td className="px-6 py-6 text-xs font-bold text-slate-500 text-center">{patient.room_no}</td>
                      <td className="px-6 py-6 text-xs font-bold text-slate-500">{patient.date_admitted}</td>
                      <td className="px-6 py-6 text-center">
                        <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase ring-1 ${
                          patient.status === 'Active' 
                            ? 'bg-emerald-50 text-emerald-600 ring-emerald-100' 
                            : 'bg-slate-50 text-slate-400 ring-slate-100'
                        }`}>{patient.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!formType && !editId) {
    return (
      <div className="max-w-6xl mx-auto py-12 animate-in fade-in zoom-in-95 duration-500">
        <div className="flex items-center justify-between mb-16">
          <div className="flex items-center gap-6">
            <button onClick={() => setLocalPatient(null)} className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-slate-800 rounded-2xl transition-all shadow-sm">
              <ArrowLeft size={20} />
            </button>
            <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Select Clinical Template</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {availableTemplates.map((template) => (
            <button 
              key={template.id}
              onClick={() => handleSelectTemplate(template)} 
              className="group bg-white p-8 rounded-[40px] border-2 border-slate-100 shadow-sm transition-all text-left flex flex-col min-h-[300px] hover:border-blue-500 hover:shadow-2xl"
            >
              <div className="bg-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <FileText size={32} className="text-blue-600" />
              </div>
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-3">{template.name}</h3>
              <p className="text-sm text-slate-400 font-medium leading-relaxed">System Code: {template.code}</p>
              <div className="mt-auto flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase tracking-widest pt-6">Initialize module <ArrowRight size={14} /></div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-6xl mx-auto pb-24 animate-in fade-in duration-700">
        <div className="sticky top-[72px] z-40 bg-[#f8fafc]/95 backdrop-blur-sm py-4 mb-6 border-b border-slate-200 flex items-center justify-between px-2 no-print transition-all">
          <div className="flex items-center gap-4">
            <button onClick={onCancel} className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-slate-800 rounded-xl transition-all shadow-sm">
              <ArrowLeft size={20} />
            </button>
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">
              {activeTemplate?.name || 'Procedure Record'}
            </h2>
          </div>
          <button onClick={handleSubmit} className="px-8 py-2.5 bg-slate-900 text-white font-black text-xs uppercase rounded-xl hover:bg-black transition-all shadow-lg flex items-center gap-2">
            <Save size={16} /> Save clinical record
          </button>
        </div>

        <div className="bg-white border-2 border-slate-900 shadow-2xl p-8 min-h-[1150px] flex flex-col medical-font text-slate-900 mx-auto max-w-5xl overflow-hidden relative">
          {formType === FormType.RECORD_OF_DELIVERY ? (
            <RecordOfDeliveryForm formData={formData} onInputChange={handleInputChange} />
          ) : formType === FormType.OPERATIVE_TECHNIQUE ? (
            <OperativeTechniqueForm formData={formData} onInputChange={handleInputChange} />
          ) : (
            <PatientAssessmentForm page={page} formData={formData} onInputChange={handleInputChange} />
          )}
        </div>

        {/* Duplicate Warning Modal */}
        {showDuplicateWarning && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-white p-10 rounded-[40px] shadow-2xl max-w-lg w-full animate-in zoom-in-95 duration-300 relative border border-slate-100 overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-amber-500"></div>
              <button onClick={() => setShowDuplicateWarning(false)} className="absolute right-8 top-8 text-slate-300 hover:text-slate-600 transition-colors">
                <X size={24} />
              </button>
              <div className="bg-amber-50 w-24 h-24 rounded-[32px] flex items-center justify-center text-amber-500 mx-auto mb-8 shadow-inner ring-4 ring-amber-50/50">
                <AlertTriangle size={48} strokeWidth={2.5} />
              </div>
              <div className="text-center space-y-4 mb-10 px-4">
                <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-tight">Existing Record Detected</h4>
                <p className="text-slate-500 text-sm font-medium leading-relaxed">
                  A clinical record for <span className="font-black text-slate-800 uppercase">"{formData.last_name}, {formData.first_name}"</span> already exists for this template.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => { setShowDuplicateWarning(false); setShowCredentialModal(true); }}
                  className="w-full py-5 bg-slate-900 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl hover:bg-black transition-all shadow-xl active:scale-[0.98]"
                >
                  Proceed Anyway
                </button>
                <button 
                  onClick={() => setShowDuplicateWarning(false)}
                  className="w-full py-5 bg-slate-50 text-slate-400 font-black text-xs uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-100 transition-all active:scale-[0.98]"
                >
                  Cancel & Review
                </button>
              </div>
            </div>
          </div>
        )}

        <TransactionOverlay status={txStatus} message={txMsg} onClose={() => setTxStatus('idle')} />
      </div>

      <CredentialConfirmationModal 
        isOpen={showCredentialModal}
        user={user}
        onConfirm={handleAuthenticatedSubmit}
        onCancel={() => setShowCredentialModal(false)}
      />
    </>
  );
};
