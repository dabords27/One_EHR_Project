import React, { useState } from "react";
import { AuthModal } from "../AuthModal";
import { ArrowLeft } from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";
import { SYSTEM_FIELD_REGISTRY } from "../../utils/systemFieldRegistry";
import { Rnd } from "react-rnd";
import { useEffect } from "react";
import { useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { TransactionOverlay } from "../TransactionOverlay";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();
interface Props {
  templateId: number;
  onBack: () => void;
}

interface TemplateField {
  id: string; // UUID
fieldUUID: string; // new
  type: string;
  page: number;

  xPercent: number;
  yPercent: number;
  widthPercent: number;
  heightPercent: number;

  fieldName: string;
  label: string;
  placeholder: string;
options?: string[];
  dataSource: "manual" | "system";
  systemBinding: string | null;

  required: boolean;

  fontSize: number;
  fontWeight: string;
  fontStyle: string;
  textAlign: string;
  fontFamily: string;
  
  dateMode?: "date" | "time" | "datetime";
autoNow?: boolean;
minDate?: string | null;
maxDate?: string | null;
isBirthdate?: boolean;
  listOrientation?: "vertical" | "horizontal";
    imageWidth?: number;
imageHeight?: number;
resultType?: "number" | "decimal" | "percentage";

  maxLength: number | null;
  formulaExpression?: string;
formulaError?: string | null;
inputType?: "text" | "number" | "decimal" | "percentage";
}

export const TemplateBuilder: React.FC<Props> = ({

  templateId,
  onBack
}) => {
  
  const { user } = useAuth();
  const [txStatus, setTxStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
const [txMsg, setTxMsg] = useState("");
  const generateFieldName = (label: string) => {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, "_");
};

const loadFields = async () => {
  try {
    const token = localStorage.getItem("token");

const response = await fetch(
  `${API_BASE}/api/custom-forms/template/${templateId}/fields?page_number=${currentPage}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    if (!response.ok) throw new Error("Failed to load fields");

    const data = await response.json();

const mappedFields: TemplateField[] = data.map((field: any) => ({
  id: String(field.field_id),
  fieldUUID: String(field.field_id),
  type: field.field_type,
  page: field.page_number,

  xPercent: field.x,
  yPercent: field.y,
  widthPercent: field.width,
  heightPercent: field.height,

  fieldName: field.field_key,

  label: field.label,
  placeholder: field.placeholder || "",

  options: field.options || undefined,

  dataSource: field.data_source || "manual",
  systemBinding: field.system_binding || null,

  required: field.is_required,
  fontSize: field.font_size,
  fontWeight: field.font_weight || "normal",
  fontStyle: field.font_style || "normal",
  textAlign: field.text_align || "left",
  fontFamily: field.font_family || "Calibri",

  inputType: field.input_type || "text",
  resultType: field.result_type || "number",

  dateMode: field.date_mode || "date",
  autoNow: field.auto_now || false,
  minDate: field.min_date || null,
  maxDate: field.max_date || null,
  isBirthdate: field.is_birthdate || false,

  listOrientation: field.list_orientation || "vertical",

  maxLength: field.max_length || null,

  formulaExpression:
    field.field_type === "formula"
      ? field.formula_expression || ""
      : undefined,

  formulaError: null
}));

    setFields(mappedFields);
  } catch (err) {
    console.error("LOAD FIELDS ERROR:", err);
  }
};

const [pdfFile, setPdfFile] = useState<File | null>(null);
const [pdfExists, setPdfExists] = useState<boolean | null>(null);
const [numPages, setNumPages] = useState<number>(0);
const [currentPage, setCurrentPage] = useState<number>(1);
const [scale, setScale] = useState<number>(2);
const [selectedField, setSelectedField] = useState<TemplateField | null>(null);
const [fields, setFields] = useState<TemplateField[]>([]);
const hasDuplicateLabels = () => {
  const labels = fields.map(f => f.label.trim().toLowerCase());
  return new Set(labels).size !== labels.length;
};
const [labelError, setLabelError] = useState<string | null>(null);
const [showAuthModal, setShowAuthModal] = useState(false);
const [isSaving, setIsSaving] = useState(false);
const [txKey, setTxKey] = useState(0);
const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
const [imageToDelete, setImageToDelete] = useState<string | null>(null);
const [isPreviewMode, setIsPreviewMode] = useState(false);
const [previewValues, setPreviewValues] = useState<Record<string, any>>({});
const API_BASE = `${window.location.protocol}//${window.location.hostname}:5000`;

useEffect(() => {
  const checkPdf = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/uploads/custom-forms/${templateId}/template.pdf`,
        { method: "HEAD" }
      );

      setPdfExists(response.ok);
    } catch {
      setPdfExists(false);
    }
  };

  checkPdf();
}, [templateId]);



const pdfFileSource = useMemo(() => ({
  url: `${API_BASE}/uploads/custom-forms/${templateId}/template.pdf?t=${Date.now()}`
}), [templateId]);
const [pdfDimensions, setPdfDimensions] = useState<{
  width: number;
  height: number;
} | null>(null);

const addField = (type: string) => {
  const uniqueId =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : "id_" + Math.random().toString(36).substring(2, 11);

  const baseName = generateFieldName(type);

  const newField: TemplateField = {
    id: uniqueId,
    fieldUUID: uniqueId,
    type,
    page: currentPage,

    xPercent: 0.2,
    yPercent: 0.2,
    widthPercent: 0.15,
    heightPercent: 0.03,

    fieldName: `${baseName}_${uniqueId}`,
    label: `${type} field`,
    placeholder: "",

    options:
      type === "select" ||
      type === "list" ||
      type === "radio_button"
        ? []
        : undefined,

    listOrientation: "vertical",

    dataSource: "manual",
    systemBinding: null,   // 🔥 MUST be null

    required: false,

    fontSize: 12,
    fontWeight: "normal",
    fontStyle: "normal",
    textAlign: "left",
    fontFamily: "Calibri, Arial, sans-serif",

    dateMode: "date",
    autoNow: false,
    minDate: null,
    maxDate: null,
    isBirthdate: false,

    maxLength: null
  };

  setFields(prev => [...prev, newField]);
};
const saveFields = async (verifiedUser: any) => {
  // 🚫 BLOCK IF DUPLICATE LABEL EXISTS
 if (hasDuplicateLabels()) {
    setTxStatus("error");
    setTxMsg("Duplicate labels detected. Please fix before saving.");
    setTimeout(() => setTxStatus("idle"), 2000);
    return;
  }
  try {
    setIsSaving(true);

    setTxKey(prev => prev + 1);
    setTxStatus("loading");
    setTxMsg("Syncing fields...");

    const startTime = Date.now();

    const token = localStorage.getItem("token");

    const response = await fetch(
  `${API_BASE}/api/custom-forms/template/${templateId}/sync-fields`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          page_number: currentPage,
          fields: fields
  .filter(f => f.page === currentPage)
  .map(f => ({
    ...f,
    list_orientation: f.listOrientation
  })),
          created_by: verifiedUser.id
        })
      }
    );

    if (!response.ok) throw new Error("Sync failed");

    // 🔥 Ensure loading shows at least 600ms
    const elapsed = Date.now() - startTime;
    const minTime = 600;

    if (elapsed < minTime) {
      await new Promise(res => setTimeout(res, minTime - elapsed));
    }

    setTxStatus("success");
    setTxMsg("Fields synced successfully.");

    setTimeout(() => setTxStatus("idle"), 1500);

  } catch (err) {
    setTxStatus("error");
    setTxMsg("Sync failed.");
    setTimeout(() => setTxStatus("idle"), 2000);
  } finally {
    setIsSaving(false);
  }
};
const FIELD_TYPES = [
  { type: "label", label: "Label", icon: "T" },
  { type: "input_text", label: "Input Text", icon: "⌨" },
  { type: "textarea", label: "Input Textarea", icon: "📝" },
  { type: "select", label: "Dropdown", icon: "▾" },
  { type: "checkbox", label: "Checkbox", icon: "☑" },
    { type: "list", label: "List", icon: "≡" },
  { type: "date", label: "Date / Time", icon: "📅" },
  { type: "radio_button", label: "Radio Button", icon: "⏺" },
  { type: "formula", label: "Formula", icon: "%" },
  { type: "image", label: "Image", icon: "🖼" },
  { type: "system_user", label: "System User", icon: "👤" }
];

const isDuplicateLabel = (label: string, currentId?: string) => {
  const normalized = label.trim().toLowerCase();

  return fields.some(f =>
    f.id !== currentId &&
    f.label.trim().toLowerCase() === normalized
  );
};

const updateSelectedField = (updates: any) => {
  if (!selectedField) return;

  setFields(prev =>
    prev.map(f => {
      if (f.id !== selectedField.id) return f;

      let updatedField = { ...f, ...updates };

  if (updates.label !== undefined) {
  const duplicate = isDuplicateLabel(updates.label, f.id);

  if (duplicate) {
    setLabelError("This label is already used in this template.");
  } else {
    setLabelError(null);
  }

  const newBase = generateFieldName(updates.label);
  updatedField.fieldName = `${newBase}_${f.fieldUUID}`;
}

      return updatedField;
    })
  );

  setSelectedField(prev => {
    if (!prev) return prev;

    let updated = { ...prev, ...updates };

  if (updates.label !== undefined) {
  const duplicate = isDuplicateLabel(updates.label, prev.id);

  if (duplicate) {
    setLabelError("This label is already used in this template.");
  } else {
    setLabelError(null);
  }

  const newBase = generateFieldName(updates.label);
  updated.fieldName = `${newBase}_${prev.fieldUUID}`;
}

    return updated;
  });
};
const computeFormula = (field: TemplateField) => {
  if (!field.formulaExpression?.trim()) return "";

  try {
    let expression = field.formulaExpression;

    // 🔹 Track if required fields have values
    let hasMissingValue = false;

    fields.forEach(f => {
      const nameRegex = new RegExp(`\\b${f.label}\\b`, "gi");

      if (nameRegex.test(expression)) {

       let value = previewValues[f.fieldName];

        // 🚨 If value is empty → return blank
        if (value === undefined || value === "") {
          hasMissingValue = true;
          return;
        }

        // Handle %
        if (typeof value === "string" && value.endsWith("%")) {
          value = value.replace("%", "");
        }

        if (isNaN(Number(value))) {
          hasMissingValue = true;
          return;
        }

        expression = expression.replace(nameRegex, Number(value).toString());
      }
    });

    // 🔥 If any field missing → return blank
    if (hasMissingValue) return "";

    // 🔹 Validate expression
    if (!/^[0-9+\-*/().\s]+$/.test(expression)) {
      return "";
    }

    const result = Function(`"use strict"; return (${expression})`)();

    if (isNaN(result)) return "";

    if (field.resultType === "percentage") {
      return result + "%";
    }

    return result;

  } catch {
    return "";
  }
};

useEffect(() => {
  if (isPreviewMode) {
 
    setSelectedField(null);
  }
}, [isPreviewMode]);

useEffect(() => {
  if (templateId) {
    loadFields();
  }
}, [templateId, currentPage]);

useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
   if (!selectedField) return;
if (isPreviewMode) return;
if (!pdfDimensions) return;

// 🔥 DO NOT MOVE if user is typing inside input/textarea/select
const active = document.activeElement as HTMLElement;

if (
  active &&
  (
    active.tagName === "INPUT" ||
    active.tagName === "TEXTAREA" ||
    active.tagName === "SELECT" ||
    active.isContentEditable
  )
) {
  return;
}

    const arrowKeys = [
      "ArrowUp",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight"
    ];

    if (!arrowKeys.includes(e.key)) return;

    // 🛑 STOP PAGE SCROLL
    e.preventDefault();

    const step = e.shiftKey ? 10 : 1;

    setFields(prev =>
      prev.map(field => {
       if (field.id !== selectedField.id) return field;

        let deltaX = 0;
        let deltaY = 0;

        switch (e.key) {
          case "ArrowUp":
            deltaY = -step;
            break;
          case "ArrowDown":
            deltaY = step;
            break;
          case "ArrowLeft":
            deltaX = -step;
            break;
          case "ArrowRight":
            deltaX = step;
            break;
        }

        const newX = Math.max(
          0,
          field.xPercent * pdfDimensions.width + deltaX
        );

        const newY = Math.max(
          0,
          field.yPercent * pdfDimensions.height + deltaY
        );

        return {
          ...field,
          xPercent: newX / pdfDimensions.width,
          yPercent: newY / pdfDimensions.height
        };
      })
    );
  };

  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, [selectedField, pdfDimensions, isPreviewMode]);

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-slate-100">

     {/* TOP BAR */}
<div className="bg-white border-b px-8 py-4 flex items-center">

  {/* LEFT SIDE */}
  <div className="flex items-center gap-4 min-w-[300px]">

    <button
      onClick={onBack}
      className="p-2 bg-slate-100 rounded-xl hover:bg-slate-200 transition"
    >
      <ArrowLeft size={18} />
    </button>

<input
  type="file"
  accept="application/pdf"
  onChange={async (e) => {
    if (!e.target.files || !e.target.files[0]) return;

    const file = e.target.files[0];

    // 🔥 Show preview immediately
    setPdfFile(file);

    const formData = new FormData();
    formData.append("pdf", file);


 const token = localStorage.getItem("token");

const response = await fetch(
  `${API_BASE}/api/custom-forms/template/${templateId}/upload-page`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: formData
  }
);

    if (!response.ok) {
      alert("Upload failed");
      return;
    }

    // 🔥 Clear local preview so it reloads from server
    setPdfFile(null);
	setPdfExists(true); // ADD THIS

  }}
  className="text-xs"
/>

  </div>

  {/* CENTER TITLE */}
  <div className="flex-1 text-center">
    <div className="text-sm font-black uppercase tracking-wider text-slate-700">
      Template Builder
    </div>
    <div className="text-[11px] text-slate-400">
      Template ID: {templateId}
    </div>
  </div>

  {/* RIGHT SIDE CONTROLS */}


  <div className="flex items-center gap-6 min-w-[300px] justify-end">

    {/* ZOOM */}
    <div className="flex items-center gap-2">
      <button
        onClick={() => setScale((prev) => Math.max(0.5, prev - 0.1))}
        className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-bold"
      >
        −
      </button>

      <span className="text-xs font-bold w-12 text-center">
        {Math.round(scale * 100)}%
      </span>

      <button
        onClick={() => setScale((prev) => Math.min(3, prev + 0.1))}
        className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-bold"
      >
        +
      </button>
    </div>



    {/* PAGE */}
    <div className="flex items-center gap-2">
      <button
        disabled={currentPage <= 1}
        onClick={() => setCurrentPage((prev) => prev - 1)}
        className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-bold disabled:opacity-40"
      >
        Prev
      </button>

      <span className="text-xs font-bold">
        Page {currentPage} / {numPages || 1}
      </span>

      <button
        disabled={currentPage >= numPages}
        onClick={() => setCurrentPage((prev) => prev + 1)}
        className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-bold disabled:opacity-40"
      >
        Next
      </button>
<div className="flex bg-slate-100 rounded-xl p-1 text-xs font-bold">
  <button
    onClick={() => setIsPreviewMode(false)}
    className={`px-3 py-1 rounded-lg transition ${
      !isPreviewMode
        ? "bg-white shadow text-slate-800"
        : "text-slate-500"
    }`}
  >
    Builder
  </button>

  <button
    onClick={() => setIsPreviewMode(true)}
    className={`px-3 py-1 rounded-lg transition ${
      isPreviewMode
        ? "bg-white shadow text-slate-800"
        : "text-slate-500"
    }`}
  >
    Preview
  </button>
</div>
 <button
  onClick={() => setShowAuthModal(true)}
  disabled={isSaving || !!labelError}
className={`px-4 py-2 text-xs font-bold rounded-lg ${
  isSaving || labelError
    ? "bg-slate-400 cursor-not-allowed"
    : "bg-emerald-600 hover:bg-emerald-700"
} text-white`}
>
  {isSaving ? "Syncing..." : "Save Fields"}
</button>


    </div>

  </div>
</div>

      {/* MAIN AREA */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT TOOLBOX */}
    <div className="w-64 bg-white border-r border-slate-200 flex flex-col">

  {/* HEADER */}
  <div className="px-4 py-3 border-b border-slate-100">
    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
      Field Toolbox
    </div>
  </div>

  {/* FIELD LIST */}
  <div className="flex-1 overflow-y-auto py-2">

   {FIELD_TYPES.map((field) => (
  <button
    key={field.type}
    onClick={() => {
      if (!isPreviewMode) {
        addField(field.type);
      }
    }}
    disabled={isPreviewMode}
    className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-black uppercase transition-all ${
      isPreviewMode
        ? "opacity-40 cursor-not-allowed"
        : "text-slate-600 hover:bg-slate-50"
    }`}
  >
        <div className="w-6 h-6 flex items-center justify-center bg-slate-100 rounded-md text-[10px] font-black">
          {field.icon}
        </div>

        <span className="tracking-wide">
          {field.label}
        </span>
      </button>
    ))}

  </div>
</div>
{/* PDF AREA */}
<div className="flex-1 overflow-auto bg-slate-100 py-10">
  <div className="max-w-[1100px] mx-auto flex justify-center">

{pdfExists === null ? (
  <div className="flex items-center justify-center h-[600px] text-slate-400 text-sm font-bold">
    Loading template...
  </div>
) : pdfExists === false && !pdfFile ? (
<div className="flex flex-col items-center justify-center h-[600px] text-slate-400">
  <div className="text-4xl mb-3">📄</div>
  <div className="text-sm font-bold">
    Upload PDF to Start Building
  </div>
</div>
) : (
<Document
  file={pdfFile ?? pdfFileSource}
  onLoadSuccess={(pdf) => {
    setNumPages(pdf.numPages);
    setPdfExists(true);
  }}
  onLoadError={() => {
    setPdfExists(false);
  }}
>
      <div className="relative shadow-2xl bg-white inline-block">

        <Page
          pageNumber={currentPage}
          scale={scale}
          renderTextLayer={false}
          renderAnnotationLayer={false}
          onLoadSuccess={(page) => {
            const { width, height } = page;
            setPdfDimensions({ width, height });
          }}
        />
{/* FIELD OVERLAY */}
<div className="absolute inset-0 z-10">
  {fields
  .filter(f => f.page === currentPage)
  .map(field => {

const orientation =
  field.listOrientation ||
  field.list_orientation ||
  field.orientation ||
  "vertical";

if (isPreviewMode) {
const isSystemField = field.dataSource === "system";
const previewFontStyle = {
  fontSize: field.fontSize,
  fontWeight: field.fontWeight,
  fontFamily: field.fontFamily,
  fontStyle: field.fontStyle,
  textAlign: field.textAlign,
};

  return (
    <div
      key={field.fieldName}
      style={{
        position: "absolute",
        width: pdfDimensions
          ? field.widthPercent * pdfDimensions.width
          : 100,
        height: pdfDimensions
          ? field.heightPercent * pdfDimensions.height
          : 30,
        left: pdfDimensions
          ? field.xPercent * pdfDimensions.width
          : 0,
        top: pdfDimensions
          ? field.yPercent * pdfDimensions.height
          : 0,
      }}
      className={`text-xs ${
  field.type !== "system_user"
    ? "border border-slate-300 bg-white overflow-hidden"
    : ""
}`}
    >

{/* INPUT TEXT (Preview Mode - Typed Validation) */}
{field.type === "input_text" && (() => {


  // 🔹 PERCENTAGE
  if (field.inputType === "percentage") {
    const currentValue = previewValues[field.fieldName] ?? "";

    return (
      <input
        type="text"
		disabled={isSystemField}
		style={previewFontStyle}
        value={currentValue}
        placeholder={field.placeholder || ""}
        onChange={(e) => {
          let value = e.target.value.replace("%", "");
          value = value.replace(/[^0-9.]/g, "");

          const parts = value.split(".");
          if (parts.length > 2) {
            value = parts[0] + "." + parts.slice(1).join("");
          }

          if (value !== "") {
            const num = Number(value);
            if (num > 100) value = "100";
            if (num < 0) value = "0";
            value = value + "%";
          }

          setPreviewValues(prev => ({
            ...prev,
            [field.fieldName]: value
          }));
        }}
        className="w-full outline-none text-slate-700"
      />
    );
  }

  // 🔹 WHOLE NUMBER
  if (field.inputType === "number") {
    return (
      <input
        type="text"
		disabled={isSystemField}
		style={previewFontStyle}
        value={previewValues[field.fieldName] || ""}
        placeholder={field.placeholder || ""}
        onChange={(e) => {
          const value = e.target.value.replace(/[^0-9]/g, "");
          setPreviewValues(prev => ({
            ...prev,
            [field.fieldName]: value
          }));
        }}
        className="w-full outline-none text-slate-700"
      />
    );
  }

  // 🔹 DECIMAL
  if (field.inputType === "decimal") {
    return (
      <input
        type="text"
		disabled={isSystemField}
		style={previewFontStyle}
        value={previewValues[field.fieldName] || ""}
        placeholder={field.placeholder || ""}
        onChange={(e) => {
          let value = e.target.value.replace(/[^0-9.]/g, "");

          const parts = value.split(".");
          if (parts.length > 2) {
            value = parts[0] + "." + parts.slice(1).join("");
          }

          setPreviewValues(prev => ({
            ...prev,
            [field.fieldName]: value
          }));
        }}
        className="w-full outline-none text-slate-700"
      />
    );
  }

  // 🔹 DEFAULT TEXT
  return (
<input
  type="text"
  value={previewValues[field.fieldName] || ""}
  placeholder={field.placeholder || ""}
  disabled={isSystemField}
  style={previewFontStyle}
  onChange={(e) => {
    if (isSystemField) return;

    setPreviewValues(prev => ({
      ...prev,
      [field.fieldName]: e.target.value
    }));
  }}
  className={`w-full outline-none text-slate-700 ${
    isSystemField ? "bg-slate-100 cursor-not-allowed" : ""
  }`}
/>
  );

})()}

      {/* DROPDOWN */}
      {field.type === "select" && (
        <select
		disabled={isSystemField}
		style={previewFontStyle}
          value={previewValues[field.fieldName] || ""}
          onChange={(e) =>
            setPreviewValues(prev => ({
              ...prev,
              [field.fieldName]: e.target.value
            }))
          }
          className="w-full border border-slate-300 text-xs bg-white"
        >
          {(field.options?.length ? field.options : ["Option 1"]).map((opt, index) => (
            <option key={`${field.fieldName}-${opt}`} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      )}

{/* CHECKBOX (Preview Mode) */}
{field.type === "checkbox" && (
  <input
  disabled={isSystemField}
    type="checkbox"
	style={previewFontStyle}
    checked={previewValues[field.fieldName] || false}
    onChange={(e) =>
      setPreviewValues(prev => ({
        ...prev,
        [field.fieldName]: e.target.checked
      }))
    }
  />
)}		

{/* LIST (Preview Mode) */}
{field.type === "list" && (
  <div
    className={`${
      orientation === "horizontal"
        ? "flex flex-wrap gap-4"
        : "flex flex-col gap-1"
    } text-xs`}
  >
    {(field.options || []).map((opt, index) => {
      const selectedValues: string[] = previewValues[field.fieldName] || [];

      return (
        <label key={`${field.fieldName}-${opt}-${index}`} className="flex items-center gap-1">
          <input
            type="checkbox"
			style={previewFontStyle}
			disabled={isSystemField}
            checked={selectedValues.includes(opt)}
            onChange={(e) => {
              setPreviewValues(prev => {
                const current: string[] = prev[field.fieldName] || [];

                if (e.target.checked) {
                  return {
                    ...prev,
                    [field.fieldName]: [...current, opt]
                  };
                } else {
                  return {
                    ...prev,
                    [field.fieldName]: current.filter(v => v !== opt)
                  };
                }
              });
            }}
          />
          <span style={previewFontStyle}>{opt}</span>
        </label>
      );
    })}
  </div>
)} 

  {/* RADIO BUTTON (Preview Mode) */}
{field.type === "radio_button" && (
  <div
    className={`${
      orientation === "horizontal"
        ? "flex flex-wrap gap-4"
        : "flex flex-col gap-1"
    } text-xs`}
  >
    {(field.options || []).map((opt, index) => (
      <label key={`${field.fieldName}-${opt}-${index}`} className="flex items-center gap-1">
        <input
          type="radio"
		  style={previewFontStyle}
		  disabled={isSystemField}
          name={field.fieldName} // 🔥 IMPORTANT: ensures single selection
          checked={previewValues[field.fieldName] === opt}
          onChange={() =>
            setPreviewValues(prev => ({
              ...prev,
              [field.fieldName]: opt
            }))
          }
        />
        <span style={previewFontStyle}>{opt}</span>
      </label>
    ))}
  </div>
)}

{/* FORMULA (Preview Mode) */}
{field.type === "formula" && (
  <input
    type="text"
	style={previewFontStyle}
	disabled={isSystemField}
    value={computeFormula(field)}
    readOnly
    className="w-full bg-slate-100 outline-none text-slate-700 text-xs font-bold"
  />
)}

{/* IMAGE (Preview Mode) */}
{field.type === "image" && (
  <div className="relative w-full h-full border border-slate-300 bg-white overflow-hidden">

    {previewValues[field.fieldName] ? (
      <>
        <img
          src={previewValues[field.fieldName]}
          alt="Uploaded"
          className="w-full h-full object-contain"
        />

        <button
          onClick={() => setImageToDelete(field.fieldName)}
          className="absolute top-1 right-1 bg-red-600 text-white text-[10px] px-2 py-0.5 rounded"
        >
          ✕
        </button>
      </>
    ) : (
      <label className="w-full h-full flex items-center justify-center cursor-pointer text-blue-600 text-xs font-bold">
        Upload
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = () => {
              setPreviewValues(prev => ({
                ...prev,
                [field.fieldName]: reader.result
              }));
            };
            reader.readAsDataURL(file);
          }}
        />
      </label>
    )}
  </div>
)}

{/* SYSTEM USER (Preview Mode) */}
{field.type === "system_user" && (
  <div
    style={{
      fontSize: field.fontSize,
      fontWeight: field.fontWeight,
      fontFamily: field.fontFamily,
      textAlign: field.textAlign,
      width: "100%",
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent:
        field.textAlign === "center"
          ? "center"
          : field.textAlign === "right"
          ? "flex-end"
          : "flex-start",
      color: "#000"
    }}
  >
   {user?.displayName || user?.fullName || user?.username || ""}
  </div>
)}
{/* DATE / TIME (Preview Mode) */}
{field.type === "date" && (() => {

  const now = new Date();

  // ✅ Convert UTC → Local (Philippines UTC+8)
  const localISODateTime = new Date(
    now.getTime() - now.getTimezoneOffset() * 60000
  ).toISOString().slice(0, 16);

  const localISODate = localISODateTime.split("T")[0];
  const localISOTime = localISODateTime.split("T")[1];

  const getType = () => {
    if (field.dateMode === "time") return "time";
    if (field.dateMode === "datetime") return "datetime-local";
    return "date";
  };

  const getAutoValue = () => {
    if (!field.autoNow) return previewValues[field.fieldName] || "";

    if (field.dateMode === "time") return localISOTime;
    if (field.dateMode === "datetime") return localISODateTime;
    return localISODate;
  };
  
  
return (
  <input
    type={getType()}
    value={getAutoValue()}
	style={previewFontStyle}
    min={field.minDate || undefined}
    max={
      field.isBirthdate
        ? localISODate
        : field.maxDate || undefined
    }
    disabled={isSystemField}
    onChange={(e) => {
      if (isSystemField) return;

      setPreviewValues(prev => ({
        ...prev,
        [field.fieldName]: e.target.value
      }));
    }}
    className={`w-full outline-none text-slate-700 border border-slate-300 text-xs ${
      isSystemField ? "bg-slate-100 cursor-not-allowed" : ""
    }`}
  />
);
})()}

{/* LABEL */}
{field.type === "label" && (
  <span style={previewFontStyle}>{field.label}</span>
)}
    </div>
  );
}

  // 🟢 BUILDER MODE (FIXED - FULL VERSION)
return (
  <Rnd
    key={field.fieldName}
    bounds="parent"
    size={{
      width: pdfDimensions
        ? field.widthPercent * pdfDimensions.width
        : 100,
      height: pdfDimensions
        ? field.heightPercent * pdfDimensions.height
        : 30
    }}
    position={{
      x: pdfDimensions
        ? field.xPercent * pdfDimensions.width
        : 0,
      y: pdfDimensions
        ? field.yPercent * pdfDimensions.height
        : 0
    }}
    onDragStop={(e, d) => {
      if (!pdfDimensions) return;

      const newXPercent = d.x / pdfDimensions.width;
      const newYPercent = d.y / pdfDimensions.height;

      setFields(prev =>
        prev.map(f =>
          f.id === field.id
            ? { ...f, xPercent: newXPercent, yPercent: newYPercent }
            : f
        )
      );
    }}
    onResizeStop={(e, direction, ref, delta, position) => {
      if (!pdfDimensions) return;

      const newWidthPercent =
        ref.offsetWidth / pdfDimensions.width;

      const newHeightPercent =
        ref.offsetHeight / pdfDimensions.height;

      const newXPercent =
        position.x / pdfDimensions.width;

      const newYPercent =
        position.y / pdfDimensions.height;

      setFields(prev =>
        prev.map(f =>
          f.id === field.id
            ? {
                ...f,
                widthPercent: newWidthPercent,
                heightPercent: newHeightPercent,
                xPercent: newXPercent,
                yPercent: newYPercent
              }
            : f
        )
      );
    }}
    onClick={() => {
      if (!isPreviewMode) {
        setSelectedField(field);
      }
    }}
    className={`border-2 ${
      selectedField?.id === field.id
        ? "border-blue-500"
        : "border-emerald-400"
    } bg-white text-[10px] font-bold cursor-move`}
  >
    <div
      style={{
        fontSize: field.fontSize,
        fontWeight: field.fontWeight,
        textAlign: field.textAlign,
        fontFamily: field.fontFamily,
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent:
          field.textAlign === "center"
            ? "center"
            : field.textAlign === "right"
            ? "flex-end"
            : "flex-start"
      }}
    >

{/* INPUT TEXT (Builder Mode) */}
{field.type === "input_text" && (
  <input
    type="text"
    disabled
    placeholder={field.placeholder || ""}
    className="w-full bg-transparent outline-none text-slate-700 pointer-events-none"
  />
)}

      {/* TEXTAREA */}
      {field.type === "textarea" && (
        <textarea
          placeholder={field.placeholder || ""}
          disabled
          className="w-full h-full bg-transparent outline-none resize-none text-slate-700 pointer-events-none"
        />
      )}

      {/* DROPDOWN */}
      {field.type === "select" && (
        <select
          disabled
          className="w-full bg-transparent text-slate-700 pointer-events-none"
        >
          {(field.options && field.options.length > 0
            ? field.options
            : ["Option 1"]
          ).map((opt, index) => (
            <option key={`${field.fieldName}-${opt}`}>{opt}</option>
          ))}
        </select>
      )}

      {/* CHECKBOX */}
      {field.type === "checkbox" && (
        <input type="checkbox" disabled />
      )}
{/* LIST (Builder Mode) */}
{field.type === "list" && (
  <div
  style={{
    fontSize: field.fontSize,
    fontWeight: field.fontWeight,
    fontFamily: field.fontFamily,
    textAlign: field.textAlign
  }}
  className={`pointer-events-none ${
    field.listOrientation === "horizontal"
      ? "flex flex-wrap gap-4"
      : "flex flex-col gap-1"
  }`}
>
    {(field.options && field.options.length > 0
      ? field.options
      : ["Option 1"]
    ).map((opt, index) => (
      <label key={`${field.fieldName}-${opt}-${index}`} className="flex items-center gap-1">
        <input type="checkbox" disabled />
        <span>{opt}</span>
      </label>
    ))}
  </div>
)}

{/* DATE / TIME */}
{field.type === "date" && (
  <input
    type="datetime-local"
    disabled
    className="w-full bg-transparent outline-none text-slate-700 pointer-events-none text-xs"
  />
)}

{/* RADIO BUTTON (Builder Mode) */}
{field.type === "radio_button" && (
<div
  style={{
    fontSize: field.fontSize,
    fontWeight: field.fontWeight,
    fontFamily: field.fontFamily,
    textAlign: field.textAlign
  }}
  className={`pointer-events-none ${
    field.listOrientation === "horizontal"
      ? "flex flex-wrap gap-4"
      : "flex flex-col gap-1"
  }`}
>
    {(field.options && field.options.length > 0
      ? field.options
      : ["Option 1"]
    ).map((opt, index) => (
      <label key={`${field.fieldName}-${opt}-${index}`} className="flex items-center gap-1">
        <input type="radio" disabled />
        <span>{opt}</span>
      </label>
    ))}
  </div>
)}

{/* FORMULA (Builder Mode) */}
{field.type === "formula" && (
<input
  type="text"
  disabled
  placeholder="%Result"
  style={{
    fontSize: field.fontSize,
    fontWeight: field.fontWeight,
    fontFamily: field.fontFamily,
    textAlign: field.textAlign
  }}
  className="w-full bg-slate-50 pointer-events-none"
/>
)}

{/* IMAGE (Builder Mode) */}
{field.type === "image" && (
  <div className="w-full h-full bg-slate-100 border border-dashed border-slate-300 pointer-events-none" />
)}

{/* SYSTEM USER (Builder Mode) */}
{field.type === "system_user" && (
  <div
    style={{
      fontSize: field.fontSize,
      fontWeight: field.fontWeight,
      fontFamily: field.fontFamily,
      textAlign: field.textAlign,
      width: "100%",
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent:
        field.textAlign === "center"
          ? "center"
          : field.textAlign === "right"
          ? "flex-end"
          : "flex-start"
    }}
    className="pointer-events-none"
  >
    Current User Name
  </div>
)}

      {/* LABEL */}
      {field.type === "label" && (
        <span>{field.label}</span>
      )}

      {/* DEFAULT FALLBACK */}
      {field.type !== "input_text" &&
        field.type !== "textarea" &&
        field.type !== "label" &&
        field.type !== "select" &&
        field.type !== "checkbox" &&
        field.type !== "list" && 
		field.type !== "date" &&
		field.type !== "radio_button" &&
		field.type !== "formula" &&
		field.type !== "image" &&
		field.type !== "system_user" &&(
          <span>{field.label}</span>
      )}

    </div>
  </Rnd>
    );
  })}
</div>
 </div>
</Document>
)}
  </div>
</div>
{/* RIGHT PROPERTIES */}
<div className="w-72 bg-white border-l flex flex-col">

  <div className="flex-1 overflow-y-auto p-4">

    <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
      Field Properties
    </div>

  {selectedField ? (
    <div className="space-y-4 mt-4">



      {/* LABEL */}
   {(
  selectedField.type === "input_text" ||
  selectedField.type === "textarea"
) && (
  <div>
    <label className="text-[10px] font-black uppercase text-slate-400">
      Label
    </label>
    <input
      type="text"
      value={selectedField.label}
      onChange={(e) =>
        updateSelectedField({ label: e.target.value })
      }
      className={`w-full mt-1 border rounded-lg px-3 py-1.5 text-xs font-semibold ${
  labelError
    ? "border-red-500 focus:ring-2 focus:ring-red-400"
    : "border-slate-300"
}`}
    />
  </div>
)}
{labelError && (
  <div className="text-[10px] text-red-600 font-bold mt-1">
    {labelError}
  </div>
)}
	   {/* SIZE*/}
	  <div>
  <label className="text-[10px] font-black uppercase text-slate-400">
    Field Name
  </label>
<input
  type="text"
  value={selectedField.fieldName}
  readOnly
  className="w-full mt-1 bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 cursor-not-allowed"
/>
</div>

 {/* INPUT TYPE*/}
{selectedField.type === "input_text" && (
  <div>
    <label className="text-[10px] font-black uppercase text-slate-400">
      Input Type
    </label>

    <select
      value={selectedField.inputType || "text"}
      onChange={(e) =>
        updateSelectedField({ inputType: e.target.value })
      }
      className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold"
    >
      <option value="text">Text</option>
      <option value="number">Whole Number</option>
      <option value="decimal">Decimal</option>
      <option value="percentage">Percentage</option>
    </select>
  </div>
)}

 {/* RESULT TYPE*/}
{selectedField.type === "formula" && (
  <div>
    <label className="text-[10px] font-black uppercase text-slate-400">
      Result Type
    </label>

    <select
      value={selectedField.resultType || "number"}
      onChange={(e) =>
        updateSelectedField({ resultType: e.target.value })
      }
      className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold"
    >
      <option value="number">Number</option>
      <option value="decimal">Decimal</option>
      <option value="percentage">Percentage</option>
    </select>
  </div>
)}

{/* PLACEHOLDER*/}
{(
  selectedField.type === "input_text" ||
  selectedField.type === "textarea"
) && (
  <div>
    <label className="text-[10px] font-black uppercase text-slate-400">
      Placeholder
    </label>

    <input
      type="text"
      value={selectedField.placeholder || ""}
      onChange={(e) =>
        updateSelectedField({ placeholder: e.target.value })
      }
      className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold"
    />
  </div>
)}

{/* FORMULA SETTINGS */}
{selectedField.type === "formula" && (
  <div className="space-y-3">
    <div>
      <label className="text-[10px] font-black uppercase text-slate-400">
        Formula Expression
      </label>

      <input
        type="text"
        value={selectedField.formulaExpression || ""}
        onChange={(e) =>
          updateSelectedField({
            formulaExpression: e.target.value
          })
        }
        placeholder="ex: height_123 + weight_456"
        className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-1.5 text-xs"
      />

      <div className="text-[10px] text-slate-400 mt-1">
        Use fieldName values (check Field Name above)
      </div>
    </div>
  </div>
)}

{(
  selectedField.type === "select" ||
  selectedField.type === "list" ||
  selectedField.type === "radio_button"
) && (
  <div>
    <label className="text-[10px] font-black uppercase text-slate-400">
      Dropdown Options
    </label>

    {selectedField.options?.map((opt, index) => (
      <div key={`${field.fieldName}-${opt}-${index}`} className="flex gap-2 mt-1">
        <input
          type="text"
          value={opt}
          onChange={(e) => {
            const newOptions = [...(selectedField.options || [])];
            newOptions[index] = e.target.value;
            updateSelectedField({ options: newOptions });
          }}
          className="flex-1 border border-slate-300 rounded px-2 py-1 text-xs"
        />

        <button
          onClick={() => {
            const newOptions = selectedField.options?.filter((_, i) => i !== index);
            updateSelectedField({ options: newOptions });
          }}
          className="text-red-500 text-xs"
        >
          ✕
        </button>
      </div>
    ))}

    <button
      onClick={() =>
        updateSelectedField({
          options: [...(selectedField.options || []), "New Option"]
        })
      }
      className="mt-2 text-xs text-blue-600 font-bold"
    >
      + Add Option
    </button>
	
	{/* LIST ORIENTATION */}
{(
  selectedField.type === "list" ||
  selectedField.type === "radio_button"
) && (
  <div className="mt-3">
    <label className="text-[10px] font-black uppercase text-slate-400">
      List Orientation
    </label>

    <select
      value={selectedField.listOrientation || "vertical"}
      onChange={(e) =>
        updateSelectedField({
          listOrientation: e.target.value
        })
      }
      className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold"
    >
      <option value="vertical">Vertical</option>
      <option value="horizontal">Horizontal</option>
    </select>
  </div>
)}
  </div>
)}

{/* DATE SETTINGS */}
{selectedField.type === "date" && (
  <div className="space-y-3">

    <div>
      <label className="text-[10px] font-black uppercase text-slate-400">
        Date Type
      </label>
      <select
        value={selectedField.dateMode || "date"}
        onChange={(e) =>
          updateSelectedField({ dateMode: e.target.value })
        }
        className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold"
      >
        <option value="date">Date Only</option>
        <option value="time">Time Only</option>
        <option value="datetime">Date & Time</option>
      </select>
    </div>

    {!(
  selectedField.type === "label" ||
  selectedField.type === "system_user" ||
  selectedField.type === "radio_button" ||
  selectedField.type === "formula"
) && (
<div className="flex items-center gap-2">
      <input
        type="checkbox"
        checked={selectedField.autoNow || false}
        onChange={(e) =>
          updateSelectedField({ autoNow: e.target.checked })
        }
      />
      <span className="text-xs font-bold text-slate-700">
        Auto Current Timestamp
      </span>
    </div>
	)}

    {selectedField.dateMode !== "time" && (
      <>
        <div>
          <label className="text-[10px] font-black uppercase text-slate-400">
            Min Date
          </label>
          <input
            type="date"
            value={selectedField.minDate || ""}
            onChange={(e) =>
              updateSelectedField({ minDate: e.target.value })
            }
            className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-1.5 text-xs"
          />
        </div>

        <div>
          <label className="text-[10px] font-black uppercase text-slate-400">
            Max Date
          </label>
          <input
            type="date"
            value={selectedField.maxDate || ""}
            onChange={(e) =>
              updateSelectedField({ maxDate: e.target.value })
            }
            className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-1.5 text-xs"
          />
        </div>
      </>
    )}

    <div className="flex items-center gap-2">
      <input
        type="checkbox"
        checked={selectedField.isBirthdate || false}
        onChange={(e) =>
          updateSelectedField({ isBirthdate: e.target.checked })
        }
      />
      <span className="text-xs font-bold text-slate-700">
        Birthdate Mode (No Future Dates)
      </span>
    </div>

  </div>
)}
{/* REQUIRED*/}
<div className="flex items-center gap-2">
  <input
    type="checkbox"
    checked={selectedField.required}
    onChange={(e) =>
      updateSelectedField({ required: e.target.checked })
    }
  />
  <span
    className={`text-xs font-bold ${
      selectedField.required
        ? "text-red-600"
        : "text-slate-700"
    }`}
  >
    Required Field?
  </span>
</div>


<div className="pt-4">
<button
  onClick={() => setShowDeleteConfirm(true)}
  className="w-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2 rounded-lg"
>
  Delete Field
</button>
</div>
{/* FONT STYLE SIZE POSITION*/}
<div className="space-y-2">

  <label className="text-[10px] font-black uppercase text-slate-400">
    Font & Style
  </label>

  <div className="flex gap-2">

    <input
      type="number"
      value={selectedField.fontSize}
      onChange={(e) =>
        updateSelectedField({ fontSize: Number(e.target.value) })
      }
      className="w-20 bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold outline-none focus:ring-2 focus:ring-slate-300"
    />

    <select
      value={selectedField.fontWeight}
      onChange={(e) =>
        updateSelectedField({ fontWeight: e.target.value })
      }
      className="bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold outline-none"
    >
      <option value="normal">Normal</option>
      <option value="bold">Bold</option>
    </select>

    <select
      value={selectedField.textAlign}
      onChange={(e) =>
        updateSelectedField({ textAlign: e.target.value })
      }
      className="bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold outline-none"
    >
      <option value="left">Left</option>
      <option value="center">Center</option>
      <option value="right">Right</option>
    </select>

  </div>
</div>

<div className="space-y-1">
  <label className="text-[10px] font-black uppercase text-slate-400">
    Font Family
  </label>

  <select
    value={selectedField.fontFamily || "Arial"}
    onChange={(e) =>
      updateSelectedField({ fontFamily: e.target.value })
    }
    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold outline-none"
  >
    <option value="Arial">Arial</option>
    <option value="Segoe UI">Segoe UI</option>
    <option value="Tahoma">Tahoma</option>
    <option value="Verdana">Verdana</option>
	<option value="Calibri">Calibri</option>
  </select>
</div>

      {/* DATA SOURCE */}
      {selectedField.type !== "system_user" && (
  <div>
    <label className="text-[10px] font-black uppercase text-slate-400">
      Data Source
    </label>
    <select
      value={selectedField.dataSource}
      onChange={(e) =>
        updateSelectedField({
          dataSource: e.target.value,
          systemBinding: null
        })
      }
      className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold"
    >
      <option value="manual">Manual Input</option>
      <option value="system">System Data</option>
    </select>
  </div>
)}

      {/* SYSTEM BINDING */}
      {selectedField.type !== "system_user" &&
 selectedField.dataSource === "system" && (
        <div>
          <label className="text-[10px] font-black uppercase text-slate-400">
            Bind To
          </label>

          <select
            value={selectedField.systemBinding ?? ""}
            onChange={(e) =>
              updateSelectedField({
                systemBinding: e.target.value
              })
            }
            className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold"
          >
            <option value="">Select field...</option>

            {SYSTEM_FIELD_REGISTRY.map(group => (
              <optgroup key={group.group} label={group.group}>
                {group.fields.map(field => (
                  <option key={field.key} value={field.key}>
                    {field.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      )}

    </div>
  ) : (
    <div className="text-xs text-slate-400 mt-4">
      Select a field to edit
    </div>
  )}
</div>
</div>

      </div>
{showAuthModal && (
  <AuthModal
    currentUsername={user?.username || ""}
    onClose={() => setShowAuthModal(false)}
    onVerified={(user) => {
      setShowAuthModal(false);
      saveFields(user);
    }}
  />
)}

{showDeleteConfirm && selectedField && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[99999]">
    <div className="bg-white rounded-xl shadow-2xl p-6 w-[320px]">
      
	  
      <div className="text-sm font-bold text-slate-700">
        Delete Field
      </div>

      <div className="text-xs text-slate-500 mt-2">
        Are you sure you want to delete this field?
        <br />
        <span className="font-bold text-slate-700">
          {selectedField.label}
        </span>
      </div>

      <div className="flex justify-end gap-2 mt-6">
        <button
          onClick={() => setShowDeleteConfirm(false)}
          className="px-4 py-1.5 text-xs font-bold bg-slate-200 rounded-lg"
        >
          Cancel
        </button>

        <button
      onClick={() => {
  setFields(prev =>
    prev.filter(f => f.id !== selectedField.id)
  );
  setSelectedField(null);
  setLabelError(null);
  setShowDeleteConfirm(false);
}}
          className="px-4 py-1.5 text-xs font-bold bg-red-600 text-white rounded-lg"
        >
          Delete
        </button>
      </div>
    </div>
  </div>
)}
{imageToDelete && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[99999]">
    <div className="bg-white rounded-xl shadow-2xl p-6 w-[320px]">

      <div className="text-sm font-bold text-slate-700">
        Remove Image
      </div>

      <div className="text-xs text-slate-500 mt-2">
        Are you sure you want to remove this image?
      </div>

      <div className="flex justify-end gap-2 mt-6">
        <button
          onClick={() => setImageToDelete(null)}
          className="px-4 py-1.5 text-xs font-bold bg-slate-200 rounded-lg"
        >
          Cancel
        </button>

        <button
          onClick={() => {
            setPreviewValues(prev => ({
              ...prev,
              [imageToDelete]: null
            }));
            setImageToDelete(null);
          }}
          className="px-4 py-1.5 text-xs font-bold bg-red-600 text-white rounded-lg"
        >
          Remove
        </button>
      </div>
    </div>
  </div>
)}
<TransactionOverlay
  key={txKey}
  status={txStatus}
  message={txMsg}
  onClose={() => setTxStatus("idle")}
/>
    </div>
  );
};