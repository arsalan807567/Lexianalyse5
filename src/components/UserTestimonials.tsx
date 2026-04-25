import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Star, Quote, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface Feedback {
  id: string;
  userEmail: string;
  message: string;
  rating: number;
  type: string;
  createdAt: any;
}

export const UserTestimonials: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Query for "good" feedbacks (rating >= 4)
    const feedbackRef = collection(db, 'feedback');
    const q = query(
      feedbackRef,
      where('rating', '>=', 4),
      orderBy('rating', 'desc'),
      orderBy('createdAt', 'desc'),
      limit(6)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Feedback[];
      setFeedbacks(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching testimonials:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return (
    <div className="flex justify-center p-12">
      <div className="w-8 h-8 border-4 border-brand-secondary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (feedbacks.length === 0) return null;

  return (
    <section className="py-12">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-brand-primary/10 rounded-xl flex items-center justify-center text-brand-primary">
          <MessageSquare className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">What Our Users Say</h2>
          <p className="text-sm text-slate-500">Real feedback from legal professionals and business owners.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {feedbacks.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative group"
            >
              <Quote className="absolute top-4 right-4 w-10 h-10 text-slate-50 opacity-10 group-hover:opacity-20 transition-opacity" />
              
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={cn(
                      "w-4 h-4",
                      i < item.rating ? "fill-yellow-400 text-yellow-400" : "text-slate-200"
                    )} 
                  />
                ))}
              </div>

              <p className="text-slate-600 text-sm leading-relaxed mb-6 italic">
                "{item.message}"
              </p>

              <div className="flex items-center gap-3 pt-4 border-t border-slate-50">
                <div className="w-8 h-8 bg-brand-secondary/10 rounded-full flex items-center justify-center text-brand-secondary font-bold text-xs">
                  {item.userEmail?.[0].toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">
                    {item.userEmail?.split('@')[0].replace(/[^a-zA-Z]/g, ' ').trim() || 'Anonymous User'}
                  </p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">Verified User</p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
};
