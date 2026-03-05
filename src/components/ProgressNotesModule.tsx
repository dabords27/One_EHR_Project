import { CheckCircle2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { AuthModal } from "./AuthModal";
import {
  MessageSquare,
  Minus,
  X,
  Maximize2,
  Minimize2,
  Calendar,
  Edit2
} from "lucide-react";
import { Patient, User } from "../types";
import { TransactionOverlay, TransactionStatus } from "./TransactionOverlay";
import { Eye, EyeOff } from "lucide-react";

interface ProgressNotesModuleProps {
  patient: Patient;
  user: User;
  onClose: () => void;
  forceMinimized?: boolean;
}

export const ProgressNotesModule: React.FC<ProgressNotesModuleProps> = ({
  patient,
  user,
  onClose,
  forceMinimized
}) => {

  /* ================= STATE ================= */

  const [notes, setNotes] = useState<any[]>([]);
  const [content, setContent] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [filter, setFilter] = useState<"All" | "DRAFT" | "FINALIZED">("All");
  const [lastNoteTimestamp, setLastNoteTimestamp] = useState<string | null>(null);
  const [selectedNoteIds, setSelectedNoteIds] = useState<string[]>([]);
  
  const [hasNewNotes, setHasNewNotes] = useState(false);
  const prevNotesLength = useRef(0);
  const isNearBottom = () => {
  const el = scrollRef.current;
  if (!el) return false;

  return el.scrollHeight - el.scrollTop - el.clientHeight < 120;
};
  
  const [facility, setFacility] = useState<{
  name: string;
  address: string;
  logoUrl: string;
} | null>(null);
  
  
  
const [confirmAction, setConfirmAction] = useState<{
  type: "edit-draft" | "edit-finalized" | "finalize" | "finalize-existing";
  note?: any;
} | null>(null);

  const [txStatus, setTxStatus] = useState<TransactionStatus>("idle");
  const [txMsg, setTxMsg] = useState("");
  
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const [isMinimized, setIsMinimized] = useState(true);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
const [templates, setTemplates] = useState<NoteTemplate[]>([]);
const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
const [showAuthModal, setShowAuthModal] = useState(false);
const [pendingStatus, setPendingStatus] = useState<"DRAFT" | "FINALIZED" | null>(null);
const [contentError, setContentError] = useState<string | null>(null);
const [showComposer, setShowComposer] = useState(true);

const userType = (user.role || "").toUpperCase();

console.log("PROGRESS USER OBJECT:", user);
console.log("PROGRESS USER ROLE:", user.role);
console.log("PROGRESS userType computed:", userType);

// Date filter
const today = new Date().toISOString().split("T")[0];

const [startDate, setStartDate] = useState(
  patient.date_admitted
    ? new Date(patient.date_admitted).toISOString().split("T")[0]
    : today
);


const [endDate, setEndDate] = useState(today);
// Maximize toggle
const toggleMaximize = () => {
  setIsMaximized(prev => !prev);
};

// Role filter
const [roleFilter, setRoleFilter] = useState<"ALL" | "DOCTOR" | "NURSE">("ALL");

const canCreateNotes =
  ["DOCTOR", "NURSE", "ADMIN"].includes(userType);

const canEditFinalized =
  userType === "ADMIN";

  const scrollRef = useRef<HTMLDivElement>(null);

  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const isActive = patient.status === "Active";

const patientFullName = `${patient.last_name}, ${patient.first_name} ${patient.middle_name || ""} ${patient.extension || ""}`
  .replace(/\s+/g, " ")
  .trim()
  .toUpperCase();

const formatPHTime = (dateString: string) => {
  const date = new Date(dateString);

  return date.toLocaleString("en-PH", {
    timeZone: "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  });
};
const fetchFacility = async () => {
  try {
    const token = localStorage.getItem("token");

    const res = await fetch(`${API}/api/facility`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    if (!res.ok) return;

    const data = await res.json();

    // ✅ Clean address builder (no extra commas)
const addressParts = [
  data.StreetAddress,
  data.City,
  data.Province,
  data.ZipCode
]
  .map(part => (part || "").toString().trim())  // normalize
  .filter(part => part.length > 0);             // remove empty

const cleanAddress = [
  data.StreetAddress,
  data.City,
  data.Province,
  data.ZipCode
]
  .map(value =>
    (value || "")
      .toString()
      .replace(/,+/g, "")   // 🔥 remove all commas inside field
      .trim()
  )
  .filter(value => value.length > 0)
  .join(", ");

setFacility({
  name: (data.FacilityName || "").trim(),
  address: cleanAddress,
  logoUrl: data.LogoPath ? `${API}${data.LogoPath}` : ""
});

  } catch (err) {
    console.error("Failed to load facility info", err);
  }
};
  

  /* ================= NOTE TEMPLATES ================= */

  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        console.error("No token found in localStorage");
        return;
      }

      const res = await fetch(`${API}/api/notetemplates`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!res.ok) {
        console.error("Template fetch failed:", res.status);
        return;
      }

      const data = await res.json();
      setTemplates(data);

    } catch (err) {
      console.error("Failed to load templates", err);
    }
  };


useEffect(() => {
  fetchTemplates();
}, []);
useEffect(() => {
  fetchNotes();
}, [patient?.case_id]);

useEffect(() => {
  fetchFacility();
}, []);
  /* ================= FETCH ================= */

const fetchNotes = async (silent = false) => {
  if (!patient?.case_id) return;

  try {
    const token = localStorage.getItem("token");

    const res = await fetch(
      `${API}/api/progress-notes/${patient.case_id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      }
    );

    if (!res.ok) return;

    const data = await res.json();
    if (!Array.isArray(data)) return;

    const newest = data.length
      ? data[data.length - 1].LastModifiedAt || data[data.length - 1].CreatedAt
      : null;

    // FIRST LOAD → always update
    if (!lastNoteTimestamp) {
      setNotes(data);
      setLastNoteTimestamp(newest);
      return;
    }

    // If something changed
    if (newest !== lastNoteTimestamp) {
      if (silent) {
        // Someone else updated → show banner
        setHasNewNotes(true);
      } else {
        // Manual refresh → update immediately
        setNotes(data);
        setLastNoteTimestamp(newest);
      }
    }

  } catch (err) {
    console.error("Fetch notes error:", err);
  }
};

/* ================= AUTO REFRESH ================= */

useEffect(() => {
  fetchNotes(); // initial load

  const interval = setInterval(() => {
    fetchNotes(true); // silent refresh
  }, 10000); // 10 seconds

  return () => clearInterval(interval);
}, [patient?.case_id]);

  /* ================= AUTO SCROLL ================= */

useEffect(() => {
  const el = scrollRef.current;
  if (!el) return;

  const isNewNoteAdded = notes.length > prevNotesLength.current;

  if (isNewNoteAdded && isNearBottom()) {
    el.scrollTop = el.scrollHeight;
  }

  prevNotesLength.current = notes.length;
}, [notes]);

  /* ================= EDIT ================= */

  const handleEdit = (note: any) => {
    setEditingNoteId(note.NoteID);
    setContent(note.Content);
  };

  /* ================= SAVE ================= */
const triggerSave = (status: "DRAFT" | "FINALIZED") => {

  if (!content.trim()) {
    setContentError("Clinical notes cannot be empty.");
    return;
  }

  if (txStatus === "loading") return;

  setContentError(null); // clear error if valid
  setPendingStatus(status);
  setShowAuthModal(true);
};
 const performSave = async (
  status: "DRAFT" | "FINALIZED",
  verifiedUserId: number
) => {
  try {
    setTxStatus("loading");
    setTxMsg("Saving progress note...");
	
	const token = localStorage.getItem("token");

    const startTime = Date.now(); // ⬅ track start

if (editingNoteId) {

  const endpoint =
    status === "FINALIZED"
      ? `${API}/api/progress-notes/${editingNoteId}/finalize`
      : `${API}/api/progress-notes/${editingNoteId}`;

  const body =
    status === "FINALIZED"
      ? { authorId: verifiedUserId }
      : { content: content.trim(), authorId: verifiedUserId };

  const res = await fetch(endpoint, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || "Update failed");
  }

} else {

  const res = await fetch(`${API}/api/progress-notes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      registryNo: patient.case_id,
      mrn: patient.mrn,
      content,
      authorId: verifiedUserId,
      status
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || "Create failed");
  }
}

    await fetchNotes();

    // ⬇ ensure minimum loading time
    const elapsed = Date.now() - startTime;
    const minimumDuration = 900;

    if (elapsed < minimumDuration) {
      await new Promise(res =>
        setTimeout(res, minimumDuration - elapsed)
      );
    }

    setContent("");
    setEditingNoteId(null);
    setSelectedTemplateId("");

    setTxStatus("success");
    setTxMsg("Progress note saved successfully.");

    setTimeout(() => {
      setTxStatus("idle");
      setTxMsg("");
    }, 1500);

  } catch (err) {
    console.error(err);
    setTxStatus("error");
    setTxMsg("Failed to save progress note.");
  }
};
const handleVerified = async (verifiedUser: { id: number; username: string }) => {
  if (!pendingStatus) return;

  await performSave(pendingStatus, verifiedUser.id);

  setShowAuthModal(false); // ✅ close AFTER save
};
  /* ================= FILTER ================= */

const filteredNotes = notes
  .filter((note) => {
    // STATUS FILTER
    if (filter !== "All" && note.Status !== filter) {
      return false;
    }

    // ROLE FILTER
    if (roleFilter !== "ALL" && note.fk_usr_type_code?.toUpperCase() !== roleFilter) {
      return false;
    }

    // DATE FILTER
    const noteDate = new Date(note.LastModifiedAt || note.CreatedAt);
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Set end time to 23:59:59 for inclusive filtering
    end.setHours(23, 59, 59, 999);

    return noteDate >= start && noteDate <= end;
  });
  
  useEffect(() => {
  setSelectedNoteIds([]);
}, [filter, roleFilter, startDate, endDate]);

const notesToPrint =
  selectedNoteIds.length > 0
    ? filteredNotes.filter(note =>
        selectedNoteIds.includes(String(note.NoteID))
      )
    : filteredNotes;


const handlePrint = () => {

if (!facility) {
  alert("Facility information not loaded.");
  return;
}

const facilityName = facility.name;
const facilityAddress = facility.address;
const facilityLogoUrl = facility.logoUrl;

  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const htmlContent = `
    <html>
      <head>
        <title>Progress Notes</title>
        <style>
  @page {
    size: A4;
    margin: 10mm;
  }

  body {
    font-family: Arial, sans-serif;
    font-size: 12px;
  }
  
  .note {
  page-break-inside: avoid;
}

  @media print {
    body {
      margin: 0;
    }
  }

  h2 {
    text-align: center;
    margin-bottom: 20px;
  }

  .header-info {
    margin-bottom: 20px;
  }

  .meta {
    font-size: 11px;
    margin-bottom: 8px;
  }

  .content {
    margin-top: 8px;
  }

  hr {
    margin: 15px 0;
  }
  
  
</style>
      </head>
      <body>
  <div style="text-align:center; margin-bottom:20px;">
    ${facilityLogoUrl ? `
  <img src="${facilityLogoUrl}" style="height:60px; margin-bottom:10px;" />
` : ""}
    <div style="font-size:16px; font-weight:bold;">
      ${facilityName}
    </div>
${facilityAddress && facilityAddress.replace(/[, ]/g, "").length > 0 ? `
<div style="font-size:12px;">
  ${facilityAddress}
</div>
` : ""}
  </div>

  <hr/>

  <h2 style="text-align:center;">PROGRESS NOTES</h2>

<div style="margin-top:15px;">
  <strong>Patient:</strong> ${patientFullName}<br/>
  <strong>MRN:</strong> ${patient.mrn}<br/>
  <strong>Admission Date:</strong> ${
    patient.date_admitted ? formatPHTime(patient.date_admitted) : "N/A"
  }
</div>

  <hr/>
${notesToPrint.map(note => {

const cleanContent = (note.Content || "")
  .trim()
  .replace(/^['"]+|['"]+$/g, "")
  .replace(/^\s+/gm, "")
  .replace(/\r?\n/g, "<br/>");

const isSameUser = note.AuthorID === note.FinalizedBy;

return `
<div class="note">

  <div class="content">
    ${cleanContent}
  </div>

  <div style="margin-top:40px; font-size:12px;">

    ${
      note.Status === "FINALIZED" && isSameUser
        ? `
          <strong>Author & Electronically Signed By:</strong> ${note.DisplayName}<br/>
          <strong>Role:</strong> ${note.fk_usr_type_code}<br/>
          <strong>Authored:</strong> ${formatPHTime(note.CreatedAt)}<br/>
          <strong>Signed:</strong> ${formatPHTime(note.FinalizedAt)}
        `
        : `
          <strong>Author:</strong> ${note.DisplayName}<br/>
          <strong>Role:</strong> ${note.fk_usr_type_code}<br/>
          <strong>Date/Time Authored:</strong> ${formatPHTime(note.CreatedAt)}
        `
    }

    ${
      note.Status === "FINALIZED" && !isSameUser
        ? `
        <br/>
        <strong>Electronically Signed By:</strong> ${note.FinalizedByName}<br/>
        <strong>Role:</strong> ${note.FinalizedByRole || note.fk_usr_type_code}<br/>
        <strong>Date/Time Signed:</strong> ${formatPHTime(note.FinalizedAt)}
        `
        : ""
    }

  </div>

  <hr/>

</div>
`;

}).join("")}

      </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
  printWindow.print();
};

  /* ================= POSITION ================= */

 const moduleStyle: React.CSSProperties = isMaximized
  ? {
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%)",
      width: "96vw",
      height: "94vh",
      maxWidth: "none",
      maxHeight: "none"
    }
    : {
        right: "20px",
        bottom: "20px",
        width: "440px",
        height: "640px",
        transform: "scale(1)"
      };

  /* ================= MINIMIZED ================= */

  if (isMinimized) {
    return (
      <div
        style={{ right: "20px", bottom: "20px" }}
        className="fixed z-[11000] w-80 bg-slate-900 text-white rounded-2xl shadow-2xl flex items-center justify-between px-4 py-3 cursor-pointer"
        onClick={() => setIsMinimized(false)}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
            <MessageSquare size={16} />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
              Progress Notes
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-2.5 h-2.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-slate-400"}`} />
              <p className="text-[10px] font-black uppercase text-emerald-400">
                {patientFullName}
              </p>
            </div>
          </div>
        </div>
        <button
  onClick={(e) => {
    e.stopPropagation();   // ✅ prevent bubbling
    onClose();
  }}
>
  <X size={14} />
</button>
      </div>
	  
    );
  }

  /* ================= FULL VIEW ================= */

  return (
    <>
      <div
        style={moduleStyle}
        className="fixed z-[11000] bg-white rounded-[40px] shadow-2xl flex flex-col border border-slate-200 overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
      >
        {/* HEADER */}
        <div className="bg-slate-800 p-5 flex justify-between items-center text-white">
          <div>
            <h3 className="text-xs font-black uppercase tracking-tight">
              Progress Notes
            </h3>

            <div className="flex items-center gap-2 mt-1">
              <span className={`w-2.5 h-2.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-slate-400"}`} />
              <p className="text-emerald-400 text-[11px] font-black uppercase tracking-[0.1em]">
                {patientFullName}
              </p>
            </div>

            {/* ✅ ADMISSION ADDED HERE */}
            {patient.date_admitted && (
              <div className="mt-1">
              <div className="mt-1 text-[11px] text-slate-300 font-medium">
  Admission: {formatPHTime(patient.date_admitted)}
</div>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button onClick={() => setIsMaximized(!isMaximized)}>
              {isMaximized ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
            <button onClick={() => setIsMinimized(true)}>
              <Minus size={18} />
            </button>
            <button onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

{/* FILTER BAR */}
<div className="flex justify-between items-center mt-4 mb-3 px-6">
  <div className="flex gap-2">
    {["All", "DRAFT", "FINALIZED"].map((type) => (
      <button
        key={type}
        onClick={() => setFilter(type as any)}
        className={`px-3 py-1.5 rounded-xl text-[11px] font-black uppercase transition
          ${
            filter === type
              ? "bg-slate-900 text-white shadow"
              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
          }`}
      >
        {type}
      </button>
    ))}
  </div>

  <button
    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
    className="text-xs font-black text-slate-500 hover:text-slate-200"
  >
     ADVANCED FILTER
  </button>
</div>

{showAdvancedFilters && (
  <div className="px-6 mb-4 space-y-3 border-t pt-3">

    {/* ROLE FILTER */}
    <div className="flex gap-2">
      {["ALL", "DOCTOR", "NURSE"].map((type) => (
        <button
          key={type}
          onClick={() => setRoleFilter(type as any)}
          className={`px-3 py-1.5 rounded-xl text-[11px] font-black uppercase transition
            ${
              roleFilter === type
                ? "bg-slate-900 text-white shadow"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
        >
          {type}
        </button>
      ))}
    </div>

    {/* DATE RANGE */}
    <div className="flex gap-3">
      <input
        type="date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
        className="border border-slate-300 rounded-lg px-2 py-1 text-xs"
      />
      <input
        type="date"
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
        className="border border-slate-300 rounded-lg px-2 py-1 text-xs"
      />
    </div>

  </div>
)}
{/* SELECT CONTROLS */}
<div className="px-6 pt-3 pb-2 flex justify-between items-center bg-slate-50 border-t">
  <div className="flex items-center gap-3">

    {/* SELECT ALL */}
    <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
      <input
        type="checkbox"
        checked={
          filteredNotes.length > 0 &&
          selectedNoteIds.length === filteredNotes.length
        }
        onChange={(e) => {
          if (e.target.checked) {
            setSelectedNoteIds(filteredNotes.map(n => String(n.NoteID)));
          } else {
            setSelectedNoteIds([]);
          }
        }}
      />
      Select All
    </label>

    {selectedNoteIds.length > 0 && (
      <span className="text-xs text-slate-400">
        {selectedNoteIds.length} selected
      </span>
    )}
 <button
      onClick={handlePrint}
      className="px-3 py-1.5 text-xs font-bold uppercase bg-slate-900 text-white rounded-lg hover:bg-black"
    >
      Print
    </button>
  </div>
</div>


    {/* NOTES */}
<div
  ref={scrollRef}
  className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-50"
>
{filteredNotes.map((note) => {
  const isOwner =
    Number(note.AuthorID) === Number(user.id ?? user.auto_id);

  const isDraft = note.Status === "DRAFT";
  const isFinalized = note.Status === "FINALIZED";
  const isAdmin = userType === "ADMIN";

  const canEditNote =
    isAdmin || (isDraft && isOwner);
	
	const canFinalizeDraft =
  isDraft && (isOwner || isAdmin);

return (
  <div
    key={note.NoteID}
    className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex gap-4"
  >
    {/* Checkbox */}
    <div className="pt-1">
      <input
        type="checkbox"
        checked={selectedNoteIds.includes(String(note.NoteID))}
        onChange={(e) => {
          const noteId = String(note.NoteID);

          if (e.target.checked) {
            setSelectedNoteIds(prev => [...prev, noteId]);
          } else {
            setSelectedNoteIds(prev => prev.filter(id => id !== noteId));
          }
        }}
      />
    </div>

    {/* Note Content */}
    <div className="flex-1">

      {/* Note Text */}
      <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
        {note.Content}
      </p>

      {/* Author + Signature Section */}
      <div className="mt-5 pt-4 border-t border-slate-300 text-sm text-black space-y-2">

        {/* Author */}
        <div>
          <p className="font-bold uppercase">
            {note.DisplayName}
          </p>

          <p className="uppercase text-xs text-slate-500">
            {note.fk_usr_type_code}
          </p>

          <p className="text-xs">
            {formatPHTime(note.CreatedAt)}
          </p>
        </div>

        {/* Finalized Signature */}
        {note.Status === "FINALIZED" && note.FinalizedByName && (
          <div className="mt-3 pt-3 border-t border-slate-200 space-y-1">

            <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-wide w-fit">
              <CheckCircle2 size={14} />
              ELECTRONICALLY SIGNED
            </div>

            <p className="font-bold uppercase">
              {note.FinalizedByName}
            </p>

            {note.FinalizedAt && (
              <p className="text-xs">
                {formatPHTime(note.FinalizedAt)}
              </p>
            )}

          </div>
        )}

      </div>

      {/* Edit / Finalize Actions */}
      {canEditNote && (
        <div className="mt-2">

          <button
            onClick={() =>
              setConfirmAction({
                type: isFinalized ? "edit-finalized" : "edit-draft",
                note
              })
            }
            className="flex items-center gap-1 text-slate-400 hover:text-slate-700 transition"
          >
            <Edit2 size={14} />
            <span className="text-xs font-medium uppercase tracking-wide">
              {isFinalized && isAdmin ? "Edit Finalized" : "Edit Draft"}
            </span>
          </button>

          {canFinalizeDraft && (
            <button
              onClick={() =>
                setConfirmAction({
                  type: "finalize-existing",
                  note
                })
              }
              className="flex items-center gap-1 text-emerald-600 hover:text-emerald-800 transition mt-2"
            >
              <CheckCircle2 size={14} />
              <span className="text-xs font-medium uppercase tracking-wide">
                Finalize Draft
              </span>
            </button>
          )}

        </div>
      )}

    </div>
  </div>
);
})}
</div>
{/* TEMPLATE + COMPOSER TOGGLE */}
<div className="flex justify-end items-center gap-3 mt-4 mb-3 pr-6">

  {/* Select Template */}
  <div className="relative w-44">
    <select
      value={selectedTemplateId}
      onChange={(e) => {
        const templateId = e.target.value;
        setSelectedTemplateId(templateId);

        const selected = templates.find(
          (t) => String(t.Id) === templateId
        );

        if (selected) {
          setContent(selected.Content);
        }
      }}
      className="appearance-none w-full bg-slate-50 border border-slate-200 rounded-xl px-3 pr-8 py-2 text-xs font-semibold text-slate-600 shadow-sm hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-200 transition"
    >
      <option value="">Select Template</option>
      {templates.map(template => (
        <option key={template.Id} value={template.Id}>
          {template.Name}
        </option>
      ))}
    </select>

    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400 text-[10px]">
      ▼
    </div>
  </div>

  {/* Composer Toggle */}
  <button
    onClick={() => setShowComposer(!showComposer)}
    className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition text-xs font-semibold text-slate-600"
    title={showComposer ? "Hide Composer" : "Show Composer"}
  >
    {showComposer ? <EyeOff size={14} /> : <Eye size={14} />}
    {showComposer ? "Hide" : "Show"}
  </button>

</div>


{/* COMPOSER SECTION */}
{showComposer && (
  <div className="p-4 border-t bg-white space-y-4 transition-all duration-300">

    {/* Textarea */}
    <textarea
      value={content}
      onChange={(e) => {
        setContent(e.target.value);
        if (contentError) setContentError(null);
      }}
      disabled={!canCreateNotes}
      className={`w-full rounded-lg p-3 text-sm h-40 transition 
        ${
          contentError
            ? "border border-red-500 focus:ring-2 focus:ring-red-200"
            : "border border-slate-300 focus:ring-2 focus:ring-sky-200"
        }
        ${
          !canCreateNotes
            ? "bg-slate-100 cursor-not-allowed opacity-60"
            : ""
        }
      `}
      placeholder={
        canCreateNotes
          ? "Enter clinical notes..."
          : "You are not authorized to create progress notes."
      }
    />

    {contentError && (
      <p className="text-red-500 text-xs font-medium">
        {contentError}
      </p>
    )}

    {/* Action Buttons */}
    <div className="flex gap-3 pt-2">
      <button
        onClick={() => triggerSave("DRAFT")}
        disabled={!canCreateNotes}
        className={`flex-1 py-2 rounded-xl text-xs font-black uppercase transition
          ${
            canCreateNotes
              ? "bg-slate-100 hover:bg-slate-200"
              : "bg-slate-200 text-slate-400 cursor-not-allowed"
          }
        `}
      >
        Save Draft
      </button>

      <button
        onClick={() => {
          if (!content.trim()) {
            setContentError("Clinical notes cannot be empty.");
            return;
          }

          setContentError(null);

          setConfirmAction({
            type: "finalize"
          });
        }}
        disabled={!canCreateNotes}
        className={`flex-1 py-2 rounded-xl text-xs font-black uppercase transition
          ${
            canCreateNotes
              ? "bg-slate-900 text-white hover:bg-black"
              : "bg-slate-300 text-slate-500 cursor-not-allowed"
          }
        `}
      >
        Finalize
      </button>
    </div>

  </div>
)}
      </div>

{showAuthModal && (
  <AuthModal
    currentUsername={user.username}
    onVerified={handleVerified}
    onClose={() => setShowAuthModal(false)}
  />
)}

{confirmAction && (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[25000]">
    <div className="bg-white rounded-2xl p-6 w-[400px] shadow-xl">
      <h3 className="text-sm font-bold uppercase tracking-wide mb-4">
        Confirm Action
      </h3>

      <p className="text-sm text-slate-600 mb-6">
        {confirmAction.type === "edit-draft" && (
          <>You are about to edit this draft note. Continue?</>
        )}

        {confirmAction.type === "edit-finalized" && (
          <>This note is finalized. Editing may affect audit records. Continue?</>
        )}

        {confirmAction.type === "finalize" && (
          <>Once finalized, this note will be electronically signed. Continue?</>
        )}

        {confirmAction.type === "finalize-existing" && (
          <>
            You are about to finalize this draft note. This action will
            electronically sign the note. Continue?
          </>
        )}
      </p>

      <div className="flex justify-end gap-3">
        <button
          onClick={() => setConfirmAction(null)}
          className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700"
        >
          Cancel
        </button>

        <button
          onClick={() => {
            if (!confirmAction) return;

            if (
              confirmAction.type === "edit-draft" ||
              confirmAction.type === "edit-finalized"
            ) {
              handleEdit(confirmAction.note);
            }

            if (confirmAction.type === "finalize") {
              triggerSave("FINALIZED");
            }

            if (
              confirmAction.type === "finalize-existing" &&
              confirmAction.note
            ) {
              const noteId = confirmAction.note.NoteID;

              setShowAuthModal(true);
              setPendingStatus("FINALIZED");
              setEditingNoteId(noteId);
            }

            setConfirmAction(null);
          }}
          className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg"
        >
          Confirm
        </button>
      </div>
    </div>
  </div>
)}

<TransactionOverlay
  status={txStatus}
  message={txMsg}
  onClose={() => setTxStatus("idle")}
/>

    </>
  );
};