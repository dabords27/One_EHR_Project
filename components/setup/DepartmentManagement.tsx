import { Search } from "lucide-react";
import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Plus,
  X,
  Save,
  Edit3,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { DepartmentEntry } from '../../types';
import { TransactionOverlay, TransactionStatus } from '../TransactionOverlay';
import { StatusConfirmationModal } from '../StatusConfirmationModal';

interface DepartmentManagementProps {
  onBack: () => void;
}

const Mandatory = () => (
  <span className="text-rose-500 ml-0.5">*</span>
);

export const DepartmentManagement: React.FC<DepartmentManagementProps> = ({ onBack }) => {

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState(""); 
  const [isEditingSubtitle, setIsEditingSubtitle] = useState(false);
  const [subtitle, setSubtitle] = useState(
    () => localStorage.getItem('dept_subtitle') || 'INFRASTRUCTURE • STATION MANAGEMENT'
  );

  const [txStatus, setTxStatus] = useState<TransactionStatus>('idle');
  const [txMsg, setTxMsg] = useState('');
const [validationError, setValidationError] = useState<{
  code: boolean;
  name: boolean;
  message: string;
}>({
  code: false,
  name: false,
  message: ""
});

const [statusModal, setStatusModal] = useState<{
  isOpen: boolean;
  dept: DepartmentEntry | null;
  action: "activate" | "deactivate" | null;
}>({ isOpen: false, dept: null, action: null });


  const [depts, setDepts] = useState<DepartmentEntry[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    status: 'Active' as 'Active' | 'Deactivated'
  });

  /* ================= FETCH ================= */

  const fetchDepartments = async () => {
    try {
      const res = await fetch(
  `${import.meta.env.VITE_API_URL}/api/departments`
);
      const data = await res.json();

      const formatted: DepartmentEntry[] = data.map((d: any) => ({
        id: d.auto_id.toString(),
        name: d.dept_name,
        code: d.dept_code,
        status: d.dept_status_active ? 'Active' : 'Deactivated'
      }));

      setDepts(formatted);
    } catch (err) {
      console.error('Fetch error:', err);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

/* ================= INPUT ================= */

const handleInputChange = (
  e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
) => {
  const { name, value } = e.target;

  // Build updated form FIRST
  const updatedForm = {
    ...formData,
   [name]: value,
  };

  setFormData(updatedForm);

  // 🚫 Skip validation in edit mode
  if (editId) {
    setValidationError({
      code: false,
      name: false,
      message: "",
    });
    return;
  }


  // Always validate both fields together
  const normalizedCode = updatedForm.code.trim().toUpperCase();
  const normalizedName = updatedForm.name.trim().toUpperCase();

  const codeExists = depts.some(
    (d) =>
      d.code.trim().toUpperCase() === normalizedCode &&
      d.id !== editId
  );

  const nameExists = depts.some(
    (d) =>
      d.name.trim().toUpperCase() === normalizedName &&
      d.id !== editId
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

  const handleSave = async () => {
   
if (validationError.code || validationError.name) {
  setTxStatus('error');
  setTxMsg(validationError.message);
  return;
}   if (!formData.name || !formData.code) return;

    setTxStatus('loading');
    setTxMsg('Synchronizing department hierarchy with master infrastructure...');

    const start = Date.now();

    try {
      if (editId) {
        await fetch(`${import.meta.env.VITE_API_URL}/api/departments/${editId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dept_name: formData.name,
            dept_status_active: formData.status === 'Active'
          })
        });
      } else {
        await fetch(`${import.meta.env.VITE_API_URL}/api/departments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dept_code: formData.code,
            dept_name: formData.name,
            dept_status_active: formData.status === 'Active'
          })
        });
      }

      await fetchDepartments();

      const elapsed = Date.now() - start;
      if (elapsed < 1000) {
        await new Promise(r => setTimeout(r, 1000 - elapsed));
      }

      setTxStatus('success');
      setTxMsg('Station data committed successfully.');

      setTimeout(() => {
        setTxStatus('idle');
        setShowForm(false);
        setEditId(null);
        setFormData({ name: '', code: '', status: 'Active' });
      }, 1000);

    } catch (err) {
      console.error(err);
      setTxStatus('error');
      setTxMsg('Station update failed due to internal server error.');
    }
  };

  /* ================= EDIT ================= */

  const handleEdit = (dept: DepartmentEntry) => {
    setEditId(dept.id);
    setFormData({
      name: dept.name,
      code: dept.code,
      status: dept.status
    });
    setShowForm(true);
  };

  /* ================= TOGGLE ================= */

const handleToggleStatus = async () => {
  // 🔒 Safety check
  if (!statusModal.dept || !statusModal.action) return;

  const dept = statusModal.dept;

  // ✅ THIS is where it goes
  const willActivate = statusModal.action === "activate";

  setTxStatus("loading");
  setTxMsg(
    `Synchronizing ${willActivate ? "Activation" : "Deactivation"} request...`
  );

  try {
    await fetch(`${import.meta.env.VITE_API_URL}/api/departments/${dept.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dept_name: dept.name,
        dept_status_active: willActivate   // ✅ use it here
      })
    });

    await fetchDepartments();

    setTxStatus("success");
    setTxMsg(
      `Station ${willActivate ? "activated" : "deactivated"} successfully.`
    );

    // close modal AFTER success
    setStatusModal({ isOpen: false, dept: null, action: null });

    setTimeout(() => setTxStatus("idle"), 1000);

  } catch (err) {
    console.error(err);
    setTxStatus("error");
    setTxMsg("Status synchronization failed.");
  }
};
  /* ================= UI ================= */
const handleSaveSubtitle = () => {
  localStorage.setItem('dept_subtitle', subtitle);
  setIsEditingSubtitle(false);
};
/* ================= SEARCH FILTER ================= */

const filteredDepts = depts.filter((dept) => {
  const term = searchTerm.toLowerCase();

  return (
    dept.code.toLowerCase().includes(term) ||
    dept.name.toLowerCase().includes(term) ||
    dept.status.toLowerCase().includes(term)
  );
});
 return (
    <div className="space-y-6 animate-in fade-in duration-500">
{/* HEADER */}
<div className="flex items-center justify-between">

  {/* LEFT SIDE */}
  <div className="flex items-center gap-4">
    <button
      onClick={onBack}
      className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-slate-800 rounded-xl shadow-sm"
    >
      <ArrowLeft size={20} />
    </button>

    <div>
      <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight leading-none mb-1">
        Department Setup
      </h2>

      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
        {subtitle}
      </p>
    </div>
  </div>

  {/* RIGHT SIDE */}
  {!showForm && (
    <div className="flex items-center gap-4">

      {/* SEARCH */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="text"
          placeholder="Search Code, Name, Status..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-4 py-2.5 w-72 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
        />
      </div>

      {/* ADD BUTTON */}
      <button
        onClick={() => {
          setEditId(null);
          setFormData({ name: '', code: '', status: 'Active' });
          setShowForm(true);
        }}
        className="px-6 py-3 bg-slate-900 text-white font-black text-xs uppercase rounded-2xl hover:bg-black transition-all shadow-lg"
      >
<span className="font-extrabold text-sm mr-1 leading-none">+</span>
  Add Department
      </button>

    </div>
  )}

</div>

      {/* FORM */}
      {showForm && (
        <div className="bg-white rounded-[32px] shadow-2xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 px-8 py-4 flex justify-between items-center">
            <h3 className="font-black text-slate-800 uppercase text-sm">
              {editId ? 'Edit Clinical Station' : 'Initialize New Station'}
            </h3>
            <button onClick={() => { setShowForm(false); setEditId(null); }}>
              <X size={20} />
            </button>
          </div>

          <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                System Code <Mandatory />
              </label>
             <input
  type="text"
  name="code"
  value={formData.code}
  onChange={handleInputChange}
  disabled={!!editId}
  style={{ textTransform: 'uppercase' }}
  placeholder="E.G. ICU"
className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm font-bold ${
  validationError.code
    ? "border-rose-500 ring-1 ring-rose-500"
    : "border-slate-200"
}`}
/>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                Department Name <Mandatory />
              </label>
              <input
  name="name"
  value={formData.name}
  onChange={handleInputChange}
  placeholder="E.G. INTENSIVE CARE UNIT"
style={{ textTransform: "uppercase" }}
className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm font-bold ${
  validationError.name
    ? "border-rose-500 ring-1 ring-rose-500"
    : "border-slate-200"
}`}
/>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                Operational Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold"
              >
                <option value="Active">ACTIVE</option>
                <option value="Deactivated">DEACTIVATED</option>
              </select>
            </div>

            <div className="md:col-span-3 flex justify-end gap-3 pt-6 border-t border-slate-100">
              <button
                onClick={() => { setShowForm(false); setEditId(null); }}
                className="px-6 py-2.5 bg-slate-100 text-slate-600 font-black text-xs uppercase rounded-xl"
              >
                Cancel
              </button>

            <button
  onClick={handleSave}
  disabled={validationError.code || validationError.name}
  className="px-8 py-2.5 bg-slate-900 text-white font-black text-xs uppercase rounded-xl flex items-center gap-2 shadow-lg hover:bg-black transition-all disabled:opacity-50"
>
                <Save size={16} />
                {editId ? 'Update Station' : 'Create Station'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TABLE */}
      <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-center w-32">Code</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Department Name</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-center w-32">Status</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-center w-64">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
  {filteredDepts.length === 0 ? (
    <tr>
      <td
        colSpan={4}
        className="px-8 py-10 text-center text-slate-400 font-semibold"
      >
        No matching departments found.
      </td>
    </tr>
  ) : (
    filteredDepts.map((dept) => (
      <tr key={dept.id} className="hover:bg-slate-50 transition-colors">
        <td className="px-8 py-5 text-center">
          <span className="text-[11px] font-black text-emerald-600 tracking-widest uppercase bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
            {dept.code}
          </span>
        </td>

        <td className="px-8 py-5">
          <span className="font-black text-slate-800 text-sm uppercase tracking-tight">
            {dept.name}
          </span>
        </td>

        <td className="px-8 py-5 text-center">
          <span
            className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tight ${
              dept.status === "Active"
                ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                : "bg-slate-100 text-slate-500 border border-slate-200"
            }`}
          >
            {dept.status}
          </span>
        </td>

        <td className="px-8 py-5 text-right">
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={() => handleEdit(dept)}
              className="text-blue-600 hover:text-blue-800 font-bold text-[10px] uppercase flex items-center gap-1.5"
            >
              <Edit3 size={14} /> Edit
            </button>

            <button
              onClick={() =>
                setStatusModal({
                  isOpen: true,
                  dept,
                  action:
                    dept.status === "Active"
                      ? "deactivate"
                      : "activate",
                })
              }
              className={`font-black text-[10px] uppercase flex items-center gap-1.5 ${
                dept.status === "Active"
                  ? "text-rose-500 hover:text-rose-700"
                  : "text-emerald-600 hover:text-emerald-800"
              }`}
            >
              {dept.status === "Active" ? (
                <ToggleLeft size={16} />
              ) : (
                <ToggleRight size={16} />
              )}
              {dept.status === "Active" ? "Deactivate" : "Activate"}
            </button>
          </div>
        </td>
      </tr>
    ))
  )}
</tbody>
        </table>
      </div>

      <TransactionOverlay status={txStatus} message={txMsg} onClose={() => setTxStatus('idle')} />

<StatusConfirmationModal
  isOpen={statusModal.isOpen}
  targetName={statusModal.dept?.name || ""}
  action={statusModal.action}
  onConfirm={handleToggleStatus}
  onCancel={() =>
    setStatusModal({ isOpen: false, dept: null, action: null })
  }
/>


    </div>
  );
};
