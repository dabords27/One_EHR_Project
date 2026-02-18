
import React from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Activity,
  Database,
  ShieldCheck
} from 'lucide-react';

export type TransactionStatus = 'idle' | 'loading' | 'success' | 'error';

interface TransactionOverlayProps {
  status: TransactionStatus;
  message?: string;
  errorDetails?: string;
  onClose?: () => void;
}

export const TransactionOverlay: React.FC<TransactionOverlayProps> = ({ 
  status, 
  message, 
  errorDetails,
  onClose 
}) => {
  if (status === 'idle') return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/60 backdrop-blur-xl p-4 animate-in fade-in duration-300">
      <div className="bg-white p-12 rounded-[48px] shadow-2xl max-w-sm w-full animate-in zoom-in-95 duration-300 text-center relative border border-slate-100 overflow-hidden">
        
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-0 w-full h-1.5 overflow-hidden">
          {status === 'loading' && <div className="h-full bg-sky-500 animate-pulse w-full"></div>}
          {status === 'success' && <div className="h-full bg-emerald-500 w-full"></div>}
          {status === 'error' && <div className="h-full bg-rose-500 w-full"></div>}
        </div>

        {/* Content Icons */}
        <div className="mb-8 relative flex justify-center">
          {status === 'loading' && (
            <div className="relative">
              <div className="w-24 h-24 rounded-[32px] bg-sky-50 flex items-center justify-center text-sky-500 animate-pulse">
                <Activity size={48} strokeWidth={2.5} />
              </div>
              <Loader2 className="absolute -top-2 -right-2 text-sky-600 animate-spin" size={32} />
            </div>
          )}

          {status === 'success' && (
            <div className="w-24 h-24 rounded-[32px] bg-emerald-50 flex items-center justify-center text-emerald-500 animate-in zoom-in-50 duration-500">
              <ShieldCheck size={48} strokeWidth={2.5} />
            </div>
          )}

          {status === 'error' && (
            <div className="w-24 h-24 rounded-[32px] bg-rose-50 flex items-center justify-center text-rose-500 animate-in shake duration-500">
              <AlertCircle size={48} strokeWidth={2.5} />
            </div>
          )}
        </div>

        {/* Textual Feedback */}
        <div className="space-y-3">
          <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">
            {status === 'loading' && 'Syncing Data...'}
            {status === 'success' && 'Archived Successfully'}
            {status === 'error' && 'Transaction Failed'}
          </h4>
          <p className="text-slate-500 text-sm font-medium leading-relaxed px-4">
            {message || (status === 'loading' ? 'Encrypting and committing clinical records to secure repository.' : '')}
          </p>
          {errorDetails && (
            <p className="text-rose-500 text-[10px] font-black uppercase bg-rose-50 p-2 rounded-xl border border-rose-100 mt-4">
              {errorDetails}
            </p>
          )}
        </div>

        {/* Action Button (Error only) */}
        {status === 'error' && onClose && (
          <button 
            onClick={onClose}
            className="mt-8 w-full py-4 bg-slate-900 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl hover:bg-black transition-all active:scale-95"
          >
            Acknowledge & Close
          </button>
        )}

        {/* Footer Identity */}
        <div className="mt-10 pt-6 border-t border-slate-50 flex items-center justify-center gap-2">
          <Database size={12} className="text-slate-300" />
          <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">
            ONE EHR Secure Transaction
          </p>
        </div>
      </div>
    </div>
  );
};
