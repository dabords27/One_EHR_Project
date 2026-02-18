
import React from 'react';
import { 
  Baby, 
  Stethoscope, 
  Activity, 
  Syringe, 
  Building2,
  ChevronRight,
  LogOut,
  Sparkles
} from 'lucide-react';
import { Department } from '../types';

interface ModuleSelectionProps {
  userName: string;
  onSelectDepartment: (dept: Department) => void;
  onLogout: () => void;
}

const DEPARTMENTS: { name: Department; icon: React.ReactNode; color: string; desc: string }[] = [
  { 
    name: 'Delivery & Labor Suite', 
    icon: <Baby size={32} />, 
    color: 'bg-blue-50 text-blue-600',
    desc: 'Operative Technique & Patient Assessment for Maternity' 
  },
  { 
    name: 'Emergency Room', 
    icon: <Activity size={32} />, 
    color: 'bg-rose-50 text-rose-600',
    desc: 'Acute Care & Emergency Clinical Recording' 
  },
  { 
    name: 'Pediatrics', 
    icon: <Stethoscope size={32} />, 
    color: 'bg-emerald-50 text-emerald-600',
    desc: 'Childhood Medical Records & Developmental Tracking' 
  },
  { 
    name: 'Surgery', 
    icon: <Syringe size={32} />, 
    color: 'bg-amber-50 text-amber-600',
    desc: 'Pre-operative & Post-operative Clinical Notes' 
  }
];

export const ModuleSelection: React.FC<ModuleSelectionProps> = ({ userName, onSelectDepartment, onLogout }) => {
  const aiBackground = sessionStorage.getItem('ai_login_bg');

  return (
    <div className="min-h-screen bg-[#f0f5fa] flex flex-col p-6 md:p-12 relative overflow-hidden">
      {/* Subtle AI Background Overlay */}
      {aiBackground && (
        <div 
          className="absolute inset-0 opacity-[0.03] grayscale pointer-events-none"
          style={{
            backgroundImage: `url(${aiBackground})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      )}

      <div className="max-w-6xl w-full mx-auto relative z-10">
        <header className="flex justify-between items-center mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={16} className="text-sky-500" />
              <span className="text-[10px] font-black text-sky-500 uppercase tracking-[0.3em]">Next-Gen Clinical Interface</span>
            </div>
            <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Welcome, {userName}</h2>
            <p className="text-slate-500 font-medium">Select a department module to begin clinical encoding</p>
          </div>
          <button 
            onClick={onLogout}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-slate-600 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {DEPARTMENTS.map((dept, idx) => (
            <button
              key={dept.name}
              onClick={() => onSelectDepartment(dept.name)}
              className="group bg-white/90 backdrop-blur-sm p-8 rounded-[32px] border border-white hover:border-sky-300 hover:shadow-2xl transition-all text-left flex flex-col min-h-[320px] animate-in fade-in zoom-in-95 duration-500"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className={`${dept.color} w-16 h-16 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-sm`}>
                {dept.icon}
              </div>
              <h3 className="text-xl font-black text-slate-800 uppercase leading-tight mb-3 tracking-tighter">{dept.name}</h3>
              <p className="text-sm text-slate-500 font-medium mb-8 flex-1 leading-relaxed">{dept.desc}</p>
              <div className="flex items-center gap-2 text-slate-400 group-hover:text-sky-600 font-black text-[10px] uppercase tracking-widest transition-colors">
                Enter Module <ChevronRight size={14} />
              </div>
            </button>
          ))}
        </div>

        <footer className="mt-20 text-center text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] border-t border-slate-200 pt-8">
          ONE EHR • ELECTRONIC HEALTH RECORD SYSTEM v1.0.4
        </footer>
      </div>
    </div>
  );
};
