import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  BarChart3, 
  Gauge, 
  Settings, 
  HelpCircle, 
  Headset, 
  PlusCircle,
  X
} from 'lucide-react';
import { cn } from '../lib/utils';

import { useAuth } from '../contexts/AuthContext';

export const Sidebar: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const { userProfile } = useAuth();
  
  const usageCount = userProfile?.usageCount || 0;
  const usageLimit = userProfile?.plan === 'pro' ? 1000 : 5; // Free plan has 5, Pro has 1000 (soft limit)
  const usagePercent = (usageCount / usageLimit) * 100;

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { name: 'Documents', icon: FileText, path: '/documents' },
    { name: 'Analysis', icon: BarChart3, path: '/analysis' },
    { name: 'Limits', icon: Gauge, path: '/limits' },
    { name: 'Support', icon: Headset, path: '/support' },
    { name: 'Settings', icon: Settings, path: '/settings' },
  ];

  return (
    <aside className="h-full w-[260px] border-r border-white/10 bg-[#1A2B3C] shadow-xl flex flex-col py-8 z-50">
      <div className="px-6 mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">LexiAnalyse</h1>
          <p className="text-[10px] text-on-primary-container uppercase tracking-widest font-semibold mt-1">AI Document Analysis</p>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="lg:hidden p-2 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            onClick={onClose}
            className={({ isActive }) => cn(
              "flex items-center px-6 py-3 text-slate-400 hover:text-white hover:bg-white/10 transition-all border-l-4 border-transparent",
              isActive && "border-blue-500 bg-white/5 text-white font-semibold"
            )}
          >
            <item.icon className="w-5 h-5 mr-3" />
            <span className="text-sm"> {item.name} </span>
          </NavLink>
        ))}
      </nav>

      <div className="px-6 mt-auto">
        <div className="bg-white/5 rounded-xl p-4 mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-slate-400 font-medium">Monthly Usage</span>
            <span className="text-xs text-white font-bold">{usageCount}/{userProfile?.plan === 'pro' || userProfile?.plan === 'professional' ? 'Unlimited' : usageLimit}</span>
          </div>
          <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden mb-3">
            <div 
              className="bg-brand-secondary h-full transition-all duration-500" 
              style={{ width: `${userProfile?.plan === 'pro' || userProfile?.plan === 'professional' ? 0 : usagePercent}%` }} 
            />
          </div>
          <NavLink 
            to="/pricing"
            className="block w-full py-2 bg-brand-secondary text-white text-center text-xs font-bold rounded-lg hover:bg-blue-500 transition-colors"
          >
            Upgrade Plan
          </NavLink>
        </div>

        <div className="space-y-1">
          <NavLink to="/support" className="flex items-center py-2 text-slate-400 hover:text-white transition-colors">
            <HelpCircle className="w-4 h-4 mr-3" />
            <span className="text-xs">Help Center</span>
          </NavLink>
          <NavLink to="/support" className="flex items-center py-2 text-slate-400 hover:text-white transition-colors">
            <Headset className="w-4 h-4 mr-3" />
            <span className="text-xs">Contact Support</span>
          </NavLink>
        </div>
      </div>
    </aside>
  );
};
