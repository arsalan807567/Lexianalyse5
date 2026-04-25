import React, { useState } from 'react';
import { Mail, Lock, Loader2, ShieldCheck, ArrowRight, CheckCircle2, User as UserIcon, AlertCircle } from 'lucide-react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  sendEmailVerification,
  updateProfile,
  signOut,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { PasswordStrength } from '../components/PasswordStrength';

export const AuthView: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address to reset your password.");
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMessage("Password reset link sent! Please check your inbox and your spam folder if you don't see it.");
      setIsResetPassword(false);
    } catch (err: any) {
      console.error("Password reset error:", err);
      let message = "An unexpected error occurred. Please try again.";
      if (err.code === 'auth/user-not-found') {
        message = "No account exists with this email identity.";
      } else if (err.code === 'auth/invalid-email') {
        message = "Please enter a valid email address.";
      } else if (err.message) {
        message = err.message;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        if (!userCredential.user.emailVerified) {
          setNeedsVerification(true);
          // We don't sign out yet so we can resend verification if they ask
          setError("Verification Required. Please confirm your email to access the system.");
        } else {
          navigate('/');
        }
      } else {
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match.");
        }
        if (password.length < 8) {
          throw new Error("Password must be at least 8 characters.");
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Professional naming from email
        const namePart = email.split('@')[0];
        const displayName = namePart
          .split(/[._-]/)
          .map(part => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' ');

        await updateProfile(userCredential.user, { displayName });
        await sendEmailVerification(userCredential.user);
        
        setSuccessMessage("Account registered successfully. A verification link has been sent to your email. Please check your inbox and spam folder.");
        setIsLogin(true);
        setNeedsVerification(true);
      }
    } catch (err: any) {
      console.error("Authentication session error:", err);
      let message = "An unexpected error occurred. Please try again.";
      
      const errorCode = err.code;
      
      if (errorCode === 'auth/invalid-credential' || errorCode === 'auth/wrong-password' || errorCode === 'auth/user-not-found') {
        message = "The email or password you entered is incorrect. Please check your credentials and try again.";
      } else if (errorCode === 'auth/email-already-in-use') {
        message = "This email is already registered. Please sign in instead.";
      } else if (errorCode === 'auth/weak-password') {
        message = "Your password is too weak. Please use at least 8 characters.";
      } else if (errorCode === 'auth/too-many-requests') {
        message = "Too many failed attempts. Please try again in a few minutes.";
      } else if (errorCode === 'auth/user-disabled') {
        message = "This account has been disabled. Please contact support.";
      } else if (errorCode === 'auth/network-request-failed') {
        message = "Network error. Please check your internet connection.";
      } else if (err.message) {
        message = err.message;
      }
      
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (!auth.currentUser) {
      setError("Please sign in again to request a new link.");
      setNeedsVerification(false);
      return;
    }
    
    setLoading(true);
    try {
      await sendEmailVerification(auth.currentUser);
      setSuccessMessage("A fresh verification link has been sent to your inbox. Be sure to check your spam folder.");
      setError(null);
    } catch (err: any) {
      console.error("Resend email error:", err);
      let message = "Failed to send verification email. Please try again later.";
      if (err.code === 'auth/too-many-requests') {
        message = "You've made too many requests. Please wait a moment.";
      } else if (err.message) {
        message = err.message;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      navigate('/');
    } catch (err: any) {
      console.error("Google sign-in error:", err);
      let message = "Google authentication failed. Please try again.";
      if (err.code === 'auth/popup-closed-by-user') {
        message = "Authentication was cancelled.";
      } else if (err.message) {
        message = err.message;
      }
      setError(message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-[440px] bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200 overflow-hidden">
        <div className="p-10 border-b border-slate-100 flex flex-col items-center">
          <div className="w-12 h-12 bg-brand-primary rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            {isResetPassword ? 'Reset Password' : (isLogin ? 'Sign in to LexiAnalyse' : 'Create your account')}
          </h2>
          <p className="text-slate-500 text-sm mt-2 text-center">
            {isResetPassword 
              ? 'Enter your email to receive a secure password reset link.' 
              : 'Enter your credentials to access the analysis terminal.'
            }
          </p>
        </div>

        <div className="p-10 space-y-8">
          {needsVerification ? (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
                <Mail className="w-8 h-8 text-brand-secondary" />
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-slate-900">Verify your email</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  We've sent a secure link to <span className="font-bold text-slate-900">{email}</span>. 
                  Please follow the instructions in the email to activate your account.
                </p>
                <p className="text-amber-600 text-xs font-bold bg-amber-50 p-2 rounded-lg border border-amber-100 flex items-center justify-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Don't see it? Check your spam folder.
                </p>
              </div>
              <div className="space-y-3">
                <button 
                  onClick={() => setNeedsVerification(false)}
                  className="w-full py-3 px-4 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                >
                  Return to Sign In <ArrowRight className="w-4 h-4" />
                </button>
                <button 
                  onClick={handleResendEmail}
                  disabled={loading}
                  className="w-full py-3 px-4 bg-white border border-slate-200 text-slate-600 rounded-lg font-semibold hover:bg-slate-50 transition-all text-sm disabled:opacity-50"
                >
                  {loading ? 'Sending...' : "Didn't receive it? Resend link"}
                </button>
              </div>
            </div>
          ) : isResetPassword ? (
            <form onSubmit={handleForgotPassword} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-brand-secondary transition-all text-slate-900 placeholder:text-slate-400"
                    placeholder="name@company.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-3">
                <button 
                  disabled={loading}
                  className="w-full bg-brand-secondary text-white py-3.5 rounded-lg font-bold hover:shadow-lg hover:shadow-blue-500/20 transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Send Reset Link</span>}
                </button>
                <button 
                  type="button"
                  onClick={() => setIsResetPassword(false)}
                  className="w-full py-3 px-4 text-slate-500 hover:text-slate-700 transition-all text-sm font-medium"
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          ) : (
            <>
              <form onSubmit={handleEmailAuth} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Email Address</label>
                  <div className="relative group">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-brand-secondary transition-all text-slate-900 placeholder:text-slate-400"
                      placeholder="name@company.com"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-slate-700">Password</label>
                    {isLogin && (
                      <button 
                        type="button"
                        onClick={() => {
                          setIsResetPassword(true);
                          setError(null);
                          setSuccessMessage(null);
                        }}
                        className="text-xs font-bold text-brand-secondary hover:underline"
                      >
                        Forgot Password?
                      </button>
                    )}
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-brand-secondary transition-all text-slate-900 placeholder:text-slate-400"
                      placeholder="Min. 8 characters"
                      required
                    />
                  </div>
                  {!isLogin && <PasswordStrength password={password} />}
                </div>

                {!isLogin && (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Confirm Password</label>
                    <div className="relative group">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                      <input 
                        type="password" 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-brand-secondary transition-all text-slate-900 placeholder:text-slate-400"
                        placeholder="••••••••••••"
                        required
                      />
                    </div>
                  </div>
                )}

                <button 
                  disabled={loading}
                  className="w-full bg-brand-secondary text-white py-3.5 rounded-lg font-bold hover:shadow-lg hover:shadow-blue-500/20 transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-slate-100"></div>
                <span className="flex-shrink mx-4 text-slate-300 text-xs font-bold uppercase tracking-widest">or</span>
                <div className="flex-grow border-t border-slate-100"></div>
              </div>

              <button 
                onClick={signInWithGoogle}
                className="w-full flex items-center justify-center gap-3 border border-slate-200 py-3 rounded-lg hover:bg-slate-50 transition-all font-semibold text-slate-700 active:scale-[0.99]"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
                Continue with Google
              </button>

              {(error || successMessage) && (
                <div className={cn(
                  "p-4 rounded-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-1",
                  error ? "bg-red-50 text-red-700 border border-red-100" : "bg-green-50 text-green-700 border border-green-100"
                )}>
                  {error ? <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" /> : <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />}
                  <p className="text-sm font-medium">{error || successMessage}</p>
                </div>
              )}

              <p className="text-center text-sm text-slate-500 font-medium">
                {isLogin ? "Don't have an account?" : "Already have an account?"}
                <button 
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError(null);
                    setSuccessMessage(null);
                  }}
                  className="text-brand-secondary font-bold ml-1.5 hover:underline decoration-2 underline-offset-4"
                >
                  {isLogin ? 'Sign Up' : 'Sign In'}
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
