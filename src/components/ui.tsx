import { type ButtonHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type InputHTMLAttributes, type TextareaHTMLAttributes, useEffect } from 'react';
import { X } from 'lucide-react';

// ── Button ───────────────────────────────────────────────────────────────
type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type Size = 'sm' | 'md' | 'lg';

const variantCls: Record<Variant, string> = {
  primary: 'bg-forest-600 text-white hover:bg-forest-700 active:bg-forest-800 shadow-soft',
  secondary: 'bg-terracotta-500 text-white hover:bg-terracotta-600 active:bg-terracotta-700 shadow-soft',
  ghost: 'bg-transparent text-forest-700 hover:bg-forest-50',
  danger: 'bg-rust-500 text-white hover:bg-rust-600 active:bg-rust-700',
  outline: 'bg-white text-forest-700 border border-forest-200 hover:bg-forest-50',
};
const sizeCls: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm rounded-lg gap-1.5',
  md: 'h-11 px-4 text-sm rounded-xl gap-2',
  lg: 'h-14 px-6 text-base rounded-xl2 gap-2.5',
};

export function Button({
  variant = 'primary', size = 'md', className = '', children, ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return (
    <button
      className={`inline-flex items-center justify-center font-semibold transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none ${variantCls[variant]} ${sizeCls[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────
export function Card({ className = '', children, onClick }: { className?: string; children: ReactNode; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`card-surface ${onClick ? 'cursor-pointer transition-shadow hover:shadow-card' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

// ── Badge ──────────────────────────────────────────────────────────────────
type BadgeTone = 'forest' | 'terracotta' | 'wheat' | 'leaf' | 'amber' | 'rust' | 'sky' | 'neutral';
const badgeTone: Record<BadgeTone, string> = {
  forest: 'bg-forest-100 text-forest-700',
  terracotta: 'bg-terracotta-100 text-terracotta-700',
  wheat: 'bg-wheat-100 text-wheat-800',
  leaf: 'bg-leaf-100 text-leaf-700',
  amber: 'bg-amber2-100 text-amber2-800',
  rust: 'bg-rust-100 text-rust-700',
  sky: 'bg-sky2-100 text-sky2-700',
  neutral: 'bg-gray-100 text-gray-700',
};
export function Badge({ tone = 'forest', children, className = '' }: { tone?: BadgeTone; children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${badgeTone[tone]} ${className}`}>
      {children}
    </span>
  );
}

// ── Input / Select / Textarea ──────────────────────────────────────────────
export function Input({ label, className = '', ...rest }: InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-sm font-semibold text-forest-800">{label}</span>}
      <input className={`input-base ${className}`} {...rest} />
    </label>
  );
}

export function Textarea({ label, className = '', ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-sm font-semibold text-forest-800">{label}</span>}
      <textarea className={`input-base min-h-[90px] resize-y ${className}`} {...rest} />
    </label>
  );
}

export function Select({ label, className = '', children, ...rest }: SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-sm font-semibold text-forest-800">{label}</span>}
      <select className={`input-base appearance-none bg-white ${className}`} {...rest}>
        {children}
      </select>
    </label>
  );
}

// ── Modal ────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, maxWidth = 'max-w-lg' }: {
  open: boolean; onClose: () => void; title: string; children: ReactNode; maxWidth?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-forest-950/40 backdrop-blur-sm animate-fadeIn" onClick={onClose} />
      <div className={`relative w-full ${maxWidth} max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white shadow-lift animate-slideUp sm:animate-scaleIn`}>
        <div className="sticky top-0 flex items-center justify-between border-b border-forest-100 bg-white/95 px-5 py-4 backdrop-blur">
          <h3 className="font-display text-lg font-semibold text-forest-900">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-forest-500 hover:bg-forest-50 hover:text-forest-800">
            <X size={20} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// ── Section title ──────────────────────────────────────────────────────────
export function SectionTitle({ icon, title, subtitle, action }: { icon?: ReactNode; title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div className="flex items-center gap-2.5">
        {icon && <span className="text-forest-600">{icon}</span>}
        <div>
          <h2 className="font-display text-xl font-semibold text-forest-900 sm:text-2xl">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-forest-500">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

// ── Progress bar ───────────────────────────────────────────────────────────
export function Progress({ value, tone = 'forest' }: { value: number; tone?: BadgeTone }) {
  const barTone: Record<string, string> = {
    forest: 'bg-forest-500', terracotta: 'bg-terracotta-500', wheat: 'bg-wheat-500',
    leaf: 'bg-leaf-500', amber: 'bg-amber2-500', rust: 'bg-rust-500', sky: 'bg-sky2-500', neutral: 'bg-gray-400',
  };
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-forest-100">
      <div className={`h-full rounded-full transition-all duration-500 ${barTone[tone]}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, hint }: { icon: ReactNode; title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-forest-200 bg-forest-50/40 px-6 py-12 text-center">
      <div className="mb-3 text-forest-400">{icon}</div>
      <p className="font-semibold text-forest-800">{title}</p>
      {hint && <p className="mt-1 max-w-xs text-sm text-forest-500">{hint}</p>}
    </div>
  );
}

// ── Page container ──────────────────────────────────────────────────────────
export function PageShell({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8 ${className}`}>{children}</div>;
}
