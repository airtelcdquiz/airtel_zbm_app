'use client'
import React from 'react';
import { cn } from '@/lib/utils';

export interface BarDatum { key: string; label: string; value: number; details?: { label: string; value: string }[] }

/** Barres verticales, une seule série. Info-bulle au survol / au toucher. */
export function BarChart({ data, height = 220, ariaLabel, valueLabel }: {
    data: BarDatum[]; height?: number; ariaLabel: string; valueLabel: string;
}) {
    const [hover, setHover] = React.useState<number | null>(null);
    const max = Math.max(1, ...data.map(d => d.value));
    const nice = niceMax(max);
    const ticks = [0, nice / 2, nice];
    const n = data.length;
    // Étiquettes d'axe : environ 6 dates visibles.
    const every = Math.max(1, Math.ceil(n / 6));
    const h = hover !== null ? data[hover] : null;

    return (
        <div className="relative select-none" style={{ height }}>
            <div className="absolute inset-0 bottom-6 left-8">
                {/* Grille */}
                {ticks.map(t => (
                    <div key={t} className="absolute inset-x-0 border-t border-dashed border-ink-200" style={{ bottom: `${(t / nice) * 100}%` }}>
                        <span className="absolute -left-8 -translate-y-1/2 w-6 text-right text-[11px] text-ink-400 tabular">{fmtTick(t)}</span>
                    </div>
                ))}
                {/* Barres */}
                <div className="absolute inset-0 flex items-end" role="img" aria-label={ariaLabel} onMouseLeave={() => setHover(null)}>
                    {data.map((d, i) => (
                        <div key={d.key} className="relative flex h-full flex-1 items-end justify-center px-[1px]"
                            onMouseEnter={() => setHover(i)} onTouchStart={() => setHover(i)}>
                            <div className={cn('w-full max-w-[18px] rounded-t-[4px] transition-colors',
                                hover === i ? 'bg-brand-700' : 'bg-brand-600', d.value === 0 && 'bg-ink-200')}
                                style={{ height: d.value === 0 ? 2 : `${(d.value / nice) * 100}%` }} />
                        </div>
                    ))}
                </div>
            </div>
            {/* Axe des dates */}
            <div className="absolute inset-x-0 bottom-0 left-8 flex h-5">
                {data.map((d, i) => (
                    <div key={d.key} className="relative flex-1">
                        {(i % every === 0 || i === n - 1) && (i === n - 1 || n - 1 - i >= every / 2) && (
                            <span className="absolute left-1/2 top-1 -translate-x-1/2 whitespace-nowrap text-[11px] text-ink-400">{d.label}</span>
                        )}
                    </div>
                ))}
            </div>
            {/* Info-bulle */}
            {h && hover !== null && (
                <div className={cn('pointer-events-none absolute top-0 z-10 min-w-[150px] rounded-lg',
                    hover / n < 0.2 ? '-translate-x-[15%]' : hover / n > 0.8 ? '-translate-x-[85%]' : '-translate-x-1/2')}
                    style={{ left: `calc(2rem + (100% - 2rem) * ${(hover + 0.5) / n})` }}>
                <div className="rounded-lg border border-ink-200 bg-white px-3 py-2 shadow-pop">
                    <p className="text-xs font-medium text-ink-500">{h.label}</p>
                    <p className="mt-0.5 text-sm font-semibold text-ink-900 tabular">{h.value.toLocaleString('fr-FR')} <span className="font-normal text-ink-500">{valueLabel}</span></p>
                    {h.details?.map(x => (
                        <p key={x.label} className="mt-0.5 flex justify-between gap-4 text-xs text-ink-600 tabular"><span>{x.label}</span><span className="font-medium text-ink-800">{x.value}</span></p>
                    ))}
                </div>
                </div>
            )}
        </div>
    );
}

function niceMax(v: number) {
    if (v <= 4) return 4;
    const p = Math.pow(10, Math.floor(Math.log10(v)));
    for (const m of [1, 2, 2.5, 5, 10]) if (m * p >= v) return m * p;
    return 10 * p;
}
function fmtTick(v: number) {
    return v >= 1000 ? `${(v / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })}k` : v.toLocaleString('fr-FR', { maximumFractionDigits: 1 });
}

/** Barre de répartition (2 à 4 parts) avec légende étiquetée. */
export function SplitBar({ parts }: { parts: { label: string; value: number }[] }) {
    const total = parts.reduce((s, p) => s + p.value, 0);
    const colors = ['bg-brand-600', 'bg-ink-700', 'bg-ink-300', 'bg-brand-300'];
    return (
        <div>
            <div className="flex h-2.5 w-full gap-[2px] overflow-hidden rounded-full bg-ink-100">
                {total > 0 && parts.map((p, i) => p.value > 0 && (
                    <div key={p.label} className={cn(colors[i % colors.length], 'h-full first:rounded-l-full last:rounded-r-full')} style={{ width: `${(p.value / total) * 100}%` }} title={`${p.label} : ${p.value}`} />
                ))}
            </div>
            <ul className="mt-4 space-y-2.5">
                {parts.map((p, i) => (
                    <li key={p.label} className="flex items-center justify-between gap-3 text-[13px]">
                        <span className="flex items-center gap-2 text-ink-700">
                            <span className={cn('size-2.5 rounded-sm', colors[i % colors.length])} aria-hidden />{p.label}
                        </span>
                        <span className="tabular text-ink-900"><span className="font-semibold">{p.value.toLocaleString('fr-FR')}</span>
                            <span className="ml-1.5 text-ink-400">{total ? Math.round((p.value / total) * 100) : 0} %</span></span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
