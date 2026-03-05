import React, { useEffect, useState } from "react";
import {
  Building2,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { Department } from "../types";
import { useFacility } from "../context/FacilityContext";

interface ModuleSelectionProps {
  username: string;
  userName: string;
  onSelectDepartment: (dept: Department) => void;
  onLogout: () => void;
}

interface DeptFromAPI {
  auto_id: number;
  dept_name: string;
  dept_code: string;
  is_default: boolean;
}

export const ModuleSelection: React.FC<ModuleSelectionProps> = ({
  username,
  userName,
  onSelectDepartment,
  onLogout
}) => {
  const [departments, setDepartments] = useState<DeptFromAPI[]>([]);
  const [loading, setLoading] = useState(true);

  const { setActiveDepartment } = useFacility();

  const aiBackground = sessionStorage.getItem("ai_login_bg");

  /* ================= FETCH DEPARTMENTS ================= */
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/users/${username}/departments`
        );

        const data = await res.json();
        setDepartments(data);
      } catch (err) {
        console.error("Department fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchDepartments();
    }
  }, [username]);

  /* ================= HANDLE SELECT ================= */
  const handleSelect = (dept: DeptFromAPI) => {
    const formatted: Department = {
      id: dept.auto_id, // 🔥 KEEP AS NUMBER
      name: dept.dept_name,
      code: dept.dept_code,
      description: dept.dept_name
    };

    // Save to localStorage (optional persistence)
    localStorage.setItem("active_department", JSON.stringify(formatted));

    // 🔥 Update global context (THIS FIXES YOUR ISSUE)
    setActiveDepartment(formatted);

    // Continue existing flow
    onSelectDepartment(formatted);
  };

  return (
    <div className="min-h-screen bg-[#f0f5fa] flex flex-col p-6 md:p-12 relative overflow-hidden">
      {/* Background */}
      {aiBackground && (
        <div
          className="absolute inset-0 opacity-[0.03] grayscale pointer-events-none"
          style={{
            backgroundImage: `url(${aiBackground})`,
            backgroundSize: "cover",
            backgroundPosition: "center"
          }}
        />
      )}

      <div className="max-w-6xl w-full mx-auto relative z-10">
        {/* HEADER */}
        <header className="flex justify-between items-center mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={16} className="text-sky-500" />
              <span className="text-[10px] font-black text-sky-500 uppercase tracking-[0.3em]">
                Role-Based Clinical Access
              </span>
            </div>

            <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight">
              Welcome | {userName}
            </h2>

            <p className="text-slate-500 font-medium">
              Select your assigned department
            </p>
          </div>
        </header>

        {/* CONTENT */}
        {loading ? (
          <div className="text-center text-slate-500 font-semibold">
            Loading assigned departments...
          </div>
        ) : departments.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-slate-200">
            <Building2 size={48} className="mx-auto text-slate-300 mb-6" />
            <h3 className="text-xl font-black text-slate-700 uppercase mb-2">
              No Department Assigned
            </h3>
            <p className="text-slate-500 font-medium">
              Please contact your system administrator.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {departments.map((dept, idx) => (
              <button
                key={dept.auto_id}
                onClick={() => handleSelect(dept)}
                className="group bg-white/90 backdrop-blur-sm p-8 rounded-[32px] border border-white hover:border-sky-300 hover:shadow-2xl transition-all text-left flex flex-col min-h-[320px] animate-in fade-in zoom-in-95 duration-500"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="bg-sky-50 text-sky-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-sm">
                  <Building2 size={28} />
                </div>

                <h3 className="text-xl font-black text-slate-800 uppercase leading-tight mb-3 tracking-tighter">
                  {dept.dept_name}
                </h3>

                <p className="text-sm text-slate-500 font-medium mb-6 flex-1 leading-relaxed">
                  System Code: {dept.dept_code}
                </p>

                {dept.is_default && (
                  <span className="inline-block mb-4 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase tracking-widest">
                    Default Station
                  </span>
                )}

                <div className="flex items-center gap-2 text-slate-400 group-hover:text-sky-600 font-black text-[10px] uppercase tracking-widest transition-colors">
                  Enter Module <ChevronRight size={14} />
                </div>
              </button>
            ))}
          </div>
        )}

        {/* FOOTER */}
        <footer className="mt-20 text-center text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] border-t border-slate-200 pt-8">
          ONE EHR • ELECTRONIC HEALTH RECORD SYSTEM v1.0.4
        </footer>
      </div>
    </div>
  );
};