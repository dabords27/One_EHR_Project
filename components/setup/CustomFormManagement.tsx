
import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Plus, 
  ClipboardType, 
  X,
  Save,
  Edit3,
  Check,
  Search,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  AlertTriangle,
  Info
} from 'lucide-react';
import { FormTemplate, FormType, FormStatus, DepartmentEntry } from '../../types';
import { TransactionOverlay, TransactionStatus } from '../TransactionOverlay';
import { StatusConfirmationModal } from '../StatusConfirmationModal';

interface CustomFormManagementProps {
  onBack: () => void;
}

const Mandatory = () => <span className="text-rose-500 ml-0.5">*</span>;

export const CustomFormManagement: React.FC<CustomFormManagementProps> = ({ onBack }) => {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [isEditingSubtitle, setIsEditingSubtitle] = useState(false);
  const [subtitle, setSubtitle] = useState(() => localStorage.getItem('form_mgmt_subtitle') || 'SETUP CONSOLE • CLINICAL TEMPLATE REGISTRY');
  const [availableDepts, setAvailableDepts] = useState<DepartmentEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Transaction State
  const [txStatus, setTxStatus] = useState<TransactionStatus>('idle');
  const [txMsg, setTxMsg] = useState('');
  const [txError, setTxError] = useState('');

  // Status Modal State
  const [statusModal, setStatusModal] = useState<{ isOpen: boolean; template: FormTemplate | null }>({ isOpen: false, template: null });
  
  // Module Used Warning State
  const [showModuleUsedWarning, setShowModuleUsedWarning] = useState(false);

  const [templates, setTemplates] = useState<FormTemplate[]>(() => {
    const saved = localStorage.getItem('custom_form_templates');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((t: FormTemplate) => ({
          ...t,
          departmentTags: Array.from(new Set((t.departmentTags || []).map(s => s.trim())))
        }));
      } catch (e) {
        console.error("Error parsing templates", e);
      }
    }
    return [];
  });

  const [formData, setFormData] = useState<Omit<FormTemplate, 'id'>>({
    code: '',
    name: '',
    baseModule: FormType.OPERATIVE_TECHNIQUE,
    departmentTags: [],
    status: FormStatus.ACTIVE
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const savedDepts = JSON.parse(localStorage.getItem('hospital_departments') || '[]');
    setAvailableDepts(savedDepts);
    localStorage.setItem('custom_form_templates', JSON.stringify(templates));
  }, [templates]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value.toUpperCase() }));
    if (errors[name]) {
      setErrors(prev => {
        const newErrs = { ...prev };
        delete newErrs[name];
        return newErrs;
      });
    }
  };

  const handleSaveSubtitle = () => {
    localStorage.setItem('form_mgmt_subtitle', subtitle.toUpperCase());
    setIsEditingSubtitle(false);
  };

  const toggleDeptTag = (deptName: string) => {
    const trimmedDept = deptName.trim();
    setFormData(prev => {
      const normalizedTags = (prev.departmentTags || []).map(t => t.trim());
      const exists = normalizedTags.includes(trimmedDept);
      const updatedTags = exists 
        ? normalizedTags.filter(d => d !== trimmedDept) 
        : [...normalizedTags, trimmedDept];
      
      if (updatedTags.length > 0 && errors.departmentTags) {
        setErrors(errs => {
          const newErrs = { ...errs };
          delete newErrs.departmentTags;
          return newErrs;
        });
      }
      
      return { ...prev, departmentTags: updatedTags };
    });
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.code.trim()) newErrors.code = 'Form Code is required';
    if (!formData.name.trim()) newErrors.name = 'Form Display Name is required';
    if (!formData.baseModule) newErrors.baseModule = 'Base Clinical Module is required';
    if (!formData.departmentTags || formData.departmentTags.length === 0) {
      newErrors.departmentTags = 'Assign at least one department';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const checkDuplicateCode = () => {
    const normalizedCode = formData.code.trim().toUpperCase();
    return templates.some(t => t.code.trim().toUpperCase() === normalizedCode && t.id !== editId);
  };

  const checkModuleAlreadyUsed = () => {
    return templates.some(t => t.baseModule === formData.baseModule && t.id !== editId);
  };

  const handleSaveAttempt = () => {
    if (!validate()) {
      setTxStatus('error');
      setTxMsg('Validation Failed: All fields marked with red border are required.');
      return;
    }

    if (checkDuplicateCode()) {
      setTxStatus('error');
      setTxMsg(`System Conflict: The Form Code "${formData.code}" is already registered.`);
      setTxError('Duplication detected in Clinical Registry. Use a unique identifier.');
      return;
    }

    if (checkModuleAlreadyUsed()) {
      setShowModuleUsedWarning(true);
    } else {
      commitSave();
    }
  };

  const commitSave = async () => {
    setShowModuleUsedWarning(false);
    setTxStatus('loading');
    setTxMsg('Synchronizing template parameters with Station Logic Manager...');
    await new Promise(resolve => setTimeout(resolve, 1200));

    try {
      const normalizedCode = formData.code.trim().toUpperCase();
      const finalData = {
        ...formData,
        code: normalizedCode,
        departmentTags: Array.from(new Set(formData.departmentTags.map(t => t.trim())))
      };

      let updated;
      if (editId) {
        updated = templates.map(t => t.id === editId ? { ...t, ...finalData } : t);
      } else {
        updated = [...templates, { ...finalData, id: Date.now().toString() }];
      }

      setTemplates(updated);
      setTxStatus('success');
      setTxMsg('Clinical template synchronization complete.');
      
      setTimeout(() => {
        setTxStatus('idle');
        setShowForm(false);
        setEditId(null);
        setFormData({ code: '', name: '', baseModule: FormType.OPERATIVE_TECHNIQUE, departmentTags: [], status: FormStatus.ACTIVE });
        setErrors({});
      }, 1200);
    } catch (e) {
      setTxStatus('error');
      setTxMsg('System Fault: Failed to commit registry data.');
    }
  };

  const handleEdit = (template: FormTemplate) => {
    setEditId(template.id);
    setFormData({ 
      code: template.code, 
      name: template.name, 
      baseModule: template.baseModule, 
      departmentTags: Array.from(new Set((template.departmentTags || []).map(t => t.trim()))), 
      status: template.status 
    });
    setErrors({});
    setShowForm(true);
  };

  const handleToggleStatus = async () => {
    if (!statusModal.template) return;
    const template = statusModal.template;
    const newStatus = template.status === FormStatus.ACTIVE ? FormStatus.INACTIVE : FormStatus.ACTIVE;
    
    setStatusModal({ isOpen: false, template: null });
    setTxStatus('loading');
    setTxMsg(`Synchronizing ${newStatus === FormStatus.ACTIVE ? 'Activation' : 'Deactivation'} request...`);
    
    await new Promise(resolve => setTimeout(resolve, 1000));

    const updated = templates.map(t => t.id === template.id ? { ...t, status: newStatus } : t);
    setTemplates(updated);
    
    setTxStatus('success');
    setTxMsg(`Template ${newStatus === FormStatus.ACTIVE ? 'activated' : 'deactivated'} successfully.`);
    setTimeout(() => setTxStatus('idle'), 1000);
  };

  const filteredTemplates = (templates || []).filter(t => (t.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (t.code || '').toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-slate-800 rounded-xl transition-all shadow-sm"><ArrowLeft size={20} /></button>
          <div>
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight leading-none mb-1">Custom Form Management</h2>
            <div className="flex items-center gap-2 group">
              {isEditingSubtitle ? <input type="text" value={subtitle} onChange={(e) => setSubtitle(e.target.value.toUpperCase())} onBlur={handleSaveSubtitle} autoFocus className="text-[10px] font-black text-amber-600 border-b border-amber-300 outline-none bg-white px-1 uppercase tracking-widest" /> : <><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{subtitle}</p><button onClick={() => setIsEditingSubtitle(true)} className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-amber-500 transition-all"><Edit3 size={10} /></button></>}
            </div>
          </div>
        </div>
        {!showForm && (
          <div className="flex items-center gap-4">
            <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input type="text" placeholder="Search templates..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 w-64 shadow-sm font-bold text-xs uppercase" /></div>
            <button onClick={() => { setEditId(null); setFormData({ code: '', name: '', baseModule: FormType.OPERATIVE_TECHNIQUE, departmentTags: [], status: FormStatus.ACTIVE }); setErrors({}); setShowForm(true); }} className="px-6 py-2.5 bg-amber-600 text-white font-black text-xs uppercase rounded-xl hover:bg-amber-700 transition-all shadow-lg flex items-center gap-2"><Plus size={16} /> New Template</button>
          </div>
        )}
      </div>

      {showForm && (
        <div className="bg-white rounded-[32px] shadow-2xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
          <div className="bg-slate-50 border-b border-slate-200 px-8 py-4 flex justify-between items-center"><h3 className="font-black text-slate-800 uppercase tracking-tight text-sm">{editId ? 'Modify Template Registry' : 'Define New Clinical Template'}</h3><button onClick={() => {setShowForm(false); setEditId(null); setErrors({});}} className="text-slate-400 hover:text-slate-600"><X size={20} /></button></div>
          <div className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Form Code <Mandatory /></label>
                <input 
                  type="text" 
                  name="code" 
                  value={formData.code} 
                  onChange={handleInputChange} 
                  placeholder="E.G. OTF-017" 
                  className={`w-full bg-white border ${errors.code ? 'border-rose-400 ring-2 ring-rose-400' : 'border-slate-300'} rounded-xl px-4 py-3 text-sm font-black text-amber-600 outline-none transition-all focus:ring-2 focus:ring-amber-500/20 shadow-sm`} 
                />
                {errors.code && <p className="text-[10px] text-rose-500 font-bold pl-1 uppercase mt-1">{errors.code}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Form Display Name <Mandatory /></label>
                <input 
                  type="text" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleInputChange} 
                  placeholder="E.G. SURGERY TECHNIQUE LOG" 
                  className={`w-full bg-white border ${errors.name ? 'border-rose-400 ring-2 ring-rose-400' : 'border-slate-300'} rounded-xl px-4 py-3 text-sm font-bold outline-none transition-all focus:ring-2 focus:ring-amber-500/20 shadow-sm`} 
                />
                {errors.name && <p className="text-[10px] text-rose-500 font-bold pl-1 uppercase mt-1">{errors.name}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Base Clinical Module <Mandatory /></label>
                <select 
                  name="baseModule" 
                  value={formData.baseModule} 
                  onChange={(e) => setFormData(prev => ({ ...prev, baseModule: e.target.value as FormType }))} 
                  className={`w-full bg-white border ${errors.baseModule ? 'border-rose-400 ring-2 ring-rose-400' : 'border-slate-300'} rounded-xl px-4 py-3 text-sm font-bold outline-none transition-all focus:ring-2 focus:ring-amber-500/20 shadow-sm`}
                >
                  <option value={FormType.OPERATIVE_TECHNIQUE}>OPERATIVE TECHNIQUE</option>
                  <option value={FormType.RECORD_OF_DELIVERY}>RECORD OF DELIVERY</option>
                  <option value={FormType.PATIENT_ASSESSMENT}>PATIENT ASSESSMENT</option>
                </select>
                {errors.baseModule && <p className="text-[10px] text-rose-500 font-bold pl-1 uppercase mt-1">{errors.baseModule}</p>}
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">Department Tagging <Mandatory /></label>
              <div className={`flex flex-wrap gap-2 p-4 bg-white rounded-2xl border ${errors.departmentTags ? 'border-rose-400 ring-2 ring-rose-400' : 'border-slate-200'} transition-all shadow-sm`}>
                {availableDepts.map(dept => (
                  <button 
                    key={dept.id} 
                    onClick={() => toggleDeptTag(dept.name)} 
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border flex items-center gap-2 ${(formData.departmentTags || []).some(t => t.trim() === dept.name.trim()) ? 'bg-amber-600 text-white border-amber-700 shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:border-amber-300'}`}
                  >
                    { (formData.departmentTags || []).some(t => t.trim() === dept.name.trim()) && <Check size={12} />}
                    {dept.name}
                  </button>
                ))}
              </div>
              {errors.departmentTags && <p className="text-[10px] text-rose-500 font-bold pl-1 uppercase mt-1">{errors.departmentTags}</p>}
            </div>
            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
              <button onClick={() => {setShowForm(false); setEditId(null); setErrors({});}} className="px-6 py-3 bg-slate-100 text-slate-600 font-black text-xs uppercase rounded-xl hover:bg-slate-200 transition-all">Cancel</button>
              <button onClick={handleSaveAttempt} className="px-10 py-3 bg-slate-900 text-white font-black text-xs uppercase rounded-xl flex items-center gap-2 shadow-xl hover:bg-black transition-all active:scale-95">
                <Save size={16} /> {editId ? 'Update Template' : 'Initialize Template'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Templates Table */}
      <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center w-32">Code</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Form Template Name</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center w-32">Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right w-64">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTemplates.map((template) => (
                <tr key={template.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-6 text-center"><span className="text-[11px] font-black text-amber-600 tracking-widest uppercase bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100 shadow-sm whitespace-nowrap">{template.code}</span></td>
                  <td className="px-8 py-6"><span className="font-black text-slate-800 text-sm uppercase tracking-tight">{template.name}</span></td>
                  <td className="px-8 py-6 text-center">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tight ${
                      template.status === FormStatus.ACTIVE 
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}>
                      {template.status || 'ACTIVE'}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button onClick={() => handleEdit(template)} className="text-blue-600 hover:text-blue-800 font-bold text-[10px] uppercase flex items-center gap-1.5 transition-colors">
                        <Edit3 size={14} /> Edit
                      </button>
                      <button 
                        onClick={() => setStatusModal({ isOpen: true, template })}
                        className={`font-black text-[10px] uppercase flex items-center gap-1.5 transition-colors ${
                          template.status === FormStatus.ACTIVE 
                            ? 'text-rose-500 hover:text-rose-700' 
                            : 'text-emerald-600 hover:text-emerald-800'
                        }`}
                      >
                        {template.status === FormStatus.ACTIVE ? <ToggleLeft size={16} /> : <ToggleRight size={16} />}
                        {template.status === FormStatus.ACTIVE ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
        </table>
      </div>

      <TransactionOverlay status={txStatus} message={txMsg} errorDetails={txError} onClose={() => setTxStatus('idle')} />
      
      <StatusConfirmationModal 
        isOpen={statusModal.isOpen}
        targetName={statusModal.template?.name || ''}
        isActivating={statusModal.template?.status !== FormStatus.ACTIVE}
        title="Clinical Template"
        onConfirm={handleToggleStatus}
        onCancel={() => setStatusModal({ isOpen: false, template: null })}
      />

      {/* Module Usage Warning Modal */}
      {showModuleUsedWarning && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white p-10 rounded-[40px] shadow-2xl max-w-lg w-full animate-in zoom-in-95 duration-300 relative border border-slate-100 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-amber-500"></div>
            
            <button onClick={() => setShowModuleUsedWarning(false)} className="absolute right-8 top-8 text-slate-300 hover:text-slate-600 transition-colors">
              <X size={24} />
            </button>

            <div className="bg-amber-50 w-24 h-24 rounded-[32px] flex items-center justify-center text-amber-500 mx-auto mb-8 shadow-inner ring-4 ring-amber-50/50">
              <AlertTriangle size={48} strokeWidth={2.5} />
            </div>

            <div className="text-center space-y-4 mb-10 px-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-700 rounded-lg mb-2">
                <Info size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">Configuration Warning</span>
              </div>
              <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-tight">Module Conflict Detected</h4>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                The <span className="font-black text-slate-800 uppercase">"{formData.baseModule.replace(/_/g, ' ')}"</span> clinical module is already utilized by another active template in the registry.
              </p>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-left">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Impact Analysis</p>
                <p className="text-[11px] text-slate-600 font-bold leading-snug">Proceeding will result in multiple templates sharing the same base logic. Is this intentional?</p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button 
                onClick={commitSave}
                className="w-full py-5 bg-slate-900 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl hover:bg-black transition-all shadow-xl shadow-slate-200 active:scale-[0.98] flex items-center justify-center gap-3"
              >
                Yes, Initialize Template
              </button>
              <button 
                onClick={() => setShowModuleUsedWarning(false)}
                className="w-full py-5 bg-slate-50 text-slate-400 font-black text-xs uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-100 transition-all active:scale-[0.98]"
              >
                No, Change Module
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
