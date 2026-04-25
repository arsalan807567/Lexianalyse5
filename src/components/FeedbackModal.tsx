import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, 
  X, 
  Send, 
  Star, 
  Bug, 
  Lightbulb, 
  MessageCircle,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { cn } from '../lib/utils';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type FeedbackType = 'bug' | 'feature' | 'general';

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  const [type, setType] = useState<FeedbackType>('general');
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !auth.currentUser) return;

    setLoading(true);
    try {
      const feedbackId = `fb-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const feedbackRef = doc(collection(db, 'feedback'), feedbackId);
      
      const payload: any = {
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email,
        type,
        message: message.trim(),
        createdAt: serverTimestamp(),
      };

      if (rating > 0) {
        payload.rating = rating;
      }

      await setDoc(feedbackRef, payload);
      setSubmitted(true);
      setTimeout(() => {
        onClose();
        // Reset after animation
        setTimeout(() => {
          setSubmitted(false);
          setMessage('');
          setRating(0);
          setType('general');
        }, 300);
      }, 2000);
    } catch (error) {
      console.error("Error submitting feedback:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60]"
          />
          
          {/* Modal */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-2xl z-[70] overflow-hidden"
          >
            <div className="relative p-6">
              <button 
                onClick={onClose}
                className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {submitted ? (
                <div className="py-12 flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold text-slate-900">Thank you!</h3>
                    <p className="text-slate-500">Your feedback helps us improve LexiAnalyse.</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-brand-primary/10 rounded-xl flex items-center justify-center text-brand-primary">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">Share Feedback</h2>
                      <p className="text-sm text-slate-500">Help us make the service better.</p>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Feedback Type */}
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'general', icon: MessageCircle, label: 'General' },
                        { id: 'bug', icon: Bug, label: 'Bug' },
                        { id: 'feature', icon: Lightbulb, label: 'Feature' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setType(item.id as FeedbackType)}
                          className={cn(
                            "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all",
                            type === item.id 
                              ? "border-brand-primary bg-brand-primary/5 text-brand-primary" 
                              : "border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200"
                          )}
                        >
                          <item.icon className="w-5 h-5" />
                          <span className="text-xs font-bold">{item.label}</span>
                        </button>
                      ))}
                    </div>

                    {/* Rating */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Experience Rating</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            onClick={() => setRating(star)}
                            className="transition-transform active:scale-90"
                          >
                            <Star 
                              className={cn(
                                "w-7 h-7 transition-colors",
                                (hoverRating || rating) >= star 
                                  ? "fill-yellow-400 text-yellow-400" 
                                  : "text-slate-200"
                              )} 
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Message */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Message</label>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder={
                          type === 'bug' ? "Describe the issue..." : 
                          type === 'feature' ? "What should we add?" : 
                          "Your thoughts..."
                        }
                        className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary/10 focus:border-brand-primary transition-all resize-none text-slate-900 placeholder:text-slate-400"
                        required
                      />
                    </div>

                    <button
                      disabled={loading || !message.trim()}
                      className="w-full h-12 bg-brand-secondary text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-blue-500/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
                    >
                      {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Submit Feedback
                        </>
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
