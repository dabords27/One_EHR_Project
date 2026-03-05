import React, { useState, useEffect } from 'react';
import { useFacility } from "../context/FacilityContext";
import { 
  LayoutDashboard, 
  FilePlus, 
  Table, 
  LogOut, 
  User as UserIcon,
  ArrowLeft,
  Settings,
  Activity,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Menu
} from 'lucide-react';
import { User, UserRole } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
  onSwitchDepartment: () => void;
  currentView: string;
  onNavigate: (view: 'dashboard' | 'create' | 'view' | 'setup' | 'audit') => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, onLogout, onSwitchDepartment, currentView, onNavigate }) => {

  console.log("===== LAYOUT USER DEBUG =====");
  console.log("FULL USER:", user);
  console.log("USER.GROUP:", user?.group);
  console.log("USER.ROLE:", user?.role);

const { facility, activeDepartment } = useFacility();
console.log("Facility Context:", facility); // 👈 ADD IT HERE
  const [isCollapsed, setIsCollapsed] = useState(false);
const hasPhoto =
  user.profileImage &&
  user.profileImage !== "" &&
  user.profileImage !== "null";

const imageUrl = hasPhoto
  ? `${import.meta.env.VITE_API_URL}${user.profileImage}`
  : "/placeholder-user.png";
 

  return (
    <div className="flex min-h-screen bg-[#f1f5f9]">
      {/* Sidebar */}
      <aside 
        className={`bg-slate-950 border-r border-white/5 shadow-2xl fixed h-full z-[60] hidden md:block transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div className="p-4 h-full flex flex-col relative">
          {/* Toggle Button */}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-3 top-20 w-6 h-6 bg-sky-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-sky-500 transition-all z-[70] border border-sky-400"
          >
            {isCollapsed ? <ChevronRight size={14} strokeWidth={3} /> : <ChevronLeft size={14} strokeWidth={3} />}
          </button>

          {/* Branding */}
          <div className={`flex flex-col gap-1 mb-8 transition-all duration-300 ${isCollapsed ? 'items-center' : 'px-2'}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white p-0.5 shadow-lg shadow-sky-500/10 flex-shrink-0">
                <div className="w-full h-full rounded-[10px] bg-slate-900 flex items-center justify-center">
                  <Activity className="text-sky-400" size={20} strokeWidth={2.5} />
                </div>
              </div>
              {!isCollapsed && (
                <div className="flex flex-col animate-in fade-in slide-in-from-left-2 duration-300">
                  <span className="font-black text-white tracking-tighter text-l leading-none uppercase">ONE EHR</span>
                  <span className="text-[10px] font-black text-sky-400 uppercase tracking-[0.2em] mt-1">CLINICAL DOCUMENTATION</span>
                </div>
              )}
            </div>
            
            {!isCollapsed && (
              <div className="mt-8 px-1 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex flex-col">
                  <p className="text-[12px] text-slate-500 font-black uppercase tracking-[0.2em] leading-tight mb-1">
                    Active Station
                  </p>
                  <p className="text-[12px] text-white font-black uppercase tracking-tight">
                    {activeDepartment?.description}
                  </p>
                </div>
                <button 
                  onClick={onSwitchDepartment}
                  className="mt-3 flex items-center gap-1.5 text-[12px] text-sky-400/80 font-black uppercase tracking-widest hover:text-white transition-all group"
                >
                  <ArrowLeft size={10} strokeWidth={3} className="group-hover:-translate-x-0.5 transition-transform" /> 
                  Switch Department
                </button>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="space-y-1.5 flex-1 mt-4">
            <NavItem 
              icon={<LayoutDashboard size={18} />} 
              label="Home" 
              isActive={currentView === 'dashboard'} 
              isCollapsed={isCollapsed}
              onClick={() => onNavigate('dashboard')} 
            />
            <NavItem 
              icon={<Table size={18} />} 
              label="View Records" 
              isActive={currentView === 'view'} 
              isCollapsed={isCollapsed}
              onClick={() => onNavigate('view')} 
            />
      {user.role?.toUpperCase() === "ADMIN" && (
  <NavItem 
    icon={<ShieldCheck size={18} />} 
    label="Audit Trail" 
    isActive={currentView === 'audit'} 
    isCollapsed={isCollapsed}
    onClick={() => onNavigate('audit')} 
  />
)}

       {user.role?.toUpperCase() === "ADMIN" && (
  <NavItem 
    icon={<Settings size={18} />} 
    label="Setup" 
    isActive={currentView === 'setup'} 
    isCollapsed={isCollapsed}
    onClick={() => onNavigate('setup')} 
  />
)}
          </nav>

          {/* User Profile & Footer */}
          <div className="pt-6 border-t border-white/5">
            <div className={`flex items-center gap-3 mb-6 transition-all duration-300 ${isCollapsed ? 'justify-center' : 'px-1'}`}>
          <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 bg-slate-900 flex-shrink-0">
{hasPhoto ? (
  <img
    src={`${import.meta.env.VITE_API_URL}${user.profileImage}`}
    className="w-full h-full object-cover"
    alt="User Profile"
  />
) : (
  <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white bg-slate-700">
    {user.fullName?.charAt(0)}
  </div>
)}
</div>
              {!isCollapsed && (
                <div className="overflow-hidden animate-in fade-in slide-in-from-left-2 duration-300">
                  <p className="text-xs font-black text-white truncate uppercase tracking-tight">{user.fullName}</p>
                  <p className="text-[12px] text-sky-400 uppercase tracking-[0.2em] font-black">{user.role}</p>
                </div>
              )}
            </div>
            <button 
              onClick={onLogout}
              className={`w-full flex items-center justify-center bg-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white rounded-xl transition-all text-[12px] font-black uppercase tracking-[0.2em] ${
                isCollapsed ? 'py-3.5' : 'px-4 py-3.5 gap-3'
              }`}
              title={isCollapsed ? "Sign Out" : ""}
            >
              <LogOut size={16} strokeWidth={2.5} />
              {!isCollapsed && "Sign Out"}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main 
        className={`flex-1 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'md:ml-20' : 'md:ml-64'
        }`}
      >
        {/* Fixed height header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-50 px-8 h-[72px] flex items-center shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
            <div>
     <div className="flex items-center gap-4">
  {facility?.LogoPath && (
    <img
      src={`${import.meta.env.VITE_API_URL}${facility.LogoPath}`}
      className="h-12 w-12 object-contain"
      alt="Facility Logo"
    />
  )}

  <div>
    <p className="text-lg font-black uppercase tracking-tight text-slate-800">
      {facility?.FacilityName || "FACILITY NAME"}
    </p>

    <p className="text-[9px] text-slate-400 font-bold tracking-[0.2em] uppercase">
      Powered by ONE DOCUMENT CORPORATION
    </p>
  </div>
</div>
         
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden lg:block">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">System Status</p>
                <p className="text-[10px] font-black text-emerald-500 flex items-center justify-end gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                  OPERATIONAL
                </p>
              </div>
            </div>
          </div>
        </header>
        
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>

      </main>
    </div>
  );
};

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  isCollapsed: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, isActive, isCollapsed, onClick }) => (
  <button 
    onClick={onClick}
    title={isCollapsed ? label : ""}
    className={`w-full flex items-center transition-all ${
      isCollapsed ? 'justify-center px-0 py-3.5' : 'px-4 py-3.5 gap-3'
    } rounded-xl ${
      isActive 
        ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/20 font-bold' 
        : 'text-slate-500 hover:bg-white/5 hover:text-white'
    }`}
  >
    <div className="flex-shrink-0">{icon}</div>
    {!isCollapsed && (
      <span className="text-xs uppercase tracking-wider font-black truncate animate-in fade-in slide-in-from-left-2 duration-300">
        {label}
      </span>
    )}
  </button>
);
