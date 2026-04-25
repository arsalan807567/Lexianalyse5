import React, { useState } from 'react';
import { useLocation, Navigate, NavLink } from 'react-router-dom';
import { 
  FileText, 
  Calendar, 
  CreditCard, 
  Gavel, 
  AlertCircle, 
  CheckCircle, 
  HelpCircle,
  Download,
  Share2,
  ExternalLink,
  ShieldAlert,
  Info,
  Languages,
  Loader2
} from 'lucide-react';
import { AnalysisSummary } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { analyzeDocument } from '../services/geminiService';

export const AnalysisResultView: React.FC = () => {
  const location = useLocation();
  const [isTranslating, setIsTranslating] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [viewLanguage, setViewLanguage] = useState('Default');
  const state = location.state as { analysis: AnalysisSummary; docName: string; docType: any; rawContent?: any } | null;

  if (!state) {
    return <Navigate to="/documents" />;
  }

  const { analysis: initialAnalysis, docName, docType, rawContent } = state;
  const [analysis, setAnalysis] = useState(initialAnalysis);

  const handleTranslate = async (lang: string) => {
    if (lang === viewLanguage) return;
    if (!rawContent) {
      alert("Original document content is not available for re-translation in this session. Please re-upload if needed.");
      return;
    }
    
    setIsTranslating(true);
    try {
      const translated = await analyzeDocument(rawContent, docType, lang);
      setAnalysis(translated);
      setViewLanguage(lang);
    } catch (err) {
      console.error("Translation failed", err);
      alert("Failed to translate the document. Please try again.");
    } finally {
      setIsTranslating(false);
    }
  };

  const languages = ['English', 'Arabic', 'French', 'Spanish', 'German', 'Chinese', 'Hindi', 'Russian', 'Portuguese', 'Japanese', 'Korean', 'Urdu'];

  return (
    <div className="space-y-8">
      {/* Header Area */}
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="bg-brand-primary text-white text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-widest">
              Document ID: #EC-{Math.floor(Math.random() * 9000) + 1000}
            </span>
            <span className="text-slate-400 text-xs">Generated {new Date().toLocaleDateString()}</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-on-surface truncate max-w-full"> {docName} Analysis </h2>
          <p className="text-slate-500 mt-1 md:mt-2 text-sm">Deep legal review for {docType}.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <button 
              disabled={isTranslating}
              onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg font-medium hover:bg-slate-50 transition-all text-sm"
            >
              {isTranslating ? (
                <Loader2 className="w-4 h-4 animate-spin text-brand-secondary" />
              ) : (
                <Languages className="w-4 h-4 text-brand-secondary" />
              )}
              {viewLanguage === 'Default' ? 'Translate' : viewLanguage}
            </button>
            <AnimatePresence>
              {isLangMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsLangMenuOpen(false)}
                  />
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 top-full mt-2 bg-white border border-slate-200 shadow-2xl rounded-xl p-2 z-50 grid grid-cols-2 gap-1 w-48 origin-top-right"
                  >
                    {languages.map(lang => (
                      <button
                        key={lang}
                        onClick={() => {
                          handleTranslate(lang);
                          setIsLangMenuOpen(false);
                        }}
                        className="text-left px-3 py-1.5 text-xs hover:bg-brand-secondary/10 hover:text-brand-secondary rounded-lg font-medium transition-all"
                      >
                        {lang}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
          <button 
            onClick={async () => {
              const shareData = {
                title: `${docName} Analysis Report`,
                text: `Check out this analysis of ${docName} powered by LexiAnalyse AI.`,
                url: window.location.href,
              };
              try {
                if (navigator.share) {
                  await navigator.share(shareData);
                } else {
                  await navigator.clipboard.writeText(window.location.href);
                  alert("Link copied to clipboard!");
                }
              } catch (err) {
                console.error("Error sharing:", err);
              }
            }}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg font-medium hover:opacity-90 transition-all text-sm"
          >
            <Share2 className="w-4 h-4" />
            <span>Share</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Left Column */}
        <div className="col-span-12 lg:col-span-8 space-y-8">
          {/* Summary */}
          <section className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="text-brand-secondary w-6 h-6" />
              <h3 className="text-xl font-bold text-brand-primary">Simple Summary</h3>
            </div>
            <p className="text-on-surface leading-relaxed whitespace-pre-wrap">
              {analysis.simpleSummary}
            </p>
          </section>

          {/* Key Info Grid */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Parties Involved</p>
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-slate-400" />
                <span className="font-bold text-brand-primary">{analysis.keyInformation.parties}</span>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Important Dates</p>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-slate-400" />
                <span className="font-bold text-brand-primary">{analysis.keyInformation.dates}</span>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Payment Terms</p>
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-slate-400" />
                <span className="font-bold text-brand-primary">{analysis.keyInformation.paymentTerms}</span>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Responsibilities</p>
              <div className="flex items-center gap-3">
                <Gavel className="w-5 h-5 text-slate-400" />
                <span className="font-bold text-brand-primary">{analysis.keyInformation.responsibilities}</span>
              </div>
            </div>
          </section>

          {/* Clauses */}
          <section className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center gap-3">
              <Gavel className="text-brand-secondary w-6 h-6" />
              <h3 className="text-xl font-bold text-brand-primary">Important Clauses</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {analysis.clauses.map((clause, idx) => (
                <div key={idx} className="p-8 hover:bg-slate-50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-brand-primary">{clause.title}</h4>
                    <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-1 rounded-full font-bold">{clause.section}</span>
                  </div>
                  <p className="text-sm text-slate-600">{clause.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Things to Check carefully */}
          <section className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <HelpCircle className="text-brand-secondary w-6 h-6" />
              <h3 className="text-xl font-bold text-brand-primary">Things to Check Carefully</h3>
            </div>
            <div className="space-y-4">
              {analysis.checkCarefully.map((item, idx) => (
                <div key={idx} className="flex gap-4 p-4 rounded-lg bg-surface-low border-l-4 border-brand-secondary">
                  <Info className="w-5 h-5 text-brand-secondary shrink-0" />
                  <div>
                    <p className="font-bold text-brand-primary text-sm mb-1">{item.title}</p>
                    <p className="text-sm text-slate-600">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Questions */}
          <section className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <HelpCircle className="text-brand-secondary w-6 h-6" />
              <h3 className="text-xl font-bold text-brand-primary">Suggested Questions to Ask</h3>
            </div>
            <ul className="space-y-4">
              {analysis.questions.map((q, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="text-brand-secondary font-bold">•</span>
                  <p className="text-sm text-on-surface">{q}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Right Column */}
        <div className="col-span-12 lg:col-span-4 space-y-8">
          {/* Verdict Score */}
          <section className="bg-white rounded-xl border border-slate-200 p-8 shadow-md text-center">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Risk Assessment</p>
            <div className="flex flex-col items-center">
              <div className={cn(
                "w-32 h-32 rounded-full border-8 flex flex-col items-center justify-center mb-6",
                analysis.verdict.score === 'Safe' ? "border-emerald-100" : analysis.verdict.score === 'Moderate Risk' ? "border-amber-100" : "border-error-container"
              )}>
                <span className="text-3xl font-black text-brand-primary">{analysis.verdict.score === 'Safe' ? 'A+' : analysis.verdict.score === 'Moderate Risk' ? 'B-' : 'F'}</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Confidence {analysis.verdict.confidence}%</span>
              </div>
              <h4 className="text-2xl font-bold text-brand-primary mb-2">{analysis.verdict.score}</h4>
              <p className="text-sm text-slate-500 leading-relaxed">
                {analysis.verdict.reasoning}
              </p>
            </div>
          </section>

          {/* Risks */}
          <section className="bg-error-container/20 rounded-xl border border-error/20 p-8">
            <div className="flex items-center gap-3 mb-6">
              <ShieldAlert className="text-error w-6 h-6" />
              <h3 className="text-xl font-bold text-error">Red Flags</h3>
            </div>
            <div className="space-y-4">
              {analysis.risks.map((risk, idx) => (
                <div key={idx} className="p-4 bg-white rounded-lg border border-error/10 shadow-sm">
                  <p className="text-error font-bold text-sm mb-1">{risk.title}</p>
                  <p className="text-xs text-slate-500">{risk.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Benefits */}
          <section className="bg-emerald-50 rounded-xl border border-emerald-100 p-8">
            <div className="flex items-center gap-3 mb-6">
              <CheckCircle className="text-emerald-600 w-6 h-6" />
              <h3 className="text-xl font-bold text-emerald-800">Benefits</h3>
            </div>
            <div className="space-y-4">
              {analysis.benefits.map((benefit, idx) => (
                <div key={idx} className="p-4 bg-white rounded-lg border border-emerald-100 shadow-sm">
                  <p className="text-emerald-700 font-bold text-sm mb-1">{benefit.title}</p>
                  <p className="text-xs text-slate-500">{benefit.description}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      <footer className="mt-16 pt-8 border-t border-slate-200">
        <div className="bg-slate-100 p-6 rounded-lg flex gap-4">
          <Info className="w-5 h-5 text-slate-400 shrink-0" />
          <p className="text-xs text-slate-500 leading-relaxed italic">
            Disclaimer: This analysis is generated by LexiAnalyse AI for informational purposes only and does not constitute legal advice. While we strive for accuracy, AI-generated insights may contain errors or omissions. Users are strongly advised to consult with a qualified legal professional before signing any legally binding documents. LexiAnalyse assumes no liability for actions taken based on this report.
          </p>
        </div>
      </footer>
    </div>
  );
};
