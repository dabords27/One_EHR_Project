
import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Plus, 
  FileStack, 
  X,
  Save,
  Edit3,
  Trash2,
  FileText,
  Search,
  Check
} from 'lucide-react';
import { NoteTemplate } from '../../types';
import { TransactionOverlay, TransactionStatus } from '../TransactionOverlay';

interface NoteTemplateManagementProps {
  onBack: () => void;
}

const DEFAULT_TEMPLATES: NoteTemplate[] = [
  { id: '1', name: 'NURSE FDAR', content: 'F - FOCUS:\nD - DATA:\nA - ACTION:\nR - RESPONSE:', category: 'NURSING' },
  { id: '2', name: 'PHYSICIAN SOAP', content: 'S - SUBJECTIVE:\nO - OBJECTIVE:\nA - ASSESSMENT:\nP - PLAN:', category: 'CLINICAL' }
];

export const NoteTemplateManagement: React.FC<NoteTemplateManagementProps> = ({ onBack }) => {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [templates, setTemplates] = useState<NoteTemplate[]>(() => {
    const saved = localStorage.getItem('progress_note_templates');
    return saved ? JSON.parse(saved) : DEFAULT_TEMPLATES;
  });

  const [txStatus, setTxStatus] = useState<TransactionStatus>('idle');
  const [txMsg, setTxMsg] = useState('');

  const [formData, setFormData] = useState<Omit<NoteTemplate, 'id'>>({
    name: '',
    content: '',
    category: 'GENERAL'
  });

  useEffect(() => {
    localStorage.setItem('progress_note_templates', JSON.stringify(templates));
  }, [templates]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value.toUpperCase() }));
  };

  const handleSave = async () => {
    if (!formData.name || !formData.content) return;
    
    setTxStatus('loading');
    setTxMsg('Synchronizing templates with clinical dictionary...');
    await new Promise(resolve => setTimeout(resolve, 800));

    let updated;
    if (editId) {
      updated = templates.map(t => t.id === editId ? { ...t, ...formData } : t);
    } else {
      updated = [...templates, { ...formData, id: Date.now().toString() }];
    }

    setTemplates(updated);
    setTxStatus('success');
    setTxMsg('Template saved successfully.');
    
    setTimeout(() => {
      setTxStatus('idle');
      setShowForm(false);
      setEditId(null);
      setFormData({ name: '', content: '', category: 'GENERAL' });
    }, 800);
  };

  const handleEdit = (template: NoteTemplate) => {
    setEditId(template.id);
    setFormData({ name: template.name, content: template.content, category: template.category });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this clinical template?')) {
      setTemplates(templates.filter(t => t.id !== id));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-slate-800 rounded-xl transition-all shadow-sm">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight leading-none mb-1">Note Templates</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Clinical Structure Definitions</p>
          </div>
        </div>
        {!showForm && (
          <button onClick={() => { setEditId(null); setFormData({ name: '', content: '', category: 'GENERAL' }); setShowForm(true); }} className="px-6 py-2.5 bg-sky-600 text-white font-black text-xs uppercase rounded-xl hover:bg-sky-700 transition-all shadow-lg flex items-center gap-2">
            <Plus size={16} /> New Template
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white rounded-[32px] shadow-2xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
          <div className="bg-slate-50 border-b border-slate-200 px-8 py-4 flex justify-between items-center">
            <h3 className="font-black text-slate-800 uppercase tracking-tight text-sm">Template Editor</h3>
            <button onClick={() => {setShowForm(false); setEditId(null);}} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
          </div>
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Template Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="E.G. NURSE FDAR" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-black focus:ring-2 focus:ring-sky-500/20 outline-none transition-all" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Category</label>
                <select name="category" value={formData.category} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-sky-500/20 outline-none">
                  <option value="GENERAL">GENERAL</option>
                  <option value="NURSING">NURSING</option>
                  <option value="CLINICAL">CLINICAL</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Structure Content</label>
              <textarea name="content" value={formData.content} onChange={handleInputChange} rows={6} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-sky-500/20 outline-none transition-all resize-none" placeholder="Enter the template structure..." />
              <p className="text-[9px] text-slate-400 font-bold uppercase">This text will be injected into the notes field when selected.</p>
            </div>
            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
              <button onClick={() => {setShowForm(false); setEditId(null);}} className="px-6 py-2.5 bg-slate-100 text-slate-600 font-black text-xs uppercase rounded-xl hover:bg-slate-200 transition-all">Cancel</button>
              <button onClick={handleSave} className="px-8 py-2.5 bg-slate-900 text-white font-black text-xs uppercase rounded-xl flex items-center gap-2 shadow-lg hover:bg-black transition-all"><Save size={16} /> Save Template</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <div key={template.id} className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600">
                <FileText size={20} />
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleEdit(template)} className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-all"><Edit3 size={16} /></button>
                <button onClick={() => handleDelete(template.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"><Trash2 size={16} /></button>
              </div>
            </div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-1">{template.name}</h3>
            <p className="text-[9px] font-black text-sky-500 uppercase tracking-widest mb-4">{template.category}</p>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <pre className="text-[10px] text-slate-600 font-medium whitespace-pre-wrap leading-tight">{template.content}</pre>
            </div>
          </div>
        ))}
        {templates.length === 0 && !showForm && (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 rounded-[40px]">
            <FileStack size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-[0.4em]">No templates defined</p>
          </div>
        )}
      </div>

      <TransactionOverlay status={txStatus} message={txMsg} onClose={() => setTxStatus('idle')} />
    </div>
  );
};
