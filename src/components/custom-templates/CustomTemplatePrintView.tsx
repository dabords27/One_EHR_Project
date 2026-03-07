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

    if (!pdfDimensions) return;

    const timer = setTimeout(() => {

      window.dispatchEvent(new Event("beforeprint"));

      setTimeout(() => {

        window.print();

        setTimeout(() => {
          window.dispatchEvent(new Event("afterprint"));
        }, 300);

      }, 120);

    }, 400);

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

<div
  style={{
    position: "relative",
width: pdfDimensions?.orientation === "landscape" ? "297mm" : "210mm",
height: pdfDimensions?.orientation === "landscape" ? "210mm" : "297mm",
    overflow: "hidden"
  }}
>

        <Document file={pdfUrl}>

<Page
  pageNumber={1}
  width={pdfDimensions?.orientation === "landscape" ? 1100 : 780}
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

        {/* FIELD OVERLAY */}

        {pdfDimensions && (

          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%"
            }}
          >

            <CustomTemplateRenderer
              template={template}
              formData={filledData}
              systemData={patient}
              currentPage={1}
              pdfDimensions={pdfDimensions}
              zoom={1}
              onChange={() => {}}
              readOnly
            />

          </div>

        )}

      </div>

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
canvas {
  width: 100% !important;
  height: 100% !important;
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
  
  #print-root {
  width: 297mm;
  height: 210mm;
}
  #print-root {
  page-break-after: avoid;
  page-break-inside: avoid;
}

#print-root > div {
  page-break-inside: avoid;
}

  input::placeholder,
  textarea::placeholder {
    color: transparent !important;
  }

  label {
    gap: 6px !important;
  }

  input,
  textarea,
  select {
    border: none !important;
    outline: none !important;
    background: transparent !important;
    box-shadow: none !important;
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

      `}</style>

    </div>

  );

};