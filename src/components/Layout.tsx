import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { Menu, X } from 'lucide-react';
import { cn } from '../lib/utils';

export const Layout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  
  const getPageTitle = (path: string) => {
    switch (path) {
      case '/': return 'Overview';
      case '/documents': return 'Documents';
      case '/analysis': return 'Analysis';
      case '/limits': return 'Usage Limits';
      case '/settings': return 'Settings';
      case '/pricing': return 'Pricing & Plans';
      default: return 'LexiAnalyse';
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-brand-primary/40 backdrop-blur-sm z-[55] lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - responsive */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-[60] transition-transform duration-300 transform lg:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <Sidebar onClose={() => setIsSidebarOpen(false)} />
      </div>

      <TopBar 
        title={getPageTitle(location.pathname)} 
        onMenuClick={() => setIsSidebarOpen(true)}
      />

      <main className="lg:ml-[260px] pt-16 min-h-screen">
        <div className="max-w-[1440px] mx-auto p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
