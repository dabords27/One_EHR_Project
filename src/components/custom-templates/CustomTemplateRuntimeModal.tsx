import React, { useState, useEffect, useMemo, useRef } from "react";
import { X, ZoomIn, ZoomOut, Save, Printer, CheckCircle } from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

import { Patient, Department, FormTemplate } from "../../types";
import { CustomTemplateRenderer } from "./CustomTemplateRenderer";

// ✅ VITE-COMPATIBLE WORKER
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

interface Props {
  template: FormTemplate
  patient: Patient
  department: Department
  user: any
  initialFormData?: Record<string, any>
  editId?: number | null
  onClose: () => void
  onSaved: () => void
}

export const CustomTemplateRuntimeModal: React.FC<Props> = ({
  template,
  patient,
  department,
  user,
  initialFormData,
  editId,
  onClose,
  onSaved
}) => {





  /* =========================
     STATE
  ========================= */
const [formData, setFormData] = useState<Record<string, any>>(initialFormData || {});

const [systemData, setSystemData] = useState<any>(patient);

useEffect(() => {

  const loadRegistry = async () => {

    try {

      const token = localStorage.getItem("token");

      const res = await fetch(
        `${API_BASE}/api/custom-forms/patient/${patient.case_id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const data = await res.json();

      if (data) {
        setSystemData(data);
      }

    } catch (err) {

      console.error("Failed to load registry", err);

    }

  };

  if (patient?.case_id) {
    loadRegistry();
  }

}, [patient.case_id]);

useEffect(() => {

  if (!systemData) return;

  const mapped = {
    ...systemData,

    gender: systemData.sex,
    room_bed: systemData.room_no,
    room_bed_no: systemData.room_no,

    arrival_datetime: systemData.date_admitted,
    admission_datetime: systemData.date_admitted,
    admission_date_time: systemData.date_admitted,

    patient_name: `${systemData.last_name}, ${systemData.first_name} ${systemData.middle_name || ""}`
  };

  setSystemData(mapped);

}, []);



useEffect(() => {
  if (initialFormData) {
    setFormData(initialFormData);
  }
}, [initialFormData]);

// ⭐ ADD THIS HERE
useEffect(() => {
  if (editId) {
    setFormId(editId);
  }
}, [editId]);

  const [formId, setFormId] = useState<number | null>(null);
  const [zoom, setZoom] = useState<number>(2);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [status, setStatus] = useState<"DRAFT" | "FINALIZED">("DRAFT");
  const [pdfError, setPdfError] = useState<string | null>(null);
  const pdfRef = useRef<HTMLDivElement | null>(null);
  
  

const formattedAdmission = patient?.date_admitted
  ? new Date(patient.date_admitted).toLocaleString("en-US", {
      timeZone: "Asia/Manila",
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    })
  : "";

const [runtimeTemplate, setRuntimeTemplate] = useState<FormTemplate>(template);

const [pdfDimensions, setPdfDimensions] = useState<{
  width: number;
  height: number;
} | null>(null);

  const totalPages = template.total_pages || 1;
  


  // ✅ BUILD PDF URL DIRECTLY FROM TEMPLATE ID
const API_BASE = `${window.location.protocol}//${window.location.hostname}:5000`;

const pdfUrl = `${API_BASE}/uploads/custom-forms/${template.template_id}/template.pdf`;



const patientFullName = `${patient.last_name}, ${patient.first_name} ${patient.middle_name || ""}`
  .replace(/\s+/g, " ")
  .trim()
  .toUpperCase();



  /* =========================
    TEMPLATE FIELDS
  ========================= */

useEffect(() => {
  const loadFields = async () => {
    const token = localStorage.getItem("token");

    const res = await fetch(
      `${API_BASE}/api/custom-forms/template/${template.template_id}/fields`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    const data = await res.json();

    const mappedFields = data.map((field: any) => ({
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
      fontFamily: "Calibri",
	  systemBinding: field.system_binding,
	  dataSource: field.data_source || "manual",
    }));

    setRuntimeTemplate({
      ...template,
      fields: mappedFields
    });
  };

  loadFields();
}, [template.template_id]);

  /* =========================
     FIELD CHANGE
  ========================= */

  const handleFieldChange = (name: string, value: any) => {
    if (status === "FINALIZED") return;

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  /* =========================
     SAVE HANDLERS
  ========================= */
const handleSaveDraft = async () => {

  const token = localStorage.getItem("token");

const payload = {

  patient_id: patient.registry_tracking_no,   // FIX HERE
  template_id: template.template_id,
  department_id: department.department_id,

  template_snapshot: runtimeTemplate,
  filled_data: formData

};

  const res = await fetch(
    `${API_BASE}/api/custom-forms/patient-form/draft`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    }
  );

  if (!res.ok) {
    alert("Failed to save draft");
    return;
  }

  const data = await res.json();

  if (data.patient_form_id) {
    setFormId(data.patient_form_id);
  }

  alert("Draft saved successfully");

};

const handleFinalize = async () => {

  if (!formId) {
    alert("Please save draft first.");
    return;
  }

  const token = localStorage.getItem("token");

  const payload = {
    patient_form_id: formId,
    filled_data: formData
  };

  const res = await fetch(
    `${API_BASE}/api/custom-forms/patient-form/finalize`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    }
  );

  if (!res.ok) {
    alert("Failed to finalize form");
    return;
  }

  setStatus("FINALIZED");

  alert("Form finalized successfully");

  onSaved();

};

const handlePrint = () => {

  const previousZoom = zoom;

  setZoom(1); // force real scale for print

  setTimeout(() => {
    window.print();
    setZoom(previousZoom); // restore UI zoom
  }, 200);

};
  /* =========================
     RENDER
  ========================= */

console.log("SYSTEM DATA", systemData);

  return (
    <div className="fixed inset-0 bg-white z-[9999] overflow-hidden">

      {/* ================= HEADER ================= */}
      <div className="sticky top-0 bg-slate-100 border-b px-6 py-3 flex justify-between items-center text-xs font-black uppercase tracking-wider z-50">

        <div className="flex gap-6 items-center">
          <div>Patient: {patientFullName}</div>
          <div>Type: {patient.patient_type}</div>
          <div>Admission: {formattedAdmission}</div>
          <div>Template: {template.template_name}</div>

          {status === "FINALIZED" && (
            <div className="text-green-600 flex items-center gap-1">
              <CheckCircle size={14} />
              Finalized
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">

          {/* Zoom */}
          <button
            onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
            className="p-1 border rounded"
          >
            <ZoomOut size={16} />
          </button>

          <span>{Math.round(zoom * 100)}%</span>

          <button
            onClick={() => setZoom(z => Math.min(3, z + 0.25))}
            className="p-1 border rounded"
          >
            <ZoomIn size={16} />
          </button>

          {/* Pagination */}
          {totalPages > 1 && (
            <>
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="px-2 border rounded"
              >
                ◀
              </button>

              <span>
                Page {currentPage} / {totalPages}
              </span>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
                className="px-2 border rounded"
              >
                ▶
              </button>
            </>
          )}

          <button
            onClick={handleSaveDraft}
            className="px-3 py-1 bg-slate-800 text-white rounded flex items-center gap-1"
          >
            <Save size={14} />
            Draft
          </button>

          <button
            onClick={handleFinalize}
            disabled={status === "FINALIZED"}
            className="px-3 py-1 bg-green-600 text-white rounded flex items-center gap-1 disabled:opacity-50"
          >
            <CheckCircle size={14} />
            Finalize
          </button>

          <button
            onClick={handlePrint}
            className="px-3 py-1 bg-blue-600 text-white rounded flex items-center gap-1"
          >
            <Printer size={14} />
            Print
          </button>

          <button
            onClick={onClose}
            className="p-2 border rounded ml-2"
          >
            <X size={16} />
          </button>
        </div>
      </div>

{/* ================= PDF + OVERLAY ================= */}
<div className="flex justify-center py-10 bg-slate-200">
  <div id="print-area">


<div
  ref={pdfRef}
  className="relative shadow-2xl bg-white"
  style={{
    width: 794 * zoom,
    height: 1123 * zoom,
    transition: "width 0.2s ease"
  }}
>
      <Document
        file={pdfUrl}
        onLoadError={(err) => {
          setPdfError("Failed to load PDF template.");
        }}
      >
        <Page
          pageNumber={currentPage}
          width={794 * zoom}
          renderTextLayer={false}
          renderAnnotationLayer={false}
          onLoadSuccess={(page) => {
            setPdfDimensions({
              width: page.width,
              height: page.height
            });
          }}
        />
      </Document>

      {/* 🔥 FIELD OVERLAY */}
      {pdfDimensions && (
<div
    style={{
      position: "absolute",
      top: 0,
      left: 0,
      width: pdfDimensions.width * zoom,
      height: pdfDimensions.height * zoom,
      zIndex: 10
    }}
  >
<CustomTemplateRenderer
  template={runtimeTemplate}
  formData={formData}
  systemData={systemData}
  currentPage={currentPage}
  pdfDimensions={pdfDimensions}
  zoom={zoom}
  onChange={handleFieldChange}
  readOnly={status === "FINALIZED"}
/>
        </div>
      )}

    </div>

  </div>
</div>

      {/* ================= PRINT CSS ================= */}
<style>
{`
@media print {

  @page {
    size: A4 portrait;
    margin: 0;
  }

  body {
    margin: 0;
    padding: 0;
  }

  /* hide header / UI */
  .sticky,
  button {
    display: none !important;
  }

  /* ensure print area is visible */
#print-area {
  width: 794px !important;
  height: 1123px !important;
  overflow: hidden !important;
}
/* Hide field borders when printing */
.field-debug {
  border: none !important;
  outline: none !important;
}

@page {
  size: A4 portrait;
  margin: 0;
}

 input,
  textarea,
  select {
    border: none !important;
    outline: none !important;
    background: transparent !important;
  }
  
    body * {
    visibility: hidden;
  }

  #print-area,
  #print-area * {
    visibility: visible;
  }

  #print-area {
    position: absolute;
    left: 0;
    top: 0;
    width: 794px;
    height: 1123px;
  }
html, body {
  zoom: 100%;
}
}
`}
</style>

    </div>
  );
};