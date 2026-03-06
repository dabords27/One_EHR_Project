import { useAuth } from "../../context/AuthContext";
import { AuthModal } from "../AuthModal";
import { Search } from "lucide-react";
import React, { useState, useEffect } from "react";
import { ArrowLeft, X, Save, Edit3, Eye } from "lucide-react";
import { DepartmentEntry } from "../../types";
import { TransactionOverlay, TransactionStatus } from "../TransactionOverlay";
import { StatusConfirmationModal } from "../StatusConfirmationModal";

interface DepartmentManagementProps {
  onBack: () => void;
}

const Mandatory = () => (
  <span className="text-rose-500 ml-0.5">*</span>
);

export const DepartmentManagement: React.FC<DepartmentManagementProps> = ({ onBack }) => {

  /* ================= AUTH ================= */

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    };
  };
  

  /* ================= STATE ================= */
  


  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [depts, setDepts] = useState<DepartmentEntry[]>([]);
  
  const [sortConfig, setSortConfig] = useState<{
  key: string | null;
  direction: "asc" | "desc";
}>({
  key: "code",
  direction: "asc"
});

const requestSort = (key: string) => {
  let direction: "asc" | "desc" = "asc";

  if (sortConfig.key === key && sortConfig.direction === "asc") {
    direction = "desc";
  }

  setSortConfig({ key, direction });
};



  const [formData, setFormData] = useState({
    name: "",
    code: "",
    status: "Active" as "Active" | "Deactivated",
  });

  const [validationError, setValidationError] = useState({
    code: false,
    name: false,
    message: "",
  });
  
  const checkDuplicate = (code: string, name: string) => {
  return depts.some(d => {
    if (editId && d.id === editId) return false;

    return (
      d.code.toUpperCase() === code.toUpperCase() ||
      d.name.toUpperCase() === name.toUpperCase()
    );
  });
};

  const [txStatus, setTxStatus] = useState<TransactionStatus>("idle");
  const [txMsg, setTxMsg] = useState("");

  
  const { user } = useAuth();

const [showAuthModal, setShowAuthModal] = useState(false);
const [pendingAction, setPendingAction] = useState<"status" | "save" | null>(null);

const [statusModal, setStatusModal] = useState<{
  isOpen: boolean;
  dept: DepartmentEntry | null;
  action: "activate" | "deactivate" | null;
}>({
  isOpen: false,
  dept: null,
  action: null
});
  /* ================= FETCH ================= */

  const fetchDepartments = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/departments`,
        { headers: getAuthHeaders() }
      );

      if (!res.ok) throw new Error("Failed to fetch departments");

      const data = await res.json();

      const formatted: DepartmentEntry[] = data.map((d: any) => ({
        id: d.auto_id.toString(),
        name: d.dept_name,
        code: d.dept_code,
        status: d.dept_status_active ? "Active" : "Deactivated",
      }));

      setDepts(formatted);

    } catch (err) {
      console.error("Fetch error:", err);
      setDepts([]);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  /* ================= EDIT ================= */

  const handleEdit = (dept: DepartmentEntry) => {
    setEditId(dept.id);
    setFormData({
      name: dept.name,
      code: dept.code,
      status: dept.status,
    });
    setShowForm(true);
  };

  /* ================= INPUT ================= */

const handleInputChange = (
  e: React.ChangeEvent<HTMLInputElement>
) => {
  const { name, value } = e.target;

  const upper = value.toUpperCase();

  const updated = {
    ...formData,
    [name]: upper
  };

  setFormData(updated);

  // Do not validate duplicate while editing
  if (editId) return;

  const codeExists = depts.some(d =>
    d.code.toUpperCase() === updated.code.toUpperCase()
  );

  const nameExists = depts.some(d =>
    d.name.toUpperCase() === updated.name.toUpperCase()
  );

  setValidationError({
    code: codeExists,
    name: nameExists,
    message:
      codeExists && nameExists
        ? "System Code and Department Name already exist."
        : codeExists
        ? "System Code already exists."
        : nameExists
        ? "Department Name already exists."
        : "",
  });
};

  /* ================= SAVE ================= */

const handleSave = async (username: string) => {

  if (validationError.code || validationError.name) {
    setTxStatus("error");
    setTxMsg(validationError.message);
    return;
  }

  if (!formData.name || !formData.code) return;

  const startTime = Date.now();

  setTxStatus("loading");
  setTxMsg("Saving department...");

  try {

    const url = editId
      ? `${import.meta.env.VITE_API_URL}/api/departments/${editId}`
      : `${import.meta.env.VITE_API_URL}/api/departments`;

    const method = editId ? "PUT" : "POST";

    const body = editId
      ? {
          dept_name: formData.name,
          dept_status_active: formData.status === "Active",
          updatedBy: username
        }
      : {
          dept_code: formData.code,
          dept_name: formData.name,
          dept_status_active: true,
          createdBy: username
        };

    const res = await fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: JSON.stringify(body)
    });

    if (!res.ok) throw new Error("Save failed");

    const elapsed = Date.now() - startTime;
    const remaining = Math.max(800 - elapsed, 0);

    setTimeout(async () => {

      await fetchDepartments();

      setTxStatus("success");
      setTxMsg("Department saved successfully.");

      setTimeout(() => {
        setTxStatus("idle");
        setShowForm(false);
        setEditId(null);
        setFormData({ name: "", code: "", status: "Active" });
      }, 900);

    }, remaining);

  } catch (err) {
    console.error(err);
    setTxStatus("error");
    setTxMsg("Save failed.");

    setTimeout(() => setTxStatus("idle"), 2000);
  }
};

  /* ================= TOGGLE ================= */

const handleToggleStatus = async (verifiedUsername: string) => {

  if (!statusModal.dept) return;

  const willActivate = statusModal.action === "activate";

  const startTime = Date.now();

  setTxStatus("loading");
  setTxMsg("Syncing data...");

  try {

    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/api/departments/${statusModal.dept.id}`,
      {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          dept_name: statusModal.dept.name,
          dept_status_active: willActivate,
          updatedBy: verifiedUsername
        })
      }
    );

    if (!res.ok) throw new Error("Status update failed");

    const elapsed = Date.now() - startTime;
    const remaining = Math.max(800 - elapsed, 0);

    setTimeout(async () => {

      await fetchDepartments();

      setTxStatus("success");
      setTxMsg(
        willActivate
          ? "Department activated successfully."
          : "Department deactivated successfully."
      );

      setTimeout(() => {
        setTxStatus("idle");
      }, 900);

    }, remaining);

  } catch (err) {
    console.error(err);
    setTxStatus("error");
    setTxMsg("Failed to update status.");

    setTimeout(() => setTxStatus("idle"), 2000);
  }

  setStatusModal({ isOpen: false, dept: null, action: null });
};
  
  
  /* ================= AUTHVERIFY ================= */
const handleVerified = (verifiedUser: { id: number; username: string }) => {
  setShowAuthModal(false);

  if (pendingAction === "status") {
    setTxStatus("loading");
    setTxMsg("Syncing data...");

    setTimeout(() => {
      handleToggleStatus(verifiedUser.username);
    }, 50);
  }

  if (pendingAction === "save") {
    setTxStatus("loading");
    setTxMsg("Saving department...");

    setTimeout(() => {
      handleSave(verifiedUser.username);
    }, 50);
  }

  setPendingAction(null);
};

const filteredDepts = React.useMemo(() => {

  let filtered = depts.filter((dept) => {
    const term = searchTerm.toLowerCase();

    return (
      dept.code.toLowerCase().includes(term) ||
      dept.name.toLowerCase().includes(term) ||
      dept.status.toLowerCase().includes(term)
    );
  });

  if (sortConfig.key) {
    filtered.sort((a: any, b: any) => {

      let aValue = a[sortConfig.key!];
      let bValue = b[sortConfig.key!];

      if (aValue < bValue) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }

      if (aValue > bValue) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }

      return 0;
    });
  }

  return filtered;

}, [depts, searchTerm, sortConfig]);
  /* ================= UI ================= */

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* HEADER */}
      <div className="flex items-center justify-between">

        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-slate-800 rounded-xl shadow-sm"
          >
            <ArrowLeft size={20} />
          </button>

          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight leading-none">
            Department Setup
          </h2>
        </div>

        {!showForm && (
          <div className="flex items-center gap-4">

            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search Code, Name, Status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2.5 w-72 bg-white border border-slate-200 rounded-xl text-sm font-semibold"
              />
            </div>

            <button
              onClick={() => {
                setEditId(null);
                setFormData({ name: "", code: "", status: "Active" });
                setShowForm(true);
              }}
              className="px-6 py-3 bg-slate-900 text-white font-black text-xs uppercase rounded-2xl shadow-lg"
            >
              + Add Department
            </button>

          </div>
        )}
      </div>

      {/* FORM */}
{showForm && (
  <div className="bg-white rounded-[32px] shadow-xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
    <div className="bg-slate-50 border-b border-slate-200 px-8 py-4 flex justify-between items-center">
      <h3 className="font-black text-slate-800 uppercase tracking-tight text-sm">
        {editId ? "Edit Department" : "Department Entry Form"}
      </h3>
      <button
        onClick={() => setShowForm(false)}
        className="text-slate-400 hover:text-slate-600"
      >
        <X size={20} />
      </button>
    </div>

    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">

      {/* CODE */}
      <div>
        <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
          Code <Mandatory />
        </label>
        <input
          name="code"
          value={formData.code}
          onChange={handleInputChange}
          disabled={!!editId}
          className={`w-full bg-white border ${
            validationError.code
              ? "border-rose-500 ring-1 ring-rose-500"
              : "border-slate-300"
          } rounded-xl px-4 py-2.5 text-sm font-bold uppercase`}
        />
      </div>

      {/* NAME */}
      <div>
        <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
          Department Name <Mandatory />
        </label>
        <input
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          className={`w-full bg-white border ${
            validationError.name
              ? "border-rose-500 ring-1 ring-rose-500"
              : "border-slate-300"
          } rounded-xl px-4 py-2.5 text-sm font-bold uppercase`}
        />
      </div>

      {/* BUTTONS */}
      <div className="md:col-span-2 flex justify-end gap-3 pt-4">
        <button
          onClick={() => setShowForm(false)}
          className="px-8 py-3 bg-slate-100 text-slate-600 font-black text-xs uppercase rounded-xl"
        >
          Cancel Entry
        </button>

        <button
          disabled={
            validationError.code ||
            validationError.name ||
            !formData.name.trim() ||
            !formData.code.trim()
          }
          onClick={() => {
            setPendingAction("save");
            setShowAuthModal(true);
          }}
          className={`px-10 py-3 font-black text-xs uppercase rounded-xl flex items-center gap-2 transition-all ${
            validationError.code ||
            validationError.name ||
            !formData.name.trim() ||
            !formData.code.trim()
              ? "bg-slate-300 text-slate-500 cursor-not-allowed"
              : "bg-slate-900 text-white hover:bg-black"
          }`}
        >
          <Save size={16} />
          {editId ? "Update Department" : "Save Department"}
        </button>
      </div>

    </div>
  </div>
)}

      {/* TABLE */}
      {!showForm && (
        <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
<th
  onClick={() => requestSort("code")}
  className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-32 cursor-pointer select-none"
>
  Code {sortConfig.key === "code" && (
    sortConfig.direction === "asc" ? "▲" : "▼"
  )}
</th>
<th
  onClick={() => requestSort("name")}
  className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer select-none"
>
  Department Name {sortConfig.key === "name" && (
    sortConfig.direction === "asc" ? "▲" : "▼"
  )}
</th>
<th
  onClick={() => requestSort("status")}
  className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-32 cursor-pointer select-none"
>
  Status {sortConfig.key === "status" && (
    sortConfig.direction === "asc" ? "▲" : "▼"
  )}
</th>
            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
  Actions
</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredDepts.map((dept) => (
                <tr key={dept.id} className="hover:bg-slate-50">
                  <td className="px-8 py-5 text-center">
                    <span className="text-sm font-black uppercase">{dept.code}</span>
                  </td>
                  <td className="px-8 py-3">
                    <span className="font-black text-sm uppercase">{dept.name}</span>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${
                      dept.status === "Active"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-200 text-slate-600"
                    }`}>
                      {dept.status}
                    </span>
                  </td>
              <td className="px-8 py-3">
  <div className="flex items-center justify-center gap-3">
<button
  onClick={() => handleEdit(dept)}
  className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase rounded-lg transition-all shadow-sm"
>
  <Edit3 size={12} />
  Edit
</button>


<button
  onClick={() =>
    setStatusModal({
      isOpen: true,
      dept,
      action: dept.status === "Active" ? "deactivate" : "activate"
    })
  }
  className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-all duration-300 ${
    dept.status === "Active" ? "bg-emerald-600" : "bg-slate-300"
  }`}
>
  <div
    className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform duration-300 ${
      dept.status === "Active"
        ? "translate-x-5"
        : "translate-x-0"
    }`}
  />
</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}


<StatusConfirmationModal
  isOpen={statusModal.isOpen}
  targetName={statusModal.dept?.name || ""}
  action={statusModal.action}
  onConfirm={() => {
    setPendingAction("status");
    setShowAuthModal(true);
  }}
  onCancel={() =>
    setStatusModal({
      isOpen: false,
      dept: null,
      action: null
    })
  }
/>

{showAuthModal && (
  <AuthModal
    currentUsername={user?.username || ""}
    onVerified={handleVerified}
    onClose={() => setShowAuthModal(false)}
  />
)}

<TransactionOverlay
  status={txStatus}
  message={txMsg}
  onClose={() => setTxStatus("idle")}
/>

    </div>
  );
};