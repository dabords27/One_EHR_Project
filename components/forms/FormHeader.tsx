
import React from 'react';

interface FormHeaderProps {
  formTitle: string;
  documentCode: string;
}

export const FormHeader: React.FC<FormHeaderProps> = ({ formTitle, documentCode }) => {
  return (
    <div className="flex justify-between items-start mb-6">
      <div className="w-20 h-20 border-2 border-slate-900 flex items-center justify-center font-black text-[10px] uppercase text-center p-1">
        HOSPITAL LOGO
      </div>
      <div className="flex-1 text-center px-4">
        <h1 className="text-xl font-black uppercase leading-tight text-slate-900">Julius K. Quiambao</h1>
        <p className="text-[11px] font-bold uppercase text-slate-700">Medical & Wellness Center Inc.</p>
        <div className="mt-4 border-t-2 border-slate-900 pt-2">
          <p className="text-[11px] font-black uppercase text-slate-900">Delivery & Labor Suite</p>
          <h2 className="text-xs font-black uppercase tracking-[0.1em] mt-0.5 text-slate-800">{formTitle}</h2>
        </div>
      </div>
      <div className="w-24 text-right">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{documentCode}</p>
      </div>
    </div>
  );
};
