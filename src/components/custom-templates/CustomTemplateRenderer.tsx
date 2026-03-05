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

  console.log("==== CUSTOM RENDERER START ====");
  console.log("TEMPLATE:", template);
  console.log("FIELDS:", template?.fields);
  console.log("PDF DIMENSIONS:", pdfDimensions);
  console.log("CURRENT PAGE:", currentPage);
  console.log("SYSTEM DATA:", systemData);

  if (!template) {
    console.warn("No template provided");
    return null;
  }

  if (!template.fields || template.fields.length === 0) {
    console.warn("No fields in template");
    return null;
  }

  if (!pdfDimensions) {
    console.warn("PDF dimensions not ready");
    return null;
  }

// 🔥 SYSTEM VALUE RESOLVER
const resolveSystemValue = (bindingKey: string) => {
  for (const group of SYSTEM_FIELD_REGISTRY) {
    const found = group.fields.find(f => f.key === bindingKey);

    if (found) {
      // 🔥 SINGLE COLUMN
      if (found.column) {
        const columnName = found.column;

        if (systemData?.[columnName] !== undefined) {
          return systemData[columnName];
        }

        const lower = columnName.toLowerCase();
        if (systemData?.[lower] !== undefined) {
          return systemData[lower];
        }

        const snake = columnName
          .replace(/([A-Z])/g, "_$1")
          .toLowerCase()
          .replace(/^_/, "");

        if (systemData?.[snake] !== undefined) {
          return systemData[snake];
        }

        return "";
      }

      // 🔥 MULTI COLUMN
      if (found.columns) {
        return found.columns
          .map(col => {
            if (systemData?.[col] !== undefined) return systemData[col];

            const lower = col.toLowerCase();
            if (systemData?.[lower] !== undefined) return systemData[lower];

            const snake = col
              .replace(/([A-Z])/g, "_$1")
              .toLowerCase()
              .replace(/^_/, "");

            return systemData?.[snake] ?? "";
          })
          .filter(Boolean)
          .join(" ");
      }
    }
  }

  return "";
};

  const pageFields = template.fields.filter(
    (field: any) => Number(field.page) === Number(currentPage)
  );

  console.log("PAGE FIELDS:", pageFields);

  const commonInputClass =
    "w-full h-full text-[12px] border border-slate-300 px-2 py-1 bg-white";

  return (
    <>
      {pageFields.map((field: any) => {

        const isSystemField =
  String(field.dataSource).toLowerCase() === "system";
        const isDisabled = readOnly || isSystemField;

        // 🔥 VALUE LOGIC FIX
		if (isSystemField) {
  console.log("SYSTEM FIELD DEBUG →");
  console.log("Field Label:", field.label);
  console.log("Binding:", field.systemBinding);
}
		
        const value = isSystemField
          ? resolveSystemValue(field.systemBinding)
          : formData[field.id] || "";

const style = {
  position: "absolute",
  width: field.widthPercent * pdfDimensions.width,
  height: field.heightPercent * pdfDimensions.height,
  left: field.xPercent * pdfDimensions.width,
  top: field.yPercent * pdfDimensions.height
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
              <select
                value={value}
                disabled={isDisabled}
                onChange={(e) => {
                  if (isDisabled) return;
                  onChange(field.id, e.target.value);
                }}
                className={commonInputClass}
              >
                <option value="">Select</option>
                {(field.options || []).map((opt: string, idx: number) => (
                  <option key={idx} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
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
              <div className="flex flex-col gap-1 text-[12px]">
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