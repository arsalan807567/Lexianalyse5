import React from 'react';
import { cn } from '../lib/utils';

interface PasswordStrengthProps {
  password: string;
}

export const PasswordStrength: React.FC<PasswordStrengthProps> = ({ password }) => {
  const getStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: 'bg-slate-200' };
    
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    switch (score) {
      case 0:
      case 1:
        return { score: 1, label: 'Weak', color: 'bg-red-500' };
      case 2:
        return { score: 2, label: 'Medium', color: 'bg-yellow-500' };
      case 3:
      case 4:
        return { score: 3, label: 'Strong', color: 'bg-green-500' };
      default:
        return { score: 0, label: '', color: 'bg-slate-200' };
    }
  };

  const { score, label, color } = getStrength(password);

  if (!password) return null;

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Security Strength</span>
        <span className={cn("text-[10px] font-bold uppercase tracking-wider", 
          score === 1 ? "text-red-500" : score === 2 ? "text-yellow-600" : "text-green-600"
        )}>
          {label}
        </span>
      </div>
      <div className="flex gap-1 h-1">
        {[1, 2, 3].map((step) => (
          <div 
            key={step}
            className={cn(
              "flex-1 rounded-full transition-all duration-300",
              step <= score ? color : "bg-slate-100"
            )}
          />
        ))}
      </div>
    </div>
  );
};
