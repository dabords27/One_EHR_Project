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
              Authorization: `Bearer ${token}`
            }
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
      window.print();
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
          width: 794,
          height: 1123
        }}
      >

        <Document file={pdfUrl}>

     <Page
  pageNumber={1}
  width={780}
  renderTextLayer={false}
  renderAnnotationLayer={false}
  onLoadSuccess={(page) => {
    setPdfDimensions({
      width: page.width,
      height: page.height
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
              width: pdfDimensions.width,
              height: pdfDimensions.height
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
<style>
{`
.screen-only {
  display: block;
}

.print-only {
  display: none;
}
@media print {

  @page {
    size: A4 portrait;
    margin: 0;
  }

  html, body {
    margin: 0;
    padding: 0;
  }

  /* Hide everything first */
  body * {
    visibility: hidden;
  }

  /* Show only the print container */
  #print-root,
  #print-root * {
    visibility: visible;
  }

  /* Let the PDF control size (prevents 2-page scaling) */
  #print-root {
    position: absolute;
    left: 0;
    top: 0;
    width: 100% !important;
    height: auto !important;
  }

  /* Remove borders from inputs */
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
`}
</style>

    </div>

  );

};