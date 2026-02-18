
import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Minus, 
  X, 
  Send, 
  Clock, 
  ShieldCheck, 
  FileEdit,
  Filter,
  CheckCircle,
  AlertCircle,
  Maximize2,
  Minimize2,
  Edit2,
  ChevronUp,
  GripHorizontal,
  Info,
  FileStack,
  ChevronDown
} from 'lucide-react';
import { Patient, User, ProgressNote, NoteStatus, AuditLog, UserRole, NoteTemplate } from '../types';
import { CredentialConfirmationModal } from './CredentialConfirmationModal';

interface ProgressNotesModuleProps {
  patient: Patient;
  user: User;
  onClose: () => void;
}

const DEFAULT_NOTE_TEMPLATES: NoteTemplate[] = [
  { id: '1', name: 'NURSE FDAR', content: 'F - FOCUS:\nD - DATA:\nA - ACTION:\nR - RESPONSE:', category: 'NURSING' },
  { id: '2', name: 'PHYSICIAN SOAP', content: 'S - SUBJECTIVE:\nO - OBJECTIVE:\nA - ASSESSMENT:\nP - PLAN:', category: 'CLINICAL' }
];

export const ProgressNotesModule: React.FC<ProgressNotesModuleProps> = ({ patient, user, onClose }) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [notes, setNotes] = useState<ProgressNote[]>([]);
  const [filter, setFilter] = useState<'All' | NoteStatus>('All');
  const [currentNote, setCurrentNote] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);
  const [availableTemplates, setAvailableTemplates] = useState<NoteTemplate[]>([]);
  
  // Draggable state with viewport bounds
  const [position, setPosition] = useState({ x: window.innerWidth - 460, y: window.innerHeight - 660 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  
  const [showCredentialModal, setShowCredentialModal] = useState(false);
  const [pendingNoteAction, setPendingNoteAction] = useState<{ content: string; status: NoteStatus; id?: string } | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Load existing notes for this patient
    const savedNotes = JSON.parse(localStorage.getItem(`progress_notes_${patient.mrn}`) || '[]');
    setNotes(savedNotes);

    // Load templates: Fallback to defaults if none exist in localStorage
    const savedTemplates = localStorage.getItem('progress_note_templates');
    if (savedTemplates) {
      setAvailableTemplates(JSON.parse(savedTemplates));
    } else {
      setAvailableTemplates(DEFAULT_NOTE_TEMPLATES);
    }
  }, [patient.mrn]);

  useEffect(() => {
    if (scrollRef.current && !isMinimized) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [notes, isMinimized, filter]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMaximized) return; // Disable dragging in maximized mode
    setIsDragging(true);
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        let newX = e.clientX - dragOffset.current.x;
        let newY = e.clientY - dragOffset.current.y;

        const moduleWidth = 440;
        const moduleHeight = 640;
        newX = Math.max(0, Math.min(newX, window.innerWidth - moduleWidth));
        newY = Math.max(72, Math.min(newY, window.innerHeight - moduleHeight));

        setPosition({ x: newX, y: newY });
      }
    };
    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleLoadDraft = (note: ProgressNote) => {
    if (note.authorId !== user.id) {
      alert("AUTHORSHIP LOCK: Only the practitioner who initiated this draft can modify it.");
      return;
    }
    
    setCurrentNote(note.content);
    setEditingNoteId(note.id);
    setTimeout(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, 100);
  };

  const applyTemplate = (template: NoteTemplate) => {
    setCurrentNote(prev => {
      const prefix = prev.trim() ? prev + '\n\n' : '';
      return prefix + template.content;
    });
    setShowTemplateMenu(false);
    // Use focus after state update to ensure keyboard accessibility
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };

  const initiateSave = (status: NoteStatus) => {
    if (!currentNote.trim()) return;
    setPendingNoteAction({ content: currentNote, status, id: editingNoteId || undefined });
    setShowCredentialModal(true);
  };

  const executeAuthenticatedSave = (password: string) => {
    const staffRegistry = JSON.parse(localStorage.getItem('hospital_staff_users') || '[]');
    const currentUserRegistry = staffRegistry.find((u: any) => u.id === user.id);
    const validPassword = currentUserRegistry ? currentUserRegistry.password : (
      user.username === 'admin' ? 'admin' : 
      user.username === 'doctor' ? 'doctor' : 'nurse'
    );

    if (password !== validPassword) {
      alert("INVALID CLINICAL CREDENTIALS. TRANSACTION ABORTED.");
      return;
    }

    if (!pendingNoteAction) return;

    let updatedNotes;
    if (pendingNoteAction.id) {
      updatedNotes = notes.map(n => n.id === pendingNoteAction.id ? {
        ...n,
        content: pendingNoteAction.content,
        status: pendingNoteAction.status,
        lastModifiedBy: user.fullName,
        lastModifiedAt: new Date().toISOString()
      } : n);
    } else {
      const newNote: ProgressNote = {
        id: Date.now().toString(),
        patientMrn: patient.mrn,
        patientName: `${patient.last_name}, ${patient.first_name} ${patient.middle_name || ''}`,
        admissionDate: patient.date_admitted,
        content: pendingNoteAction.content,
        authorId: user.id,
        authorName: user.fullName,
        authorRole: user.role,
        timestamp: new Date().toISOString(),
        status: pendingNoteAction.status
      };
      updatedNotes = [...notes, newNote];
    }

    setNotes(updatedNotes);
    localStorage.setItem(`progress_notes_${patient.mrn}`, JSON.stringify(updatedNotes));
    
    const log: AuditLog = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      userId: user.id,
      userName: user.fullName,
      action: pendingNoteAction.id ? `UPDATE_NOTE_${pendingNoteAction.status.toUpperCase()}` : `CREATE_NOTE_${pendingNoteAction.status.toUpperCase()}`,
      targetId: pendingNoteAction.id || 'NEW_ENTRY',
      module: 'PROGRESS_NOTES'
    };
    const logs = JSON.parse(localStorage.getItem('clinical_audit_logs') || '[]');
    localStorage.setItem('clinical_audit_logs', JSON.stringify([...logs, log]));

    setCurrentNote('');
    setEditingNoteId(null);
    setPendingNoteAction(null);
    setShowCredentialModal(false);
  };

  const filteredNotes = filter === 'All' ? notes : notes.filter(n => n.status === filter);
  const groupedNotes = filteredNotes.reduce((acc, note) => {
    const dateKey = `${note.admissionDate.split(' ')[0]} - ${note.patientName}`;
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(note);
    return acc;
  }, {} as Record<string, ProgressNote[]>);

  const patientFullName = `${patient.last_name}, ${patient.first_name} ${patient.middle_name || ''} ${patient.extension || ''}`.trim().toUpperCase();

  const formatRegDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    const parts = dateStr.split(' ');
    const datePart = parts[0];
    const timePart = parts.slice(1).join(' ');
    if (!datePart.includes('-')) return dateStr;
    const [y, m, d] = datePart.split('-');
    const shortYear = y.length === 4 ? y.slice(2) : y;
    return `${m}/${d}/${shortYear} ${timePart}`;
  };

  if (isMinimized) {
    return (
      <div 
        style={{ left: `${position.x}px`, top: `${window.innerHeight - 80}px` }}
        className="fixed z-[1000] w-80 bg-slate-900 text-white rounded-t-2xl shadow-2xl flex items-center justify-between px-4 py-3 cursor-pointer border border-white/10"
        onClick={() => setIsMinimized(false)}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center">
            <MessageSquare size={16} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-tight truncate">
            {patient.last_name} Notes
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="p-1 hover:bg-white/10 rounded-md"><X size={14} /></button>
        </div>
      </div>
    );
  }

  const moduleStyle: React.CSSProperties = isMaximized 
    ? { left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: '85vw', height: '85vh', maxWidth: '1200px', maxHeight: '900px' }
    : { left: `${position.x}px`, top: `${position.y}px`, width: '440px', height: '640px' };

  return (
    <>
      <div 
        style={moduleStyle}
        className={`fixed z-[1000] bg-white rounded-[40px] shadow-[0_48px_120px_-24px_rgba(0,0,0,0.4)] flex flex-col border border-slate-200 overflow-hidden animate-in ${isMaximized ? 'zoom-in-95' : 'slide-in-from-bottom-4'} duration-500 transition-[width,height,transform,left,top] ease-out`}
      >
        <div 
          onMouseDown={handleMouseDown}
          className={`bg-slate-900 p-5 flex items-center justify-between transition-colors ${isMaximized ? 'cursor-default' : 'cursor-grab active:cursor-grabbing hover:bg-slate-800'}`}
        >
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="w-12 h-12 rounded-[20px] bg-sky-600 flex items-center justify-center text-white shadow-xl shadow-sky-900/50 flex-shrink-0">
              <MessageSquare size={24} strokeWidth={2.5} />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-2">
                 {!isMaximized && <GripHorizontal size={14} className="text-slate-600" />}
                 <h3 className="text-white text-xs font-black uppercase tracking-tight leading-none">Progress Notes Module</h3>
              </div>
              <div className="flex items-center gap-2 mt-1 truncate">
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm ${patient.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-500'}`} title={patient.status}></span>
                <p className="text-sky-400 text-[11px] font-black uppercase tracking-[0.1em] truncate">{patientFullName}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setIsMaximized(!isMaximized)} 
              className="p-2.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
              title={isMaximized ? "Restore" : "Maximize"}
            >
              {isMaximized ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
            <button onClick={() => setIsMinimized(true)} className="p-2.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all" title="Minimize"><Minus size={20} /></button>
            <button onClick={onClose} className="p-2.5 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-xl transition-all" title="Close"><X size={20} /></button>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shadow-inner">
          <div className="relative group">
             <select 
               value={filter}
               onChange={(e) => setFilter(e.target.value as any)}
               className="bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-[10px] font-black uppercase outline-none focus:ring-4 focus:ring-sky-500/10 shadow-sm appearance-none transition-all cursor-pointer"
             >
               <option value="All">All Transactions</option>
               <option value={NoteStatus.DRAFT}>Pending Drafts</option>
               <option value={NoteStatus.FINALIZED}>Finalized Records</option>
             </select>
             <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-sky-500" size={12} />
          </div>
          <div className="flex items-center gap-2.5 px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-sm">
            <Clock size={12} className="text-sky-500" />
            <span className="text-[10px] font-black text-slate-800 uppercase tracking-tight">REG. DATE & TIME: {formatRegDate(patient.date_admitted)}</span>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-12 bg-slate-50/20 custom-scrollbar">
          {Object.keys(groupedNotes).length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-10 py-20 text-slate-900">
              <FileEdit size={64} className="mb-4" />
              <p className="text-sm font-black uppercase tracking-[0.6em]">No data records</p>
            </div>
          ) : (
            Object.entries(groupedNotes).map(([groupKey, groupNotes]) => (
              <div key={groupKey} className="space-y-8">
                <div className="flex items-center gap-4">
                  <div className="h-px bg-slate-200 flex-1"></div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] bg-slate-50 px-4 py-1.5 rounded-full border border-slate-200 shadow-sm whitespace-nowrap">Session: {groupKey}</span>
                  <div className="h-px bg-slate-200 flex-1"></div>
                </div>
                
                <div className="space-y-8">
                  {groupNotes.map((note) => {
                    const isOwn = note.authorId === user.id;
                    const isDraft = note.status === NoteStatus.DRAFT;
                    const isDoctor = note.authorRole === UserRole.DOCTOR || note.authorRole === 'DOCTOR';
                    const isAdmin = note.authorRole === UserRole.ADMIN || note.authorRole === 'ADMIN';

                    return (
                      <div key={note.id} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} group/msg animate-in fade-in slide-in-from-bottom-2`}>
                        <div className={`max-w-[85%] rounded-[32px] p-5 shadow-lg border transition-all relative ${
                          isOwn 
                            ? 'bg-sky-600 text-white border-sky-700 rounded-tr-none' 
                            : 'bg-slate-200 text-slate-800 border-slate-300 rounded-tl-none'
                        } ${isDraft ? 'opacity-90 border-dashed border-sky-400 shadow-inner' : ''}`}>
                          <p className={`text-[13px] font-medium leading-relaxed whitespace-pre-wrap ${isOwn ? 'text-white' : 'text-slate-800'}`}>{note.content}</p>
                          
                          {isDraft && isOwn && (
                            <div className="mt-4 flex gap-2">
                                <button 
                                  onClick={() => handleLoadDraft(note)}
                                  className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/30 text-[9px] font-black uppercase rounded-xl transition-all border border-white/10"
                                >
                                  <Edit2 size={12} /> Edit & Finalize
                                </button>
                            </div>
                          )}
                        </div>
                        
                        <div className={`mt-2 flex flex-col ${isOwn ? 'items-end' : 'items-start'} gap-1 px-2`}>
                          <div className={`flex items-center gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                            <span className="text-[10px] font-black uppercase text-slate-900 tracking-tight">{note.authorName}</span>
                            <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                              isDoctor ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 
                              isAdmin ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                              'bg-slate-300 text-slate-600 border border-slate-400'
                            }`}>{note.authorRole}</span>
                          </div>
                          <div className={`flex items-center gap-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                              {new Date(note.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg border ${
                              note.status === NoteStatus.FINALIZED 
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                : 'bg-amber-50 text-amber-600 border-amber-100'
                            }`}>
                              {note.status === NoteStatus.FINALIZED ? <ShieldCheck size={10} /> : <AlertCircle size={10} />}
                              <span className="text-[9px] font-black uppercase">{note.status}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-6 bg-white border-t border-slate-100 shadow-[0_-8px_40px_-12px_rgba(0,0,0,0.08)] relative">
          {/* Template Menu Popover */}
          {showTemplateMenu && (
            <div className="absolute bottom-full right-6 mb-4 w-64 bg-white border border-slate-200 rounded-[32px] shadow-[0_24px_80px_-12px_rgba(0,0,0,0.25)] overflow-hidden animate-in slide-in-from-bottom-4 duration-300 z-50">
              <div className="bg-slate-900 px-5 py-3 flex items-center justify-between">
                <span className="text-[10px] font-black text-white uppercase tracking-widest">Select Template</span>
                <button onClick={() => setShowTemplateMenu(false)} className="text-slate-400 hover:text-white transition-colors"><X size={14} /></button>
              </div>
              <div className="max-h-64 overflow-y-auto p-2">
                {availableTemplates.map(t => (
                  <button 
                    key={t.id}
                    onClick={() => applyTemplate(t)}
                    className="w-full p-4 hover:bg-sky-50 text-left rounded-2xl transition-all border border-transparent hover:border-sky-100 group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight">{t.name}</p>
                      <span className="text-[8px] font-black text-sky-500 bg-sky-50 px-1.5 py-0.5 rounded">{t.category}</span>
                    </div>
                    <p className="text-[9px] text-slate-400 font-medium truncate">{t.content.slice(0, 40)}...</p>
                  </button>
                ))}
                {availableTemplates.length === 0 && (
                  <div className="p-8 text-center text-slate-300 font-black uppercase text-[10px]">
                    No Templates Found
                  </div>
                )}
              </div>
            </div>
          )}

          {patient.status === 'Discharged' && (
            <div className="mb-4 flex items-center gap-3 p-3 bg-amber-50 border border-amber-100 rounded-2xl text-amber-700 animate-in fade-in duration-300">
              <Info size={16} className="flex-shrink-0" />
              <p className="text-[10px] font-black uppercase leading-tight tracking-tight">
                Note: This patient is currently DISCHARGED. Updates will be archived as retrospective entries.
              </p>
            </div>
          )}

          {editingNoteId && (
            <div className="absolute -top-10 left-6 flex items-center gap-2 px-3 py-1.5 bg-sky-50 border border-sky-100 rounded-t-xl text-[9px] font-black uppercase text-sky-600 animate-in slide-in-from-bottom-2">
              <Edit2 size={10} /> Currently Editing Draft ID: {editingNoteId.slice(-4)}
              <button onClick={() => { setEditingNoteId(null); setCurrentNote(''); }} className="ml-2 hover:text-rose-500"><X size={10} /></button>
            </div>
          )}
          
          <div className="relative">
            <textarea 
              ref={textareaRef}
              value={currentNote}
              onChange={(e) => setCurrentNote(e.target.value)}
              placeholder="Enter clinical observations or nursing notes..."
              className="w-full bg-slate-50 border border-slate-200 rounded-[28px] p-5 pt-12 text-sm font-medium focus:ring-8 focus:ring-sky-500/5 focus:bg-white focus:border-sky-300 transition-all outline-none resize-none h-44 mb-4 custom-scrollbar"
            />
            {/* Toolbar Inside Textarea */}
            <div className="absolute top-4 left-5 right-5 flex items-center justify-between pointer-events-none">
              <div className="flex items-center gap-2 text-[8px] font-black text-slate-300 uppercase tracking-widest">
                Clinical Structure Ready
              </div>
              <button 
                onClick={(e) => { e.preventDefault(); setShowTemplateMenu(!showTemplateMenu); }}
                className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[9px] font-black uppercase text-slate-600 hover:text-sky-600 hover:border-sky-300 transition-all shadow-sm group"
              >
                <FileStack size={12} className="text-sky-500 group-hover:scale-110 transition-transform" />
                Choose Template
                <ChevronDown size={10} className="text-slate-300" />
              </button>
            </div>
          </div>

          <div className="flex gap-4">
            <button 
              disabled={!currentNote.trim()}
              onClick={() => initiateSave(NoteStatus.DRAFT)}
              className="flex-1 py-4 bg-slate-100 text-slate-600 font-black text-[10px] uppercase tracking-[0.25em] rounded-2xl hover:bg-slate-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2 group"
            >
              Save as Draft
            </button>
            <button 
              disabled={!currentNote.trim()}
              onClick={() => initiateSave(NoteStatus.FINALIZED)}
              className="flex-[1.2] py-4 bg-slate-900 text-white font-black text-[10px] uppercase tracking-[0.25em] rounded-2xl hover:bg-black transition-all shadow-2xl shadow-slate-300 disabled:opacity-50 flex items-center justify-center gap-3 active:scale-95"
            >
              Finalize Note <Send size={14} strokeWidth={2.5} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      <CredentialConfirmationModal 
        isOpen={showCredentialModal}
        user={user}
        onConfirm={executeAuthenticatedSave}
        onCancel={() => { setShowCredentialModal(false); setPendingNoteAction(null); }}
        title={pendingNoteAction?.id ? "Authenticate Draft Finalization" : "Authenticate Clinical Entry"}
        description={pendingNoteAction?.status === NoteStatus.FINALIZED 
          ? "This action will permanently commit the record to the patient's medical history archive. Electronic signature required."
          : "Securely saving your draft notes. You may continue editing this entry later."}
      />
    </>
  );
};
