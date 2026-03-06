import React, { useState, useEffect } from 'react';
import { FileText, Pencil, Trash2, ArrowLeft, Save, Search } from 'lucide-react';
import { NoteTemplate } from '../../types';
import { TransactionOverlay, TransactionStatus } from '../TransactionOverlay';
import { useAuth } from "../../context/AuthContext";
import { AuthModal } from "../AuthModal";

interface NoteTemplateManagementProps {
  onBack: () => void;
}

const API_URL = `${import.meta.env.VITE_API_URL}/api/notetemplates`;

export const NoteTemplateManagement: React.FC<NoteTemplateManagementProps> = ({ onBack }) => {

  const { user } = useAuth();

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json"
  });

  const [templates, setTemplates] = useState<NoteTemplate[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [templateSort, setTemplateSort] = useState<"name" | "date">("name");
  const [txStatus, setTxStatus] = useState<TransactionStatus>('idle');
  const [txMsg, setTxMsg] = useState('');

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingSave, setPendingSave] = useState(false);

  const [formData, setFormData] = useState<Omit<NoteTemplate, 'id'>>({
    name: '',
    content: '',
    category: 'GENERAL'
  });

  const [isNameTaken, setIsNameTaken] = useState(false);
  const [errors, setErrors] = useState<{ name?: string }>({});
  

  // ================= FETCH =================
  const fetchTemplates = async () => {
    try {
      const res = await fetch(API_URL, {
        headers: getAuthHeaders()
      });

      if (!res.ok) throw new Error('Failed to fetch templates.');

      const data = await res.json();

      if (!Array.isArray(data)) {
        setTemplates([]);
        return;
      }

     const mapped = data.map((t: any) => ({
  id: String(t.Id),
  name: t.Name,
  content: t.Content,
  category: t.Category?.toUpperCase() || 'GENERAL',
  created_at: t.CreatedDate || null
}));

      setTemplates(mapped);

    } catch (err) {
      console.error(err);
      setTemplates([]);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  // ================= DUPLICATE CHECK =================
  const checkTemplateNameExists = (name: string) => {
    if (!name.trim()) return false;

    return templates.some(t => {
      if (editId && t.id === editId) return false;
      return t.name.toUpperCase() === name.toUpperCase();
    });
  };

  // ================= INPUT =================
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === 'name') {
      const upper = value.toUpperCase();

      setFormData(prev => ({ ...prev, name: upper }));

      const exists = checkTemplateNameExists(upper);
      setIsNameTaken(exists);

      setErrors(prev => ({
        ...prev,
        name: exists ? "Template name already taken" : undefined
      }));
    }
    else if (name === 'category') {
      setFormData(prev => ({ ...prev, category: value.toUpperCase() }));
    }
    else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const resetForm = () => {
    setFormData({ name: '', content: '', category: 'GENERAL' });
    setEditId(null);
    setIsNameTaken(false);
    setErrors({});
    setShowForm(false);
  };

  // ================= EDIT =================
  const handleEdit = (template: NoteTemplate) => {
    setEditId(template.id);
    setFormData({
      name: template.name,
      content: template.content,
      category: template.category
    });
    setIsNameTaken(false);
    setErrors({});
    setShowForm(true);
  };

  // ================= DELETE REQUEST =================
  const requestDelete = (id: string) => {
    setPendingDeleteId(id);
    setShowAuthModal(true);
  };

  // ================= VERIFIED =================
const handleVerified = async (verifiedUser: { id: number; username: string }) => {

  setShowAuthModal(false);

  const startTime = Date.now();
  setTxStatus("loading");
  setTxMsg("Syncing data...");

  try {

    // DELETE
    if (pendingDeleteId) {

      const res = await fetch(`${API_URL}/${pendingDeleteId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          deletedBy: verifiedUser.username
        })
      });

      if (!res.ok) throw new Error("Delete failed");

      setPendingDeleteId(null);
    }

    // SAVE
    if (pendingSave) {

      const method = editId ? "PUT" : "POST";
      const url = editId ? `${API_URL}/${editId}` : API_URL;

const body = editId
  ? {
      name: formData.name,
      content: formData.content,
      category: formData.category,
      updatedBy: verifiedUser.username
    }
  : {
      name: formData.name,
      content: formData.content,
      category: formData.category,
      createdBy: verifiedUser.username
    };
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(body)
      });

      if (!res.ok) throw new Error("Save failed");

      setPendingSave(false);
    }

    const elapsed = Date.now() - startTime;
    const remaining = Math.max(1000 - elapsed, 0); // 👈 make it 1000ms

    setTimeout(async () => {

      await fetchTemplates();

      setTxStatus("success");
      setTxMsg("Operation successful.");

      setTimeout(() => {
        setTxStatus("idle");
        resetForm();
      }, 900);

    }, remaining);

  } catch (err: any) {
    setTxStatus("error");
    setTxMsg(err.message || "Operation failed.");
    setTimeout(() => setTxStatus("idle"), 2000);
  }
};


// ================= FILTER =================
// ================= FILTER =================
const filteredTemplates = [...templates]
  .filter(t =>
    t.name.toUpperCase().includes(search.toUpperCase())
  )
  .sort((a, b) => {

    if (templateSort === "name") {
      return a.name.localeCompare(b.name);
    }

    if (templateSort === "date") {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;

      return dateA - dateB; // OLDEST → NEWEST (newest at bottom)
    }

    return 0;
  });
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

          <div>
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
              Note Templates
            </h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
              {filteredTemplates.length} Templates Available
            </p>
          </div>
        </div>

        {!showForm && (
          <button
            onClick={() => {
              setEditId(null);
              setIsNameTaken(false);
              setErrors({});
              setFormData({ name: '', content: '', category: 'GENERAL' });
              setShowForm(true);
            }}
            className="px-6 py-3 bg-slate-900 text-white font-black text-xs uppercase rounded-2xl shadow-lg"
          >
            + New Note Template
          </button>
        )}
      </div>

{/* SEARCH + SORT */}
{!showForm && (
  <div className="flex items-center gap-4">

    {/* SEARCH */}
    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2 flex-1">
      <Search size={16} className="text-slate-400" />
      <input
        type="text"
        placeholder="Search template..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full outline-none text-sm"
      />
    </div>

    {/* SORT */}
    <select
      value={templateSort}
      onChange={(e) =>
        setTemplateSort(e.target.value as "name" | "date")
      }
      className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wide text-slate-600"
    >
      <option value="name">Sort by Name</option>
      <option value="date">Sort by Date Created</option>
    </select>

  </div>
)}	
	  {/* TEMPLATE LIST */}
{!showForm && (
  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-6">
    {filteredTemplates.map(template => (
      <div
        key={template.id}
        className="relative bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100"
      >
        <div className="absolute top-5 right-5 flex items-center gap-2">
          <button
            onClick={() => handleEdit(template)}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-sky-100 flex items-center justify-center transition"
          >
            <Pencil size={14} />
          </button>

          <button
            onClick={() => requestDelete(template.id)}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-red-100 flex items-center justify-center transition"
          >
            <Trash2 size={14} />
          </button>
        </div>

        <div className="w-14 h-14 rounded-2xl bg-sky-100 flex items-center justify-center mb-6">
          <FileText size={24} />
        </div>

        <h3 className="text-lg font-black text-slate-800 tracking-tight">
          {template.name}
        </h3>

        <p className="text-sm text-slate-400 mt-2 uppercase tracking-widest">
          {template.category}
        </p>
      </div>
    ))}
  </div>
)}

      {/* FORM */}
      {showForm && (
        <div className="bg-white rounded-[32px] shadow-2xl border border-slate-200">
          <div className="p-8 space-y-6">

            {/* TEMPLATE NAME */}
            <div className="space-y-1">
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Template Name"
                className={`w-full bg-slate-50 border ${
                  errors.name || isNameTaken
                    ? "border-rose-500 ring-1 ring-rose-500"
                    : "border-slate-200"
                } rounded-xl px-4 py-3 text-sm font-semibold outline-none`}
              />

              {(errors.name || isNameTaken) && (
                <p className="text-[10px] text-rose-600 font-black uppercase tracking-wide pl-1">
                  {errors.name}
                </p>
              )}

              {!isNameTaken && formData.name && !errors.name && (
                <p className="text-[10px] text-emerald-600 font-black uppercase tracking-wide pl-1">
                  Template name available
                </p>
              )}
            </div>

            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold"
            >
              <option value="GENERAL">GENERAL</option>
              <option value="NURSING">NURSING</option>
              <option value="CLINICAL">CLINICAL</option>
              <option value="ADMIN">ADMIN</option>
            </select>

            <textarea
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              rows={10}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm resize-none"
              placeholder="Enter template structure..."
            />

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={resetForm}
                className="px-8 py-3 bg-slate-100 text-slate-600 font-black text-xs uppercase rounded-xl"
              >
                Cancel Entry
              </button>

              <button
                disabled={isNameTaken || !formData.name.trim()}
                onClick={() => {
                  if (!formData.name.trim()) {
                    setErrors({ name: "Template name is required" });
                    return;
                  }

                  if (checkTemplateNameExists(formData.name)) {
                    setErrors({ name: "Template name already taken" });
                    return;
                  }

                  setPendingSave(true);
                  setShowAuthModal(true);
                }}
                className={`px-10 py-3 font-black text-xs uppercase rounded-xl flex items-center gap-2 transition-all ${
                  isNameTaken || !formData.name.trim()
                    ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                    : "bg-slate-900 text-white hover:bg-black"
                }`}
              >
                <Save size={16} />
                Save Note Template
              </button>
            </div>

          </div>
        </div>
      )}

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
        onClose={() => setTxStatus('idle')}
      />

    </div>
  );
};