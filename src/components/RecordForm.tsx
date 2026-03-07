import React, { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";

import {
  FormType,
  Patient,
  Department,
  FormTemplate,
  FormStatus
} from "../types";

import { OperativeTechniqueForm } from "./forms/OperativeTechniqueForm";
import { PatientAssessmentForm } from "./forms/PatientAssessmentForm";
import { RecordOfDeliveryForm } from "./forms/RecordOfDeliveryForm";

import { TemplateSelector } from "./custom-templates/CustomTemplateSelector";
import { CustomTemplateRuntimeModal } from "./custom-templates/CustomTemplateRuntimeModal";

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
  user,
  formType
}) => {

  /* =========================
     STATE
  ========================= */

  const [activeTemplate, setActiveTemplate] = useState<FormTemplate | null>(null);
  const [availableTemplates, setAvailableTemplates] = useState<FormTemplate[]>([]);
  const [formData, setFormData] = useState<any>({});
  const [loadedPatient, setLoadedPatient] = useState<Patient | null>(null);
const [templateSearch, setTemplateSearch] = useState("");
const [templateSort, setTemplateSort] = useState<"name" | "date">("name");
  const patient = selectedPatient || loadedPatient;
  

  const API_BASE = `${window.location.protocol}//${window.location.hostname}:5000`;

  /* =========================
     PATIENT NAME
  ========================= */

  const patientFullName = patient
    ? `${patient.last_name}, ${patient.first_name} ${patient.middle_name || ""} ${patient.extension || ""}`
        .replace(/\s+/g, " ")
        .trim()
        .toUpperCase()
    : "";





  /* =========================
     SEARCH
  ========================= */
const filteredTemplates = availableTemplates
  .filter((t) =>
    t.name?.toLowerCase().includes(templateSearch.toLowerCase())
  )
  .sort((a, b) => {

    if (templateSort === "name") {
      return a.name.localeCompare(b.name);
    }

    if (templateSort === "date") {
      return (
        new Date(b.created_at || 0).getTime() -
        new Date(a.created_at || 0).getTime()
      );
    }

    return 0;

  });
  /* =========================
     LOAD CUSTOM TEMPLATES
  ========================= */

  useEffect(() => {

    if (editId) return;

    const savedTemplates: FormTemplate[] =
      JSON.parse(localStorage.getItem("custom_form_templates") || "[]");

    const filtered = savedTemplates.filter((t) => {

      const isTagged = (t.departmentTags || []).some(
        (tag) =>
          tag.trim().toUpperCase() === department.description?.toUpperCase()
      );

      const isActive = t.status === FormStatus.ACTIVE;

      return isTagged && isActive;

    });

    setAvailableTemplates(filtered);

    if (patient) {

      setFormData({
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
      });

    }

  }, [patient, department, editId]);

  /* =========================
     LOAD EXISTING RECORD
  ========================= */

  useEffect(() => {

    if (!editId) return;

    const loadRecord = async () => {

      try {

        const token = localStorage.getItem("token");

        const res = await fetch(
          `${API_BASE}/api/custom-forms/patient-form/${editId}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        if (!res.ok) {
  const error = await res.text();
  console.error("SERVER ERROR:", error);
  return;
}

const data = await res.json();

        if (!data) return;

        console.log("EDIT RECORD DATA:", data);

        /* Normalize patient */
const normalizedPatient: Patient = data.patient;

        /* Load filled form data */
const filled = data.filled_data || {};

setFormData({
  ...filled,
  __status: data.status
});

        /* Set patient FIRST */
        setLoadedPatient(normalizedPatient);

        /* THEN load template */
   if (data.template) {
  setTimeout(() => {
    setActiveTemplate({
      ...data.template,
      fields: data.template.fields || []
    });
  }, 0);
}

      } catch (error) {

        console.error("Error loading record:", error);

      }

    };

    loadRecord();

  }, [editId]);

  /* =========================
     STATIC FORMS
  ========================= */

  const renderStaticForm = () => {

    if (formType === FormType.RECORD_OF_DELIVERY) {

      return (
        <RecordOfDeliveryForm
          formData={formData}
          onInputChange={(e: any) =>
            setFormData({ ...formData, [e.target.name]: e.target.value })
          }
        />
      );

    }

    if (formType === FormType.OPERATIVE_TECHNIQUE) {

      return (
        <OperativeTechniqueForm
          formData={formData}
          onInputChange={(e: any) =>
            setFormData({ ...formData, [e.target.name]: e.target.value })
          }
        />
      );

    }

    return (
      <PatientAssessmentForm
        page={1}
        formData={formData}
        onInputChange={(e: any) =>
          setFormData({ ...formData, [e.target.name]: e.target.value })
        }
      />
    );

  };

  /* =========================
     GUARD
  ========================= */

if (!patient && editId && !activeTemplate) {
  return (
    <div className="p-10 text-center text-slate-500">
      Loading record...
    </div>
  );
}

  /* =========================
     RENDER
  ========================= */

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
                <>
                  <p className="text-[11px] font-black text-sky-700 uppercase tracking-widest">
                    {patientFullName}
                  </p>

                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    CASE ID: {patient.case_id} • MRN: {patient.mrn}
                  </p>
                </>
              )}

            </div>

          </div>

        </div>

        {/* BODY */}

        <div className="bg-white border-2 border-slate-900 shadow-2xl p-8 min-h-[900px]">

{/* TEMPLATE SELECTOR */}

{!editId && !activeTemplate && availableTemplates.length > 0 && (
  <>
    <h2 className="text-sm font-black uppercase tracking-widest mb-6">
      Available Templates
    </h2>

    {/* SEARCH + SORT */}
    <div className="flex gap-3 mb-6">

      <input
        type="text"
        placeholder="Search template..."
        value={templateSearch}
        onChange={(e) => setTemplateSearch(e.target.value)}
        className="border px-3 py-2 text-sm w-64"
      />

      <select
        value={templateSort}
        onChange={(e) => setTemplateSort(e.target.value as any)}
        className="border px-3 py-2 text-sm"
      >
        <option value="name">Sort by Name</option>
        <option value="date">Sort by Date Created</option>
      </select>

    </div>

    <TemplateSelector
      templates={filteredTemplates}
      onSelect={setActiveTemplate}
    />
  </>
)}

          {/* STATIC FORM */}

          {!editId && !activeTemplate && availableTemplates.length === 0 && (
            <>
              <h2 className="text-sm font-black uppercase tracking-widest mb-6">
                Standard Clinical Form
              </h2>

              {renderStaticForm()}
            </>
          )}

        </div>

      </div>

      {/* TEMPLATE RUNTIME */}

{activeTemplate && patient && (
  <CustomTemplateRuntimeModal
    template={activeTemplate}
    patient={patient}
    department={department}
    user={user}
    initialFormData={formData}
    editId={editId}
    onClose={() => {
      setActiveTemplate(null)
      onSuccess()
    }}
    onSaved={onSuccess}
  />
)}
    </>
  );
};