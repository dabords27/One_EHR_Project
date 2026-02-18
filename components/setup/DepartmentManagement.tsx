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
  const [isEditingSubtitle, setIsEditingSubtitle] = useState(false);
  const [subtitle, setSubtitle] = useState(
    () => localStorage.getItem('dept_subtitle') || 'INFRASTRUCTURE • STATION MANAGEMENT'
  );

  const [txStatus, setTxStatus] = useState<TransactionStatus>('idle');
  const [txMsg, setTxMsg] = useState('');
  const [validationError, setValidationError] = useState('');

  const [statusModal, setStatusModal] = useState<{
    isOpen: boolean;
    dept: DepartmentEntry | null;
  }>({ isOpen: false, dept: null });

  const [depts, setDepts] = useState<DepartmentEntry[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    status: 'Active' as 'Active' | 'Inactive'
  });

  /* ================= FETCH ================= */

  const fetchDepartments = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/departments');
      const data = await res.json();

      const formatted: DepartmentEntry[] = data.map((d: any) => ({
        id: d.auto_id.toString(),
        name: d.dept_name,
        code: d.dept_code,
        status: d.dept_status === 'active' ? 'Active' : 'Inactive'
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
  const upperValue = value.toUpperCase();

  setFormData(prev => ({
    ...prev,
    [name]: upperValue
  }));

  // Duplicate code validation
  if (name === 'code') {
    const exists = depts.some(
      d =>
        d.code.toUpperCase() === upperValue &&
        d.id !== editId
    );

    if (exists) {
      setValidationError('System Code already exists.');
    } else {
      setValidationError('');
    }
  }
};
    

  /* ================= SAVE ================= */

  const handleSave = async () => {
   
if (validationError) {
  setTxStatus('error');
  setTxMsg(validationError);
  setTimeout(() => setTxStatus('idle'), 1500);
  return;
}   if (!formData.name || !formData.code) return;

    setTxStatus('loading');
    setTxMsg('Synchronizing department hierarchy with master infrastructure...');

    const start = Date.now();

    try {
      if (editId) {
        await fetch(`http://localhost:5000/api/departments/${editId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dept_name: formData.name,
            dept_status: formData.status.toLowerCase()
          })
        });
      } else {
        await fetch('http://localhost:5000/api/departments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dept_code: formData.code,
            dept_name: formData.name,
            dept_status: formData.status.toLowerCase()
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
    if (!statusModal.dept) return;

    const dept = statusModal.dept;
    const newStatus = dept.status === 'Active' ? 'inactive' : 'active';

    setStatusModal({ isOpen: false, dept: null });
    setTxStatus('loading');
    setTxMsg(`Synchronizing ${newStatus === 'active' ? 'Activation' : 'Deactivation'} request...`);

    const start = Date.now();

    try {
      await fetch(`http://localhost:5000/api/departments/${dept.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dept_name: dept.name,
          dept_status: newStatus
        })
      });

      await fetchDepartments();

      const elapsed = Date.now() - start;
      if (elapsed < 1000) {
        await new Promise(r => setTimeout(r, 1000 - elapsed));
      }

      setTxStatus('success');
      setTxMsg(`Station ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully.`);
      setTimeout(() => setTxStatus('idle'), 1000);

    } catch (err) {
      console.error(err);
      setTxStatus('error');
      setTxMsg('Status synchronization failed.');
    }
  };

  /* ================= UI ================= */

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack}
            className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-slate-800 rounded-xl shadow-sm">
            <ArrowLeft size={20} />
          </button>

          <div>
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight leading-none mb-1">
              Department Setup
            </h2>

            <div className="flex items-center gap-2 group">
              {isEditingSubtitle ? (
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value.toUpperCase())}
                  onBlur={handleSaveSubtitle}
                  autoFocus
                  className="text-[10px] font-black text-emerald-600 border-b border-emerald-300 outline-none bg-emerald-50 px-1 uppercase tracking-widest"
                />
              ) : (
                <>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {subtitle}
                  </p>
                  <button onClick={() => setIsEditingSubtitle(true)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-emerald-500">
                    <Edit3 size={10} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {!showForm && (
          <button
            onClick={() => {
              setEditId(null);
              setFormData({ name: '', code: '', status: 'Active' });
              setShowForm(true);
            }}
            className="px-6 py-2.5 bg-emerald-600 text-white font-black text-xs uppercase rounded-xl hover:bg-emerald-700 shadow-lg flex items-center gap-2"
          >
            <Plus size={16} /> Add Station
          </button>
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
  className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm font-black ${
    validationError ? 'border-rose-400' : 'border-slate-200'
  } ${editId ? 'text-slate-400 cursor-not-allowed' : 'text-emerald-600'}`}
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
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold"
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
                <option value="Inactive">INACTIVE</option>
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
  disabled={!!validationError}
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
              <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-right w-64">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {depts.map((dept) => (
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
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tight ${
                    dept.status === 'Active'
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}>
                    {dept.status}
                  </span>
                </td>

                <td className="px-8 py-5 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <button onClick={() => handleEdit(dept)}
                      className="text-blue-600 hover:text-blue-800 font-bold text-[10px] uppercase flex items-center gap-1.5">
                      <Edit3 size={14} /> Edit
                    </button>

                    <button
                      onClick={() => setStatusModal({ isOpen: true, dept })}
                      className={`font-black text-[10px] uppercase flex items-center gap-1.5 ${
                        dept.status === 'Active'
                          ? 'text-rose-500 hover:text-rose-700'
                          : 'text-emerald-600 hover:text-emerald-800'
                      }`}
                    >
                      {dept.status === 'Active'
                        ? <ToggleLeft size={16} />
                        : <ToggleRight size={16} />}
                      {dept.status === 'Active' ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <TransactionOverlay status={txStatus} message={txMsg} onClose={() => setTxStatus('idle')} />

      <StatusConfirmationModal
        isOpen={statusModal.isOpen}
        targetName={statusModal.dept?.name || ''}
        isActivating={statusModal.dept?.status !== 'Active'}
        title="Clinical Station"
        onConfirm={handleToggleStatus}
        onCancel={() => setStatusModal({ isOpen: false, dept: null })}
      />
    </div>
  );
};
