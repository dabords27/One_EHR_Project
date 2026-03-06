import React, { useState, useEffect, useMemo, useRef } from "react";
import { X, ZoomIn, ZoomOut, Save, Printer, CheckCircle } from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";
import { TransactionOverlay, TransactionStatus } from "../TransactionOverlay";
import { useAuth } from "../../context/AuthContext";
import { AuthModal } from "../AuthModal";

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

const [formId, setFormId] = useState<number | null>(null)

const [formData, setFormData] = useState<Record<string, any>>(initialFormData || {})
const [systemData, setSystemData] = useState<any>(patient)

const [zoom, setZoom] = useState<number>(2)
const [currentPage, setCurrentPage] = useState<number>(1)
const [status, setStatus] = useState<"DRAFT" | "FINALIZED">("DRAFT")
const [pdfError, setPdfError] = useState<string | null>(null)

const pdfRef = useRef<HTMLDivElement | null>(null)

const { user: authUser } = useAuth()

const [showAuthModal, setShowAuthModal] = useState(false)
const [showFinalizeError, setShowFinalizeError] = useState(false)

const [transactionStatus, setTransactionStatus] =
  useState<TransactionStatus>("idle")

const [pendingSave, setPendingSave] = useState(false)
const [pendingFinalize, setPendingFinalize] = useState(false)
const [hasDraft, setHasDraft] = useState(false)

const pageWidth =
  template.page_orientation === "landscape" ? 1123 : 794;

const pageHeight =
  template.page_orientation === "landscape" ? 794 : 1123;

const [runtimeTemplate, setRuntimeTemplate] = useState<FormTemplate>(template)

const [pdfDimensions, setPdfDimensions] = useState<{
  width: number
  height: number
} | null>(null)

const totalPages = template.total_pages || 1

/* =========================
   API BASE
========================= */

const API_BASE = `${window.location.protocol}//${window.location.hostname}:5000`

const pdfUrl = `${API_BASE}/uploads/custom-forms/${template.template_id}/template.pdf`

/* =========================
   LOG FORM ID
========================= */

useEffect(() => {
  console.log("Current formId:", formId)
}, [formId])

/* =========================
   LOAD REGISTRY
========================= */

useEffect(() => {

  const loadRegistry = async () => {

    try {

      const token = localStorage.getItem("token")

      const res = await fetch(
        `${API_BASE}/api/custom-forms/patient/${patient.case_id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      const data = await res.json()

      console.log("REGISTRY RESPONSE:", data)

      if (data) {
        setSystemData(data)
      }

    } catch (err) {

      console.error("Failed to load registry", err)

    }

  }

  if (patient?.case_id) {
    loadRegistry()
  }

}, [patient.case_id])

/* =========================
   MAP SYSTEM DATA
========================= */

useEffect(() => {

  if (!systemData) return

  const mapped = {
    ...systemData,

    gender: systemData.sex,
    room_bed: systemData.room_no,
    room_bed_no: systemData.room_no,

    arrival_datetime: systemData.date_admitted,
    admission_datetime: systemData.date_admitted,
    admission_date_time: systemData.date_admitted,

    patient_name: `${systemData.last_name}, ${systemData.first_name} ${systemData.middle_name || ""}`
  }

  setSystemData(mapped)

}, [])

/* =========================
   INITIAL FORM DATA
========================= */

useEffect(() => {
  if (initialFormData) {
    setFormData(initialFormData)
  }
}, [initialFormData])

/* =========================
   EDIT MODE
========================= */

useEffect(() => {
  if (editId || initialFormData) {
    setFormId(editId || null)
    setHasDraft(true)

    if (initialFormData?.status === "FINALIZED") {
      setStatus("FINALIZED")
    }
  }
}, [editId, initialFormData])

/* =========================
   FORMAT DATA
========================= */

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
  : ""

const patientFullName = `${patient.last_name}, ${patient.first_name} ${patient.middle_name || ""}`
  .replace(/\s+/g, " ")
  .trim()
  .toUpperCase()

/* =========================
   LOAD TEMPLATE FIELDS
========================= */

useEffect(() => {

  const loadFields = async () => {

    const token = localStorage.getItem("token")

    const res = await fetch(
      `${API_BASE}/api/custom-forms/template/${template.template_id}/fields`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    )

    const data = await res.json()

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
    }))

    setRuntimeTemplate({
      ...template,
      fields: mappedFields
    })

  }

  loadFields()

}, [template.template_id])

/* =========================
   FIELD CHANGE
========================= */

const handleFieldChange = (name: string, value: any) => {

  if (status === "FINALIZED") return

  setFormData(prev => ({
    ...prev,
    [name]: value
  }))

}

/* =========================
   SAVE DRAFT
========================= */

const handleSaveDraft = async () => {

setTransactionStatus("loading")

const startTime = Date.now()

const token = localStorage.getItem("token")

const payload = {

patient_form_id: formId, // ⭐ VERY IMPORTANT
  patient_id: patient.case_id,
  template_id: template.template_id,
  department_id: department?.department_id || 1,

  template_snapshot: runtimeTemplate,
  filled_data: formData

}

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
)

if (!res.ok) {

  setTransactionStatus("error")
  alert("Failed to save draft")
  return

}

const data = await res.json()

console.log("SAVE DRAFT API RESPONSE:", data)

const elapsed = Date.now() - startTime
const minTime = 600

if (elapsed < minTime) {
  await new Promise(res => setTimeout(res, minTime - elapsed))
}

const newFormId =
  data.patient_form_id ||
  data.form_id ||
  data.id

if (newFormId) {
  setFormId(newFormId)
  setHasDraft(true)
}

setTransactionStatus("success")

setTimeout(() => {
  setTransactionStatus("idle")
}, 1200)



}

/* =========================
   AUTH SUCCESS
========================= */

const handleAuthSuccess = async () => {

  setShowAuthModal(false)

  if (pendingSave) {
    await handleSaveDraft()
    setPendingSave(false)
  }

  if (pendingFinalize) {
    await handleFinalize()
    setPendingFinalize(false)
  }

}

/* =========================
   FINALIZE
========================= */

const handleFinalize = async () => {

  if (!formId) {
    setShowFinalizeError(true);
    return;
  }

  setTransactionStatus("loading");

  const startTime = Date.now();

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
    setTransactionStatus("error");
    return;
  }

  const elapsed = Date.now() - startTime;
  const minTime = 600;

  if (elapsed < minTime) {
    await new Promise(res => setTimeout(res, minTime - elapsed));
  }

  setStatus("FINALIZED");

  setTransactionStatus("success");

  setTimeout(() => {
    setTransactionStatus("idle");
  }, 1200);

};

/* =========================
   PRINT
========================= */

const handlePrint = () => {

  const previousZoom = zoom

  // Force correct print size
  setZoom(1)

  setTimeout(() => {
    window.print()
    setZoom(previousZoom)
  }, 200)

}

  /* =========================
      RENDER
  ========================= */


  return (
    <div className="fixed inset-0 bg-white z-[9999] flex flex-col">

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
            onClick={() => setZoom(z => Math.max(0.8, z - 0.1))}
            className="p-1 border rounded"
          >
            <ZoomOut size={16} />
          </button>

          <span>{Math.round(zoom * 100)}%</span>

          <button
            onClick={() => setZoom(z => Math.min(3, z + 0.1))}
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
  onClick={() => {
    setPendingSave(true);
    setShowAuthModal(true);
  }}
  disabled={status === "FINALIZED"}
  className={`px-3 py-1 rounded flex items-center gap-1 text-white ${
    status === "FINALIZED"
      ? "bg-slate-400 cursor-not-allowed"
      : "bg-slate-800"
  }`}
>
  <Save size={14} />
  Draft
</button>

<button
  onClick={() => {
    setPendingFinalize(true);
    setShowAuthModal(true);
  }}
  disabled={status === "FINALIZED" || !formId}
  className={`px-3 py-1 rounded flex items-center gap-1 ${
    status === "FINALIZED" || !formId
      ? "bg-slate-400 cursor-not-allowed"
      : "bg-green-600"
  } text-white`}
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
<div className="flex-1 overflow-auto flex justify-center items-start py-10 bg-slate-200">
  <div id="print-area">


<div
  ref={pdfRef}
  className="relative shadow-2xl bg-white inline-block"
>
      <Document
        file={pdfUrl}
        onLoadError={(err) => {
          setPdfError("Failed to load PDF template.");
        }}
      >
<Page
  pageNumber={currentPage}
  width={pageWidth * zoom}
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
  transformOrigin: "top left",
  overflow: "hidden",
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
.screen-only {
  display: block;
}

.print-only {
  display: none;
}

@media print {

  @page {
    size: ${template.page_orientation === "landscape" ? "A4 landscape" : "A4 portrait"};
    margin: 0;
  }

  html, body {
    margin: 0;
    padding: 0;
  }

  /* Hide UI */
  .sticky,
  button {
    display: none !important;
  }

  /* Only show the form */
  body * {
    visibility: hidden;
  }

  #print-area,
  #print-area * {
    visibility: visible;
  }

  /* Force correct page width so Chrome respects orientation */
#print-area {
  position: absolute;
  top: 0;
  left: 0;
  width: 100% !important;
  height: 100% !important;
}


  /* Remove borders from inputs */
  input,
  textarea,
  select {
    border: none !important;
    outline: none !important;
    background: transparent !important;
    appearance: none !important;
    -webkit-appearance: none !important;
    -moz-appearance: none !important;
    pointer-events: none !important;
    padding: 0 !important;
  }

  select::-ms-expand {
    display: none;
  }

}
`}
</style>

<TransactionOverlay status={transactionStatus} />

{showAuthModal && (
<AuthModal
  currentUsername={authUser?.username || ""}
  onClose={() => setShowAuthModal(false)}
  onVerified={(user) => {
    handleAuthSuccess(user);
  }}
/>
)}

{showFinalizeError && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[99999]">
    <div className="bg-white rounded-xl shadow-2xl p-6 w-[320px]">

      <div className="text-sm font-bold text-slate-700">
        Draft Required
      </div>

      <div className="text-xs text-slate-500 mt-2">
        Please save a draft before finalizing this form.
      </div>

      <div className="flex justify-end mt-6">
        <button
          onClick={() => setShowFinalizeError(false)}
          className="px-4 py-1.5 text-xs font-bold bg-slate-200 rounded-lg"
        >
          OK
        </button>
      </div>

    </div>
  </div>
)}

    </div>
  );
};