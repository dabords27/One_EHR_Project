import { Eye, EyeOff } from "lucide-react";
import React, { useState } from 'react';

interface AuthModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onClose: () => void;
  onConfirm: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  currentUsername,
  onVerified,
  onClose
}) => {

  const [username, setUsername] = useState(currentUsername);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
const [showPassword, setShowPassword] = useState(false);
  const handleVerify = async () => {

    if (!username || !password) {
      setError('Username and password are required');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message);
        setPassword('');
        setLoading(false);
        return;
      }

      setLoading(false);
      onVerified(data.user);

    } catch (err) {
      setLoading(false);
      setError('Authentication failed');
      setPassword('');
    }
  };

return (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[15000]">

    <div className="w-[420px] rounded-[28px] bg-gradient-to-br from-[#0f1c2f] to-[#0b1626] p-8 shadow-2xl border border-white/10">

      {/* TITLE */}
      <div className="mb-8 text-center">
        <p className="text-[11px] tracking-[0.35em] text-white/40 font-semibold">
          USER AUTHENTICATION
        </p>
      </div>

      {/* USERNAME */}
      <div className="mb-6">
        <label className="text-[10px] tracking-[0.3em] text-white/40 font-semibold block mb-3">
          USERNAME
        </label>

        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 14s-1-2-4-2-4 2-4 2"/>
              <circle cx="8" cy="6" r="3"/>
            </svg>
          </span>

          <input
            autoComplete="off"
            name="auth-username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-full pl-12 pr-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 transition"
          />
        </div>
      </div>

{/* PASSWORD */}
<div className="mb-6">
  <label className="text-[10px] tracking-[0.3em] text-white/40 font-semibold block mb-3">
    PASSWORD
  </label>

  <div className="relative">
    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="7" width="10" height="7" rx="2"/>
        <path d="M6 7V5a2 2 0 1 1 4 0v2"/>
      </svg>
    </span>

    <input
      autoComplete="new-password"
      name="auth-password"
      type={showPassword ? "text" : "password"}
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") handleVerify();
      }}
      className="w-full bg-white/5 border border-white/10 rounded-full pl-12 pr-12 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 transition"
    />

    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition"
    >
      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  </div>
</div>

      {/* ERROR */}
      {error && (
        <p className="text-[11px] tracking-[0.35em] font-small uppercase text-red-400 text-center mb-4">
  {error}
</p>
      )}

      {/* ACTIONS */}
      <div className="flex gap-4 mt-2">
        <button
          onClick={onClose}
          disabled={loading}
          className="flex-1 py-3 rounded-full text-xs font-semibold tracking-widest text-white/50 border border-white/10 hover:bg-white/5 transition"
        >
          CANCEL
        </button>

        <button
          onClick={handleVerify}
          disabled={loading}
          className="flex-1 py-3 rounded-full text-xs font-semibold tracking-widest bg-sky-500 hover:bg-sky-400 text-white transition disabled:opacity-50"
        >
          {loading ? "VERIFYING..." : "VERIFY & CONTINUE"}
        </button>
      </div>

    </div>
  </div>
);
};