import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Patient } from '../types';

interface Props {
  patient: Patient;
  onBack: () => void;
}

export const ClinicalFormSelection: React.FC<Props> = ({
  patient,
  onBack
}) => {

  const fullName = `${patient.last_name}, ${patient.first_name} ${patient.middle_name || ''} ${patient.extension || ''}`
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();

  return (
    <div className="max-w-6xl mx-auto pb-24 animate-in fade-in duration-700">

      {/* HEADER */}
      <div className="sticky top-[72px] z-40 bg-[#f8fafc]/95 backdrop-blur-sm py-4 mb-10 border-b border-slate-200 flex items-center gap-4 px-2">

        <button
          onClick={onBack}
          className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-slate-800 rounded-xl shadow-sm"
        >
          <ArrowLeft size={20} />
        </button>

        <div>
          <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">
            Select Clinical Form
          </h2>

          <p className="text-[11px] font-black text-sky-700 uppercase tracking-widest mt-1">
            {fullName}
          </p>
        </div>

      </div>

      {/* BODY PLACEHOLDER */}
      <div className="bg-white border-2 border-slate-900 shadow-2xl p-10 min-h-[600px] flex items-center justify-center">

        <p className="text-sm text-slate-400 font-bold uppercase tracking-wider">
          Form configuration under development
        </p>

      </div>

    </div>
  );
};