// client/src/components/Sidebar.tsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { useTranslation } from '../context/LanguageContext.tsx';
import { 
  LayoutDashboard, 
  CalendarDays, 
  ShieldAlert, 
  MapPin, 
  Clock, 
  FileCheck, 
  BarChart3, 
  Users, 
  Settings, 
  LogOut,
  X
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const { t, language, setLanguage } = useTranslation();

  const handleLangToggle = () => {
    setLanguage(language === 'en' ? 'mr' : 'en');
  };

  const navItems = [
    { to: '/', label: t('dashboard'), icon: LayoutDashboard, roles: ['ADMIN', 'SUPERVISOR', 'VIEWER'] },
    { to: '/duty', label: t('todaysDuty'), icon: CalendarDays, roles: ['ADMIN', 'SUPERVISOR', 'VIEWER'] },
    { to: '/guards', label: t('guards'), icon: ShieldAlert, roles: ['ADMIN', 'SUPERVISOR', 'VIEWER'] },
    { to: '/locations', label: t('locations'), icon: MapPin, roles: ['ADMIN', 'SUPERVISOR', 'VIEWER'] },
    { to: '/availability', label: t('availability'), icon: Clock, roles: ['ADMIN', 'SUPERVISOR'] },
    { to: '/leaves', label: t('leaves'), icon: FileCheck, roles: ['ADMIN', 'SUPERVISOR', 'VIEWER'] },
    { to: '/reports', label: t('reports'), icon: BarChart3, roles: ['ADMIN', 'SUPERVISOR', 'VIEWER'] },
    { to: '/users', label: t('users'), icon: Users, roles: ['ADMIN'] },
    { to: '/settings', label: t('settings'), icon: Settings, roles: ['ADMIN', 'SUPERVISOR'] },
  ];

  const visibleItems = navItems.filter(item => user && item.roles.includes(user.role));

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed bottom-0 top-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-card px-4 py-6 transition-transform duration-300 lg:static lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between pb-6">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded bg-primary flex items-center justify-center font-extrabold text-white text-lg">SG</div>
            <h1 className="text-md font-bold tracking-tight">{t('loginTitle')}</h1>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted lg:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto">
          {visibleItems.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                  ${isActive 
                    ? 'bg-primary text-primary-foreground font-semibold shadow-sm' 
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'}
                `}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer Area */}
        <div className="border-t border-border pt-4 mt-4 space-y-3">
          <div className="flex items-center justify-between px-2 text-xs text-muted-foreground">
            <span>Profile: <strong>{user?.name.split(' ')[0]}</strong></span>
            <span className="px-1.5 py-0.5 rounded bg-muted font-bold text-[9px] uppercase">{user?.role}</span>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={handleLangToggle}
              className="flex-1 py-1.5 text-xs font-semibold rounded bg-muted hover:brightness-95 transition-all text-center"
            >
              {language === 'en' ? 'मराठी' : 'English'}
            </button>
            <button 
              onClick={logout}
              className="flex-1 py-1.5 text-xs font-semibold rounded bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all flex items-center justify-center gap-1"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>{t('logout')}</span>
            </button>
          </div>

          <p className="text-center text-[10px] text-muted-foreground/60 no-print">
            Made with ❤️ by Atharva Deshmukh
          </p>
        </div>
      </aside>
    </>
  );
};
