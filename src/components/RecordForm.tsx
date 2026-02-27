import React, { useState, useEffect } from 'react';
import {
  Save,
  ArrowLeft,
  FileText,
  X,
  AlertTriangle
} from 'lucide-react';

import {
  OperativeRecord,
  FormType,
  Patient,
  Department,
  FormTemplate,
  FormStatus,
  AuditLog
} from '../types';

import { OperativeTechniqueForm } from './forms/OperativeTechniqueForm';
import { PatientAssessmentForm } from './forms/PatientAssessmentForm';
import { RecordOfDeliveryForm } from './forms/RecordOfDeliveryForm';
import { TransactionOverlay, TransactionStatus } from './TransactionOverlay';
import { CredentialConfirmationModal } from './CredentialConfirmationModal';

interface RecordFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  editId: number | null;
  selectedPatient: Patient | null;
  department: Department;
  setActivePatient: (patient: Patient | null) => void;
  user: any;
    formType: FormType;
}

export const RecordForm: React.FC<RecordFormProps> = ({
  onSuccess,
  onCancel,
  editId,
  selectedPatient,
  department,
  setActivePatient,
user,
  formType  // ✅ ADD HERE
}) => {

  /* ===================== SAFETY ===================== */

  if (!selectedPatient && !editId) {
    return null;
  }

  const patient = selectedPatient;

  const patientFullName = patient
    ? `${patient.last_name}, ${patient.first_name} ${patient.middle_name || ''} ${patient.extension || ''}`
        .replace(/\s+/g, ' ')
        .trim()
        .toUpperCase()
    : '';

  /* ===================== STATE ===================== */

  const [activeTemplate, setActiveTemplate] = useState<FormTemplate | null>(null);
  const [availableTemplates, setAvailableTemplates] = useState<FormTemplate[]>([]);
  const [txStatus, setTxStatus] = useState<TransactionStatus>('idle');
  const [txMsg, setTxMsg] = useState('');
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [showCredentialModal, setShowCredentialModal] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<any>({
    date_time: new Date().toLocaleString(),
    pre_operative_diagnosis: '',
    post_operative_diagnosis: '',
    technique: '',
    operative_findings: '',
    attending_surgeon_name: '',
  });

  /* ===================== LOAD TEMPLATES ===================== */

  useEffect(() => {
    const savedTemplates: FormTemplate[] =
      JSON.parse(localStorage.getItem('custom_form_templates') || '[]');

    const filtered = savedTemplates.filter(t => {
      const isTagged = (t.departmentTags || []).some(tag =>
        tag.trim().toUpperCase() === department.trim().toUpperCase()
      );
      const isActive = t.status === FormStatus.ACTIVE;
      return isTagged && isActive;
    });

    setAvailableTemplates(filtered);

    if (patient) {
      setFormData((prev: any) => ({
        ...prev,
        last_name: patient.last_name,
        first_name: patient.first_name,
        middle_name: patient.middle_name,
        mrn: patient.mrn,
        case_id: patient.case_id,
        birthdate: patient.birthdate,
        room_no: patient.room_no,
        sex: patient.sex,
        patient_type: patient.patient_type,
        date_admitted: patient.date_admitted,
        patient_status: patient.status
      }));
    }

  }, [patient, department]);

  /* ===================== INPUT HANDLER ===================== */

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  /* ===================== VALIDATION ===================== */

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.pre_operative_diagnosis?.trim())
      newErrors.pre_operative_diagnosis = 'Required';

    if (!formData.post_operative_diagnosis?.trim())
      newErrors.post_operative_diagnosis = 'Required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* ===================== SUBMIT ===================== */

  const handleSubmit = () => {
    if (!validate()) {
      setTxStatus('error');
      setTxMsg('Validation Failed. Please complete required fields.');
      return;
    }

    setShowCredentialModal(true);
  };

  const handleAuthenticatedSubmit = (password: string) => {
    const staffRegistry =
      JSON.parse(localStorage.getItem('hospital_staff_users') || '[]');

    const currentUserRegistry =
      staffRegistry.find((u: any) => u.id === user.id);

    const validPassword = currentUserRegistry
      ? currentUserRegistry.password
      : 'admin';

    if (password !== validPassword) {
      alert("INVALID CLINICAL CREDENTIALS.");
      return;
    }

    executeCommit();
  };

  const executeCommit = async () => {
    setShowCredentialModal(false);
    setTxStatus('loading');
    setTxMsg('Committing clinical record...');

    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      const stored =
        JSON.parse(localStorage.getItem('operative_records') || '[]');

      const newRecord = {
        ...formData,
        id: editId || Date.now(),
        form_type: formType,
        record_datetime: new Date().toISOString(),
        verifiedBy: user.fullName,
        verifiedAt: new Date().toISOString()
      };

      const updated = editId
        ? stored.map((r: any) => r.id === editId ? newRecord : r)
        : [...stored, newRecord];

      localStorage.setItem('operative_records', JSON.stringify(updated));

      const log: AuditLog = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        userId: user.id,
        userName: user.fullName,
        action: editId ? 'UPDATE_RECORD' : 'CREATE_RECORD',
        targetId: newRecord.id.toString(),
        module: 'RECORD_ENTRY'
      };

      const logs =
        JSON.parse(localStorage.getItem('clinical_audit_logs') || '[]');

      localStorage.setItem(
        'clinical_audit_logs',
        JSON.stringify([...logs, log])
      );

      setTxStatus('success');
      setTxMsg('Medical record archived successfully.');

      setTimeout(() => {
        setTxStatus('idle');
        onSuccess();
      }, 1500);

    } catch (e) {
      setTxStatus('error');
      setTxMsg('Storage error occurred.');
    }
  };

  /* ===================== RENDER ===================== */

  return (
    <>
      <div className="max-w-6xl mx-auto pb-24 animate-in fade-in duration-700">

        {/* HEADER */}
        <div className="sticky top-[72px] z-40 bg-[#f8fafc]/95 backdrop-blur-sm py-4 mb-6 border-b border-slate-200 flex items-center justify-between px-2">

          <div className="flex items-center gap-4">
            <button
              onClick={onCancel}
              className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-slate-800 rounded-xl shadow-sm"
            >
              <ArrowLeft size={20} />
            </button>

            <div>
          
              {patient && (
                <div className="mt-1">
                  <p className="text-[11px] font-black text-sky-700 uppercase tracking-widest">
                    {patientFullName}
                  </p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    CASE ID: {patient.case_id} • MRN: {patient.mrn}
                  </p>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleSubmit}
            className="px-8 py-2.5 bg-slate-900 text-white font-black text-xs uppercase rounded-xl hover:bg-black transition-all shadow-lg flex items-center gap-2"
          >
            <Save size={16} /> Save Clinical Record
          </button>
        </div>

        {/* FORM BODY */}
        <div className="bg-white border-2 border-slate-900 shadow-2xl p-8 min-h-[900px]">

          {formType === FormType.RECORD_OF_DELIVERY ? (
            <RecordOfDeliveryForm
              formData={formData}
              onInputChange={handleInputChange}
            />
          ) : formType === FormType.OPERATIVE_TECHNIQUE ? (
            <OperativeTechniqueForm
              formData={formData}
              onInputChange={handleInputChange}
            />
          ) : (
            <PatientAssessmentForm
              page={1}
              formData={formData}
              onInputChange={handleInputChange}
            />
          )}

        </div>

        <TransactionOverlay
          status={txStatus}
          message={txMsg}
          onClose={() => setTxStatus('idle')}
        />
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