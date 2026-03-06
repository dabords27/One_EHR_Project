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

  const [templateSearch, setTemplateSearch] = useState("");
  const [templateSort, setTemplateSort] = useState<"name" | "date">("name");

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

        const deptId = activeDepartment.id;   // USE ACTIVE DEPARTMENT
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

  }, [activeDepartment?.id]);


  /* ================= FILTER + SORT ================= */

  const filteredTemplates = templates
    .filter((t) =>
      (t.template_name || "")
        .toLowerCase()
        .includes(templateSearch.toLowerCase())
    )
    .sort((a, b) => {

      if (templateSort === "name") {
        return (a.template_name || "").localeCompare(b.template_name || "");
      }

      if (templateSort === "date") {
        return (
          new Date(b.created_at || 0).getTime() -
          new Date(a.created_at || 0).getTime()
        );
      }

      return 0;

    });


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

      // Inject fields before opening modal
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
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8">

          {/* TOP BAR (SEARCH + SORT RIGHT SIDE) */}
<div className="flex justify-end items-center gap-4 mb-8">

  {/* SEARCH INPUT */}
  <div className="relative w-[340px]">

    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 21l-4.35-4.35M16 10a6 6 0 11-12 0 6 6 0 0112 0z"
      />
    </svg>

    <input
      type="text"
      placeholder="Search Template Name..."
      value={templateSearch}
      onChange={(e) => setTemplateSearch(e.target.value)}
      className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-100 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
    />

  </div>

  {/* SORT DROPDOWN */}
  <select
    value={templateSort}
    onChange={(e) => setTemplateSort(e.target.value as any)}
    className="px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
  >
    <option value="name">Sort by Name</option>
    <option value="date">Sort by Date Created</option>
  </select>

</div>


          <TemplateSelector
            templates={filteredTemplates}
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