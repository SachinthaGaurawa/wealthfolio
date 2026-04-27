import { ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Global precision formatter: 10,000,000.00
export const fmtN = (n: number | string) => {
  const val = typeof n === 'string' ? parseFloat(n.replace(/,/g, '')) : n;
  if (isNaN(val)) return '0.00';
  return val.toLocaleString('en-US', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });
};

// Formatter with Label: LKR 10,000,000.00
export const fmt = (n: number | string) => `LKR ${fmtN(n)}`;

// Shorthand formatter: LKR 10.00M
export const fmtS = (n: number) => {
  const a = Math.abs(n || 0);
  if (a >= 1000000) return 'LKR ' + (n / 1000000).toFixed(2) + 'M';
  if (a >= 1000) return 'LKR ' + (n / 1000).toFixed(1) + 'K';
  return 'LKR ' + fmtN(n);
};

// Parsing money string to number safely
export const pM = (s: string | number) => {
  if (typeof s === 'number') return s;
  const clean = String(s).replace(/[^0-9.]/g, '');
  return parseFloat(clean) || 0;
};

// EMI Calculator (Sri Lanka standard)
export const emi = (p: number, r: number, n: number) => {
  if (r === 0) return p / n;
  const monthlyRate = r / 100 / 12;
  return p * monthlyRate * Math.pow(1 + monthlyRate, n) / (Math.pow(1 + monthlyRate, n) - 1);
};

export const uid = () => '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export const today = () => new Date().toISOString().split('T')[0];
export const curMonth = () => new Date().toISOString().substr(0, 7);

// Next month helper (for schedule)
export const nextMonth = (monthStr: string) => {
  const [y, m] = monthStr.split('-').map(Number);
  const next = new Date(y, m, 1);
  return next.toISOString().substr(0, 7);
};

export async function sha256(msg: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(msg));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// 50-day CC Cycle helper
export const getCCDeadline = (billingDate: string) => {
  const d = new Date(billingDate);
  d.setDate(d.getDate() + 20); // 30 + 20
  return d.toISOString().split('T')[0];
};
