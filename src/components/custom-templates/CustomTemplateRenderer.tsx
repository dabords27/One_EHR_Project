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
  showValidation?: boolean;
  forcePrint?: boolean; 
}

export const CustomTemplateRenderer: React.FC<Props> = ({
  template,
  formData,
  systemData,
  currentPage,
  pdfDimensions,
  zoom,
  onChange,
  readOnly = false,
  showValidation = false,
  forcePrint = false 
}) => {

  console.log("SYSTEM DATA RECEIVED:", systemData);

/* =====================================
   PRINT MODE DETECTOR
===================================== */

const [internalPrint, setInternalPrint] = React.useState(false);

const isPrint = internalPrint || forcePrint; // ✅ THIS IS KEY

React.useEffect(() => {
  const beforePrint = () => setInternalPrint(true);
  const afterPrint = () => setInternalPrint(false);

  window.addEventListener("beforeprint", beforePrint);
  window.addEventListener("afterprint", afterPrint);

  return () => {
    window.removeEventListener("beforeprint", beforePrint);
    window.removeEventListener("afterprint", afterPrint);
  };
}, []);

/* ✅ ADD HERE */
const cleanPrintValue = (val: any) => {
  if (
    val === undefined ||
    val === null ||
    val === "" ||
    val === "Select" ||
    val === "Invalid Date"
  ) {
    return "";
  }
  return val;
};

  if (!template) return null;
  if (!template.fields?.length) return null;
  if (!pdfDimensions) return null;
  
/* =====================================
   SYSTEM VALUE RESOLVER
===================================== */

const formatDateTime = (value: any) => {
  if (!value) return "";

  const date = new Date(value);
  
   if (isNaN(date.getTime())) return ""; 

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  }).format(date);
};

const formatDate = (value: any) => {

  if (!value) return "";

  const d = new Date(value);
  
 if (isNaN(d.getTime())) return "";

  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();

  return `${mm}/${dd}/${yyyy}`;
};
const formatTime = (value: any) => {
  if (!value) return "";

  // ✅ Handle "03:25 PM" manually
if (
  typeof value === "string" &&
  (value.includes("AM") || value.includes("PM"))
) {
  return value;
}

// ✅ Handle "HH:mm" (e.g. "15:25")
if (typeof value === "string" && /^\d{2}:\d{2}$/.test(value)) {
  const [h, m] = value.split(":").map(Number);

  const d = new Date();
  d.setHours(h, m, 0, 0);

  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  }).format(d);
}
  const d = new Date(value);

  if (isNaN(d.getTime())) return "";

  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  }).format(d);
};

const resolveSystemValue = (bindingKey: string) => {

  if (!bindingKey) return "";

  const normalize = (v: string) =>
    v?.toString().toLowerCase().replace(/[^a-z0-9]/g, "");

  const normalizedSystem: Record<string, any> = {};

  Object.keys(systemData || {}).forEach((key) => {
    normalizedSystem[normalize(key)] = systemData[key];
  });

  for (const group of SYSTEM_FIELD_REGISTRY) {

    const field = group.fields.find(
      f => normalize(f.key) === normalize(bindingKey)
    );

    if (!field) continue;

    if (field.columns) {
      return field.columns
        .map(col => normalizedSystem[normalize(col)] ?? "")
        .filter(Boolean)
        .join(", ");
    }

    if (field.column) {

      const value = normalizedSystem[normalize(field.column)];

      if (!value) return "";

      if (field.format === "datetime") return formatDateTime(value);
      if (field.format === "date") return formatDate(value);
      if (field.format === "time") return formatTime(value);

      return value;
    }

  }

  const fallback = bindingKey.split(".").pop();

  if (!fallback) return "";

  return normalizedSystem[normalize(fallback)] ?? "";

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

console.log("FIELD BINDING:", field.systemBinding);
const value = isSystemField
  ? (field.systemBinding
      ? resolveSystemValue(field.systemBinding)
      : "")
  : formData[field.fieldName] ?? "";
  
    const showError =
    showValidation &&
    field.required &&
    !value &&
    !isSystemField;

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
  width: (field.widthPercent || 0) * (pdfDimensions?.width || 0),
  height:
    field.type === "radio_button" || field.type === "list"
      ? "auto"
      : (field.heightPercent || 0) * (pdfDimensions?.height || 0),
  left: (field.xPercent || 0) * (pdfDimensions?.width || 0),
  top: (field.yPercent || 0) * (pdfDimensions?.height || 0)
};
        const commonInputClass =
          "w-full h-full border border-slate-300 bg-white outline-none text-slate-700";

        return (
          <div
  key={field.id}
  style={style}
  className={showError ? "outline outline-2 outline-red-500 rounded-sm" : ""}
>

            {/* INPUT TEXT */}

           {field.type === "input_text" && (

  isPrint ? (



  <div style={fontStyle}>
    {cleanPrintValue(value)}
  </div>

  ) : (

    <input
      type="text"
      value={value}
      disabled={isDisabled}
      placeholder={field.placeholder || ""}
      style={fontStyle}
      onChange={(e) => {
        if (isDisabled) return;
        onChange(field.fieldName, e.target.value);
      }}
      className={`${commonInputClass} ${
  showError ? "border-red-500" : ""
}`}
    />

  )

)}

            {/* TEXTAREA */}

 {field.type === "textarea" && (

isPrint ? (

  <div style={fontStyle}>
    {cleanPrintValue(value)}
  </div>

  ) : (

    <textarea
      value={value}
      disabled={isDisabled}
      placeholder={field.placeholder || ""}
      style={fontStyle}
      onChange={(e) => {
        if (isDisabled) return;
        onChange(field.fieldName, e.target.value);
      }}
      className={`${commonInputClass} resize-none ${
showError ? "border-red-500" : ""
}`}
    />

  )

)}

{/* DATE / TIME */}
{field.type === "date" && (() => {

  const getType = () => {
    if (field.dateMode === "time") return "time";
    if (field.dateMode === "datetime") return "datetime-local";
    return "date";
  };

  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);

  const localISODate = local.toISOString().slice(0,10);
  const localISOTime = local.toISOString().slice(11,16);
  const localISODateTime = local.toISOString().slice(0,16);

const autoValue = value || (() => {

  if (!field.autoNow) return "";

  if (field.dateMode === "time") return localISOTime;
  if (field.dateMode === "datetime") return localISODateTime;
  return localISODate;

})();

return isPrint ? (() => {

  const formatted =
    autoValue
      ? field.dateMode === "time"
        ? formatTime(autoValue)
        : field.dateMode === "datetime"
        ? formatDateTime(autoValue)
        : formatDate(autoValue)
      : "";

  return (
    <div style={fontStyle}>
      {cleanPrintValue(formatted)}
    </div>
  );

})() : (
    <input
      type={getType()}
      value={autoValue}
      required={field.required}
      min={field.dateMode !== "time" ? field.minDate || undefined : undefined}
      max={
        field.dateMode !== "time"
          ? field.isBirthdate
            ? localISODate
            : field.maxDate || undefined
          : undefined
      }
      disabled={isDisabled}
      style={fontStyle}
      onChange={(e)=>{
        if (isDisabled) return;
        onChange(field.fieldName, e.target.value);
      }}
      className={`${commonInputClass} ${
showError ? "border-red-500" : ""
}`}
    />

  );

})()}

            {/* SELECT */}

{field.type === "select" && (

isPrint ? (

  <div style={fontStyle}>
    {cleanPrintValue(value)}
  </div>

  ) : (

    <select
      value={value}
      disabled={isDisabled}
      style={fontStyle}
      onChange={(e) => {
        if (isDisabled) return;
        onChange(field.fieldName, e.target.value);
      }}
      className={`${commonInputClass} ${
showError ? "border-red-500" : ""
}`}
    >
      <option value="">Select</option>

      {(field.options || []).map((opt: string, idx: number) => (
        <option key={`${field.id}-${opt}`} value={opt}>
          {opt}
        </option>
      ))}

    </select>

  )

)}

            {/* CHECKBOX */}

{field.type === "checkbox" && (
  <>
    {!isPrint && (
      <input
        type="checkbox"
        checked={isSystemField ? Boolean(value) : formData[field.fieldName] || false}
        disabled={isDisabled}
        onChange={(e) => {
          if (isDisabled) return;
          onChange(field.fieldName, e.target.checked);
        }}
      />
    )}

    {isPrint && (
      <div style={fontStyle}>
        {(formData[field.fieldName] || false) ? "☑" : ""}
      </div>
    )}
  </>
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

                  const selected = formData[field.fieldName] || [];

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

  {isPrint ? (
    <span>
      {selected.includes(opt) ? "☑" : ""}
    </span>
  ) : (
    <input
      type="checkbox"
      checked={selected.includes(opt)}
      disabled={isDisabled}
      onChange={(e) => {

        let updated = [...selected];

        if (e.target.checked) updated.push(opt);
        else updated = updated.filter(v => v !== opt);

        onChange(field.fieldName, updated);

      }}
    />
  )}

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

    {isPrint ? (
      <span>
        {value === opt ? "◉" : ""}
      </span>
    ) : (
      <input
        type="radio"
        name={field.id}
        value={opt}
        checked={value === opt}
        disabled={isDisabled}
        onChange={(e) => {
          if (isDisabled) return;
          onChange(field.fieldName, e.target.value);
        }}
      />
    )}

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
                <>
  {field.fieldName}
  {field.required && (
    <span style={{ color: "red", marginLeft: 2 }}>*</span>
  )}
</>
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