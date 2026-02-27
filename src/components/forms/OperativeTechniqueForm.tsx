
import React from 'react';
import { FormHeader } from './FormHeader';

interface OperativeTechniqueFormProps {
  formData: any;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

const Mandatory = () => <span className="text-rose-500 ml-0.5">*</span>;

export const OperativeTechniqueForm: React.FC<OperativeTechniqueFormProps> = ({ formData, onInputChange }) => {
  return (
    <div className="flex-1 space-y-6">
      <FormHeader 
        formTitle="Operative Technique Form" 
        documentCode="JKQ-MED-OTF-DLS-017" 
      />

      {/* Diagnosis Section */}
      <div className="grid grid-cols-1 border-2 border-slate-900">
        <div className="p-4 border-b-2 border-slate-900">
          <label className="text-[10px] font-black uppercase text-slate-500 mb-2 block">Pre-Operative Diagnosis <Mandatory /></label>
          <textarea
            name="pre_operative_diagnosis"
            value={formData.pre_operative_diagnosis || ''}
            onChange={onInputChange}
            className="w-full bg-transparent outline-none font-bold text-sm uppercase resize-none h-20"
            placeholder="Enter diagnosis..."
          />
        </div>
        <div className="p-4">
          <label className="text-[10px] font-black uppercase text-slate-500 mb-2 block">Post-Operative Diagnosis <Mandatory /></label>
          <textarea
            name="post_operative_diagnosis"
            value={formData.post_operative_diagnosis || ''}
            onChange={onInputChange}
            className="w-full bg-transparent outline-none font-bold text-sm uppercase resize-none h-20"
            placeholder="Enter diagnosis..."
          />
        </div>
      </div>

      {/* Main Technique & Findings */}
      <div className="border-2 border-slate-900 min-h-[400px]">
        <div className="p-4 border-b-2 border-slate-900 h-[300px] flex flex-col">
          <label className="text-[10px] font-black uppercase text-slate-500 mb-2 block">Operative Technique <Mandatory /></label>
          <textarea
            name="technique"
            value={formData.technique || ''}
            onChange={onInputChange}
            className="w-full flex-1 bg-transparent outline-none font-medium text-sm leading-relaxed"
            placeholder="Describe the surgical procedure step-by-step..."
          />
        </div>
        <div className="p-4 h-[150px] flex flex-col">
          <label className="text-[10px] font-black uppercase text-slate-500 mb-2 block">Operative Findings</label>
          <textarea
            name="operative_findings"
            value={formData.operative_findings || ''}
            onChange={onInputChange}
            className="w-full flex-1 bg-transparent outline-none font-bold text-sm uppercase leading-relaxed"
            placeholder="Describe findings..."
          />
        </div>
      </div>

      {/* Monitoring Section */}
      <div className="grid grid-cols-2 border-2 border-slate-900">
        <div className="p-4 border-r-2 border-slate-900">
          <p className="text-[10px] font-black uppercase text-slate-500 mb-3">Reportable Events</p>
          <div className="flex gap-6">
            <label className="flex items-center gap-2.5 text-[11px] font-bold uppercase cursor-pointer">
              <input type="radio" name="reportable_events" value="true" onChange={onInputChange} checked={formData.reportable_events === 'true'} className="square-check" /> 
              With Reportable Events
            </label>
            <label className="flex items-center gap-2.5 text-[11px] font-bold uppercase cursor-pointer">
              <input type="radio" name="reportable_events" value="false" onChange={onInputChange} checked={formData.reportable_events === 'false'} className="square-check" /> 
              Without Reportable Events
            </label>
          </div>
        </div>
        <div className="p-4 grid grid-cols-2 gap-4">
           <div>
              <label className="text-[10px] font-black uppercase text-slate-500 mb-1 block">Est. Blood Loss</label>
              <input type="text" name="ebl" onChange={onInputChange} value={formData.ebl || ''} className="w-full border-b border-slate-300 bg-transparent outline-none font-bold text-sm" />
           </div>
           <div>
              <label className="text-[10px] font-black uppercase text-slate-500 mb-1 block">Urine Output</label>
              <input type="text" name="urine_output" onChange={onInputChange} value={formData.urine_output || ''} className="w-full border-b border-slate-300 bg-transparent outline-none font-bold text-sm" />
           </div>
        </div>
      </div>

      {/* Signatories */}
      <div className="mt-20 grid grid-cols-2 gap-12 text-center">
        <div>
          <input 
            type="text" 
            name="attending_surgeon_name" 
            value={formData.attending_surgeon_name || ''} 
            onChange={onInputChange} 
            placeholder="Surgeon Name"
            className="w-full border-b-2 border-slate-900 outline-none text-center font-black uppercase text-sm mb-1 bg-transparent" 
          />
          <p className="text-[9px] font-bold text-slate-400 uppercase">Attending Surgeon <Mandatory /></p>
        </div>
        <div>
          <input 
            type="text" 
            name="anesthesiologist_name" 
            value={formData.anesthesiologist_name || ''} 
            onChange={onInputChange} 
            placeholder="Anesthesiologist Name"
            className="w-full border-b-2 border-slate-900 outline-none text-center font-black uppercase text-sm mb-1 bg-transparent" 
          />
          <p className="text-[9px] font-bold text-slate-400 uppercase">Anesthesiologist</p>
        </div>
      </div>
    </div>
  );
};
