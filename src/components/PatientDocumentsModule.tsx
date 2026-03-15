import { TransactionOverlay, TransactionStatus } from "./TransactionOverlay";
import { useState, useEffect } from "react";
import {
  Upload,
  FileText,
  Trash2,
  Eye,
  Printer,
  FolderOpen,
  Minus,
  X,
  Maximize2,
  Minimize2,
  Download
} from "lucide-react";
import { AuthModal } from "./AuthModal";

interface Props {
  patient: any;
  user: any;
  onClose?: () => void;
  forceMinimized?: boolean;
}

export const PatientDocumentsModule: React.FC<Props> = ({
  patient,
  user,
  onClose,
  forceMinimized
}) => {

  const [documents, setDocuments] = useState<any[]>([]);
  const [recordName, setRecordName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(Date.now());
  
  const recordNameExists = documents.some(
  (d) =>
    d.RecordName?.toLowerCase().trim() ===
    recordName.toLowerCase().trim()
);

  const [search, setSearch] = useState("");
const [showDateFilter, setShowDateFilter] = useState(false);
  
  const [dateFrom, setDateFrom] = useState("");
const [dateTo, setDateTo] = useState("");

  const [showAuth, setShowAuth] = useState(false);
  const [pendingAction, setPendingAction] = useState<any>(null);

  const [loading, setLoading] = useState(false);

  const [txStatus, setTxStatus] = useState<TransactionStatus>("idle");
  const [txMsg, setTxMsg] = useState("");

  const [viewState, setViewState] =
    useState<"open" | "minimized" | "collapsed">("minimized");

  const [isMaximized, setIsMaximized] = useState(false);

  const API = import.meta.env.VITE_API_URL;

  const patientFullName = `${patient.last_name}, ${patient.first_name}`
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();

  const fetchDocs = async () => {

    setLoading(true);

    const res = await fetch(`${API}/api/patient-documents/${patient.case_id}`);
    const data = await res.json();

    setDocuments(Array.isArray(data) ? data : data.data || []);

    setLoading(false);
  };

  useEffect(() => {
    fetchDocs();
  }, [patient.case_id]);

  const handleUpload = () => {
    setPendingAction("upload");
    setShowAuth(true);
  };
  
  

  const performUpload = async (userId: number) => {

    if (!recordName.trim()) {
      alert("Please enter a record name");
      return;
    }

    if (!file) {
      alert("Please select a file");
      return;
    }

    const startTime = Date.now();

    setTxStatus("loading");
    setTxMsg("Syncing documents...");

    try {

      const form = new FormData();

      form.append("registryTrackingNo", patient.case_id);
      form.append("recordName", recordName);
      form.append("userId", userId.toString());
      form.append("file", file);

      const res = await fetch(`${API}/api/patient-documents/upload`, {
        method: "POST",
        body: form
      });

      const data = await res.json();

      if (!data.success) throw new Error(data.message);

      const elapsed = Date.now() - startTime;
      const remaining = Math.max(1000 - elapsed, 0);

      setTimeout(async () => {

        await fetchDocs();

        setRecordName("");
        setFile(null);
		setFileInputKey(Date.now()); 

        setTxStatus("success");
        setTxMsg("Document uploaded.");

        setTimeout(() => setTxStatus("idle"), 900);

      }, remaining);

    } catch (err: any) {

      setTxStatus("error");
      setTxMsg(err.message || "Upload failed");

      setTimeout(() => setTxStatus("idle"), 2000);
    }
  };

const handleVerified = (user: any) => {

  if (pendingAction === "upload") {
    performUpload(user.id);
  }

  if (pendingAction?.type === "delete") {
    performDelete(pendingAction.doc, user.id);
  }

  if (pendingAction?.type === "view") {

    const url = `${API}/${pendingAction.doc.FilePath}`;
    window.open(url, "_blank");

  }

  if (pendingAction?.type === "print") {

    handlePrint(pendingAction.doc);

  }

  if (pendingAction?.type === "download") {

    handleDownload(pendingAction.doc);

  }

  setShowAuth(false);
  setPendingAction(null);

};

const deleteDoc = (doc: any) => {

  setPendingAction({
    type: "delete",
    doc
  });

  setShowAuth(true);

};

  const performDelete = async (doc: any, userId: number) => {

    const startTime = Date.now();

    setTxStatus("loading");
    setTxMsg("Deleting document...");

    try {

      const res = await fetch(`${API}/api/patient-documents/${doc.DocumentID}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
      });

      const data = await res.json();

      if (!data.success) throw new Error(data.message);

      const elapsed = Date.now() - startTime;
      const remaining = Math.max(1000 - elapsed, 0);

      setTimeout(async () => {

        await fetchDocs();

        setTxStatus("success");
        setTxMsg("Document deleted.");

        setTimeout(() => setTxStatus("idle"), 900);

      }, remaining);

    } catch (err: any) {

      setTxStatus("error");
      setTxMsg(err.message || "Delete failed");

      setTimeout(() => setTxStatus("idle"), 2000);
    }
  };
const handlePrint = (doc: any) => {

  const url = `${API}/${doc.FilePath}`;

  const printWindow = window.open(url, "_blank");

  if (!printWindow) return;

  const timer = setInterval(() => {

    if (printWindow.document.readyState === "complete") {

      clearInterval(timer);

      printWindow.focus();
      printWindow.print();

    }

  }, 500);

};
const handleDownload = async (doc: any) => {

  const url = `${API}/${doc.FilePath}`;

  try {

    const response = await fetch(url);

    const blob = await response.blob();

    const downloadUrl = window.URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = downloadUrl;
    link.download = doc.FileName;

    document.body.appendChild(link);

    link.click();

    link.remove();

    window.URL.revokeObjectURL(downloadUrl);

  } catch (err) {
    console.error("Download failed", err);
  }

};

const filtered = (documents || []).filter((d) => {

  const matchSearch =
    (d.RecordName || "").toLowerCase().includes(search.toLowerCase());

  const uploadDate = new Date(d.CreatedAt);

  const uploadDay = uploadDate.toISOString().split("T")[0];

  let matchDate = true;

  if (dateFrom) {
    matchDate = uploadDay >= dateFrom;
  }

  if (dateTo) {
    matchDate = matchDate && uploadDay <= dateTo;
  }

  return matchSearch && matchDate;

});

  const moduleStyle: React.CSSProperties = isMaximized
    ? {
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        width: "96vw",
        height: "94vh"
      }
    : {
        right: "20px",
        bottom: "220px",
        width: "440px",
        height: "640px"
      };

  if (viewState === "collapsed") {
    return (
      <div
        className="fixed z-[11000] w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center shadow-xl cursor-pointer"
        style={{ right: "20px", bottom: "200px" }}
        onClick={() => setViewState("minimized")}
      >
        <FolderOpen size={20} className="text-white" />
      </div>
    );
  }

  if (viewState === "minimized") {
    return (
      <div
        className="fixed z-[11000] w-80 bg-slate-900 text-white rounded-2xl shadow-2xl flex items-center justify-between px-4 py-3 cursor-pointer"
        style={{ right: "20px", bottom: "200px" }}
        onClick={() => setViewState("open")}
      >
        <div className="flex items-center gap-3">

          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
            <FolderOpen size={16} />
          </div>

          <div>
            <p className="text-[9px] font-black uppercase text-slate-400">
              Patient Documents
            </p>

            <p className="text-[10px] font-black uppercase text-emerald-400">
              {patientFullName}
            </p>
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setViewState("collapsed");
          }}
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <>
      <div
        style={moduleStyle}
        className="fixed z-[11000] bg-white rounded-[40px] shadow-2xl flex flex-col border border-slate-200 overflow-hidden"
      >

        {/* HEADER */}

        <div className="bg-slate-800 p-5 flex justify-between items-center text-white">

          <div>
            <h3 className="text-xs font-black uppercase">
              Patient Documents
            </h3>

            <p className="text-emerald-400 text-[11px] font-black uppercase">
              {patientFullName}
            </p>
          </div>

          <div className="flex gap-3">

            <button onClick={() => setIsMaximized(!isMaximized)}>
              {isMaximized ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>

            <button onClick={() => setViewState("minimized")}>
              <Minus size={18} />
            </button>

            <button onClick={() => setViewState("collapsed")}>
              <X size={18} />
            </button>

          </div>
        </div>

        {/* TOOLBAR */}

      <div className="p-4 border-b bg-slate-50 space-y-3">

  <div className="flex flex-wrap items-center gap-2">

    <input
      placeholder="Record name"
      value={recordName}
      onChange={(e) => setRecordName(e.target.value)}
      className="flex-1 border rounded-lg px-3 py-2 text-sm min-w-[140px]"
    />

<input
  key={fileInputKey}
  type="file"
  accept=".pdf,.jpg,.jpeg,.png"
  onChange={(e) => setFile(e.target.files?.[0] || null)}
  className="text-xs w-[170px]"
/>

    <button
      disabled={!recordName.trim() || !file || recordNameExists}
      onClick={handleUpload}
      className={`px-3 py-2 rounded-lg text-sm flex items-center gap-2
      ${
        !recordName.trim() || !file || recordNameExists
          ? "bg-slate-300 text-slate-500 cursor-not-allowed"
          : "bg-slate-900 text-white hover:bg-slate-700"
      }`}
    >
      <Upload size={16} />
      Upload
    </button>
	
	{recordNameExists && (
  <p className="text-red-500 text-xs mt-1 font-semibold">
    Record name has already been taken for this patient.
  </p>
)}

  </div>

<div className="space-y-2">

  {/* Search Row */}

  <div className="flex gap-2 border rounded-lg p-2 bg-white">

    <input
      placeholder="Search document"
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      className="flex-1 outline-none text-sm"
    />

    <button
      onClick={() => setShowDateFilter(!showDateFilter)}
      className="text-xs bg-slate-200 px-2 rounded"
    >
      {showDateFilter ? "Hide Dates" : "Filter Dates"}
    </button>

  </div>

  {/* Date Range Row */}

  {showDateFilter && (
    <div className="flex gap-2 ml-auto w-[420px]">

      <input
        type="date"
        value={dateFrom}
        onChange={(e) => setDateFrom(e.target.value)}
        className="text-sm border rounded px-2 flex-1"
      />

      <input
        type="date"
        value={dateTo}
        onChange={(e) => setDateTo(e.target.value)}
        className="text-sm border rounded px-2 flex-1"
      />

    </div>
  )}

</div>
        </div>

{/* DOCUMENT LIST */}

<div className="flex-1 overflow-auto p-4 space-y-3 bg-slate-50">

  {loading && (
    <div className="flex justify-center py-6">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-900"></div>
    </div>
  )}

  {filtered.map((doc) => {

    const fileUrl = `${API}/${doc.FilePath}`;

    return (
      <div
        key={doc.DocumentID}
        className="bg-white p-3 rounded-xl shadow-sm border flex justify-between items-center"
      >

        <div>
          <p className="font-semibold text-sm">
            {doc.RecordName}
          </p>

      <p className="text-xs text-gray-500">
  {doc.FileName}
</p>

<p className="text-[11px] text-gray-400">
  {new Date(doc.CreatedAt).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })} • {doc.UploadedBy || "Unknown"}
</p>
        </div>
<div className="flex gap-3 items-center text-slate-600">

  <button
    onClick={() => {
      setPendingAction({ type: "view", doc });
      setShowAuth(true);
    }}
    title="View Document"
  >
    <Eye size={16} />
  </button>

  <button
    onClick={() => {
      setPendingAction({ type: "print", doc });
      setShowAuth(true);
    }}
    title="Print Document"
  >
    <Printer size={16} />
  </button>

  <button
    onClick={() => {
      setPendingAction({ type: "download", doc });
      setShowAuth(true);
    }}
    title="Download Document"
  >
    <Download size={16} />
  </button>

  <button
    onClick={() => deleteDoc(doc)}
    title="Delete Document"
  >
    <Trash2 size={16} />
  </button>

</div>

      </div>
    );

  })}

</div>
</div>

{showAuth && (
  <AuthModal
    currentUsername={user.username}
    onVerified={handleVerified}
    onClose={() => setShowAuth(false)}
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