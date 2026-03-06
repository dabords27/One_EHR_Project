import React from "react";
import { FormTemplate } from "../../types";
import { SYSTEM_FIELD_REGISTRY } from "../../utils/systemFieldRegistry";

interface Props {
  template: FormTemplate | null;
  formData: Record<string, any>;
  systemData: Record<string, any>;
  currentPage: number;
  pdfDimensions: { width: number; height: number } | null;
  zoom: number; // ✅ ADD THIS
  onChange: (name: string, value: any) => void;
  readOnly?: boolean;
}

export const CustomTemplateRenderer: React.FC<Props> = ({
  template,
  formData,
  systemData,
  currentPage,
  pdfDimensions,
  zoom, // ✅ ADD THIS
  onChange,
  readOnly = false
}) => {

  if (!template) {

    return null;
  }

  if (!template.fields || template.fields.length === 0) {

    return null;
  }

  if (!pdfDimensions) {

    return null;
  }

// 🔥 SYSTEM VALUE RESOLVER
const resolveSystemValue = (bindingKey: string) => {

  if (!bindingKey) return "";

  const normalize = (v: string) =>
    v?.toString().toLowerCase().replace(/[^a-z0-9]/g, "");

  const normalizedSystem = Object.keys(systemData || {}).reduce((acc, key) => {
    acc[normalize(key)] = systemData[key];
    return acc;
  }, {} as Record<string, any>);

  const columnKey = bindingKey.split(".").pop();
  if (!columnKey) return "";

  const normalizedColumn = normalize(columnKey);

  /* =============================
     DIRECT MATCH
  ============================= */

  if (normalizedSystem[normalizedColumn] !== undefined) {
    return normalizedSystem[normalizedColumn];
  }

  /* =============================
     COMPUTED FIELDS (PRINT LOGIC)
  ============================= */

  if (bindingKey === "patient_name") {
    return `${systemData.last_name || ""} ${systemData.first_name || ""} ${systemData.middle_name || ""}`.trim();
  }

  if (bindingKey === "age") {

    if (!systemData.birthdate) return "";

    const birth = new Date(systemData.birthdate);
    const today = new Date();

    const years = today.getFullYear() - birth.getFullYear();
    const months = today.getMonth() - birth.getMonth();
    const days = today.getDate() - birth.getDate();

    return `${years}Y ${Math.abs(months)}M ${Math.abs(days)}D`;
  }

  if (bindingKey === "address") {
    return [
      systemData.barangay,
      systemData.town_city,
      systemData.province
    ].filter(Boolean).join(", ");
  }

  if (bindingKey === "region_full") {
    return `${systemData.region || ""}`;
  }

  /* =============================
     REGISTRY LOOKUP
  ============================= */

  for (const group of SYSTEM_FIELD_REGISTRY) {

    const found = group.fields.find(f => f.key === bindingKey);

    if (!found) continue;

    if (found.column) {

      const key = normalize(found.column);
      return normalizedSystem[key] ?? "";

    }

    if (found.columns) {

      return found.columns
        .map(col => normalizedSystem[normalize(col)] ?? "")
        .filter(Boolean)
        .join(" ");

    }

  }

  return "";
};
  const pageFields = template.fields.filter(
    (field: any) => Number(field.page) === Number(currentPage)
  );



  const commonInputClass =
  "w-full h-full border border-slate-300 px-1 bg-white leading-tight";

  return (
    <>
      {pageFields.map((field: any) => {

        const isSystemField =
  String(field.dataSource).toLowerCase() === "system";
        const isDisabled = readOnly || isSystemField;

        // 🔥 VALUE LOGIC FIX
		if (isSystemField) {

}
		
 const value = isSystemField
  ? resolveSystemValue(field.systemBinding)
  : formData[field.id] || "";

// 🔍 DEBUG SYSTEM VALUE
if (isSystemField) {
}
const style = {
  position: "absolute",

  width: field.widthPercent * pdfDimensions.width,
  height: field.heightPercent * pdfDimensions.height,
  left: field.xPercent * pdfDimensions.width,
  top: field.yPercent * pdfDimensions.height,

  fontSize: (field.fontSize || 12) * zoom,
  fontWeight: field.fontWeight || "normal",
  fontStyle: field.fontStyle || "normal",
  textAlign: field.textAlign || "left",
  fontFamily: field.fontFamily || "Calibri"
};

          return (
  <div key={field.id} style={style} className="field-debug">

            {/* INPUT TEXT */}
            {field.type === "input_text" && (
              <input
                type="text"
                value={value}
                disabled={isDisabled}
                placeholder={field.placeholder || ""}
                onChange={(e) => {
                  if (isDisabled) return;
                  onChange(field.id, e.target.value);
                }}
                className={commonInputClass}
              />
            )}

            {/* TEXTAREA */}
            {field.type === "textarea" && (
              <textarea
                value={value}
                disabled={isDisabled}
                placeholder={field.placeholder || ""}
                onChange={(e) => {
                  if (isDisabled) return;
                  onChange(field.id, e.target.value);
                }}
                className={`${commonInputClass} resize-none`}
              />
            )}

       {/* SELECT */}
{field.type === "select" && (
  <>
    {/* Screen dropdown */}
    <select
      value={value}
      disabled={isDisabled}
      onChange={(e) => {
        if (isDisabled) return;
        onChange(field.id, e.target.value);
      }}
      className={`${commonInputClass} screen-only`}
    >
      <option value="">Select</option>
      {(field.options || []).map((opt: string, idx: number) => (
        <option key={`${field.id}-${opt}`} value={opt}>
          {opt}
        </option>
      ))}
    </select>

    {/* Print value */}
    <div className="print-only w-full h-full px-2 py-1">
      {value}
    </div>
  </>
)}
            {/* CHECKBOX */}
            {field.type === "checkbox" && (
              <input
                type="checkbox"
                checked={isSystemField ? Boolean(value) : formData[field.id] || false}
                disabled={isDisabled}
                onChange={(e) => {
                  if (isDisabled) return;
                  onChange(field.id, e.target.checked);
                }}
              />
            )}

            {/* RADIO BUTTON */}
            {field.type === "radio_button" && (
            <div className="flex flex-col gap-1">
                {(field.options || []).map((opt: string, idx: number) => (
                  <label key={idx} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={field.id}
                      value={opt}
                      checked={value === opt}
                      disabled={isDisabled}
                      onChange={(e) => {
                        if (isDisabled) return;
                        onChange(field.id, e.target.value);
                      }}
                    />
                    {opt}
                  </label>
                ))}
              </div>
            )}

            {/* DATE */}
            {field.type === "date" && (
              <input
                type="date"
                value={value}
                disabled={isDisabled}
                onChange={(e) => {
                  if (isDisabled) return;
                  onChange(field.id, e.target.value);
                }}
                className={commonInputClass}
              />
            )}

            {/* LABEL */}
            {field.type === "label" && (
              <div
                style={{
                  fontSize: field.fontSize || 12,
                  fontWeight: field.fontWeight || "normal",
                  textAlign: field.textAlign || "left",
                  fontFamily: field.fontFamily || "Calibri"
                }}
              >
                {field.label}
              </div>
            )}

          </div>
        );
      })}
    </>
  );
};