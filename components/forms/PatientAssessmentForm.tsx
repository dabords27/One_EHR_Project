
import React from 'react';
import { FormHeader } from './FormHeader';

interface PatientAssessmentFormProps {
  page: number;
  formData: any;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

const Mandatory = () => <span className="text-rose-500 ml-0.5">*</span>;

export const PatientAssessmentForm: React.FC<PatientAssessmentFormProps> = ({ page, formData, onInputChange }) => {
  return (
    <div className="flex-1 space-y-4">
      <FormHeader 
        formTitle="Patient Database and Assessment Form (Obstetrics & Gynecology)" 
        documentCode="JKQ-MED-PDAO-DLS-024" 
      />

      {page === 1 && (
        <div className="animate-in fade-in duration-300">
          <div className="bg-[#e6f2ff] px-3 py-1 border-2 border-slate-900 text-[11px] font-black uppercase tracking-wider mb-0.5">PART I. CLINICAL HISTORY</div>
          <div className="grid grid-cols-12 border-2 border-slate-900">
            <div className="col-span-6 border-r-2 border-slate-900 p-2 min-h-[80px]">
              <p className="text-[10px] font-black uppercase mb-3 text-slate-500">HISTORY OBTAINED FROM <Mandatory /></p>
              <div className="flex flex-col gap-2.5">
                <label className="flex items-center gap-2.5 text-[11px] font-bold uppercase cursor-pointer">
                  <input type="radio" name="history_from" value="Patient" onChange={onInputChange} checked={formData.history_from === 'Patient'} className="square-check" /> PATIENT
                </label>
                <div className="flex items-center gap-2.5 text-[11px] font-bold uppercase cursor-pointer">
                  <input type="radio" name="history_from" value="Others" onChange={onInputChange} checked={formData.history_from === 'Others'} className="square-check" /> 
                  <span className="whitespace-nowrap">OTHERS:</span>
                  <input type="text" name="history_from_others" value={formData.history_from_others || ''} onChange={onInputChange} className="flex-1 border-b border-slate-300 outline-none bg-transparent h-4 px-1 pb-0.5 font-bold" />
                </div>
              </div>
            </div>
            <div className="col-span-6 p-2">
              <p className="text-[10px] font-black uppercase mb-3 text-slate-500">RELIABILITY <Mandatory /></p>
              <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                {['POOR', 'FAIR', 'GOOD', 'EXCELLENT'].map(opt => (
                  <label key={opt} className="flex items-center gap-2.5 text-[11px] font-bold uppercase cursor-pointer">
                    <input type="radio" name="reliability" value={opt} onChange={onInputChange} checked={formData.reliability === opt} className="square-check" /> {opt}
                  </label>
                ))}
              </div>
            </div>
          </div>
          
          <div className="border-x-2 border-slate-900 p-2">
            <p className="text-[10px] font-black uppercase text-slate-500">CHIEF COMPLAINT <Mandatory /></p>
            <textarea name="chief_complaint" value={formData.chief_complaint || ''} onChange={onInputChange} rows={2} className="w-full outline-none border-b border-slate-200 mt-1 font-bold text-sm uppercase resize-none bg-transparent" />
          </div>
          
          <div className="border-x-2 border-b-2 border-slate-900 p-2">
            <p className="text-[10px] font-black uppercase text-slate-500">HISTORY OF PRESENT ILLNESS <Mandatory /></p>
            <textarea name="history_present_illness" value={formData.history_present_illness || ''} onChange={onInputChange} rows={9} className="w-full outline-none mt-1 font-medium text-sm leading-relaxed bg-transparent" />
          </div>

          <div className="bg-[#e6f2ff] px-3 py-1 border-x-2 border-b-2 border-slate-900 text-[11px] font-black uppercase text-center tracking-widest">PAST MEDICAL HISTORY</div>
          
          <div className="grid grid-cols-12 border-x-2 border-b-2 border-slate-900">
            <div className="col-span-8 border-r-2 border-slate-900 p-2">
              <p className="text-[10px] font-black uppercase mb-3 text-slate-500">ALLERGIES</p>
              <div className="space-y-1.5">
                {['No Known Allergy', 'Latex', 'Food', 'Drug'].map(a => (
                  <div key={a} className="flex items-center gap-3">
                    <input type="checkbox" className="square-check" />
                    <span className="text-[11px] font-bold uppercase">{a}</span>
                    <div className="flex-1 border-b border-slate-100 h-3"></div>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <p className="text-[10px] font-black uppercase mb-3 text-slate-500">PAST MEDICAL</p>
                <div className="grid grid-cols-3 gap-y-2.5 gap-x-2">
                  {['Hypertension', 'Diabetes', 'Asthma', 'Cardiac', 'Seizure', 'Others'].map(m => (
                    <label key={m} className="flex items-center gap-2.5 text-[10px] font-bold uppercase cursor-pointer">
                      <input type="checkbox" className="square-check" /> {m}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="col-span-4 p-2">
               <p className="text-[9px] font-black uppercase text-slate-400 mb-2">Surgical History</p>
               <div className="space-y-2">
                  {[1, 2, 3].map(i => <div key={i} className="border-b border-slate-200 h-6"></div>)}
               </div>
            </div>
          </div>
        </div>
      )}

      {page === 2 && (
        <div className="animate-in fade-in duration-300">
           <div className="bg-[#e6f2ff] px-3 py-1 border-2 border-slate-900 text-[11px] font-black uppercase tracking-wider text-center">OBSTETRIC AND GYNECOLOGY HISTORY</div>
           <div className="border-x-2 border-b-2 border-slate-900 p-4 min-h-[500px]">
              <div className="grid grid-cols-3 gap-4 mb-8">
                 {['LMP', 'EDD', 'AOG', 'G', 'P', 'T', 'A', 'L'].map(l => (
                    <div key={l} className="flex items-end gap-2">
                       <span className="text-[10px] font-black uppercase whitespace-nowrap w-8">{l}:</span>
                       <div className="flex-1 border-b border-slate-300 h-5"></div>
                    </div>
                 ))}
              </div>
              <table className="w-full border-collapse border border-slate-900 text-[10px]">
                 <thead>
                    <tr className="bg-slate-50 border-b border-slate-900">
                       <th className="border-r border-slate-900 p-1 w-10">G#</th>
                       <th className="border-r border-slate-900 p-1">OUTCOME</th>
                       <th className="border-r border-slate-900 p-1">DATE</th>
                       <th className="border-r border-slate-900 p-1">PLACE</th>
                       <th className="p-1">COMPLICATIONS</th>
                    </tr>
                 </thead>
                 <tbody>
                    {[1, 2, 3, 4, 5].map(i => (
                       <tr key={i} className="border-b border-slate-200 h-8">
                          <td className="border-r border-slate-900 text-center font-bold">{i}</td>
                          <td className="border-r border-slate-200"></td>
                          <td className="border-r border-slate-200"></td>
                          <td className="border-r border-slate-200"></td>
                          <td></td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      )}

      {page === 3 && (
        <div className="animate-in fade-in duration-300">
           <div className="bg-[#e6f2ff] px-3 py-1 border-2 border-slate-900 text-[11px] font-black uppercase tracking-wider mb-0.5">PART III. PHYSICAL EXAMINATION</div>
           <div className="grid grid-cols-12 border-2 border-slate-900 min-h-[400px]">
              <div className="col-span-8 border-r-2 border-slate-900 p-4">
                 <p className="text-[10px] font-black uppercase text-slate-500 mb-4">Admitting Diagnosis <Mandatory /></p>
                 <textarea className="w-full h-full bg-transparent outline-none font-black text-sm uppercase resize-none" />
              </div>
              <div className="col-span-4 p-4 bg-slate-50">
                 <p className="text-[10px] font-black uppercase text-slate-500 mb-4 text-center">Vital Signs <Mandatory /></p>
                 <div className="space-y-4">
                    {['BP', 'HR', 'RR', 'Temp', 'SpO2'].map(v => (
                       <div key={v} className="flex justify-between items-end border-b border-slate-200 pb-1">
                          <span className="text-[10px] font-bold">{v}</span>
                          <div className="w-20 h-4"></div>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      )}

      {page === 4 && (
        <div className="animate-in fade-in duration-300">
           <div className="bg-[#e6f2ff] px-3 py-1 border-2 border-slate-900 text-[11px] font-black uppercase tracking-wider text-center">FINAL DISPOSITION</div>
           <div className="border-x-2 border-b-2 border-slate-900 p-8 min-h-[600px] flex flex-col justify-end">
              <div className="grid grid-cols-2 gap-12 text-center">
                 <div>
                    <div className="border-b-2 border-slate-900 h-8 mb-1"></div>
                    <p className="text-[9px] font-bold uppercase text-slate-400">Attending Physician <Mandatory /></p>
                 </div>
                 <div>
                    <div className="border-b-2 border-slate-900 h-8 mb-1"></div>
                    <p className="text-[9px] font-bold uppercase text-slate-400">Hospitalist-on-duty</p>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
