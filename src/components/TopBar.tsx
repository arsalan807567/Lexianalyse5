import React from 'react';
import { Search, Bell, LogIn, LogOut, Menu, User as UserIcon, MessageSquare } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { logout } from '../lib/firebase';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { FeedbackModal } from './FeedbackModal';

interface TopBarProps {
  title: string;
  onMenuClick?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ title, onMenuClick }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [showConfirmLogout, setShowConfirmLogout] = React.useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = React.useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Logout failed:", error);
    }
    setShowConfirmLogout(false);
  };

  return (
    <header className="fixed top-0 right-0 w-full lg:w-[calc(100%-260px)] h-16 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 md:px-8">
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <button 
            onClick={onMenuClick}
            className="p-2 -ml-2 text-slate-500 lg:hidden hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
        )}
        <span className="text-base md:text-lg font-bold text-[#1A2B3C] truncate">{title}</span>
      </div>

      <div className="flex items-center space-x-3 md:space-x-6">
        <div className="relative hidden xl:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full text-sm w-64 focus:ring-2 focus:ring-brand-secondary/20 transition-all outline-none"
            placeholder="Search documents..."
            type="text"
          />
        </div>
        
        <button className="text-slate-500 hover:text-brand-secondary transition-colors relative">
          <Bell className="w-5 h-5 md:w-6 h-6" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-error rounded-full border-2 border-white"></span>
        </button>

        <button 
          onClick={() => setIsFeedbackOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-brand-secondary transition-all group"
        >
          <MessageSquare className="w-4 h-4" />
          <span className="text-[10px] font-bold uppercase tracking-wider hidden xs:block">Feedback</span>
        </button>

        <div className="flex items-center space-x-2 md:space-x-3 pl-2 md:pl-4 border-l border-slate-200">
          {!loading && user ? (
            <div className="flex items-center space-x-2 md:space-x-3">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] md:text-xs font-bold text-on-surface truncate max-w-[100px]">{user.displayName || 'Legal Pro'}</p>
                <p className="text-[8px] md:text-[10px] text-slate-500 truncate max-w-[100px]">{user.email}</p>
              </div>
              <div className="w-7 h-7 md:w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center bg-slate-50 text-slate-400">
                <UserIcon className="w-4 h-4 md:w-5 h-5" />
              </div>
              
              <div className="relative">
                <button 
                  onClick={() => setShowConfirmLogout(!showConfirmLogout)}
                  className="p-1.5 text-slate-400 hover:text-error transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>

                {showConfirmLogout && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in duration-200">
                    <p className="text-[10px] font-bold text-slate-700 px-2 py-1 mb-2 border-b border-slate-100">Confirm Sign Out?</p>
                    <div className="flex flex-col gap-1">
                      <button 
                        onClick={handleLogout}
                        className="w-full text-left px-2 py-1.5 text-[10px] font-bold text-error hover:bg-error/5 rounded transition-colors flex items-center gap-2"
                      >
                        <LogOut className="w-3 h-3" />
                        Yes, Sign Out
                      </button>
                      <button 
                        onClick={() => setShowConfirmLogout(false)}
                        className="w-full text-left px-2 py-1.5 text-[10px] font-bold text-slate-500 hover:bg-slate-50 rounded transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <button 
              onClick={() => navigate('/login')}
              disabled={loading}
              className="flex items-center gap-2 px-3 md:px-4 py-1.5 bg-brand-secondary text-white rounded-lg text-[10px] md:text-xs font-bold hover:opacity-90 transition-opacity"
            >
              <LogIn className="w-4 h-4 hidden xs:block" />
              Sign In
            </button>
          )}
        </div>
      </div>
      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
    </header>
  );
};
