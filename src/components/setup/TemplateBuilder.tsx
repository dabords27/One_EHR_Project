import React, { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";
import { SYSTEM_FIELD_REGISTRY } from "../../utils/systemFieldRegistry";
import { Rnd } from "react-rnd";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();
interface Props {
  templateId: number;
  onBack: () => void;
}

export const TemplateBuilder: React.FC<Props> = ({
  templateId,
  onBack
}) => {
  
const [pdfFile, setPdfFile] = useState<File | null>(null);
const [numPages, setNumPages] = useState<number>(0);
const [currentPage, setCurrentPage] = useState<number>(1);
const [scale, setScale] = useState<number>(1);
const [selectedField, setSelectedField] = useState<any>(null);
const [fields, setFields] = useState<any[]>([]);
const [pdfDimensions, setPdfDimensions] = useState<{
  width: number;
  height: number;
} | null>(null);

const addField = (type: string) => {
  const newField = {
  id: Date.now(),
  type,
  page: currentPage,

  xPercent: 0.2,
  yPercent: 0.2,
  widthPercent: 0.15,
  heightPercent: 0.05,

  label: `${type} field`,
  dataSource: "manual",
  systemBinding: null,
  required: false
};

  setFields(prev => [...prev, newField]);
};

const FIELD_TYPES = [
  { type: "label", label: "Label", icon: "T" },
  { type: "title", label: "Title", icon: "T+" },
  { type: "paragraph", label: "Paragraph", icon: "¶" },
  { type: "list", label: "List", icon: "≡" },
  { type: "checkbox", label: "Checkbox", icon: "☑" },
  { type: "input_text", label: "Input Text", icon: "⌨" },
  { type: "textarea", label: "Input Textarea", icon: "📝" },
  { type: "select", label: "Input Select", icon: "▾" },
  { type: "date", label: "Date / Time", icon: "📅" },
  { type: "image", label: "Image", icon: "🖼" },
  { type: "annotation", label: "Annotation", icon: "✎" },
  { type: "table", label: "Table", icon: "▦" },
  { type: "system_user", label: "System User", icon: "👤" },
  { type: "order_button", label: "Order Button", icon: "⏺" }
];

const updateSelectedField = (updates: any) => {
  setFields(prev =>
    prev.map(f =>
      f.id === selectedField.id ? { ...f, ...updates } : f
    )
  );

  setSelectedField(prev => ({ ...prev, ...updates }));
};

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
      onChange={(e) => {
        if (e.target.files && e.target.files[0]) {
          setPdfFile(e.target.files[0]);
        }
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
        onClick={() => addField(field.type)}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-black uppercase text-slate-600 hover:bg-slate-50 transition-all"
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

    {pdfFile ? (
      <Document
  file={pdfFile}
  onLoadSuccess={({ numPages }) => {
    setNumPages(numPages);
    setCurrentPage(1);
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
        .map(field => (
         <Rnd
  key={field.id}
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
  onClick={() => setSelectedField(field)}
  className={`border-2 ${
    selectedField?.id === field.id
      ? "border-blue-500"
      : "border-emerald-400"
  } bg-white text-[10px] font-bold flex items-center justify-center cursor-move`}
>
  {field.type.toUpperCase()}
</Rnd>
        ))}
    </div>

  </div>
</Document>
    ) : (
      <div className="h-[700px] flex items-center justify-center text-slate-300 font-black text-lg">
        Upload a PDF to start building
      </div>
    )}

  </div>
</div>

       {/* RIGHT PROPERTIES */}
<div className="w-72 bg-white border-l p-4">
  <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
    Field Properties
  </div>

  {selectedField ? (
    <div className="space-y-4 mt-4">

      {/* LABEL */}
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
          className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold"
        />
      </div>

      {/* DATA SOURCE */}
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

      {/* SYSTEM BINDING */}
      {selectedField.dataSource === "system" && (
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
  );
};