import { FacilityInformationManagement } from './FacilityInformationManagement';
import React, { useState } from 'react';
import { TemplateBuilder } from './TemplateBuilder';
import { 
  Users, 
  Building2, 
  Settings2, 
  ArrowLeft,
  ChevronRight,
  ClipboardType,
  FileStack
} from 'lucide-react';
import { UserManagement } from './UserManagement';
import { DepartmentManagement } from './DepartmentManagement';
import { CustomFormManagement } from './CustomFormManagement';
import { NoteTemplateManagement } from './NoteTemplateManagement';

export const Setup: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'landing' | 'facility' | 'users' | 'departments' | 'forms' | 'note-templates'>('landing');
  const [builderTemplateId, setBuilderTemplateId] = useState<number | null>(null);
  
  if (builderTemplateId !== null) {
  return (
    <TemplateBuilder
      templateId={builderTemplateId}
      onBack={() => setBuilderTemplateId(null)}
    />
  );
}
  
if (activeTab === 'facility') {
  return <FacilityInformationManagement onBack={() => setActiveTab('landing')} />;
}

  if (activeTab === 'users') {
    return <UserManagement onBack={() => setActiveTab('landing')} />;
  }

  if (activeTab === 'departments') {
    return <DepartmentManagement onBack={() => setActiveTab('landing')} />;
  }

if (activeTab === 'forms') {
  return (
    <CustomFormManagement
      onBack={() => setActiveTab('landing')}
      onManageTemplate={(id) => setBuilderTemplateId(id)}
    />
  );
}

  if (activeTab === 'note-templates') {
    return <NoteTemplateManagement onBack={() => setActiveTab('landing')} />;
  }

return (
  <div className="space-y-8 animate-in fade-in duration-500">
    <div>
      <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight">
        System Configuration
      </h2>
      <p className="text-slate-500 font-medium">
        Manage hospital infrastructure, personnel, and custom form rules
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

      {/* 1️⃣ FACILITY */}
      <button 
        onClick={() => setActiveTab('facility')}
        className="group bg-white p-8 rounded-[40px] border-2 border-slate-100 hover:border-purple-500 hover:shadow-2xl transition-all text-left"
      >
        <div className="bg-purple-50 w-16 h-16 rounded-2xl flex items-center justify-center text-purple-600 mb-8 group-hover:rotate-6 transition-transform">
          <Settings2 size={32} />
        </div>
        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">
          Facility Information
        </h3>
        <p className="text-sm text-slate-400 font-medium mb-8 leading-relaxed">
          Configure healthcare facility details and branding.
        </p>
        <div className="flex items-center gap-2 text-purple-600 font-black text-[10px] uppercase tracking-widest">
          Open Facility Setup <ChevronRight size={14} />
        </div>
      </button>

      {/* 2️⃣ USER */}
      <button 
        onClick={() => setActiveTab('users')}
        className="group bg-white p-8 rounded-[40px] border-2 border-slate-100 hover:border-blue-500 hover:shadow-2xl transition-all text-left"
      >
        <div className="bg-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center text-blue-600 mb-8 group-hover:rotate-6 transition-transform">
          <Users size={32} />
        </div>
        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">
          User Management
        </h3>
        <p className="text-sm text-slate-400 font-medium mb-8 leading-relaxed">
          Administer hospital staff accounts, roles, and digital signatures.
        </p>
        <div className="flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase tracking-widest">
          Open User Console <ChevronRight size={14} />
        </div>
      </button>

      {/* 3️⃣ DEPARTMENTS */}
      <button 
        onClick={() => setActiveTab('departments')}
        className="group bg-white p-8 rounded-[40px] border-2 border-slate-100 hover:border-emerald-500 hover:shadow-2xl transition-all text-left"
      >
        <div className="bg-emerald-50 w-16 h-16 rounded-2xl flex items-center justify-center text-emerald-600 mb-8 group-hover:rotate-6 transition-transform">
          <Building2 size={32} />
        </div>
        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">
          Departments
        </h3>
        <p className="text-sm text-slate-400 font-medium mb-8 leading-relaxed">
          Define and manage clinical departments and station codes.
        </p>
        <div className="flex items-center gap-2 text-emerald-600 font-black text-[10px] uppercase tracking-widest">
          Open Department Setup <ChevronRight size={14} />
        </div>
      </button>

      {/* 4️⃣ NOTE TEMPLATES */}
      <button 
        onClick={() => setActiveTab('note-templates')}
        className="group bg-white p-8 rounded-[40px] border-2 border-slate-100 hover:border-sky-500 hover:shadow-2xl transition-all text-left"
      >
        <div className="bg-sky-50 w-16 h-16 rounded-2xl flex items-center justify-center text-sky-600 mb-8 group-hover:rotate-6 transition-transform">
          <FileStack size={32} />
        </div>
        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">
          Note Templates
        </h3>
        <p className="text-sm text-slate-400 font-medium mb-8 leading-relaxed">
          Structured clinical note formats (FDAR, SOAP, etc.)
        </p>
        <div className="flex items-center gap-2 text-sky-600 font-black text-[10px] uppercase tracking-widest">
          Manage Note Templates <ChevronRight size={14} />
        </div>
      </button>

      {/* 5️⃣ CUSTOM FORMS */}
      <button 
        onClick={() => setActiveTab('forms')}
        className="group bg-white p-8 rounded-[40px] border-2 border-slate-100 hover:border-amber-500 hover:shadow-2xl transition-all text-left"
      >
        <div className="bg-amber-50 w-16 h-16 rounded-2xl flex items-center justify-center text-amber-600 mb-8 group-hover:rotate-6 transition-transform">
          <ClipboardType size={32} />
        </div>
        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">
          Custom Forms
        </h3>
        <p className="text-sm text-slate-400 font-medium mb-8 leading-relaxed">
          Advance dynamic forms validation manager
        </p>
        <div className="flex items-center gap-2 text-amber-600 font-black text-[10px] uppercase tracking-widest">
          Open Form Manager <ChevronRight size={14} />
        </div>
      </button>

    </div>
  </div>
);
};
