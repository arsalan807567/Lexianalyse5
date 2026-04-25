import React from 'react';
import { Check, Zap, Shield, Crown, Clock, CheckCircle2, XCircle, ArrowRight, Headset, MessageCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

import { PayPalButton } from '../components/PayPalButton';

export const PricingView: React.FC = () => {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const [showCheckout, setShowCheckout] = React.useState<string | null>(null);

  const handleSubscribe = async (plan: string) => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (plan === 'Free') {
       alert("You are already on the Free plan or it is selected.");
       return;
    }

    setShowCheckout(plan);
  };

  const plans = [
    {
      name: 'Free',
      price: '$0',
      description: 'Ideal for individual legal researchers and students.',
      features: [
        '5 Document Analyses / Mo',
        'Standard AI Model',
        'Basic Risk Scoring',
        'PDF Export Support',
        '30-Day History Storage'
      ],
      buttonText: userProfile?.plan === 'free' ? 'Current Plan' : 'Select Free',
      isCurrent: userProfile?.plan === 'free',
      color: 'slate'
    },
    {
      name: 'Professional',
      price: '10 USDT',
      description: 'For legal professionals and small law firms.',
      features: [
        'Unlimited Analyses',
        'Deep Forensic AI Model',
        'Priority Processing',
        'Advanced Clause Extraction',
        'Unlimited History',
        'Translation Features'
      ],
      buttonText: userProfile?.plan === 'professional' ? 'Current Plan' : 'Upgrade to Pro',
      isCurrent: userProfile?.plan === 'professional',
      popular: true,
      color: 'blue'
    }
  ];

  return (
    <div className="space-y-12 py-8 max-w-7xl mx-auto px-4 md:px-0">
      <div className="text-center space-y-4">
        <h1 className="text-3xl md:text-5xl font-black text-brand-primary">Simple, Transparent Pricing</h1>
        <p className="text-slate-500 max-w-2xl mx-auto text-lg leading-relaxed">Choose the perfect plan for your legal analysis needs. Secure, fast, and enterprise-ready.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto gap-8 items-stretch pt-8">
        {plans.map((plan, idx) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={cn(
              "relative bg-white rounded-2xl p-8 border-2 transition-all hover:shadow-xl flex flex-col",
              plan.popular ? 'border-brand-secondary shadow-lg scale-105 z-10' : 'border-slate-100 shadow-sm'
            )}
          >
            {plan.popular && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-brand-secondary text-white px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                <Crown className="w-3 h-3" />
                Most Popular
              </div>
            )}

            <div className="mb-8">
              <h3 className="text-xl font-bold text-brand-primary mb-2">{plan.name}</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-brand-primary">{plan.price}</span>
                {plan.price !== 'Custom' && <span className="text-slate-400 font-medium">/mo</span>}
              </div>
              <p className="text-sm text-slate-500 mt-4 leading-relaxed min-h-[40px]">{plan.description}</p>
            </div>

            <div className="space-y-4 mb-10 flex-1">
              {plan.features.map((feature, fIdx) => (
                <div key={fIdx} className="flex items-start gap-3">
                  <div className={cn(
                    "mt-0.5 p-0.5 rounded-full",
                    plan.popular ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'
                  )}>
                    <Check className="w-3 h-3" />
                  </div>
                  <span className="text-sm text-slate-600 font-medium">{feature}</span>
                </div>
              ))}
            </div>

            {showCheckout === plan.name ? (
              <div className="mt-auto">
                <PayPalButton 
                  planName={plan.name} 
                  amount={plan.price} 
                  onSuccess={() => {
                    alert("Subscription successful! Your account has been upgraded.");
                    setShowCheckout(null);
                  }}
                  onError={() => {
                    alert("There was an error processing your PayPal payment. Please try again.");
                  }}
                />
                <button 
                  onClick={() => setShowCheckout(null)}
                  className="w-full mt-2 text-xs text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleSubscribe(plan.name)}
                className={cn(
                  "w-full py-4 rounded-xl font-bold transition-all mt-auto",
                  plan.isCurrent 
                  ? 'bg-slate-50 text-slate-400 cursor-default border border-slate-200' 
                  : plan.popular 
                    ? 'bg-brand-secondary text-white hover:opacity-90 shadow-lg shadow-blue-500/20' 
                    : 'border-2 border-brand-secondary text-brand-secondary hover:bg-brand-secondary/5'
                )}
              >
                {plan.buttonText}
              </button>
            )}
            
            {!plan.isCurrent && (
              <div className="mt-4 flex items-center justify-center gap-2 text-[10px] uppercase font-bold text-slate-400">
                <Shield className="w-3 h-3" />
                Secure Billing
                <Clock className="w-3 h-3 ml-2" />
                PayPal Checkout
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 md:p-12 text-center space-y-6">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-brand-secondary">
            <Headset className="w-8 h-8" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-brand-primary">Need help choosing?</h2>
          <p className="text-slate-500 max-w-xl mx-auto text-lg leading-relaxed">
            Our legal tech experts are available on WhatsApp and Email to answer your questions about plans and custom enterprise needs.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button 
            onClick={() => navigate('/support')}
            className="w-full sm:w-auto px-8 py-4 bg-brand-primary text-white rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
          >
            Contact Support
            <ArrowRight className="w-4 h-4" />
          </button>
          <a 
             href="https://wa.me/0565657738"
             target="_blank"
             rel="noopener noreferrer"
             className="w-full sm:w-auto px-8 py-4 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
          >
            WhatsApp Us
            <CheckCircle2 className="w-4 h-4 text-white" />
          </a>
        </div>
      </div>
    </div>
  );
};
