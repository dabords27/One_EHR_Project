
import React, { useState } from 'react';
import { ShieldCheck, X, Eye, EyeOff, Lock, User as UserIcon } from 'lucide-react';
import { User } from '../types';

interface CredentialConfirmationModalProps {
  isOpen: boolean;
  onConfirm: (password: string) => void;
  onCancel: () => void;
  user: User;
  title?: string;
  description?: string;
}

export const CredentialConfirmationModal: React.FC<CredentialConfirmationModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  user,
  title = "Authenticate Transaction",
  description = "Electronic signature required. Please provide your clinical password to finalize this medical record."
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError("AUTHENTICATION FAILED: PASSWORD REQUIRED");
      return;
    }
    onConfirm(password);
    setPassword('');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-4 animate-in fade-in duration-300">
      <div className="bg-white p-10 rounded-[40px] shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-300 relative border border-slate-100 overflow-hidden">
        {/* Security bar */}
        <div className="absolute top-0 left-0 w-full h-2 bg-sky-600"></div>

        <button onClick={onCancel} className="absolute right-8 top-8 text-slate-300 hover:text-slate-600 transition-colors">
          <X size={24} />
        </button>

        <div className="bg-sky-50 w-24 h-24 rounded-[32px] flex items-center justify-center text-sky-600 mx-auto mb-8 shadow-inner ring-4 ring-sky-50/50">
          <ShieldCheck size={48} strokeWidth={2.5} />
        </div>

        <div className="text-center space-y-4 mb-10">
          <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">{title}</h4>
          <p className="text-slate-500 text-sm font-medium leading-relaxed px-2">{description}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
             <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white flex-shrink-0 shadow-lg">
                <UserIcon size={18} />
             </div>
             <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Practitioner</p>
                <p className="text-sm font-black text-slate-800 uppercase tracking-tight leading-none">{user.fullName}</p>
             </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider pl-1">Electronic Credential</label>
            <div className="relative group">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type={showPassword ? "text" : "password"}
                autoFocus
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                placeholder="Enter clinical password"
                className={`w-full bg-white border ${error ? 'border-rose-500 ring-2 ring-rose-100' : 'border-slate-300'} rounded-2xl pl-14 pr-12 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-sky-500/10 transition-all`}
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-sky-600 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {error && <p className="text-[10px] text-rose-500 font-black uppercase tracking-widest pl-1">{error}</p>}
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <button 
              type="submit"
              className="w-full py-5 bg-slate-900 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl hover:bg-black transition-all shadow-xl shadow-slate-200 active:scale-[0.98] flex items-center justify-center gap-3"
            >
              Sign & Finalize
            </button>
            <button 
              type="button"
              onClick={onCancel}
              className="w-full py-5 bg-slate-50 text-slate-400 font-black text-xs uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-100 transition-all active:scale-[0.98]"
            >
              Abort Transaction
            </button>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center opacity-40">
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em]">
            E-Signature Protocol v2.1 • OneEHR Secure System
          </p>
        </div>
      </div>
    </div>
  );
};
