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
const [status, setStatus] = useState<"DRAFT" | "FINALIZED">(
  initialFormData?.__status === "FINALIZED" ? "FINALIZED" : "DRAFT"
)
const [pdfError, setPdfError] = useState<string | null>(null)

const pdfRef = useRef<HTMLDivElement | null>(null)

const { user: authUser } = useAuth()

const [showAuthModal, setShowAuthModal] = useState(false)
const [showFinalizeError, setShowFinalizeError] = useState(false)

const [showValidation, setShowValidation] = useState(false)

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
console.log("Runtime initialFormData:", initialFormData);
  if (initialFormData) {
    setFormData(initialFormData)

if (initialFormData.__status === "FINALIZED") {
  setStatus("FINALIZED")
}
  }
}, [initialFormData])
/* =========================
   EDIT MODE
========================= */

useEffect(() => {
  if (editId || initialFormData) {
    setFormId(editId || null)
    setHasDraft(true)

    if (initialFormData?.__status === "FINALIZED") {
      setStatus("FINALIZED")
    }
  }
}, [editId, initialFormData])

/* =========================
   FORMAT DATA
========================= */

const formatDate = (date: any) => {

  if (!date) return ""

  const d = new Date(date)

  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  const yyyy = d.getFullYear()

  return `${mm}/${dd}/${yyyy}`
}

const formatTime = (date: any) => {

  if (!date) return ""

  return new Date(date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  })
}

const formattedAdmission = formatDate(patient?.date_admitted)

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

  fieldName: field.field_key,

  xPercent: field.x,
  yPercent: field.y,
  widthPercent: field.width,
  heightPercent: field.height,

  label: field.label,
  placeholder: field.placeholder,

  options: field.options || [],

  formulaExpression: field.formula_expression,
  resultType: field.result_type,

  fontSize: field.font_size,
  fontWeight: field.font_weight || "normal",
  fontStyle: field.font_style || "normal",
  textAlign: field.text_align || "left",
  fontFamily: field.font_family || "Calibri",

  listOrientation: field.list_orientation || "vertical",

  systemBinding: field.system_binding,
  dataSource: field.data_source || "manual",

  // ⭐ ADD THESE
  dateMode: field.date_mode || "date",
  autoNow: field.auto_now || false,
  minDate: field.min_date || null,
  maxDate: field.max_date || null,
  isBirthdate: field.is_birthdate || false,
  required: field.is_required || false

}));
   setRuntimeTemplate(prev => ({
  ...prev,
  fields: mappedFields
}))

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

  // reset validation highlight when user edits
  if (showValidation) {
    setShowValidation(false)
  }

}

/* =========================
   SAVE DRAFT
========================= */
const handleSaveDraft = async () => {

  /* =========================
     REQUIRED FIELD VALIDATION
  ========================= */

  const requiredFields = runtimeTemplate.fields.filter(
    (f:any) => f.required
  );

  let hasError = false;

  for (const field of requiredFields) {

    // skip system fields
    if (field.dataSource === "system") continue;

    const val = formData[field.fieldName];

    if (
      val === undefined ||
      val === null ||
      val === "" ||
      (Array.isArray(val) && val.length === 0)
    ) {
      hasError = true;
    }

  }

  if (hasError) {
    setShowValidation(true);
    return;
  }

  /* =========================
     SAVE DRAFT
  ========================= */

  setTransactionStatus("loading");

  const startTime = Date.now();

  const token = localStorage.getItem("token");

  const payload = {
    patient_form_id: formId,
    patient_id: patient.case_id,
    template_id: template.template_id,
    department_id: department?.department_id || 1,
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
    setTransactionStatus("error");
    alert("Failed to save draft");
    return;
  }

  const data = await res.json();

  const elapsed = Date.now() - startTime;
  const minTime = 600;

  if (elapsed < minTime) {
    await new Promise(res => setTimeout(res, minTime - elapsed));
  }

  const newFormId =
    data.patient_form_id ||
    data.form_id ||
    data.id;

  if (newFormId) {
    setFormId(newFormId);
    setHasDraft(true);
  }

  setTransactionStatus("success");

  setTimeout(() => {
    setTransactionStatus("idle");
  }, 1200);

};

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

  /* =========================
     REQUIRE DRAFT FIRST
  ========================= */

  if (!formId) {
    setShowFinalizeError(true);
    return;
  }

  /* =========================
     REQUIRED FIELD VALIDATION
  ========================= */

  const requiredFields = runtimeTemplate.fields.filter(
    (f:any) => f.required
  );

  let hasError = false;

  for (const field of requiredFields) {

    // skip system fields
    if (field.dataSource === "system") continue;

    const val = formData[field.fieldName];

    if (
      val === undefined ||
      val === null ||
      val === "" ||
      (Array.isArray(val) && val.length === 0)
    ) {
      hasError = true;
    }

  }

  if (hasError) {
    setShowValidation(true);
    return;
  }

  /* =========================
     FINALIZE API CALL
  ========================= */

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

  const previousZoom = zoom;

  setZoom(1);

  // 🔥 Force React render BEFORE printing
  setTimeout(() => {

    window.dispatchEvent(new Event("beforeprint"));

    setTimeout(() => {

      window.print();

      setTimeout(() => {
        window.dispatchEvent(new Event("afterprint"));
        setZoom(previousZoom);
      }, 300);

    }, 100);

  }, 200);

};
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
          <div>
  Admission: {formatDate(patient.date_admitted)} {formatTime(patient.date_admitted)}
</div>
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
  if (status === "FINALIZED") return

  const requiredFields = runtimeTemplate.fields.filter(
    (f:any) => f.required
  )

  let hasError = false

  for (const field of requiredFields) {

    if (field.dataSource === "system") continue

    const val = formData[field.fieldName]

    if (
      val === undefined ||
      val === null ||
      val === "" ||
      (Array.isArray(val) && val.length === 0)
    ) {
      hasError = true
    }

  }

  if (hasError) {
    setShowValidation(true)
    return
  }

  setPendingSave(true)
  setShowAuthModal(true)
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

  const requiredFields = runtimeTemplate.fields.filter(
    (f:any) => f.required
  )

  let hasError = false

  for (const field of requiredFields) {

    if (field.dataSource === "system") continue

    const val = formData[field.fieldName]

    if (
      val === undefined ||
      val === null ||
      val === "" ||
      (Array.isArray(val) && val.length === 0)
    ) {
      hasError = true
    }

  }

  if (hasError) {
    setShowValidation(true)
    return
  }

  setPendingFinalize(true)
  setShowAuthModal(true)

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
  devicePixelRatio={2}
  renderTextLayer={false}
  renderAnnotationLayer={false}
onLoadSuccess={(page) => {

  const orientation = page.width > page.height ? "landscape" : "portrait";

  setPdfDimensions({
    width: page.width,
    height: page.height,
    orientation
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
  systemData={{
  ...systemData,
  username: user?.username || authUser?.username,
  displayName: user?.displayName || authUser?.displayName,
  fullName: user?.fullName || authUser?.fullName
}}
  currentPage={currentPage}
  pdfDimensions={pdfDimensions}
  zoom={zoom}
  onChange={handleFieldChange}
  readOnly={status === "FINALIZED"}
  showValidation={showValidation}
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

.print-page {
  page-break-after: always;
}

@page {
  size: A4 ${pdfDimensions?.orientation || template.page_orientation};
  margin: 0;
}

canvas {
  width: 100% !important;
  height: 100% !important;
}
  
    input::placeholder,
  textarea::placeholder {
    color: transparent !important;
  }
  
  
label {
  gap: 6px !important;
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

#print-area {
  width: ${template.page_orientation === "landscape" ? "297mm" : "210mm"};
  height: ${template.page_orientation === "landscape" ? "210mm" : "297mm"};
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