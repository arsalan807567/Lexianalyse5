import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { 
  confirmPasswordReset, 
  verifyPasswordResetCode, 
  applyActionCode,
  checkActionCode
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { 
  ShieldCheck, 
  Lock, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
  Mail
} from 'lucide-react';
import { PasswordStrength } from '../components/PasswordStrength';

export const AuthActionView: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const mode = searchParams.get('mode');
  const oobCode = searchParams.get('oobCode');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState('');
  
  // Reset Password State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!oobCode || !mode) {
      setError("Invalid or expired action link. Please request a new one.");
      setLoading(false);
      return;
    }

    const verifyCode = async () => {
      try {
        if (mode === 'resetPassword') {
          const userEmail = await verifyPasswordResetCode(auth, oobCode);
          setEmail(userEmail);
        } else if (mode === 'verifyEmail') {
          await applyActionCode(auth, oobCode);
          setSuccess(true);
        }
      } catch (err: any) {
        console.error("Action code verification error:", err);
        setError("The link has expired or has already been used. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    verifyCode();
  }, [mode, oobCode]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await confirmPasswordReset(auth, oobCode!, newPassword);
      setSuccess(true);
    } catch (err: any) {
      console.error("Password reset error:", err);
      setError("Failed to reset password. The link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-brand-secondary animate-spin" />
          <p className="text-slate-500 font-medium">Verifying security token...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        {/* Header Decoration */}
        <div className="h-2 bg-gradient-to-r from-brand-secondary to-brand-accent"></div>
        
        <div className="p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 bg-brand-primary rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-brand-primary/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              {mode === 'resetPassword' ? 'Create New Password' : 'Email Verified'}
            </h2>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-error/5 border border-error/20 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 text-error mt-0.5" />
              <p className="text-sm font-medium text-error">{error}</p>
            </div>
          )}

          {success ? (
            <div className="text-center space-y-6">
              <div className="flex justify-center flex-col items-center gap-4">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
                <div className="space-y-2">
                  <p className="text-slate-600 font-medium">
                    {mode === 'resetPassword' 
                      ? 'Your password has been successfully updated.' 
                      : 'Your email has been successfully verified.'}
                  </p>
                  <p className="text-sm text-slate-400">You can now sign in with your credentials.</p>
                </div>
              </div>
              
              <Link 
                to="/login"
                className="w-full bg-brand-secondary text-white py-3.5 rounded-lg font-bold hover:shadow-lg hover:shadow-blue-500/20 transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
              >
                Go to Sign In
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : mode === 'resetPassword' ? (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg flex items-center gap-3">
                <Mail className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-600">{email}</span>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">New Password</label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-11 pr-11 py-3 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-brand-secondary transition-all text-slate-900 placeholder:text-slate-400"
                    placeholder="••••••••"
                    required
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                </div>
                <PasswordStrength password={newPassword} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Confirm New Password</label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-11 pr-11 py-3 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-brand-secondary transition-all text-slate-900 placeholder:text-slate-400"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <button 
                disabled={loading}
                className="w-full bg-brand-secondary text-white py-3.5 rounded-lg font-bold hover:shadow-lg hover:shadow-blue-500/20 transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Update Password</span>}
              </button>
            </form>
          ) : (
            <div className="text-center py-4">
              <p className="text-slate-500">Processing your verification request...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
