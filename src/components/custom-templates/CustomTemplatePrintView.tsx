import React, { useEffect, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Patient, FormTemplate } from "../../types";
import { CustomTemplateRenderer } from "./CustomTemplateRenderer";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

interface Props {
  recordId: number;
  onClose: () => void;
}

export const CustomTemplatePrintView: React.FC<Props> = ({
  recordId,
  onClose
}) => {

  const [template, setTemplate] = useState<FormTemplate | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [filledData, setFilledData] = useState<any>({});
  const [pdfDimensions, setPdfDimensions] = useState<any>(null);

  const API_BASE = `${window.location.protocol}//${window.location.hostname}:5000`;
  
const mappedPatient = patient || {};

  /* ================= LOAD RECORD ================= */

  useEffect(() => {

    const loadRecord = async () => {

      try {

        const token = localStorage.getItem("token");

        const res = await fetch(
          `${API_BASE}/api/custom-forms/patient-form/${recordId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await res.json();

        console.log("PRINT DATA:", data);
		console.log("PATIENT DATA:", data.patient);

        setTemplate(data.template_snapshot ?? data.template ?? null);
        setPatient(data.patient ?? null);
        setFilledData(data.filled_data ?? {});

      } catch (err) {

        console.error("PRINT LOAD ERROR:", err);

      }

    };

    loadRecord();

  }, [recordId]);

  /* ================= CLOSE AFTER PRINT ================= */

  useEffect(() => {

    const handleAfterPrint = () => onClose();

    window.addEventListener("afterprint", handleAfterPrint);

    return () => {
      window.removeEventListener("afterprint", handleAfterPrint);
    };

  }, [onClose]);

  /* ================= AUTO PRINT ================= */

useEffect(() => {

if (!pdfDimensions || !template) return;

  const timer = setTimeout(() => {
    window.print();
  }, 600);

  return () => clearTimeout(timer);

}, [pdfDimensions]);

/* ================= LOADING STATE ================= */

if (!template || !patient) {
  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center">
      Preparing print document...
    </div>
  );
}

const pdfUrl = `${API_BASE}/uploads/custom-forms/${template.template_id}/template.pdf`;

return (

  <div id="print-root">

    <Document
  file={pdfUrl}
  onLoadSuccess={(doc) => {
    // load first page to get dimensions
  }}
>

      {Array.from({ length: template.total_pages || 1 }).map((_, i) => (

   <div
  key={i}
  style={{
    position: "relative",
width: 794,
height: 1123,
overflow: "hidden",
    pageBreakAfter: "always"
  }}
>

<Page
  pageNumber={i + 1}
  width={794}
  devicePixelRatio={2}
  renderTextLayer={false}
  renderAnnotationLayer={false}
  devicePixelRatio={2}
  renderTextLayer={false}
  renderAnnotationLayer={false}
  onLoadSuccess={(page) => {

    if (pdfDimensions) return;

    const orientation =
      page.width > page.height ? "landscape" : "portrait";

    setPdfDimensions({
      width: page.width,
      height: page.height,
      orientation
    });

  }}
/>

          {pdfDimensions && (

            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
width: 794,
height: 1123,
transformOrigin: "top left"
              }}
            >
<CustomTemplateRenderer
  template={template}
  formData={filledData}
  systemData={mappedPatient}
  currentPage={i + 1}
  pdfDimensions={pdfDimensions}
  zoom={1}
  onChange={() => {}}
  readOnly
/>

            </div>

          )}

        </div>

      ))}

    </Document>

    {/* ================= PRINT CSS ================= */}

    <style>{`

.screen-only {
  display: block;
}

.print-only {
  display: none;
}

@media print {

  @page {
    size: A4 ${pdfDimensions?.orientation || "portrait"};
    margin: 0;
  }

  html, body {
    margin: 0;
    padding: 0;
  }

#print-root {
  position: absolute;
  top: 0;
  left: 0;
  width: ${pdfDimensions?.orientation === "landscape" ? "297mm" : "210mm"};
  height: ${pdfDimensions?.orientation === "landscape" ? "210mm" : "297mm"};
}

  body * {
    visibility: hidden;
  }

  #print-root,
  #print-root * {
    visibility: visible;
  }

  #print-root {
    position: absolute;
    left: 0;
    top: 0;
    width: 100% !important;
    height: auto !important;
  }



input,
textarea,
/* PRINT DROPDOWN STYLE */
select {
  appearance: none !important;
  -webkit-appearance: none !important;
  -moz-appearance: none !important;

  border: none !important;
  outline: none !important;
  background: transparent !important;

  width: 100%;
  height: 100%;

  padding: 0 !important;
  margin: 0 !important;

  pointer-events: none !important;
}

/* Hide dropdown arrow in Chrome */
select::-ms-expand {
  display: none;
}


/* PRINT CHECKBOX STYLE */
input[type="checkbox"] {
  appearance: none;
  -webkit-appearance: none;

  width: 100%;
  height: 100%;

  border: none !important;
  background: transparent !important;

  display: flex;
  align-items: center;
  justify-content: center;

  position: relative;
}

/* show check mark only */
input[type="checkbox"]:checked::after {
  content: "✓";
  font-size: 20px;
  font-weight: bold;
  color: black;

  position: absolute;
  top: 50%;
  left: 50%;

  transform: translate(-50%, -50%);
}

input[type="checkbox"]::-ms-check {
  display: none;
}

}

    `}</style>

</div>

);
};