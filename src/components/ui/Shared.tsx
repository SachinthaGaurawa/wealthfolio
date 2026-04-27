import React from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'xs';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const base = 'inline-flex items-center justify-center gap-2 rounded text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 shadow-sm';
    
    const variants = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-600 shadow-sm shadow-blue-200',
      secondary: 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 focus:ring-slate-300',
      danger: 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 focus:ring-red-500',
      success: 'bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 focus:ring-emerald-500',
      ghost: 'bg-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50 focus:ring-slate-400 shadow-none',
      outline: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 focus:ring-slate-300'
    };

    const sizes = {
      xs: 'px-2 py-1 text-[10px]',
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-6 py-2 text-sm',
      lg: 'px-8 py-3 text-base'
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);

export const Card = ({ children, className, hover = true, ...props }: { children: React.ReactNode; className?: string, hover?: boolean, [key: string]: any }) => (
  <div className={cn(
    'bg-white border border-slate-200 rounded-lg p-5 shadow-sm transition-all',
    hover && 'hover:shadow-md hover:border-blue-200',
    className
  )} {...props}>
    {children}
  </div>
);

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, ...props }, ref) => (
    <div className="space-y-1">
      {label && <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">{label}</label>}
      <input
        ref={ref}
        className={cn(
          'w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100',
          className
        )}
        {...props}
      />
    </div>
  )
);

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, label, ...props }, ref) => (
    <div className="space-y-1">
      {label && <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">{label}</label>}
      <select
        ref={ref}
        className={cn(
          'w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100',
          className
        )}
        {...props}
      >
        {children}
      </select>
    </div>
  )
);

export const Badge = ({ children, variant = 'gray' }: { children: React.ReactNode; variant?: 'green' | 'red' | 'yellow' | 'blue' | 'purple' | 'cyan' | 'gray' | 'gold' }) => {
  const styles = {
    green: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
    red: 'bg-red-50 text-red-600 border border-red-100',
    yellow: 'bg-amber-50 text-amber-600 border border-amber-100',
    blue: 'bg-blue-50 text-blue-600 border border-blue-100',
    purple: 'bg-violet-50 text-violet-600 border border-violet-100',
    cyan: 'bg-cyan-50 text-cyan-600 border border-cyan-100',
    gray: 'bg-slate-100 text-slate-600 border border-slate-200',
    gold: 'bg-yellow-50 text-yellow-600 border border-yellow-200'
  };
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest', styles[variant])}>
      {children}
    </span>
  );
};

