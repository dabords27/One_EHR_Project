
import React, { useState, useEffect } from 'react';
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
import { User, Patient, Department } from './types';


const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [department, setDepartment] = useState<Department | null>(null);
  const [currentView, setCurrentView] = useState<'dashboard' | 'create' | 'view' | 'setup' | 'audit'>('dashboard');
  const [editRecordId, setEditRecordId] = useState<number | null>(null);
  const [activePatient, setActivePatient] = useState<Patient | null>(null);
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('dl_suite_user');
    const savedDept = localStorage.getItem('dl_suite_dept');
    
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser) as User;
      setUser(parsedUser);
      
      if (savedDept) {
        setDepartment(savedDept as Department);
      } else if (parsedUser.defaultDepartment) {
        setDepartment(parsedUser.defaultDepartment as Department);
        localStorage.setItem('dl_suite_dept', parsedUser.defaultDepartment);
      }
    }
  }, []);

const handleLogin = (loggedInUser: User) => {
  setUser(loggedInUser);
  localStorage.setItem('dl_suite_user', JSON.stringify(loggedInUser));

  if (loggedInUser.defaultDepartment) {
    handleSelectDepartment(loggedInUser.defaultDepartment as Department);
  }
};

  const handleSelectDepartment = (dept: Department) => {
    setDepartment(dept);
    localStorage.setItem('dl_suite_dept', dept);
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
    localStorage.removeItem('dl_suite_user');
    localStorage.removeItem('dl_suite_dept');
    setIsSignOutModalOpen(false);
    setActivePatient(null);
  };

  const navigateTo = (view: 'dashboard' | 'create' | 'view' | 'setup' | 'audit', id: number | null = null, patient: Patient | null = null) => {
    setCurrentView(view);
    setEditRecordId(id);
    if (patient) setActivePatient(patient);
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  if (!department) {
    return (
      <>
        <ModuleSelection 
          userName={user.fullName} 
          onSelectDepartment={handleSelectDepartment} 
          onLogout={() => setIsSignOutModalOpen(true)} 
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
          <Dashboard onNavigate={navigateTo} department={department} setActivePatient={setActivePatient} />
        )}
        {currentView === 'create' && (
          <RecordForm 
            onSuccess={() => navigateTo('view')} 
            editId={editRecordId} 
            selectedPatient={activePatient}
            onCancel={() => navigateTo('dashboard')}
            department={department}
            setActivePatient={setActivePatient}
            user={user}
          />
        )}
        {currentView === 'view' && (
          <RecordList 
            user={user} 
            onEdit={(id) => navigateTo('create', id)} 
          />
        )}
        {currentView === 'setup' && (
          <Setup />
        )}
        {currentView === 'audit' && (
          <AuditTrail />
        )}
      </Layout>
      
      {activePatient && (
        <>
          <ProgressNotesModule 
            patient={activePatient} 
            user={user} 
            onClose={() => setActivePatient(null)} 
          />
          <CourseInWardModule 
            patient={activePatient} 
            user={user} 
            onClose={() => setActivePatient(null)} 
          />
        </>
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
