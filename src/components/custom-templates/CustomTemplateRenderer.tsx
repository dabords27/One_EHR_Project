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
  showValidation = false
}) => {

/* =====================================
   PRINT MODE DETECTOR
===================================== */

const [isPrint, setIsPrint] = React.useState(false);

React.useEffect(() => {

  const beforePrint = () => setIsPrint(true);
  const afterPrint = () => setIsPrint(false);

  window.addEventListener("beforeprint", beforePrint);
  window.addEventListener("afterprint", afterPrint);

  return () => {
    window.removeEventListener("beforeprint", beforePrint);
    window.removeEventListener("afterprint", afterPrint);
  };

}, []);

  if (!template) return null;
  if (!template.fields?.length) return null;
  if (!pdfDimensions) return null;
  
/* =====================================
   SYSTEM VALUE RESOLVER
===================================== */

const formatDateTime = (value: any) => {
  if (!value) return "";

  const date = new Date(value);

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

  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();

  return `${mm}/${dd}/${yyyy}`;
};
const formatTime = (value: any) => {
  if (!value) return "";

  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  }).format(new Date(value));
};

const resolveSystemValue = (bindingKey: string) => {

  if (!bindingKey) return "";

  const normalize = (v: string) =>
    v?.toString().toLowerCase().replace(/[^a-z0-9]/g, "");

  const normalizedSystem = Object.keys(systemData || {}).reduce((acc, key) => {
    acc[normalize(key)] = systemData[key];
    return acc;
  }, {} as Record<string, any>);

  /* ==============================
     SPECIAL CALCULATED FIELDS
  ============================== */

if (bindingKey === "patient_name") {

  const last =
    systemData.last_name ||
    systemData.lastname ||
    systemData.lastName ||
    "";

  const first =
    systemData.first_name ||
    systemData.firstname ||
    systemData.firstName ||
    "";

  const middle =
    systemData.middle_name ||
    systemData.middlename ||
    systemData.middleName ||
    "";

  return [last, first, middle].filter(Boolean).join(", ");
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

  /* ==============================
     LOOKUP FROM SYSTEM REGISTRY
  ============================== */

  for (const group of SYSTEM_FIELD_REGISTRY) {

 const found = group.fields.find(
  f => normalize(f.key) === normalize(bindingKey)
);
    if (!found) continue;

    /* Single Column Field */
    if (found.column) {

      const key = normalize(found.column);
let value = normalizedSystem[key];

// fallback to binding column name
if (value === undefined) {

  const fallbackKey = normalize(bindingKey.split(".").pop() || "");
  value = normalizedSystem[fallbackKey];

}

if (value === undefined || value === null) return "";

if (found.format === "datetime") return formatDateTime(value);
if (found.format === "date") return formatDate(value);
if (found.format === "time") return formatTime(value);

return value;
    }

    /* Multi Column Field (Full Name etc) */
    if (found.columns) {

      return found.columns
        .map(col => normalizedSystem[normalize(col)] ?? "")
        .filter(Boolean)
        .join(" ");
    }

  }

  /* ==============================
     DIRECT COLUMN FALLBACK
  ============================== */

  const columnKey = bindingKey.split(".").pop();
  if (!columnKey) return "";

  const normalizedColumn = normalize(columnKey);

  if (normalizedSystem[normalizedColumn] !== undefined) {
    return normalizedSystem[normalizedColumn];
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
      {value}
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
      {value}
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

 const autoValue = (() => {

  if (!field.autoNow) return value;

  if (field.dateMode === "time") return localISOTime;
  if (field.dateMode === "datetime") return localISODateTime;
  return localISODate;

})();

  return isPrint ? (

<div style={fontStyle}>
{
  autoValue
    ? field.dateMode === "time"
      ? formatTime(autoValue)
      : field.dateMode === "datetime"
      ? formatDateTime(autoValue)
      : formatDate(autoValue)
    : ""
}
</div>

  ) : (

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
      {value}
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

  isPrint ? (

    <div style={fontStyle}>
      {(formData[field.fieldName] || false) ? "☑" : "☐"}
    </div>

  ) : (

    <input
      type="checkbox"
      checked={isSystemField ? Boolean(value) : formData[field.fieldName] || false}
      disabled={isDisabled}
      onChange={(e) => {
        if (isDisabled) return;
        onChange(field.fieldName, e.target.checked);
      }}
    />

  )

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
      {selected.includes(opt) ? "☑" : "☐"}
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
        {value === opt ? "◉" : "○"}
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