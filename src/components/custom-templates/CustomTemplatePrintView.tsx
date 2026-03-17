
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
  const user = JSON.parse(localStorage.getItem("user") || "{}");

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

        setTemplate(data.template_snapshot ?? data.template ?? null);
        setPatient(data.patient ?? null);


        // LOAD FULL REGISTRY DATA
        try {

          const registryRes = await fetch(
            `${API_BASE}/api/custom-forms/patient/${data.patient.case_id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          const registryData = await registryRes.json();

          setPatient({
            ...data.patient,
            ...registryData
          });

        } catch (err) {
          console.error("Failed loading registry data for print", err);
        }

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
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.print();
      });
    });
  }, 500);

  return () => clearTimeout(timer);

}, [pdfDimensions, template]); 

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

<Document file={pdfUrl}>

        {Array.from({ length: template.total_pages || 1 }).map((_, i) => (

          <div
            key={i}
            style={{
              position: "relative",
width: "210mm",
height: "297mm",
              overflow: "visible",
              pageBreakAfter: "always",
			  breakAfter: "page"
            }}
          >

            <Page
              pageNumber={i + 1}
              width={900}
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
                width: "210mm",
height: "297mm",
                  transformOrigin: "top left"
                }}
              >

                <CustomTemplateRenderer
                  key={recordId} // ✅ FIXED (removed unstable key)
                  template={template}
                  formData={filledData}
                  systemData={{
                    ...(mappedPatient || {}),
                    ...(mappedPatient?.visit || {}),
                    ...(mappedPatient?.diagnosis || {}),
                    username: user?.username,
                    displayName: user?.displayName,
                    fullName: user?.fullName
                  }}
                  currentPage={i + 1}
                  pdfDimensions={pdfDimensions}
                  zoom={1}
                  onChange={() => {}}
                  readOnly
                  forcePrint
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
    zoom: 1.15;
  }

  /* Hide everything */
  body * {
    visibility: hidden;
  }

  /* Show only print root */
  #print-root {
    visibility: visible;
    position: absolute;
    top: 0;
    left: 0;
    width: ${pdfDimensions?.orientation === "landscape" ? "297mm" : "210mm"};
  }

  #print-root * {
    visibility: visible;
  }

/* ================= CHECKBOX FINAL FIX ================= */

input[type="checkbox"] {
  appearance: none;
  -webkit-appearance: none;

  width: 100%;
  height: 100%;

  border: none !important;
  outline: none !important;

  background: transparent !important;

  opacity: 0; /* 🔥 FULLY HIDE THE BOX */

  position: relative;
}

/* create a fake checkmark layer */
input[type="checkbox"]:checked::after {
  content: "✓";
  font-size: 18px;
  font-weight: bold;
  color: black;

  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);

  opacity: 1;
}

/* prevent any default rendering */
input[type="checkbox"]::-ms-check {
  display: none;
}

  /* ================= INPUT CLEANUP ================= */

  input,
  textarea,
  select {
    pointer-events: none !important;
    border: none !important;
    outline: none !important;
    background: transparent !important;
  }

  select::-ms-expand {
    display: none;
  }

}

`}</style>

    </div>

  );

};