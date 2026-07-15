// client/src/App.tsx
import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { LanguageProvider } from './context/LanguageContext.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { Navbar } from './components/Navbar.tsx';
import { Loader } from './components/Loader.tsx';

// Pages
import { Login } from './pages/Login.tsx';
import { Dashboard } from './pages/Dashboard.tsx';
import { TodayDuty } from './pages/TodayDuty.tsx';
import { Guards } from './pages/Guards.tsx';
import { Locations } from './pages/Locations.tsx';
import { Availability } from './pages/Availability.tsx';
import { Leaves } from './pages/Leaves.tsx';
import { Reports } from './pages/Reports.tsx';
import { Users } from './pages/Users.tsx';
import { Settings } from './pages/Settings.tsx';
import { AuditDrawer } from './components/AuditDrawer.tsx';

// 1. Protected Route Guard
const ProtectedLayout: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);

  if (isLoading) return <Loader />;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar 
          onMenuClick={() => setSidebarOpen(true)} 
          onAuditClick={() => setAuditOpen(!auditOpen)}
        />
        
        <main className="flex-1 overflow-y-auto p-6 bg-background/40">
          <Outlet context={{ auditOpen, setAuditOpen }} />
        </main>
      </div>

      <AuditDrawer isOpen={auditOpen} onClose={() => setAuditOpen(false)} />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            {/* Protected Routes inside layout */}
            <Route element={<ProtectedLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/duty" element={<TodayDuty />} />
              <Route path="/guards" element={<Guards />} />
              <Route path="/locations" element={<Locations />} />
              <Route path="/availability" element={<Availability />} />
              <Route path="/leaves" element={<Leaves />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/users" element={<Users />} />
              <Route path="/settings" element={<Settings />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </LanguageProvider>
  );
};

export default App;
