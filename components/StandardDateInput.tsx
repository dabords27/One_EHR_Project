
import React from 'react';
import { Calendar } from 'lucide-react';

interface StandardDateInputProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  required?: boolean;
}

export const StandardDateInput: React.FC<StandardDateInputProps> = ({ 
  label, 
  name, 
  value, 
  onChange, 
  className = "",
  required = false
}) => {
  return (
    <div className={`space-y-1 ${className}`}>
      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
        {label}
      </label>
      <div className="relative group">
        <input 
          type="date" 
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-bold uppercase outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all group-hover:border-slate-400"
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300 group-hover:text-blue-500 transition-colors">
          <Calendar size={16} />
        </div>
      </div>
    </div>
  );
};
