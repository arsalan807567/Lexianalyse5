import React, { useState, useRef } from 'react';
import { 
  CloudUpload, 
  Settings2, 
  Languages, 
  Zap, 
  Lock, 
  Info, 
  ArrowRight,
  ShieldCheck,
  LogIn,
  FileText,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useLocation } from 'react-router-dom';
import * as pdfjsLib from 'pdfjs-dist';
import { analyzeDocument } from '../services/geminiService';
import { DocumentType } from '../types';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { signInWithGoogle, db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export const UploadView: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [docType, setDocType] = useState<DocumentType>('Contract');
  const [language, setLanguage] = useState('English');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  const docTypeDescriptions: Record<string, string> = {
    'Contract': 'Focuses on obligations, termination clauses, and liability risks.',
    'Legal Document': 'Optimized for general legal review and structural verification.',
    'Business Agreement': 'Targets commercial terms, SLAs, and partnership performance metrics.',
    'Invoice': 'Prioritizes data extraction, tax verification, and line-item accuracy.',
    'Government Form': 'Enforces compliance check, data field integrity, and submission requirements.',
    'Other': 'Provides general semantic understanding and layout extraction.'
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      generatePreview(selectedFile);
    }
  };

  const generatePreview = async (selectedFile: File) => {
    setIsPreviewLoading(true);
    setPreviewUrl(null);

    if (selectedFile.type.startsWith('image/')) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      setIsPreviewLoading(false);
    } else if (selectedFile.type === 'application/pdf') {
      try {
        const arrayBuffer = await selectedFile.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);
        
        const scale = 1.0;
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        // Target preview size
        const targetWidth = 300;
        const responsiveScale = targetWidth / viewport.width;
        const finalViewport = page.getViewport({ scale: responsiveScale });
        
        canvas.height = finalViewport.height;
        canvas.width = finalViewport.width;

        await page.render({ 
          canvasContext: context!, 
          viewport: finalViewport,
          canvas: canvas
        }).promise;
        setPreviewUrl(canvas.toDataURL());
      } catch (err) {
        console.error("PDF preview error:", err);
      } finally {
        setIsPreviewLoading(false);
      }
    } else {
      setIsPreviewLoading(false);
    }
  };

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
    setPreviewUrl(null);
  };

  const handleUpload = async () => {
    if (!user) {
      setError("Please sign in to analyze documents.");
      return;
    }
    if (!file) {
      setError("Please select a file first.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("File is too large. Max limit is 5MB.");
      return;
    }

    const isPro = userProfile?.plan === 'pro' || userProfile?.plan === 'professional';
    const usageLimit = isPro ? Infinity : 5;

    if (!isPro && (userProfile?.usageCount || 0) >= usageLimit) {
      setError("You have reached your monthly analysis limit. Please upgrade your plan for more analyses.");
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const reader = new FileReader();
      
      const contentPromise = new Promise<string | { data: string; mimeType: string }>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
            const base64 = result.split(',')[1];
            resolve({ data: base64, mimeType: file.type });
          } else {
            resolve(result);
          }
        };
        reader.onerror = reject;
        
        if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
          reader.readAsDataURL(file);
        } else {
          reader.readAsText(file);
        }
      });

      const content = await contentPromise;
      const analysis = await analyzeDocument(content, docType, language);
      
      // Save to Firestore
      const analysisData = {
        userId: user.uid,
        docName: file.name,
        docType: docType,
        result: analysis,
        createdAt: serverTimestamp()
      };

      const analysesRef = collection(db, 'users', user.uid, 'analyses');
      await addDoc(analysesRef, analysisData);

      // Update usage count
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        usageCount: increment(1)
      });
      
      navigate('/results', { state: { analysis, docName: file.name, docType, rawContent: content } });
    } catch (err: any) {
      console.error(err);
      setError("Failed to analyze document. Please check your API key or file format.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-brand-primary">Upload Document</h1>
        <p className="text-slate-500 mt-2">Securely upload and configure your documents for deep semantic analysis.</p>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Upload Area */}
        <div className="col-span-12 lg:col-span-8">
          <div className="bg-white border border-slate-200 rounded-xl p-8 h-full shadow-sm">
            <div className="border-2 border-dashed border-blue-200 bg-surface-low rounded-xl p-6 md:p-12 flex flex-col items-center justify-center text-center transition-colors hover:border-brand-secondary group cursor-pointer h-full min-h-[400px] relative overflow-hidden">
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleFileChange}
                accept=".pdf,.docx,.txt,image/*"
              />
              
              <AnimatePresence mode="wait">
                {file ? (
                  <motion.div 
                    key="preview"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex flex-col items-center z-10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="relative group/preview mb-6">
                      <div className="w-48 h-64 bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden flex items-center justify-center relative">
                        {isPreviewLoading ? (
                          <div className="flex flex-col items-center gap-2">
                            <motion.div 
                              animate={{ rotate: 360 }}
                              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                              className="w-6 h-6 border-2 border-brand-secondary border-t-transparent rounded-full"
                            />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rendering...</span>
                          </div>
                        ) : previewUrl ? (
                          <img 
                            src={previewUrl} 
                            alt="Preview" 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-slate-300">
                            <FileText className="w-12 h-12" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center px-4">Preview Not Available</span>
                          </div>
                        )}
                        
                        <div className="absolute inset-0 bg-slate-900/0 group-hover/preview:bg-slate-900/40 transition-colors flex items-center justify-center">
                          <button 
                            onClick={clearFile}
                            className="p-3 bg-error text-white rounded-full opacity-0 group-hover/preview:opacity-100 transform translate-y-4 group-hover/preview:translate-y-0 transition-all hover:scale-110 shadow-lg shadow-error/20"
                            title="Remove File"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Badge */}
                      <div className="absolute -top-3 -right-3 bg-brand-secondary text-white px-3 py-1 rounded-full text-[10px] font-bold shadow-lg border-2 border-white uppercase tracking-wider">
                        {file.type.includes('pdf') ? 'PDF' : 'Image'}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h2 className="text-xl font-bold text-brand-primary line-clamp-1 max-w-[300px]">{file.name}</h2>
                      <p className="text-sm text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="text-brand-secondary text-xs font-bold uppercase hover:underline mt-2 inline-block transition-transform hover:scale-105 active:scale-95"
                      >
                        Change File
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="upload-prompt"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="w-20 h-20 bg-white rounded-full shadow-lg flex items-center justify-center mb-6 text-brand-secondary group-hover:scale-110 transition-transform">
                      <CloudUpload className="w-10 h-10" />
                    </div>
                    
                    <h2 className="text-2xl font-bold text-brand-primary mb-2">Drag and drop your file here</h2>
                    <p className="text-sm text-slate-500 mb-8 max-w-md">
                      Supported formats: PDF, DOCX, and high-res images (JPEG/PNG). 5MB limit applies per file.
                    </p>
                    <div className="flex items-center gap-4">
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-brand-secondary text-white px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
                      >
                        Select Files
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mt-12 flex items-center gap-8 border-t border-slate-200/50 pt-8 w-full max-w-xl justify-center">
                <div className="flex items-center gap-2 text-slate-500">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-semibold">End-to-End Encrypted</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <Zap className="w-4 h-4 text-blue-500" />
                  <span className="text-xs font-semibold">Processed in &lt;30s</span>
                </div>
              </div>
            </div>
            
            {error && (
              <p className="mt-4 text-error text-center text-sm font-bold bg-error-container/50 py-2 rounded-lg">{error}</p>
            )}
          </div>
        </div>

        {/* Settings Panel */}
        <div className="col-span-12 lg:col-span-4 space-y-8">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6 text-brand-primary">
              <Settings2 className="w-5 h-5" />
              <h3 className="font-bold text-lg">Document Profile</h3>
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Document Type</label>
                  <div className="relative">
                    <button 
                      onMouseEnter={() => setShowTooltip(true)}
                      onMouseLeave={() => setShowTooltip(false)}
                      className="text-slate-400 hover:text-brand-secondary transition-colors"
                    >
                      <Info className="w-3.5 h-3.5" />
                    </button>
                    {showTooltip && (
                      <div className="absolute right-0 bottom-full mb-2 w-48 bg-slate-900 text-white text-[10px] p-2 rounded-lg shadow-xl z-20 animate-in fade-in zoom-in duration-200">
                        <p className="font-bold border-b border-white/10 pb-1 mb-1">{docType}</p>
                        <p className="leading-relaxed opacity-80">{docTypeDescriptions[docType] || 'Standard processing applied.'}</p>
                        <div className="absolute top-full right-1.5 w-2 h-2 bg-slate-900 rotate-45 -mt-1"></div>
                      </div>
                    )}
                  </div>
                </div>
                <select 
                  value={docType}
                  onChange={(e) => setDocType(e.target.value as DocumentType)}
                  className="w-full bg-white border border-slate-200 rounded-lg h-12 px-4 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                >
                  <option>Contract</option>
                  <option>Legal Document</option>
                  <option>Business Agreement</option>
                  <option>Invoice</option>
                  <option>Government Form</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Processing Language</label>
                <div className="relative">
                  <select 
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg h-12 px-4 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  >
                    <option>English</option>
                    <option>Arabic</option>
                    <option>Urdu</option>
                    <option>Hindi</option>
                    <option>Bengali</option>
                    <option>French</option>
                    <option>German</option>
                    <option>Spanish</option>
                    <option>Portuguese</option>
                    <option>Russian</option>
                    <option>Japanese</option>
                    <option>Chinese</option>
                    <option>Italian</option>
                    <option>Dutch</option>
                    <option>Turkish</option>
                    <option>Persian</option>
                  </select>
                  <Languages className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 w-5 h-5" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Analysis Intensity</label>
                  <div className="group relative">
                    <Info className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                    <div className="absolute right-0 bottom-full mb-2 w-48 bg-slate-900 text-white text-[10px] p-2 rounded-lg shadow-xl z-20 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                      Deep Forensic uses higher reasoning for clause-by-clause scrutiny.
                      <div className="absolute top-full right-1.5 w-2 h-2 bg-slate-900 rotate-45 -mt-1"></div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button className="bg-surface-low border-2 border-brand-secondary text-brand-primary rounded-lg py-2 text-xs font-bold">Standard</button>
                  <button className="bg-white border border-slate-200 text-slate-500 rounded-lg py-2 text-xs font-bold hover:bg-slate-50">Deep Forensic</button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-brand-primary text-white rounded-xl p-6 relative overflow-hidden">
            <h4 className="text-lg font-bold mb-4">Submission Limits</h4>
            <div className="space-y-4 relative z-10">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-400 mt-1" />
                <div>
                  <p className="text-sm font-bold">File Size Limit</p>
                  <p className="text-xs text-slate-400">Up to 5MB per document for optimal processing.</p>
                </div>
              </div>
              <div className="mt-6">
                <div className="flex justify-between text-[10px] uppercase font-bold text-slate-400 mb-2">
                  <span>Quota Used</span>
                  <span>{userProfile?.usageCount || 0} / {userProfile?.plan === 'pro' ? '1,000' : '5'} Monthly Analyses</span>
                </div>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-500" 
                    style={{ width: `${Math.min(((userProfile?.usageCount || 0) / (userProfile?.plan === 'pro' ? 1000 : 5)) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
            <Info className="absolute top-0 right-0 !w-16 !h-16 text-white/5 -mr-4 -mt-4" />
          </div>

          <button 
            disabled={isAnalyzing || !file}
            onClick={handleUpload}
            className="w-full bg-brand-secondary text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 hover:scale-[1.02] transition-transform active:scale-100 disabled:opacity-50 disabled:hover:scale-100"
          >
            {isAnalyzing ? (
              <>
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                />
                Analyzing...
              </>
            ) : (
              <>
                Process Analysis
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
