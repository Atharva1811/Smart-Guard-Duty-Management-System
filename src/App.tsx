import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { LanguageProvider } from "./context/LanguageContext";
import Layout from "./components/Layout";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { TodayDuty } from "./pages/TodayDuty";
import { Guards } from "./pages/Guards";
import { Locations } from "./pages/Locations";
import { Availability } from "./pages/Availability";
import { Leaves } from "./pages/Leaves";
import { Reports } from "./pages/Reports";
import { Users } from "./pages/Users";
import { Settings } from "./pages/Settings";
import { dbHub } from "./db/dbHub";

// Protect route checking for active session
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen w-screen flex items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-xs font-semibold text-muted-foreground">Initializing Security Terminal...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Layout>{children}</Layout>;
};

// Public route preventing logged in users from seeing login screen
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  React.useEffect(() => {
    const initPull = async () => {
      try {
        await dbHub.pullCloudData();
      } catch {
        // Silent catch
      }
    };
    initPull();
  }, []);

  return (
    <LanguageProvider>
      <Router basename="/Smart-Guard-Duty-Management-System">
        <ThemeProvider>
          <AuthProvider>
          <Routes>
            {/* Public authentication */}
            <Route 
              path="/login" 
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } 
            />

            {/* Protected dashboard endpoints */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/duty" 
              element={
                <ProtectedRoute>
                  <TodayDuty />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/guards" 
              element={
                <ProtectedRoute>
                  <Guards />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/locations" 
              element={
                <ProtectedRoute>
                  <Locations />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/availability" 
              element={
                <ProtectedRoute allowedRoles={["Admin", "Supervisor"]}>
                  <Availability />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/leaves" 
              element={
                <ProtectedRoute>
                  <Leaves />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/reports" 
              element={
                <ProtectedRoute>
                  <Reports />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/users" 
              element={
                <ProtectedRoute allowedRoles={["Admin"]}>
                  <Users />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute allowedRoles={["Admin", "Supervisor"]}>
                  <Settings />
                </ProtectedRoute>
              } 
            />

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </AuthProvider>
        </ThemeProvider>
      </Router>
    </LanguageProvider>
  );
};

export default App;
