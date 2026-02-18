
import React from 'react';
import { FormHeader } from './FormHeader';
import { StandardDateInput } from '../StandardDateInput';

interface RecordOfDeliveryFormProps {
  formData: any;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

const Mandatory = () => <span className="text-rose-500 ml-0.5">*</span>;

export const RecordOfDeliveryForm: React.FC<RecordOfDeliveryFormProps> = ({ formData, onInputChange }) => {
  const InputCell = ({ label, name, flex = true, className = "", required = false }: { label: string, name: string, flex?: boolean, className?: string, required?: boolean }) => (
    <div className={`p-1 border-r border-slate-900 last:border-r-0 ${flex ? 'flex items-center gap-1' : ''} ${className}`}>
      <span className="text-[9px] font-black uppercase text-slate-800 whitespace-nowrap">{label} {required && <Mandatory />}</span>
      <input 
        type="text" 
        name={name} 
        value={formData[name] || ''} 
        onChange={onInputChange} 
        className="flex-1 bg-transparent border-none outline-none font-bold text-xs uppercase h-full min-h-[16px]" 
      />
    </div>
  );

  const SectionTitle = ({ title }: { title: string }) => (
    <div className="bg-[#e6f2ff] border-y border-slate-900 px-2 py-0.5 text-[10px] font-black text-center uppercase tracking-widest">
      {title}
    </div>
  );

  return (
    <div className="flex-1">
      <FormHeader 
        formTitle="RECORD OF DELIVERY/OPERATION" 
        documentCode="JKQ-MED-ROD-DLS-002" 
      />

      <div className="text-[9px] font-black uppercase mb-1 flex justify-between">
        <span>INSTRUCTION: Please fill out all required information and write in print</span>
        <span className="text-slate-400">Station DLS Encoder</span>
      </div>

      <div className="border-2 border-slate-900 grid grid-cols-12 mb-4">
        {/* Row 1 */}
        <div className="col-span-9 border-r border-b border-slate-900 p-1 flex flex-col">
          <span className="text-[9px] font-black uppercase">Patient Name <Mandatory /></span>
          <div className="flex gap-4 px-2 mt-1">
            <div className="flex-1 flex flex-col">
              <span className="text-[7px] font-bold text-slate-400 text-center">LAST NAME</span>
              <p className="text-xs font-black text-center uppercase border-b border-slate-200">{formData.last_name}</p>
            </div>
            <div className="flex-1 flex flex-col">
              <span className="text-[7px] font-bold text-slate-400 text-center">FIRST NAME</span>
              <p className="text-xs font-black text-center uppercase border-b border-slate-200">{formData.first_name}</p>
            </div>
            <div className="flex-1 flex flex-col">
              <span className="text-[7px] font-bold text-slate-400 text-center">MIDDLE NAME</span>
              <p className="text-xs font-black text-center uppercase border-b border-slate-200">{formData.middle_name || 'N/A'}</p>
            </div>
          </div>
        </div>
        <div className="col-span-3 border-b border-slate-900 p-1 flex flex-col">
          <span className="text-[9px] font-black uppercase">MRN NO. <Mandatory /></span>
          <p className="text-sm font-black text-center mt-2 tracking-widest">{formData.mrn}</p>
        </div>

        {/* Row 2 - Updated with StandardDateInput logic */}
        <div className="col-span-3 border-r border-b border-slate-900 p-1">
           <StandardDateInput 
             label="Birth Date"
             name="birthdate"
             value={formData.birthdate || ''}
             onChange={onInputChange}
             className="!space-y-0"
           />
        </div>
        <InputCell label="AGE" name="age" className="col-span-1 border-b" required />
        <InputCell label="ROOM NO." name="room_no" className="col-span-3 border-b" />
        <InputCell label="DATE/TIME" name="date_time" className="col-span-5 border-b" required />

        {/* Row 3 - Surgeon Details */}
        <InputCell label="OBSTETRICIAN/SURGEON" name="physician" className="col-span-7 border-b" required />
        <InputCell label="PARA" name="para" className="col-span-3 border-b" />
        <InputCell label="AOG" name="aog" className="col-span-2 border-b" />

        <InputCell label="ASSISTANT" name="assistant" className="col-span-7 border-b" />
        <InputCell label="GRAVIDA" name="gravida" className="col-span-5 border-b" />

        <InputCell label="ANESTHESIOLOGIST" name="anesthesiologist_name" className="col-span-7 border-b" />
        <InputCell label="TYPE OF ANESTHESIA" name="anesthesia_type" className="col-span-5 border-b" />

        <InputCell label="PEDIATRICIAN" name="pediatrician" className="col-span-7 border-b" />
        <InputCell label="ANESTHESIA AGENT" name="anesthesia_agent" className="col-span-5 border-b" />

        <div className="col-span-7 border-r border-b border-slate-900 p-1 flex items-center gap-2">
           <span className="text-[9px] font-black uppercase text-slate-800">SCRUBS NURSE</span>
           <input name="scrub_nurse" onChange={onInputChange} className="flex-1 bg-transparent border-none outline-none font-bold text-xs uppercase" />
        </div>
        <div className="col-span-5 border-b border-slate-900 p-1 flex items-center gap-1">
           <span className="text-[9px] font-black uppercase text-slate-800">DURATION OF ANESTHESIA</span>
           <span className="text-[7px] font-bold">START</span>
           <input className="w-12 border-b border-slate-200 h-3 text-[9px] text-center" />
           <span className="text-[7px] font-bold ml-1">END</span>
           <input className="w-12 border-b border-slate-200 h-3 text-[9px] text-center" />
        </div>

        <InputCell label="CIRCULATING NURSE/ MIDWIFE" name="circ_nurse" className="col-span-7 border-b" />
        <InputCell label="POSITION IN OR TABLE" name="or_position" className="col-span-5 border-b" />

        <InputCell label="PRE-OPERATIVE DIAGNOSIS" name="pre_operative_diagnosis" className="col-span-7 border-b" required />
        <div className="col-span-5 border-b border-slate-900 p-1 flex items-center gap-2">
           <span className="text-[9px] font-black uppercase text-slate-800">TIME OUT UNIVERSAL PROTOCOL</span>
           <input className="flex-1 border-b border-slate-200 h-3" />
        </div>

        <div className="col-span-7 border-r border-b border-slate-900 p-1 flex items-center gap-2">
           <span className="text-[9px] font-black uppercase text-slate-800">POST OPERATIVE DIAGNOSIS <Mandatory /></span>
           <textarea name="post_operative_diagnosis" onChange={onInputChange} className="flex-1 bg-transparent border-none outline-none font-bold text-xs uppercase resize-none h-6" />
        </div>
        <div className="col-span-5 border-b border-slate-900 p-1 flex items-center gap-1">
           <span className="text-[9px] font-black uppercase text-slate-800">DURATION OF OPERATION</span>
           <span className="text-[7px] font-bold">START</span>
           <input className="w-12 border-b border-slate-200 h-3 text-[9px] text-center" />
           <span className="text-[7px] font-bold ml-1">END</span>
           <input className="w-12 border-b border-slate-200 h-3 text-[9px] text-center" />
        </div>

        <InputCell label="OPERATION PERFORMED" name="technique" className="col-span-7 border-b" required />
        <InputCell label="TIME OF DELIVERY" name="time_of_delivery" className="col-span-5 border-b" />

        <div className="col-span-7 border-r border-b border-slate-900 p-1 flex items-center gap-2">
           <span className="text-[9px] font-black uppercase text-slate-800">SECONDARY PROCEDURE(S)</span>
           <input name="secondary_procedures" onChange={onInputChange} className="flex-1 bg-transparent border-none outline-none font-bold text-xs uppercase" />
        </div>
        <InputCell label="TYPE OF DELIVERY" name="delivery_type" className="col-span-5 border-b" />

        <InputCell label="SPECIMEN REMOVED" name="specimen" className="col-span-7 border-r border-slate-900" />
        <div className="col-span-5 flex flex-col">
           <InputCell label="TIME OF PLACENTA OUT" name="placenta_out" className="border-b" />
           <InputCell label="TYPE OF EPISIOTOMY" name="episiotomy_type" className="border-b" />
           <InputCell label="SEX OF BABY" name="baby_sex" className="border-b" />
           <InputCell label="APGAR SCORE" name="apgar" className="border-b" />
           <InputCell label="TIME IN/ MODE OF TRANSFER" name="transfer_in" className="border-b" />
           <InputCell label="TIME OUT/ MODE OF TRANSFER" name="transfer_out" />
        </div>
      </div>

      <SectionTitle title="MINOR PROCEDURE/ VAGINAL DELIVERY" />
      <div className="grid grid-cols-2 border-x border-b border-slate-900 mb-4">
        <table className="w-full border-collapse text-[8px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-900">
              <th className="border-r border-slate-900 p-1 text-left uppercase">SPONGE COUNT</th>
              <th className="border-r border-slate-900 p-1 uppercase">INITIAL COUNT</th>
              <th className="border-r border-slate-900 p-1 uppercase">IN SURG SITE</th>
              <th className="border-r border-slate-900 p-1 uppercase">ON TABLE</th>
              <th className="border-r border-slate-900 p-1 uppercase">ON FLOOR</th>
              <th className="p-1 uppercase">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {['8X4 TRIPAQUE', 'CHERRIES', 'BLADES', 'NEEDLE COUNT', 'OTHERS'].map(item => (
              <tr key={item} className="border-b border-slate-200 h-5">
                <td className="border-r border-slate-900 font-black px-1 uppercase">{item}</td>
                <td className="border-r border-slate-900"></td><td className="border-r border-slate-900"></td><td className="border-r border-slate-900"></td><td className="border-r border-slate-900"></td><td></td>
              </tr>
            ))}
          </tbody>
        </table>
        <table className="w-full border-collapse text-[8px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-900">
              <th className="border-r border-slate-900 p-1 text-left uppercase">SPONGE COUNT</th>
              <th className="border-r border-slate-900 p-1 uppercase">INITIAL COUNT</th>
              <th className="border-r border-slate-900 p-1 uppercase">IN SURG SITE</th>
              <th className="border-r border-slate-900 p-1 uppercase">ON TABLE</th>
              <th className="border-r border-slate-900 p-1 uppercase">ON FLOOR</th>
              <th className="p-1 uppercase">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {['8X4 TRIPAQUE', 'CHERRIES', 'BLADES', 'NEEDLE COUNT', 'OTHERS'].map(item => (
              <tr key={item + '2'} className="border-b border-slate-200 h-5">
                <td className="border-r border-slate-900 font-black px-1 uppercase">{item}</td>
                <td className="border-r border-slate-900"></td><td className="border-r border-slate-900"></td><td className="border-r border-slate-900"></td><td className="border-r border-slate-900"></td><td></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SectionTitle title="MAJOR PROCEDURE/ CESAREAN SECTION" />
      <div className="border-x border-b border-slate-900 p-1 mb-8 overflow-x-auto">
         <table className="w-full text-[7px] border-collapse border border-slate-900">
            <thead className="bg-slate-50 uppercase font-black">
               <tr className="border-b border-slate-900">
                  <th rowSpan={2} className="border-r border-slate-900 p-1">Sponge Count</th>
                  <th rowSpan={2} className="border-r border-slate-900 p-1">Init Count</th>
                  <th colSpan={4} className="border-r border-slate-900 p-1">First Count</th>
                  <th rowSpan={2} className="border-r border-slate-900 p-1">Init Count</th>
                  <th colSpan={4} className="border-r border-slate-900 p-1">Second Count</th>
                  <th rowSpan={2} className="border-r border-slate-900 p-1">Init Count</th>
                  <th colSpan={4} className="p-1">Final Count</th>
               </tr>
               <tr className="border-b border-slate-900 text-[6px]">
                  <th className="border-r border-slate-900 p-0.5">Surg Site</th><th className="border-r border-slate-900 p-0.5">Table</th><th className="border-r border-slate-900 p-0.5">Floor</th><th className="border-r border-slate-900 p-0.5">Total</th>
                  <th className="border-r border-slate-900 p-0.5">Surg Site</th><th className="border-r border-slate-900 p-0.5">Table</th><th className="border-r border-slate-900 p-0.5">Floor</th><th className="border-r border-slate-900 p-0.5">Total</th>
                  <th className="border-r border-slate-900 p-0.5">Surg Site</th><th className="border-r border-slate-900 p-0.5">Table</th><th className="border-r border-slate-900 p-0.5">Floor</th><th className="p-0.5">Total</th>
               </tr>
            </thead>
            <tbody>
               {['8x4 Tripaque', 'Lap Packs', 'Cherries', 'Peanuts', 'Blades', 'Needle Count', 'Others'].map(row => (
                  <tr key={row} className="border-b border-slate-200 h-5">
                     <td className="border-r border-slate-900 font-bold px-1 uppercase">{row}</td>
                     <td className="border-r border-slate-900"></td><td className="border-r border-slate-900"></td><td className="border-r border-slate-900"></td><td className="border-r border-slate-900"></td><td className="border-r border-slate-900"></td>
                     <td className="border-r border-slate-900"></td><td className="border-r border-slate-900"></td><td className="border-r border-slate-900"></td><td className="border-r border-slate-900"></td><td className="border-r border-slate-900"></td>
                     <td className="border-r border-slate-900"></td><td className="border-r border-slate-900"></td><td className="border-r border-slate-200"></td><td className="border-r border-slate-200"></td><td></td>
                  </tr>
               ))}
            </tbody>
         </table>
      </div>

      <div className="border-2 border-slate-900 p-4">
         <p className="text-[9px] font-black uppercase mb-1">REMARKS</p>
         <textarea className="w-full h-12 bg-transparent outline-none font-bold text-xs resize-none" />
      </div>

      <div className="mt-8 pt-4 flex justify-between gap-12 text-center">
         <div className="flex-1">
            <div className="border-b border-slate-900 h-6 mb-1"></div>
            <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Signature Over Printed Name/ Date & Time</p>
            <p className="text-[10px] font-black uppercase text-slate-800">OBSTETRICIAN <Mandatory /></p>
         </div>
         <div className="flex-1">
            <div className="border-b border-slate-900 h-6 mb-1"></div>
            <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Signature Over Printed Name/ Date & Time</p>
            <p className="text-[10px] font-black uppercase text-slate-800">CIRCULATING NURSE</p>
         </div>
      </div>
    </div>
  );
};
