import { Eye, EyeOff } from 'lucide-react';
import React, { useState } from 'react';
import { User as UserIcon, Lock, ChevronRight, Activity, Sparkles } from 'lucide-react';
import { User, UserRole } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
}

// Professional static design constants
const STATIC_BG = 'radial-gradient(circle at top right, #0f172a, #020617)';
const ACCENT_GRADIENT = 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)';

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');

 try {
  const res = await fetch(
    `${import.meta.env.VITE_API_URL}/api/auth/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ username, password })
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Login failed");
  }

  const user: User = {
    ...data,
    profileImage: data.photo || null
  };

  localStorage.setItem("ehr_user", JSON.stringify(user));

  if (user.defaultDepartment) {
    localStorage.setItem("activeDept", user.defaultDepartment);
  }

  onLogin(user);

} catch (err: any) {
  setError(err.message);
}
};

const [showPassword, setShowPassword] = useState(false);


  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] p-4 relative overflow-hidden">
      {/* High-fidelity static background */}
      <div 
        className="absolute inset-0 opacity-40"
        style={{ background: STATIC_BG }}
      />
      
      {/* Decorative medical grid overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} 
      />

      <div className="max-w-md w-full animate-in zoom-in-95 duration-700 relative z-10">
        <div className="bg-[#0f172a]/95 backdrop-blur-3xl rounded-[48px] shadow-[0_32px_120px_-20px_rgba(0,163,255,0.15)] overflow-hidden border border-white/5 flex flex-col min-h-[720px]">
          {/* Brand Header */}
          <div className="pt-16 pb-10 text-center relative flex flex-col items-center border-b border-white/5 bg-white/[0.01]">
            <div className="w-24 h-24 bg-white rounded-[32px] shadow-2xl flex items-center justify-center mb-10 relative z-10 border border-white/10 p-0.5 transition-transform hover:scale-105 active:scale-95 duration-500 cursor-pointer shadow-sky-500/10">
              <div className="w-full h-full rounded-[28px] bg-slate-900 flex items-center justify-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-sky-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <Activity className="text-sky-400 relative z-10" size={40} strokeWidth={2.5} />
              </div>
            </div>
            
            <div className="relative z-10 flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={12} className="text-sky-400" />
                <span className="text-[9px] font-black text-sky-400 uppercase tracking-[0.4em]">Integrated Platform</span>
              </div>
              <h1 className="text-4xl font-black text-white tracking-tighter leading-none uppercase">
                ONE EHR
              </h1>
              <span className="text-slate-500 text-[10px] tracking-[0.5em] font-black uppercase drop-shadow-sm">
                HEALTH RECORD SYSTEM
              </span>
            </div>
          </div>
          
          <div className="px-12 pb-14 pt-10 space-y-10 flex-1 flex flex-col">
            <div className="text-center">
              <p className="text-slate-500 font-black uppercase text-[10px] tracking-[0.4em]">Login Authentication</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-8 flex-1">
              {/* Username Field */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-2">Username</label>
                <div className="relative group">
                  <UserIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-sky-400 transition-colors" size={18} />
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-16 pr-6 py-5 bg-white/[0.03] border border-white/10 rounded-[28px] focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:bg-white/[0.07] transition-all font-bold text-white placeholder:text-slate-600 shadow-inner"
                    placeholder="Username"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-3">
  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-2">
    Password
  </label>

  <div className="relative group">
    <Lock
      className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-sky-400 transition-colors"
      size={18}
    />

    <input
      type={showPassword ? "text" : "password"}   // 👈 toggle here
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      className="w-full pl-16 pr-14 py-5 bg-white/[0.03] border border-white/10 rounded-[28px] focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:bg-white/[0.07] transition-all font-bold text-white placeholder:text-slate-600 shadow-inner"
      placeholder="••••••••"
      required
    />

    {/* 👁 Eye Toggle Button */}
    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-500 hover:text-sky-400 transition-colors"
    >
      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
    </button>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-rose-500/10 text-rose-400 rounded-[24px] text-[10px] font-black text-center border border-rose-500/20 animate-in shake duration-500 uppercase tracking-widest">
                  {error}
                </div>
              )}

              {/* Login Button */}
              <button 
                type="submit"
                className="w-full py-6 bg-sky-600 hover:bg-sky-500 text-white font-black rounded-[28px] shadow-[0_20px_50px_-10px_rgba(2,132,199,0.5)] flex items-center justify-center gap-3 transition-all active:scale-[0.97] hover:-translate-y-0.5 mt-4 uppercase text-[12px] tracking-[0.25em]"
              >
                ACCESS SYSTEM
                <ChevronRight size={20} strokeWidth={3} />
              </button>
            </form>
            
            {/* Footer */}
            <div className="pt-10 text-center border-t border-white/5">
              <p className="text-[9px] text-slate-600 font-black uppercase tracking-[0.4em] leading-relaxed">
                @2026 ONE EHR v.1.0<br/>
                <span className="text-sky-400/40">SECURE CLINICAL ENVIRONMENT</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
