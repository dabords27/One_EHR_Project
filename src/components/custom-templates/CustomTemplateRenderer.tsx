import React from "react";
import { FormTemplate } from "../../types";
import { SYSTEM_FIELD_REGISTRY } from "../../utils/systemFieldRegistry";

interface Props {
  template: FormTemplate | null;
  formData: Record<string, any>;
  systemData: Record<string, any>;
  currentPage: number;
  pdfDimensions: { width: number; height: number } | null;
  zoom: number;
  onChange: (name: string, value: any) => void;
  readOnly?: boolean;
}

export const CustomTemplateRenderer: React.FC<Props> = ({
  template,
  formData,
  systemData,
  currentPage,
  pdfDimensions,
  zoom,
  onChange,
  readOnly = false
}) => {

  if (!template) return null;
  if (!template.fields?.length) return null;
  if (!pdfDimensions) return null;
  


  /* =====================================
     SYSTEM VALUE RESOLVER
  ===================================== */

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

    if (normalizedSystem[normalizedColumn] !== undefined) {
      return normalizedSystem[normalizedColumn];
    }

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

  /* =====================================
     PAGE FILTER
  ===================================== */

  const pageFields = template.fields.filter(
    (field: any) => Number(field.page) === Number(currentPage)
  );

  /* =====================================
     FORMULA
  ===================================== */
const computeFormula = (field: any) => {

  if (!field.formulaExpression) return "";

  try {

    let expression = field.formulaExpression;

    Object.keys(formData).forEach((key) => {

      const value = formData[key];

      if (value === undefined || value === "") return;

      let numericValue = value;

      if (typeof numericValue === "string" && numericValue.endsWith("%")) {
        numericValue = numericValue.replace("%", "");
      }

      if (isNaN(Number(numericValue))) return;

      expression = expression.replaceAll(key, Number(numericValue));

    });

    if (!/^[0-9+\-*/().\s]+$/.test(expression)) return "";

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


const computedFormulas: Record<string, any> = {};

template.fields.forEach((field: any) => {

  if (field.type !== "formula") return;

  computedFormulas[field.id] = computeFormula(field);

});

  /* =====================================
     RENDER
  ===================================== */

  return (
    <>
      {pageFields.map((field: any) => {

        const isSystemField =
          String(field.dataSource).toLowerCase() === "system";

        const isDisabled = readOnly || isSystemField;

const value = isSystemField
  ? resolveSystemValue(field.systemBinding)
  : formData[field.label] ?? "";

        const orientation =
          field.listOrientation ||
          field.orientation ||
          field.list_orientation ||
          "vertical";

        /* =====================================
           FONT STYLE (IDENTICAL TO BUILDER)
        ===================================== */

        const fontStyle = {
          fontSize: Math.max((field.fontSize || 12) * zoom, 12),
          fontWeight: field.fontWeight || "normal",
          fontFamily: field.fontFamily || "Calibri",
          fontStyle: field.fontStyle || "normal",
          textAlign: field.textAlign || "left"
        };

        /* =====================================
           POSITION STYLE
        ===================================== */

const style = {
  position: "absolute",
  width: field.widthPercent * pdfDimensions.width,
  height:
    field.type === "radio_button" || field.type === "list"
      ? "auto"
      : field.heightPercent * pdfDimensions.height,
  left: field.xPercent * pdfDimensions.width,
  top: field.yPercent * pdfDimensions.height
};
        const commonInputClass =
          "w-full h-full border border-slate-300 bg-white outline-none text-slate-700";

        return (
          <div key={field.id} style={style}>

            {/* INPUT TEXT */}

            {field.type === "input_text" && (
              <input
                type="text"
                value={value}
                disabled={isDisabled}
                placeholder={field.placeholder || ""}
                style={fontStyle}
                onChange={(e) => {
                  if (isDisabled) return;
                  onChange(field.label, e.target.value);
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
                style={fontStyle}
                onChange={(e) => {
                  if (isDisabled) return;
                  onChange(field.label, e.target.value);
                }}
                className={`${commonInputClass} resize-none`}
              />
            )}

            {/* SELECT */}

            {field.type === "select" && (
              <select
                value={value}
                disabled={isDisabled}
                style={fontStyle}
                onChange={(e) => {
                  if (isDisabled) return;
                 onChange(field.label, e.target.value);
                }}
                className={commonInputClass}
              >
                <option value="">Select</option>

                {(field.options || []).map((opt: string, idx: number) => (
				
                  <option key={`${field.id}-${opt}`} value={opt}>
                    {opt}
                  </option>
                ))}

              </select>
            )}

            {/* CHECKBOX */}

            {field.type === "checkbox" && (
              <input
                type="checkbox"
                checked={isSystemField ? Boolean(value) : formData[field.label] || false}
                disabled={isDisabled}
                onChange={(e) => {
                  if (isDisabled) return;
                 onChange(field.label, e.target.checked);
                }}
              />
            )}

            {/* LIST */}

            {field.type === "list" && (
              <div
  style={{
    width: "100%",
    display: "flex",
    flexDirection: orientation === "horizontal" ? "row" : "column",
    flexWrap: orientation === "horizontal" ? "wrap" : "nowrap",
    alignItems: "flex-start",
    gap: orientation === "horizontal" ? 16 : 4
  }}
>

                {(field.options || []).map((opt: string, idx: number) => {

                  const selected = formData[field.label] || [];

                  return (
                    <label
                      key={idx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        ...fontStyle
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selected.includes(opt)}
                        disabled={isDisabled}
                        onChange={(e) => {

                          let updated = [...selected];

                          if (e.target.checked) updated.push(opt);
                          else updated = updated.filter(v => v !== opt);

                          onChange(field.label, updated);

                        }}
                      />

                      {opt}

                    </label>
                  );

                })}

              </div>
            )}

            {/* RADIO BUTTON */}

            {field.type === "radio_button" && (
            <div
  style={{
    width: "100%",
    display: "flex",
    flexDirection: orientation === "horizontal" ? "row" : "column",
    flexWrap: orientation === "horizontal" ? "wrap" : "nowrap",
    alignItems: "flex-start",
    gap: orientation === "horizontal" ? 16 : 4
  }}
>

                {(field.options || []).map((opt: string, idx: number) => (
                  <label
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      ...fontStyle
                    }}
                  >
                    <input
                      type="radio"
                      name={field.id}
                      value={opt}
                      checked={value === opt}
                      disabled={isDisabled}
                      onChange={(e) => {
                        if (isDisabled) return;
                        onChange(field.label, e.target.value);
                      }}
                    />

                    {opt}

                  </label>
                ))}

              </div>
            )}

            {/* FORMULA */}

            {field.type === "formula" && (
              <input
                type="text"
                readOnly
                value={computedFormulas[field.id] || ""}
key={JSON.stringify(formData)}
                style={fontStyle}
                className={`${commonInputClass} bg-slate-100`}
              />
            )}

            {/* LABEL */}

            {field.type === "label" && (
              <div
                style={{
                  ...fontStyle,
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
                {field.label}
              </div>
            )}

            {/* SYSTEM USER */}
{field.type === "system_user" && (
  <div
    style={{
      ...fontStyle,
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
      textAlign: field.textAlign || "left"
    }}
  >
    {systemData?.displayName ||
     systemData?.fullName ||
     systemData?.username ||
     ""}
  </div>
)}

          </div>
        );

      })}
    </>
  );
};