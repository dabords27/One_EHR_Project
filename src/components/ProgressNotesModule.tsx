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

  const [txStatus, setTxStatus] = useState<TransactionStatus>("idle");
  const [txMsg, setTxMsg] = useState("");

  const [isMinimized, setIsMinimized] = useState(true);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
const [templates, setTemplates] = useState<NoteTemplate[]>([]);
const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
const [showAuthModal, setShowAuthModal] = useState(false);
const [pendingStatus, setPendingStatus] = useState<"DRAFT" | "FINALIZED" | null>(null);
const [contentError, setContentError] = useState<string | null>(null);

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
  fetchNotes();
}, [patient?.case_id]);
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

    // Get newest note timestamp
    const newest = data.length
      ? data[data.length - 1].LastModifiedAt || data[data.length - 1].CreatedAt
      : null;

    // Only update if changed
    if (newest !== lastNoteTimestamp) {
      setNotes(data);
      setLastNoteTimestamp(newest);
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
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
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

    const startTime = Date.now(); // ⬅ track start

    if (editingNoteId) {
      await fetch(
        `${API}/api/progress-notes/${editingNoteId}${status === "FINALIZED" ? "/finalize" : ""}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content,
            authorId: verifiedUserId
          })
        }
      );
    } else {
      await fetch(`${API}/api/progress-notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registryNo: patient.case_id,
          mrn: patient.mrn,
          content,
          authorId: verifiedUserId,
          status
        })
      });
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
  setShowAuthModal(false);

  if (!pendingStatus) return;

  await performSave(pendingStatus, verifiedUser.id);
};

  /* ================= FILTER ================= */

  const filteredNotes =
    filter === "All"
      ? notes
      : notes.filter((n) => n.Status === filter);

  /* ================= POSITION ================= */

  const moduleStyle: React.CSSProperties = isMaximized
    ? {
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%) scale(1)",
        width: "85vw",
        height: "85vh",
        maxWidth: "1200px",
        maxHeight: "900px"
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
        className="fixed z-[9999] w-80 bg-slate-900 text-white rounded-2xl shadow-2xl flex items-center justify-between px-4 py-3 cursor-pointer"
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
        className="fixed z-[9999] bg-white rounded-[40px] shadow-2xl flex flex-col border border-slate-200 overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
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
<div className="flex justify-end mt-4 mb-3 pr-6">
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
</div>

        {/* NOTES */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
          {filteredNotes.map((note) => {
            const isOwner = Number(note.AuthorID) === Number(user.id ?? user.auto_id);
            const isDraft = note.Status === "DRAFT";

            return (
              <div key={note.NoteID} className="bg-white p-3 rounded-2xl shadow-sm border">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-sm font-semibold">{note.DisplayName}</p>
                    <p className="text-[11px] text-gray-400 uppercase">
                      {note.fk_usr_type_code}
                    </p>
                  </div>

                  {note.Status === "FINALIZED" && (
                    <span className="text-green-600 text-xs font-semibold">
                      FINALIZED
                    </span>
                  )}
                </div>

                <p className="text-sm whitespace-pre-wrap">{note.Content}</p>

                <div className="flex justify-between mt-2 text-[10px] text-gray-400">
                  <span>
                    {formatPHTime(note.LastModifiedAt || note.CreatedAt)}
                  </span>

                  {isDraft && isOwner && (
                    <button
                      onClick={() => handleEdit(note)}
                      className="flex items-center gap-1 text-gray-400 hover:text-gray-600"
                    >
                      <Edit2 size={12} />
                      Edit Draft
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {/* SELECT TEMPLATE */}
<div className="flex justify-end mt-4 mb-3 pr-6">
  <div className="relative w-40">
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
</div>

        {/* INPUT */}
       <div className="p-4 border-t bg-white space-y-3">
  <textarea
  value={content}
  onChange={(e) => {
    setContent(e.target.value);
    if (contentError) setContentError(null);
  }}
  className={`w-full rounded-lg p-3 text-sm h-40 transition 
    ${contentError 
      ? "border border-red-500 focus:ring-2 focus:ring-red-200" 
      : "border border-slate-300 focus:ring-2 focus:ring-sky-200"
    }`}
  placeholder="Enter clinical notes..."
/>
{contentError && (
  <p className="text-red-500 text-xs font-medium mt-1">
    {contentError}
  </p>
)}

          <div className="flex gap-3">
            <button
              onClick={() => triggerSave("DRAFT")}
              className="flex-1 bg-slate-100 py-2 rounded-xl text-xs font-black uppercase"
            >
              Save Draft
            </button>
            <button
              onClick={() => triggerSave("FINALIZED")}
              className="flex-1 bg-slate-900 text-white py-2 rounded-xl text-xs font-black uppercase"
            >
              Finalize
            </button>
          </div>
        </div>
      </div>

      {showAuthModal && (
  <AuthModal
    currentUsername={user.username}
    onVerified={handleVerified}
    onClose={() => setShowAuthModal(false)}
  />
)}

<TransactionOverlay
  status={txStatus}
  message={txMsg}
  onClose={() => setTxStatus("idle")}
/>
    </>
  );
};