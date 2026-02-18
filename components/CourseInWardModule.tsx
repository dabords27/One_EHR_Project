
import React, { useState, useRef, useEffect } from 'react';
import { 
  Stethoscope, 
  Minus, 
  X, 
  Clock, 
  Maximize2, 
  Minimize2, 
  GripHorizontal,
  Calendar,
  History,
  Info
} from 'lucide-react';
import { Patient, User } from '../types';

interface CourseInWardModuleProps {
  patient: Patient;
  user: User;
  onClose: () => void;
}

export const CourseInWardModule: React.FC<CourseInWardModuleProps> = ({ patient, user, onClose }) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  
  // Local state only, no persistence logic as per "No CRUD" requirement
  const [dateTime, setDateTime] = useState(new Date().toISOString().slice(0, 16));
  const [content, setContent] = useState('');

  // Position adjusted to clear the sidebar (approx 256px wide) to avoid blocking Sign Out
  const [position, setPosition] = useState({ x: 280, y: window.innerHeight - 660 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMaximized) return;
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

  const patientFullName = `${patient.last_name}, ${patient.first_name} ${patient.middle_name || ''} ${patient.extension || ''}`.trim().toUpperCase();

  if (isMinimized) {
    return (
      <div 
        style={{ left: `${position.x}px`, top: `${window.innerHeight - 80}px` }}
        className="fixed z-[999] w-80 bg-slate-800 text-white rounded-t-2xl shadow-2xl flex items-center justify-between px-4 py-3 cursor-pointer border border-white/10"
        onClick={() => setIsMinimized(false)}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
            <Stethoscope size={16} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-tight truncate">
            Course in the ward: {patient.last_name}
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
    <div 
      style={moduleStyle}
      className={`fixed z-[999] bg-white rounded-[40px] shadow-[0_48px_120px_-24px_rgba(0,0,0,0.3)] flex flex-col border border-slate-200 overflow-hidden transition-all duration-500 ease-out`}
    >
      {/* Header - Drag Handle */}
      <div 
        onMouseDown={handleMouseDown}
        className={`bg-slate-800 p-5 flex items-center justify-between transition-colors ${isMaximized ? 'cursor-default' : 'cursor-grab active:cursor-grabbing hover:bg-slate-700'}`}
      >
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="w-12 h-12 rounded-[20px] bg-emerald-600 flex items-center justify-center text-white shadow-xl flex-shrink-0">
            <Stethoscope size={24} strokeWidth={2.5} />
          </div>
          <div className="truncate">
            <div className="flex items-center gap-2">
               {!isMaximized && <GripHorizontal size={14} className="text-slate-500" />}
               <h3 className="text-white text-xs font-black uppercase tracking-tight leading-none">Course in the ward</h3>
            </div>
            <p className="text-emerald-400 text-[11px] font-black uppercase tracking-[0.1em] mt-1 truncate">{patientFullName}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setIsMaximized(!isMaximized)} className="p-2.5 text-slate-400 hover:text-white rounded-xl transition-all">
            {isMaximized ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
          <button onClick={() => setIsMinimized(true)} className="p-2.5 text-slate-400 hover:text-white rounded-xl transition-all"><Minus size={20} /></button>
          <button onClick={onClose} className="p-2.5 text-slate-400 hover:text-rose-400 rounded-xl transition-all"><X size={20} /></button>
        </div>
      </div>

      {/* Display Area - Static Placeholder UI */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 custom-scrollbar">
        <div className="flex flex-col items-center justify-center py-10 opacity-30 text-slate-400">
          <History size={48} className="mb-2" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em]">Historical Course Timeline</p>
        </div>

        {/* Mock entries to demonstrate UI */}
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
             <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter flex items-center gap-1">
                  <Clock size={10} /> 02/13/2026 10:45 AM
                </span>
                <span className="text-[9px] font-black text-emerald-600 uppercase bg-emerald-50 px-2 py-0.5 rounded">Admission Note</span>
             </div>
             <p className="text-xs font-medium text-slate-700 leading-relaxed italic">
               "Patient admitted to ward. Vital signs stable. Initial assessment completed. Continuing prescribed labor monitoring protocol."
             </p>
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="p-6 bg-white border-t border-slate-100 shadow-inner space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 space-y-1">
            <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest pl-1 flex items-center gap-1">
              <Calendar size={10} /> Clinical Date & Time Entry
            </label>
            <input 
              type="datetime-local" 
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest pl-1">Course Observations / Ward Notes</label>
          <textarea 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type clinical progress, modifications in treatment, or ward observations here..."
            className="w-full bg-slate-50 border border-slate-200 rounded-[24px] p-5 text-sm font-medium focus:ring-8 focus:ring-emerald-500/5 focus:bg-white focus:border-emerald-300 transition-all outline-none resize-none h-32 custom-scrollbar"
          />
        </div>

        <div className="flex gap-4">
          <button 
            className="flex-1 py-4 bg-slate-100 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl cursor-not-allowed flex items-center justify-center gap-2"
            disabled
            title="Logic disabled in UI-only version"
          >
            Draft Entry
          </button>
          <button 
            className="flex-[1.2] py-4 bg-emerald-600 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl opacity-50 cursor-not-allowed flex items-center justify-center gap-2"
            disabled
            title="Logic disabled in UI-only version"
          >
            Finalize Ward Note
          </button>
        </div>
        
        <div className="flex items-center justify-center gap-2 px-3 py-1 bg-amber-50 rounded-lg text-amber-600 border border-amber-100">
          <Info size={12} />
          <p className="text-[9px] font-black uppercase tracking-tight">UI Preview Mode: Functional logic not implemented</p>
        </div>
      </div>
    </div>
  );
};
