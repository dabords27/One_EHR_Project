import React, { useState, useEffect } from 'react';
import {
  Stethoscope,
  Minus,
  X,
  Maximize2,
  Minimize2,
  History
} from 'lucide-react';
import { Patient, User } from '../types';

interface CourseInWardModuleProps {
  patient: Patient;
  user: User;
  onClose: () => void;
  forceMinimized?: boolean;
}

export const CourseInWardModule: React.FC<CourseInWardModuleProps> = ({
  patient,
  user,
  onClose,
  forceMinimized
}) => {

const [isMinimized, setIsMinimized] = useState(true);
  const [isMaximized, setIsMaximized] = useState(false);
  
  useEffect(() => {
  console.log("CourseInWard MOUNTED");

  return () => {
    console.log("CourseInWard UNMOUNTED");
  };
}, []);

  const [admissionDateTime, setAdmissionDateTime] = useState<string | null>(null);
  const [courses, setCourses] = useState<any[]>([]);

  // Respect App.tsx control
 useEffect(() => {
  if (forceMinimized !== undefined) {
    setIsMinimized(forceMinimized);
  }
}, [forceMinimized]);

  // Reset maximize when patient changes
  useEffect(() => {
    setIsMaximized(false);
  }, [patient.case_id]);

  // Load course + admission
  useEffect(() => {
    const loadCourse = async () => {
      if (!patient.case_id) return;

      const res = await fetch(`/api/course-in-ward/${patient.case_id}`);
      const data = await res.json();

      setAdmissionDateTime(data.admissionDateTime || null);

      if (data.admissionDateTime) {
        const admission = new Date(data.admissionDateTime);

        const filtered = (data.courses || []).filter((c: any) => {
          return new Date(c.OrderDate) >= admission;
        });

        setCourses(filtered);
      } else {
        setCourses(data.courses || []);
      }
    };

    loadCourse();
  }, [patient.case_id]);

  const formatDateTime = (value: string) => {
    const date = new Date(value);

    return date.toLocaleString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  };

  const isActive = patient.status === 'Active';

  const patientFullName = `${patient.last_name}, ${patient.first_name} ${patient.middle_name || ''} ${patient.extension || ''}`
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();

  /* ================= MINIMIZED ================= */

  if (isMinimized) {
  
  
    return (
      <div
        style={{ right: '20px', bottom: '110px' }}
        className="fixed z-[10000] w-80 bg-slate-900 text-white rounded-2xl shadow-2xl flex items-center justify-between px-4 py-3 cursor-pointer border border-white/10"
        onClick={() => setIsMinimized(false)}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
            <Stethoscope size={16} />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
              Course in the Ward
            </p>

            <div className="flex items-center gap-2 mt-1">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isActive ? 'bg-emerald-500' : 'bg-slate-400'
                }`}
              />
              <p className="text-[10px] font-black uppercase tracking-tight text-emerald-400 break-words leading-tight">
                {patientFullName}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="p-1 hover:bg-white/10 rounded-md"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  /* ================= POSITION ================= */

  const moduleStyle: React.CSSProperties = isMaximized
    ? {
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%) scale(1)",
        width: "85vw",
        height: "85vh",
        maxWidth: "1200px",
        maxHeight: "900px"
      }
    : {
        right: "20px",
        bottom: "100px",
        width: "440px",
        height: "640px",
        transform: "scale(1)"
      };

  /* ================= RENDER ================= */

  return (
    <div
      style={moduleStyle}
      className="fixed z-[10000] bg-white rounded-[40px] shadow-2xl flex flex-col border border-slate-200 overflow-hidden transition-[transform,width,height] duration-300 ease-out"
    >
      {/* HEADER */}
      <div className="bg-slate-800 p-5 flex items-center justify-between">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-12 h-12 rounded-[20px] bg-emerald-600 flex items-center justify-center text-white shadow-xl">
            <Stethoscope size={24} strokeWidth={2.5} />
          </div>

          <div className="truncate">
            <h3 className="text-white text-xs font-black uppercase tracking-tight">
              Course in the Ward
            </h3>

            <div className="flex items-center gap-2 mt-1">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isActive ? 'bg-emerald-500' : 'bg-slate-400'
                }`}
              />
              <p className="text-emerald-400 text-[11px] font-black uppercase truncate">
                {patientFullName}
              </p>
            </div>

            {admissionDateTime && (
              <p className="text-[10px] text-slate-300 mt-1 font-bold">
                ADMISSION: {formatDateTime(admissionDateTime)}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            className="p-2.5 text-slate-400 hover:text-white rounded-xl"
          >
            {isMaximized ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>

          <button
            onClick={() => setIsMinimized(true)}
            className="p-2.5 text-slate-400 hover:text-white rounded-xl"
          >
            <Minus size={20} />
          </button>

          <button
            onClick={onClose}
            className="p-2.5 text-slate-400 hover:text-rose-400 rounded-xl"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* BODY */}
      <div className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-4">

        {courses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 opacity-30 text-slate-400">
            <History size={48} className="mb-2" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em]">
              No Course Records
            </p>
          </div>
        ) : (
          courses.map((item, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm"
            >
              <div className="text-[11px] font-bold text-slate-500 mb-2">
                {formatDateTime(item.OrderDate)}
              </div>

              <div className="text-sm text-slate-700 whitespace-pre-wrap">
                {item.Remarks}
              </div>

              <div className="text-[11px] text-emerald-600 font-semibold mt-2">
                {item.DoctorName}
              </div>
            </div>
          ))
        )}

      </div>

    </div>
  );
};