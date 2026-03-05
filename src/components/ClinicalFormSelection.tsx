import React, { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { Patient, FormTemplate, FormStatus } from "../types";
import { TemplateSelector } from "./custom-templates/CustomTemplateSelector";
import { CustomTemplateRuntimeModal } from "./custom-templates/CustomTemplateRuntimeModal";
import { useAuth } from "../context/AuthContext"; // adjust if needed

import { useFacility } from "../context/FacilityContext";

interface Props {
  patient: Patient;
  onBack: () => void;
}

export const ClinicalFormSelection: React.FC<Props> = ({

  patient,
  onBack
}) => {

  const { user } = useAuth(); // adjust if your auth context differs


  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [activeTemplate, setActiveTemplate] = useState<FormTemplate | null>(null);

const API_BASE =
  `${window.location.protocol}//${window.location.hostname}:5000`;

  const department = user?.department?.description || "";
  const { activeDepartment } = useFacility();

  const fullName = `${patient.last_name}, ${patient.first_name} ${patient.middle_name || ""} ${patient.extension || ""}`
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();

  /* ================= LOAD TEMPLATES ================= */
useEffect(() => {
  if (!activeDepartment?.id) return;

  const loadTemplates = async () => {
    try {
      const deptId = activeDepartment.id;   // ✅ USE ACTIVE DEPARTMENT

      const token = localStorage.getItem("token");

      const API_BASE =
        `${window.location.protocol}//${window.location.hostname}:5000`;

      const res = await fetch(
        `${API_BASE}/api/custom-forms/templates?department_id=${deptId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (!res.ok) {
        throw new Error("Failed to fetch templates");
      }

      const data = await res.json();
      setTemplates(data);

    } catch (err) {
      console.error("Template load error:", err);
      setTemplates([]);
    }
  };

  loadTemplates();

}, [activeDepartment?.id]);   // ✅ DEPEND ON ACTIVE DEPARTMENT

const handleSelectTemplate = async (template: FormTemplate) => {
  try {
    const token = localStorage.getItem("token");

    const res = await fetch(
      `${API_BASE}/api/custom-forms/template/${template.template_id}/fields`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    if (!res.ok) {
      throw new Error("Failed to load fields");
    }

    const data = await res.json();

    const loadedFields = data.map((field: any) => ({
      id: String(field.field_id),
      type: field.field_type,
      page: field.page_number,
      xPercent: field.x,
      yPercent: field.y,
      widthPercent: field.width,
      heightPercent: field.height,
      label: field.label,
      placeholder: field.placeholder,
      options: field.options || [],
      fontSize: field.font_size,
      fontWeight: "normal",
      textAlign: "left",
      fontFamily: "Calibri"
    }));

    // 🔥 Inject fields before opening modal
    setActiveTemplate({
      ...template,
      fields: loadedFields
    });

  } catch (err) {
    console.error("Field load error:", err);
  }
};


  /* ================= RENDER ================= */

  return (
    <>
      <div className="max-w-6xl mx-auto pb-24 animate-in fade-in duration-700">

        {/* HEADER */}
        <div className="sticky top-[72px] z-40 bg-[#f8fafc]/95 backdrop-blur-sm py-4 mb-10 border-b border-slate-200 flex items-center gap-4 px-2">

          <button
            onClick={onBack}
            className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-slate-800 rounded-xl shadow-sm"
          >
            <ArrowLeft size={20} />
          </button>

          <div>
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">
              Select Clinical Form
            </h2>

            <p className="text-[11px] font-black text-sky-700 uppercase tracking-widest mt-1">
              {fullName}
            </p>
          </div>
        </div>

        {/* TEMPLATE SELECTOR */}
        <div className="bg-white border-2 border-slate-900 shadow-2xl p-10 min-h-[600px]">

         <TemplateSelector
  templates={templates}
  onSelect={handleSelectTemplate}
/>

        </div>
      </div>

      {/* FULLSCREEN RUNTIME */}
      {activeTemplate && (
        <CustomTemplateRuntimeModal
          template={activeTemplate}
          patient={patient}
          department={department}
          user={user}
          onClose={() => setActiveTemplate(null)}
          onSaved={() => setActiveTemplate(null)}
        />
      )}
    </>
  );
};