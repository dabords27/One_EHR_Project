import { Search, ArrowLeft, Edit3, Save, X } from "lucide-react";
import { Wrench, Hammer } from "lucide-react";
import React, { useState, useEffect } from "react";
import { TransactionOverlay, TransactionStatus } from "../TransactionOverlay";
import { useAuth } from "../../context/AuthContext";
import { AuthModal } from "../AuthModal";

import { StatusConfirmationModal } from "../StatusConfirmationModal";

interface Props {
  onBack: () => void;
  onManageTemplate: (templateId: number) => void;
}

export const CustomFormManagement: React.FC<Props> = ({
  onBack,
  onManageTemplate
}) => {
  const [showForm, setShowForm] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditingSubtitle, setIsEditingSubtitle] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
const [selectedDepartments, setSelectedDepartments] = useState<number[]>([]);

const [pendingToggleId, setPendingToggleId] = useState<number | null>(null);
const [pendingToggleValue, setPendingToggleValue] = useState<boolean | null>(null);

const [isEditMode, setIsEditMode] = useState(false);
const [editingTemplateId, setEditingTemplateId] = useState<number | null>(null);

const { user } = useAuth();

const [txStatus, setTxStatus] = useState<TransactionStatus>("idle");
const [txMsg, setTxMsg] = useState("");

const [showAuthModal, setShowAuthModal] = useState(false);
const [pendingSave, setPendingSave] = useState(false);

const [statusModal, setStatusModal] = useState<{
  isOpen: boolean;
  template: any | null;
  action: "activate" | "deactivate" | null;
}>({
  isOpen: false,
  template: null,
  action: null
});
  
  const [subtitle, setSubtitle] = useState(
    () =>
      localStorage.getItem("custom_form_subtitle") ||
      "SETUP CONSOLE • CUSTOM FORM TEMPLATES"
  );

  const initialForm = {
    template_name: "",
    description: "",
    paper_size: "A4",
    orientation: "portrait",
    total_pages: 1
  };

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json"
  };
};
  const [formData, setFormData] = useState(initialForm);

  const handleSaveSubtitle = () => {
    localStorage.setItem(
      "custom_form_subtitle",
      subtitle.toUpperCase()
    );
    setIsEditingSubtitle(false);
  };

const fetchDepartments = async () => {
  try {
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/api/departments`,
      {
        headers: getAuthHeaders()
      }
    );

    if (!res.ok) throw new Error("Failed to fetch departments");

    const data = await res.json();
    setDepartments(data);

  } catch (err) {
    console.error(err);
  }
};


const fetchTemplates = async () => {

  try {
    const res = await fetch(
	
      `${import.meta.env.VITE_API_URL}/api/custom-forms/templates`,
      {
        headers: getAuthHeaders()
      }
    );

    if (!res.ok) throw new Error("Failed to fetch templates");

const data = await res.json();

const mapped = data.map((t: any) => ({
  ...t,
  is_active: t.is_active === true || t.is_active === 1// ✅ force real boolean
}));

setTemplates(mapped);

  } catch (err) {
    console.error(err);
  }
};

useEffect(() => {
  fetchTemplates();
  fetchDepartments();   // 👈 ADD THIS
}, []);

const handleVerified = async (verifiedUser: { id: number; username: string }) => {

  setShowAuthModal(false);

  const startTime = Date.now();
setTxStatus("loading");

if (statusModal.template) {
  setTxMsg(
    statusModal.action === "activate"
      ? "Activating custom form..."
      : "Deactivating custom form..."
  );
} else if (pendingSave) {
  setTxMsg("Syncing custom form data...");
}

  try {

    if (pendingSave) {

      const url = isEditMode
        ? `${import.meta.env.VITE_API_URL}/api/custom-forms/template/${editingTemplateId}`
        : `${import.meta.env.VITE_API_URL}/api/custom-forms/template`;

      const method = isEditMode ? "PUT" : "POST";

      const body = {
        ...formData,
        department_ids: selectedDepartments,
        ...(isEditMode
          ? { updated_by: verifiedUser.id }
          : { created_by: verifiedUser.id })
      };

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(body)
      });

      if (!res.ok) throw new Error("Save failed");

      setPendingSave(false);
    }
	
if (statusModal.template) {

  const newStatus = statusModal.action === "activate";

  const res = await fetch(
    `${import.meta.env.VITE_API_URL}/api/custom-forms/template/${statusModal.template.template_id}/status`,
    {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        is_active: newStatus,
        updated_by: verifiedUser.id
      })
    }
  );

  if (!res.ok) throw new Error("Status update failed");

  setStatusModal({
    isOpen: false,
    template: null,
    action: null
  });
}

    const elapsed = Date.now() - startTime;
    const remaining = Math.max(1000 - elapsed, 0);

    setTimeout(async () => {

      await fetchTemplates();

      setTxStatus("success");
      setTxMsg("Custom form synced successfully.");

      setTimeout(() => {
        setTxStatus("idle");
        setShowForm(false);
        setIsEditMode(false);
        setEditingTemplateId(null);
        setFormData(initialForm);
        setSelectedDepartments([]);
      }, 900);

    }, remaining);

  } catch (err: any) {
    setTxStatus("error");
    setTxMsg(err.message || "Operation failed.");
    setTimeout(() => setTxStatus("idle"), 2000);
  }
};
  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* HEADER */}
      <div className="flex items-center justify-between">

        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-slate-800 rounded-xl transition-all shadow-sm"
          >
            <ArrowLeft size={20} />
          </button>

          <div>
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight leading-none mb-1">
              Custom Form Management
            </h2>

            <div className="flex items-center gap-2 group">
              {isEditingSubtitle ? (
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) =>
                    setSubtitle(e.target.value.toUpperCase())
                  }
                  onBlur={handleSaveSubtitle}
                  autoFocus
                  className="text-[10px] font-black text-emerald-600 border-b border-emerald-300 outline-none bg-emerald-50 px-1 uppercase tracking-widest"
                />
              ) : (
                <>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {subtitle}
                  </p>
                  <button
                    onClick={() => setIsEditingSubtitle(true)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-emerald-500 transition-all"
                  >
                    <Edit3 size={10} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {!showForm && (
          <div className="flex items-center gap-4">

            <div className="relative w-80">
              <Search
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search Template..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-100 border border-slate-200 rounded-2xl pl-12 pr-4 py-3 text-sm font-semibold tracking-wide text-slate-700 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-slate-300 transition-all"
              />
            </div>

            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 bg-slate-900 text-white font-black text-xs uppercase rounded-2xl hover:bg-black transition-all shadow-lg"
            >
              <span className="font-extrabold text-sm mr-1 leading-none">
                +
              </span>
              Create Template
            </button>
          </div>
        )}
      </div>

      {/* CREATE FORM */}
      {showForm ? (
        <div className="bg-white rounded-[32px] shadow-xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
          <div className="bg-slate-50 border-b border-slate-200 px-8 py-4 flex justify-between items-center">
            <h3 className="font-black text-slate-800 uppercase tracking-tight text-sm">
              {isEditMode ? "Edit Template" : "Template Configuration"}
            </h3>
            <button
              onClick={() => setShowForm(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                Template Name
              </label>
            <input
  type="text"
  value={formData.template_name}
  onChange={(e) =>
    setFormData(prev => ({
      ...prev,
      template_name: e.target.value
    }))
  }
  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-bold uppercase outline-none focus:ring-2 focus:ring-sky-500/20"
/>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                Total Pages
              </label>
           <input
  type="number"
  value={formData.total_pages}
  onChange={(e) =>
    setFormData(prev => ({
      ...prev,
      total_pages: Number(e.target.value)
    }))
  }
  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-sky-500/20"
/>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                Paper Size
              </label>
        <select
  value={formData.paper_size}
  onChange={(e) =>
    setFormData(prev => ({
      ...prev,
      paper_size: e.target.value
    }))
  }
  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-bold uppercase outline-none focus:ring-2 focus:ring-sky-500/20"
>
  <option value="A4">A4</option>
  <option value="Letter">Letter</option>
  <option value="Folio">Folio</option>
</select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                Orientation
              </label>
       <select
  value={formData.orientation}
  onChange={(e) =>
    setFormData(prev => ({
      ...prev,
      orientation: e.target.value
    }))
  }
  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-bold uppercase outline-none focus:ring-2 focus:ring-sky-500/20"
>
  <option value="portrait">Portrait</option>
  <option value="landscape">Landscape</option>
</select>
            </div>
{/* ✅ ADD THIS RIGHT HERE */}
  <div className="md:col-span-2 space-y-2">
    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
      Authorized Departments
    </label>

    <div className="border border-slate-200 rounded-xl p-4 max-h-48 overflow-y-auto space-y-2">
      {departments.map((dept) => (
        <label
          key={dept.auto_id}
          className="flex items-center gap-2 text-sm font-semibold"
        >
          <input
            type="checkbox"
            checked={selectedDepartments.includes(dept.auto_id)}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedDepartments(prev => [...prev, dept.auto_id]);
              } else {
                setSelectedDepartments(prev =>
                  prev.filter(id => id !== dept.auto_id)
                );
              }
            }}
          />
          {dept.dept_name}
        </label>
      ))}
    </div>
  </div>
            <div className="md:col-span-2 mt-6 flex justify-end gap-3 pt-6 border-t border-slate-100">
              <button
                onClick={() => setShowForm(false)}
                className="px-8 py-3 bg-slate-100 text-slate-600 font-black text-xs uppercase rounded-xl hover:bg-slate-200 transition-all"
              >
                Cancel Entry
              </button>

              <button 
			   onClick={() => {
  if (!formData.template_name.trim()) {
    alert("Template name is required");
    return;
  }

  setPendingSave(true);
  setShowAuthModal(true);
}}
			  className="px-10 py-3 bg-slate-900 text-white font-black text-xs uppercase rounded-xl shadow-lg hover:bg-black transition-all flex items-center gap-2">
                <Save size={16} />
                {isEditMode ? "Update Template" : "Save Template"}
              </button>
            </div>

          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 overflow-hidden">
       {templates.length === 0 ? (
  <div className="p-10 text-center text-slate-400 font-black uppercase text-sm tracking-widest">
    No Templates Yet
  </div>
) : (
  <table className="w-full text-left">
    <thead>
      <tr className="bg-slate-50 border-b border-slate-200">
        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Template Name
        </th>
        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
          Pages
        </th>
		  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
          Paper Size
        </th>
        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
          Orientation
        </th>
<th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
  Actions
</th>
      </tr>
    </thead>

    <tbody className="divide-y divide-slate-100">
   {templates
  .filter((t: any) =>
    t.template_name.toLowerCase().includes(searchTerm.toLowerCase())
  )
  .map((t: any) => (
<tr key={t.template_id} className="hover:bg-slate-50 transition-colors">
  <td className="px-8 py-5 font-black text-slate-700 uppercase text-sm">
    {t.template_name}
  </td>

  <td className="px-8 py-5 text-center font-black text-slate-700 uppercase text-sm">
    {t.total_pages}
  </td>

  <td className="px-8 py-5 text-center font-black text-slate-700 uppercase text-sm">
    {t.paper_size}
  </td>

  <td className="px-8 py-5 text-center font-black text-slate-700 uppercase text-sm">
    {t.orientation}
  </td>

<td className="px-8 py-5 text-center">
  <div className="inline-flex items-center gap-3">

    {/* EDIT */}
    <button
onClick={async () => {
  setIsEditMode(true);
  setEditingTemplateId(t.template_id);

  setFormData({
    template_name: t.template_name,
    paper_size: t.paper_size,
    orientation: t.orientation,
    total_pages: t.total_pages,
    description: ""
  });

  try {
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/api/custom-forms/template/${t.template_id}/departments`,
      {
        headers: getAuthHeaders()
      }
    );

    if (!res.ok) throw new Error("Failed to fetch template departments");

    const data = await res.json();

    // ✅ Auto-check departments
    setSelectedDepartments(
      data.map((d: any) => d.department_id)
    );

  } catch (err) {
    console.error(err);
  }

  setShowForm(true);
}}
      className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase rounded-lg transition-all shadow-sm"
    >
      <Edit3 size={14} />
      Edit
    </button>

    {/* TEMPLATE BUILDER */}
    <button
      onClick={() => onManageTemplate(t.template_id)}
      className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-black text-white font-black text-[10px] uppercase rounded-lg transition-all shadow-sm"
    >
      <Wrench size={14} />
      Builder
    </button>

{/* ACTIVE TOGGLE */}
<button
  onClick={() =>
    setStatusModal({
      isOpen: true,
      template: t,
      action: t.is_active ? "deactivate" : "activate"
    })
  }
  className={`w-12 h-6 flex items-center rounded-full p-1 transition-all duration-300 ${
    t.is_active ? "bg-emerald-600" : "bg-slate-300"
  }`}
>
  <div
    className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform duration-300 ${
      t.is_active ? "translate-x-6" : "translate-x-0"
    }`}
  />
</button>
  </div>
</td>
</tr>
      ))}
    </tbody>
  </table>
)}
        </div>
      )}
	  <StatusConfirmationModal
  isOpen={statusModal.isOpen}
  targetName={statusModal.template?.template_name || ""}
  action={statusModal.action}
  onConfirm={() => {
    setShowAuthModal(true);
  }}
  onCancel={() =>
    setStatusModal({
      isOpen: false,
      template: null,
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