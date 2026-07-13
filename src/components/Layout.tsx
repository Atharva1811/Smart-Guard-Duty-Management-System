import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* Sidebar navigation */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      {/* Main content wrapper */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Navbar */}
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-background flex flex-col justify-between">
          <div className="flex-1">
            {children}
          </div>
          <footer className="mt-8 pt-6 border-t border-border/60 text-center text-xs text-muted-foreground/80 no-print select-none tracking-wide">
            Made with <span className="text-rose-500 animate-pulse inline-block">❤️</span> by Atharva Deshmukh
          </footer>
        </main>
      </div>
    </div>
  );
};
export default Layout;
