import { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Login } from './components/Login';
import { ModuleSelection } from './components/ModuleSelection';
import { Dashboard } from './components/Dashboard';
import { RecordForm } from './components/RecordForm';
import { RecordList } from './components/RecordList';
import { Setup } from './components/setup/Setup';
import { AuditTrail } from './components/AuditTrail';
import { SignOutModal } from './components/SignOutModal';
import { ProgressNotesModule } from './components/ProgressNotesModule';
import { CourseInWardModule } from './components/CourseInWardModule';
import { ClinicalFormSelection } from './components/ClinicalFormSelection';
import { User, Patient, Department, FormType } from './types';
import { CustomTemplatePrintView } from "./components/custom-templates/CustomTemplatePrintView";
import { PatientDocumentsModule } from './components/PatientDocumentsModule';

const App: React.FC = () => {

  const [user, setUser] = useState<User | null>(null);
  const [department, setDepartment] = useState<Department | null>(null);
  const [currentView, setCurrentView] = useState<
    'dashboard' | 'select-form' | 'create' | 'view' | 'setup' | 'audit'
  >('dashboard');

  const [editRecordId, setEditRecordId] = useState<number | null>(null);
  const [activePatient, setActivePatient] = useState<Patient | null>(null);
  const [selectedFormType, setSelectedFormType] = useState<FormType | null>(null);
  const [areClinicalModulesMinimized, setAreClinicalModulesMinimized] = useState(false);
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const [showProgressNotes, setShowProgressNotes] = useState(true);
const [showCourseInWard, setShowCourseInWard] = useState(true);
const [isProgressMaximized, setIsProgressMaximized] = useState(false);
const [printRecordId, setPrintRecordId] = useState<number | null>(null);
const [showPatientDocuments, setShowPatientDocuments] = useState(true);

/* ================= RESTORE SESSION ================= */

useEffect(() => {
const savedUser = sessionStorage.getItem('dl_suite_user');
const savedDept = sessionStorage.getItem('dl_suite_dept');

  if (savedUser) {
    const parsedUser = JSON.parse(savedUser) as User;
    setUser(parsedUser);

    if (savedDept) {
      try {
        setDepartment(JSON.parse(savedDept));
      } catch {
        setDepartment({
          code: savedDept,
          description: savedDept
        } as Department);
      }
    } else if (parsedUser.defaultDepartment) {
      setDepartment(parsedUser.defaultDepartment);
      localStorage.setItem(
        'dl_suite_dept',
        JSON.stringify(parsedUser.defaultDepartment)
      );
    }
  }
}, []);


// ✅ ADD THIS RIGHT HERE
useEffect(() => {
  if (activePatient) {
    setShowProgressNotes(true);
    setShowCourseInWard(true);
	setShowPatientDocuments(true);
  }
}, [activePatient]);

/* ================= AUTO LOGOUT (5 MIN IDLE) ================= */

useEffect(() => {
  if (!user) return; // Only run when logged in

  const IDLE_TIMEOUT = 5 * 60 * 1000; // 2 minutes
  let timeout: NodeJS.Timeout;

  const logoutUser = () => {
    console.log("User inactive for 5 minutes. Auto logging out...");
    handleLogout();
  };

  const resetTimer = () => {
    clearTimeout(timeout);
    timeout = setTimeout(logoutUser, IDLE_TIMEOUT);
  };

  const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];

  events.forEach((event) => {
    window.addEventListener(event, resetTimer);
  });

  resetTimer(); // Start timer immediately

  return () => {
    clearTimeout(timeout);
    events.forEach((event) => {
      window.removeEventListener(event, resetTimer);
    });
  };
}, [user]);



/* ================= LOGOUT ON TAB / BROWSER CLOSE ================= */

useEffect(() => {
  if (!user) return;

  const handleBeforeUnload = () => {
    sessionStorage.setItem("ehr_closing", "true");

    setTimeout(() => {
      const closing = sessionStorage.getItem("ehr_closing");

      if (closing === "true") {
        localStorage.removeItem("dl_suite_user");
        localStorage.removeItem("dl_suite_dept");
      }
    }, 100);
  };

  const handleLoad = () => {
    sessionStorage.removeItem("ehr_closing");
  };

  window.addEventListener("beforeunload", handleBeforeUnload);
  window.addEventListener("load", handleLoad);

  return () => {
    window.removeEventListener("beforeunload", handleBeforeUnload);
    window.removeEventListener("load", handleLoad);
  };
}, [user]);

  /* ================= AUTH ================= */

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    sessionStorage.setItem('dl_suite_user', JSON.stringify(loggedInUser));
    localStorage.setItem('last_login_username', loggedInUser.username);

    if (loggedInUser.defaultDepartment) {
      handleSelectDepartment(loggedInUser.defaultDepartment);
    }
  };

  const handleSelectDepartment = (dept: Department) => {
    setDepartment(dept);
    sessionStorage.setItem('dl_suite_dept', JSON.stringify(dept));
    setCurrentView('dashboard');
  };

  const handleSwitchDepartment = () => {
    setDepartment(null);
    localStorage.removeItem('dl_suite_dept');
    setCurrentView('dashboard');
    setActivePatient(null);
  };

  const handleLogout = () => {
    setUser(null);
    setDepartment(null);
    setActivePatient(null);
    setSelectedFormType(null);
sessionStorage.removeItem('dl_suite_user');
sessionStorage.removeItem('dl_suite_dept');
    setIsSignOutModalOpen(false);
  };

  /* ================= NAVIGATION ================= */

  const navigateTo = (
    view: 'dashboard' | 'select-form' | 'create' | 'view' | 'setup' | 'audit',
    id: number | null = null,
    patient: Patient | null = null
  ) => {

    setCurrentView(view);
    setEditRecordId(id);

    // 🔥 Force module reset even if same patient double-clicked
 if (patient !== null) {
  setActivePatient(patient);
}

    // Minimize only on select-form and create
if (view === 'select-form' || view === 'create') {
  setAreClinicalModulesMinimized(true);
} else {
  setAreClinicalModulesMinimized(false);
}
  };

  /* ================= RENDER ================= */

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  if (!department) {
    return (
      <>
        <ModuleSelection
  username={user.username}   // 👈 THIS IS MISSING
  userName={user.fullName}
  onSelectDepartment={handleSelectDepartment}
  onLogout={handleLogout}
/>

        <SignOutModal
          isOpen={isSignOutModalOpen}
          onConfirm={handleLogout}
          onCancel={() => setIsSignOutModalOpen(false)}
        />
      </>
    );
  }

  return (
    <>
      <Layout
        user={{ ...user, department } as any}
        onLogout={() => setIsSignOutModalOpen(true)}
        onSwitchDepartment={handleSwitchDepartment}
        currentView={currentView}
        onNavigate={navigateTo}
      >

     {currentView === 'dashboard' && (
  <Dashboard
    onNavigate={navigateTo}
    department={department}
    setActivePatient={setActivePatient}
    user={user}
  />
)}

        {currentView === 'select-form' && activePatient && (
          <ClinicalFormSelection
            patient={activePatient}
            onBack={() => navigateTo('dashboard')}
            onSelect={(formType) => {
              setSelectedFormType(formType);
              navigateTo('create', null, activePatient);
            }}
          />
        )}

{currentView === 'create' && (
  <RecordForm
    formType={selectedFormType ?? undefined}
    onSuccess={() => navigateTo('view')}
    editId={editRecordId}
    selectedPatient={activePatient ?? undefined}
    onCancel={() => navigateTo('dashboard')}
    department={department}
    setActivePatient={setActivePatient}
    user={user}
  />
)}

{currentView === 'view' && (
<RecordList
  user={user}
  onEdit={(id) => navigateTo("create", id)}
  onPrint={(id) => {
    setPrintRecordId(id);
  }}
/>
)}
        {currentView === 'setup' && <Setup />}
        {currentView === 'audit' && <AuditTrail />}

      </Layout>

      {/* Floating Clinical Modules (Hidden on Setup) */}
{activePatient && !['setup', 'dashboard', 'view', 'audit'].includes(currentView) && (
  <>
  
    {showPatientDocuments && !isProgressMaximized && (
      <PatientDocumentsModule
        patient={activePatient}
        user={user}
        forceMinimized={areClinicalModulesMinimized}
        onClose={() => setShowPatientDocuments(false)}
      />
    )}

    {showProgressNotes && (
      <ProgressNotesModule
        key={`progress-${activePatient.case_id}`}
        patient={activePatient}
        user={user}
        forceMinimized={areClinicalModulesMinimized}
        isMaximizedGlobal={isProgressMaximized}
        setIsMaximizedGlobal={setIsProgressMaximized}
        onClose={() => setShowProgressNotes(false)}
      />
    )}

    {showCourseInWard && !isProgressMaximized && (
      <CourseInWardModule
        patient={activePatient}
        user={user}
        forceMinimized={areClinicalModulesMinimized}
        onClose={() => setShowCourseInWard(false)}
      />
    )}

  </>
)}
{/* PRINT VIEW */}
{printRecordId && (
  <CustomTemplatePrintView
    recordId={printRecordId}
    onClose={() => setPrintRecordId(null)}
  />
)}
      <SignOutModal
        isOpen={isSignOutModalOpen}
        onConfirm={handleLogout}
        onCancel={() => setIsSignOutModalOpen(false)}
      />
    </>
  );
};

export default App;