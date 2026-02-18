
import React from 'react';
import { LogOut, X, AlertTriangle } from 'lucide-react';

interface SignOutModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const SignOutModal: React.FC<SignOutModalProps> = ({ isOpen, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-white p-10 rounded-[40px] shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-300 relative border border-slate-100">
        <button 
          onClick={onCancel}
          className="absolute right-8 top-8 text-slate-300 hover:text-slate-600 transition-colors"
        >
          <X size={24} />
        </button>

        <div className="bg-rose-50 w-20 h-20 rounded-[28px] flex items-center justify-center text-rose-500 mx-auto mb-8 shadow-inner ring-4 ring-rose-50/50">
          <LogOut size={36} strokeWidth={2.5} />
        </div>

        <div className="text-center space-y-3 mb-10">
          <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">Terminate Session</h4>
          <p className="text-slate-500 text-sm font-medium leading-relaxed">
            You are about to sign out of the <span className="font-black text-slate-800 uppercase tracking-tight">ONE EHR</span> clinical environment. All unsaved changes in active forms will be lost.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button 
            onClick={onConfirm}
            className="w-full py-5 bg-slate-900 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl hover:bg-black transition-all shadow-xl shadow-slate-200 active:scale-[0.98] flex items-center justify-center gap-3"
          >
            Confirm Sign Out
          </button>
          <button 
            onClick={onCancel}
            className="w-full py-5 bg-slate-50 text-slate-400 font-black text-xs uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-100 transition-all active:scale-[0.98]"
          >
            Cancel
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">
            Jayvee Palisoc Secure System Auth
          </p>
        </div>
      </div>
    </div>
  );
};
