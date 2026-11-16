'use client'
/**
 * Composants d'interface communs du back-office.
 * Toutes les pages les utilisent pour rester cohérentes : ne pas recréer
 * localement un bouton, un badge ou une pagination.
 */
import Link from 'next/link';
import React from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ Page */

export interface Crumb { label: string; href?: string }

export function PageHeader({ title, description, crumbs, actions, className }: {
    title: React.ReactNode; description?: React.ReactNode; crumbs?: Crumb[];
    actions?: React.ReactNode; className?: string;
}) {
    return (
        <div className={cn('mb-6', className)}>
            {crumbs && crumbs.length > 0 && (
                <nav aria-label="Fil d'Ariane" className="mb-2 flex flex-wrap items-center gap-1 text-[13px] text-ink-500">
                    {crumbs.map((c, i) => (
                        <React.Fragment key={i}>
                            {i > 0 && <ChevronRight className="size-3.5 text-ink-300" aria-hidden />}
                            {c.href ? <Link href={c.href} className="hover:text-ink-900">{c.label}</Link>
                                : <span className="text-ink-700">{c.label}</span>}
                        </React.Fragment>
                    ))}
                </nav>
            )}
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="min-w-0">
                    <h1 className="text-[22px] font-semibold tracking-tight text-ink-900 sm:text-2xl">{title}</h1>
                    {description && <p className="mt-1 text-sm text-ink-500">{description}</p>}
                </div>
                {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
            </div>
        </div>
    );
}

export function PageBody({ children, className }: { children: React.ReactNode; className?: string }) {
    return <div className={cn('mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8 animate-fade-in', className)}>{children}</div>;
}

/* ------------------------------------------------------------------ Card */

export function Card({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
    return <div className={cn('rounded-xl border border-ink-200 bg-white shadow-card', className)} {...rest}>{children}</div>;
}

export function CardHeader({ title, description, action, className }: {
    title: React.ReactNode; description?: React.ReactNode; action?: React.ReactNode; className?: string;
}) {
    return (
        <div className={cn('flex items-start justify-between gap-4 border-b border-ink-100 px-5 py-4', className)}>
            <div className="min-w-0">
                <h2 className="text-[15px] font-semibold text-ink-900">{title}</h2>
                {description && <p className="mt-0.5 text-[13px] text-ink-500">{description}</p>}
            </div>
            {action}
        </div>
    );
}

/* ---------------------------------------------------------------- Button */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type ButtonSize = 'sm' | 'md';

const buttonBase = 'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0';
const buttonVariants: Record<ButtonVariant, string> = {
    primary: 'bg-brand-600 text-white shadow-sm hover:bg-brand-700 active:bg-brand-800',
    secondary: 'border border-ink-200 bg-white text-ink-700 shadow-sm hover:bg-ink-50 hover:text-ink-900',
    ghost: 'text-ink-600 hover:bg-ink-100 hover:text-ink-900',
    danger: 'border border-brand-200 bg-white text-brand-700 shadow-sm hover:bg-brand-50',
    success: 'bg-success-600 text-white shadow-sm hover:bg-success-700',
};
const buttonSizes: Record<ButtonSize, string> = {
    sm: 'h-8 px-3 text-[13px]',
    md: 'h-9 px-3.5 text-sm',
};

export function buttonClass(variant: ButtonVariant = 'primary', size: ButtonSize = 'md', className?: string) {
    return cn(buttonBase, buttonVariants[variant], buttonSizes[size], className);
}

export function Button({ variant = 'primary', size = 'md', loading, className, children, disabled, ...rest }:
    React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize; loading?: boolean }) {
    return (
        <button className={buttonClass(variant, size, className)} disabled={disabled || loading} {...rest}>
            {loading && <Spinner className="size-4 text-current" />}
            {children}
        </button>
    );
}

export function ButtonLink({ href, variant = 'primary', size = 'md', className, children }: {
    href: string; variant?: ButtonVariant; size?: ButtonSize; className?: string; children: React.ReactNode;
}) {
    return <Link href={href} className={buttonClass(variant, size, className)}>{children}</Link>;
}

/* ----------------------------------------------------------------- Badge */

export type Tone = 'neutral' | 'brand' | 'success' | 'warning' | 'info' | 'dark';
const tones: Record<Tone, string> = {
    neutral: 'bg-ink-100 text-ink-700 ring-ink-200',
    brand: 'bg-brand-50 text-brand-700 ring-brand-200',
    success: 'bg-success-50 text-success-700 ring-success-600/20',
    warning: 'bg-warning-50 text-warning-700 ring-warning-600/20',
    info: 'bg-sky-50 text-sky-700 ring-sky-600/20',
    dark: 'bg-ink-900 text-white ring-ink-900',
};

export function Badge({ tone = 'neutral', dot, children, className }: {
    tone?: Tone; dot?: boolean; children: React.ReactNode; className?: string;
}) {
    return (
        <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset', tones[tone], className)}>
            {dot && <span className="size-1.5 rounded-full bg-current" aria-hidden />}
            {children}
        </span>
    );
}

/* ---------------------------------------------------------------- Avatar */

const AVATAR_TONES = ['bg-brand-100 text-brand-800', 'bg-ink-200 text-ink-800', 'bg-amber-100 text-amber-800', 'bg-sky-100 text-sky-800', 'bg-emerald-100 text-emerald-800', 'bg-violet-100 text-violet-800'];

export function initials(name?: string | null) {
    const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    return ((parts[0][0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

export function Avatar({ name, seed, size = 'md', className }: { name?: string | null; seed?: string; size?: 'sm' | 'md' | 'lg' | 'xl'; className?: string }) {
    const key = seed ?? name ?? '';
    let h = 0;
    for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
    const sizes = { sm: 'size-7 text-[11px]', md: 'size-9 text-xs', lg: 'size-12 text-sm', xl: 'size-16 text-lg' };
    return (
        <span className={cn('inline-flex shrink-0 items-center justify-center rounded-full font-semibold', AVATAR_TONES[h % AVATAR_TONES.length], sizes[size], className)} aria-hidden>
            {initials(name)}
        </span>
    );
}

/* ------------------------------------------------------- Spinner/Skeleton */

export function Spinner({ className }: { className?: string }) {
    return (
        <svg className={cn('size-5 animate-spin text-brand-600', className)} viewBox="0 0 24 24" fill="none" role="status" aria-label="Chargement">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
            <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
    );
}

export function Skeleton({ className }: { className?: string }) {
    return <span className={cn('block animate-pulse rounded-md bg-ink-100', className)} />;
}

export function SkeletonRows({ rows = 8, cols }: { rows?: number; cols: number }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, r) => (
                <tr key={r} className="border-b border-ink-100 last:border-0">
                    {Array.from({ length: cols }).map((_, c) => (
                        <td key={c} className="px-4 py-3.5">
                            <Skeleton className={cn('h-3.5', c === 0 ? 'w-32' : c % 3 === 0 ? 'w-12' : 'w-20')} />
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
}

/* ------------------------------------------------------------ EmptyState */

export function EmptyState({ icon, title, description, action, className }: {
    icon?: React.ReactNode; title: string; description?: React.ReactNode; action?: React.ReactNode; className?: string;
}) {
    return (
        <div className={cn('flex flex-col items-center justify-center px-6 py-14 text-center', className)}>
            {icon && <div className="mb-3 flex size-11 items-center justify-center rounded-full bg-ink-100 text-ink-500 [&_svg]:size-5">{icon}</div>}
            <p className="text-sm font-semibold text-ink-900">{title}</p>
            {description && <p className="mt-1 max-w-sm text-[13px] text-ink-500">{description}</p>}
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}

/* ---------------------------------------------------------------- Inputs */

export const inputClass = 'h-9 w-full rounded-lg border border-ink-200 bg-white px-3 text-sm text-ink-900 shadow-sm outline-none transition placeholder:text-ink-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 disabled:bg-ink-50 disabled:text-ink-500';

export function Select({ className, children, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement>) {
    return (
        <div className={cn('relative', className)}>
            <select className={cn(inputClass, 'appearance-none pr-8 cursor-pointer')} {...rest}>{children}</select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-ink-400" aria-hidden />
        </div>
    );
}

export function Field({ label, hint, error, children, className }: {
    label: string; hint?: React.ReactNode; error?: string; children: React.ReactNode; className?: string;
}) {
    return (
        <label className={cn('block', className)}>
            <span className="mb-1.5 block text-[13px] font-medium text-ink-700">{label}</span>
            {children}
            {error ? <span className="mt-1 block text-xs text-brand-700">{error}</span>
                : hint ? <span className="mt-1 block text-xs text-ink-500">{hint}</span> : null}
        </label>
    );
}

/** Champ de recherche : déclenche `onSearch` après une courte pause de frappe. */
export function SearchInput({ value, onSearch, placeholder = 'Rechercher…', className, delay = 350 }: {
    value: string; onSearch: (v: string) => void; placeholder?: string; className?: string; delay?: number;
}) {
    const [text, setText] = React.useState(value);
    React.useEffect(() => { setText(value); }, [value]);
    React.useEffect(() => {
        if (text === value) return;
        const t = setTimeout(() => onSearch(text.trim()), delay);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [text]);
    return (
        <div className={cn('relative', className)}>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-400" aria-hidden />
            <input type="search" value={text} onChange={e => setText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') onSearch(text.trim()); }}
                placeholder={placeholder} aria-label={placeholder}
                className={cn(inputClass, 'pl-9 pr-8 [&::-webkit-search-cancel-button]:hidden')} />
            {text && (
                <button type="button" onClick={() => { setText(''); onSearch(''); }} aria-label="Effacer la recherche"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-ink-400 hover:text-ink-700">
                    <X className="size-4" />
                </button>
            )}
        </div>
    );
}

export function Switch({ checked, onChange, disabled, label }: {
    checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; label?: string;
}) {
    return (
        <button type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled}
            onClick={() => onChange(!checked)}
            className={cn('relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors disabled:opacity-50',
                checked ? 'bg-brand-600' : 'bg-ink-300')}>
            <span className={cn('inline-block size-4 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-[18px]' : 'translate-x-0.5')} />
        </button>
    );
}

/* ----------------------------------------------------------------- Table */

export const tableClass = 'w-full text-left text-sm';
export const theadClass = 'border-b border-ink-200 bg-ink-25 text-xs font-medium text-ink-500';
export const thClass = 'px-4 py-2.5 font-medium whitespace-nowrap';
export const tdClass = 'px-4 py-3 align-middle';
export const trClass = 'border-b border-ink-100 last:border-0 transition-colors hover:bg-ink-25';

/* ------------------------------------------------------------ Pagination */

export function Pagination({ page, pages, total, perPage, onChange, className }: {
    page: number; pages: number; total?: number; perPage?: number; onChange: (p: number) => void; className?: string;
}) {
    if (pages <= 1 && !total) return null;
    const items: (number | '…')[] = [];
    const add = (n: number) => { if (!items.includes(n)) items.push(n); };
    for (let n = 1; n <= pages; n++) {
        if (n === 1 || n === pages || Math.abs(n - page) <= 1) add(n);
        else if (items[items.length - 1] !== '…') items.push('…');
    }
    const from = total && perPage ? (page - 1) * perPage + 1 : null;
    const to = total && perPage ? Math.min(page * perPage, total) : null;
    const btn = 'inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-[13px] font-medium transition-colors';
    return (
        <div className={cn('flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 px-4 py-3', className)}>
            <p className="text-[13px] text-ink-500 tabular">
                {from !== null && total ? <>Affichage de <span className="font-medium text-ink-700">{from}</span>–<span className="font-medium text-ink-700">{to}</span> sur <span className="font-medium text-ink-700">{total.toLocaleString('fr-FR')}</span></> : null}
            </p>
            {pages > 1 && (
                <nav className="flex items-center gap-1" aria-label="Pagination">
                    <button className={cn(btn, 'text-ink-600 hover:bg-ink-100 disabled:opacity-40')} disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Page précédente">
                        <ChevronLeft className="size-4" />
                    </button>
                    {items.map((n, i) => n === '…'
                        ? <span key={`e${i}`} className="px-1 text-ink-400">…</span>
                        : <button key={n} onClick={() => onChange(n)} aria-current={n === page ? 'page' : undefined}
                            className={cn(btn, 'tabular', n === page ? 'bg-ink-900 text-white' : 'text-ink-600 hover:bg-ink-100')}>{n}</button>)}
                    <button className={cn(btn, 'text-ink-600 hover:bg-ink-100 disabled:opacity-40')} disabled={page >= pages} onClick={() => onChange(page + 1)} aria-label="Page suivante">
                        <ChevronRight className="size-4" />
                    </button>
                </nav>
            )}
        </div>
    );
}

/* ----------------------------------------------------------------- Modal */

export function Modal({ open, onClose, title, description, children, footer, size = 'md' }: {
    open: boolean; onClose: () => void; title: string; description?: string; children?: React.ReactNode;
    footer?: React.ReactNode; size?: 'sm' | 'md' | 'lg';
}) {
    React.useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [open, onClose]);
    if (!open) return null;
    const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' };
    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
            <div className="absolute inset-0 bg-ink-900/40 backdrop-blur-[2px] animate-in fade-in" onClick={onClose} />
            <div className={cn('relative w-full rounded-t-2xl bg-white shadow-pop sm:rounded-2xl animate-in fade-in zoom-in-95 slide-in-from-bottom-2', widths[size])}>
                <div className="flex items-start justify-between gap-4 px-6 pt-5">
                    <div>
                        <h2 className="text-base font-semibold text-ink-900">{title}</h2>
                        {description && <p className="mt-1 text-[13px] text-ink-500">{description}</p>}
                    </div>
                    <button onClick={onClose} className="-mr-2 rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700" aria-label="Fermer">
                        <X className="size-4" />
                    </button>
                </div>
                {children && <div className="px-6 py-5">{children}</div>}
                {footer && <div className="flex justify-end gap-2 rounded-b-2xl border-t border-ink-100 bg-ink-25 px-6 py-3.5">{footer}</div>}
            </div>
        </div>
    );
}

/* ----------------------------------------------------------------- Alert */

export function Alert({ tone = 'brand', children, className }: { tone?: 'brand' | 'success' | 'info'; children: React.ReactNode; className?: string }) {
    const t = { brand: 'border-brand-200 bg-brand-50 text-brand-800', success: 'border-success-600/20 bg-success-50 text-success-700', info: 'border-sky-200 bg-sky-50 text-sky-800' };
    return <div role={tone === 'brand' ? 'alert' : 'status'} className={cn('rounded-lg border px-3.5 py-2.5 text-[13px]', t[tone], className)}>{children}</div>;
}

/* ------------------------------------------------------------- Formatage */
// Définis dans lib/format.ts (utilisables aussi côté serveur).
export { fmtInt, fmtDate, fmtPhone } from '@/lib/format';
