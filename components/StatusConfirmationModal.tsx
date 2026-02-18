
import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface StatusConfirmationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  targetName: string;
  isActivating: boolean;
}

export const StatusConfirmationModal: React.FC<StatusConfirmationModalProps> = ({ 
  isOpen, 
  onConfirm, 
  onCancel, 
  title, 
  targetName, 
  isActivating 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-white p-10 rounded-[40px] shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-300 relative border border-slate-100">
        <button 
          onClick={onCancel}
          className="absolute right-8 top-8 text-slate-300 hover:text-slate-600 transition-colors"
        >
          <X size={24} />
        </button>

        <div className={`w-20 h-20 rounded-[28px] flex items-center justify-center mx-auto mb-8 shadow-inner ring-4 ${
          isActivating ? 'bg-emerald-50 text-emerald-500 ring-emerald-50/50' : 'bg-amber-50 text-amber-500 ring-amber-50/50'
        }`}>
          <AlertTriangle size={36} strokeWidth={2.5} />
        </div>

        <div className="text-center space-y-3 mb-10">
          <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">
            {isActivating ? 'Confirm Activation' : 'Confirm Deactivation'}
          </h4>
          <p className="text-slate-500 text-sm font-medium leading-relaxed">
            Are you sure you want to {isActivating ? 'ACTIVATE' : 'DEACTIVATE'} <span className="font-black text-slate-800">{targetName}</span>? 
            {isActivating ? ' This will restore access to this resource.' : ' This resource will be hidden from active clinical selections but retained in archives.'}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button 
            onClick={onConfirm}
            className={`w-full py-5 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl active:scale-[0.98] ${
              isActivating ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100' : 'bg-slate-900 hover:bg-black shadow-slate-100'
            }`}
          >
            {isActivating ? 'Proceed with Activation' : 'Proceed with Deactivation'}
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
            Access Governance & Control
          </p>
        </div>
      </div>
    </div>
  );
};
