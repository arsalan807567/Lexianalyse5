import React from 'react';
import { Mail, MessageCircle, Phone, Clock, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';

export const SupportView: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-12 py-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-black text-brand-primary">Customer Support</h1>
        <p className="text-slate-500 text-lg">We're here to help you with your document analysis needs.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* WhatsApp Support */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-50 border border-emerald-100 rounded-2xl p-8 flex flex-col items-center text-center group hover:shadow-lg transition-all"
        >
          <div className="w-16 h-16 bg-emerald-500 text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
            <MessageCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-emerald-900 mb-2">WhatsApp Support</h2>
          <p className="text-emerald-700/70 mb-6 font-medium">Quick responses for urgent technical queries or billing questions.</p>
          <a 
            href="https://wa.me/0565657738" 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-full py-4 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
          >
            Chat on WhatsApp
            <ExternalLink className="w-4 h-4" />
          </a>
          <p className="mt-4 text-emerald-900 font-bold">0565657738</p>
        </motion.div>

        {/* Email Support */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-brand-primary/5 border border-brand-primary/10 rounded-2xl p-8 flex flex-col items-center text-center group hover:shadow-lg transition-all"
        >
          <div className="w-16 h-16 bg-brand-primary text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-brand-primary/20 group-hover:scale-110 transition-transform">
            <Mail className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-brand-primary mb-2">Email Support</h2>
          <p className="text-slate-500 mb-6 font-medium">Detailed support for enterprise queries and complex document issues.</p>
          <a 
            href="mailto:lexianalyse.team@gmail.com" 
            className="w-full py-4 bg-brand-primary text-white rounded-xl font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
          >
            Send Email
            <ExternalLink className="w-4 h-4" />
          </a>
          <p className="mt-4 text-brand-primary font-bold">lexianalyse.team@gmail.com</p>
        </motion.div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-6">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Response Time</h3>
            <p className="text-slate-500">We typically respond within 2-4 hours during business days.</p>
          </div>
        </div>
        <div className="text-center md:text-right">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Office Hours</p>
          <p className="font-bold text-brand-primary">Mon - Fri: 9:00 AM - 6:00 PM</p>
        </div>
      </div>
    </div>
  );
};
