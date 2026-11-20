'use client'
/** Éléments communs de la rubrique TV Show. */
import React from 'react';
import { Check } from 'lucide-react';
import api from '@/lib/api';
import cookies from '@/lib/cookies';
import { cn } from '@/lib/utils';
import { Badge, Field, Select, Tone, inputClass } from '@/components/ui/kit';
import {
    Audience, QuestionStatus, RegistrationMode, Scene, SessionStatus, TvSession, TvSessionInput,
    isoToKinshasaInput, kinshasaInputToIso,
} from '@/lib/tvshow';

/* ---------------------------------------------------------------- Libellés */

export const STATUS_LABELS: Record<SessionStatus, { label: string; tone: Tone }> = {
    draft: { label: 'Brouillon', tone: 'neutral' },
    registration: { label: 'Inscriptions ouvertes', tone: 'info' },
    live: { label: 'En direct', tone: 'brand' },
    paused: { label: 'En pause', tone: 'warning' },
    finished: { label: 'Terminée', tone: 'success' },
    cancelled: { label: 'Annulée', tone: 'neutral' },
};

export const SCENE_LABELS: Record<Scene, string> = {
    waiting: "Écran d'attente", question: 'Question', reveal: 'Révélation',
    leaderboard: 'Classement', podium: 'Podium', pause: 'Pause',
};

export const QSTATUS_LABELS: Record<QuestionStatus, { label: string; tone: Tone }> = {
    pending: { label: 'À venir', tone: 'neutral' },
    displayed: { label: 'Affichée', tone: 'info' },
    open: { label: 'USSD ouvert', tone: 'brand' },
    closed: { label: 'Fermée', tone: 'warning' },
    revealed: { label: 'Révélée', tone: 'success' },
    cancelled: { label: 'Annulée', tone: 'neutral' },
};

export const MODE_LABELS: Record<RegistrationMode, string> = {
    admin: "Par l'administrateur",
    ussd: 'Par USSD (code de session)',
    both: 'Les deux',
};

export function StatusBadge({ status }: { status: SessionStatus }) {
    const s = STATUS_LABELS[status] ?? { label: status, tone: 'neutral' as Tone };
    return <Badge tone={s.tone} dot={status === 'live' || status === 'registration' || status === 'paused'}
        className={cn(status === 'live' && '[&>span]:animate-pulse', status === 'cancelled' && 'line-through')}>{s.label}</Badge>;
}

export function QuestionStatusBadge({ status }: { status: QuestionStatus }) {
    const s = QSTATUS_LABELS[status] ?? { label: status, tone: 'neutral' as Tone };
    return <Badge tone={s.tone}>{s.label}</Badge>;
}

/** Une session dont les réglages ne sont plus modifiables. */
export const isLocked = (status: SessionStatus) => status === 'live' || status === 'paused' || status === 'finished';

/** Les 4 options, la bonne réponse marquée. */
export function OptionsGrid({ options, correct, compact }: { options: string[]; correct: number | null; compact?: boolean }) {
    return (
        <ol className={cn('grid grid-cols-1 gap-1.5 sm:grid-cols-2', compact && 'gap-1')}>
            {options.map((opt, i) => {
                const ok = correct === i + 1;
                return (
                    <li key={i} className={cn('flex min-w-0 items-center gap-2 rounded-md px-2.5 py-1.5',
                        compact ? 'text-[13px]' : 'text-sm',
                        ok ? 'bg-success-50 text-success-700 ring-1 ring-inset ring-success-600/20 font-medium' : 'bg-ink-50 text-ink-600')}>
                        <span className={cn('text-xs font-semibold tabular', ok ? 'text-success-700' : 'text-ink-400')}>{i + 1}.</span>
                        <span className="min-w-0 flex-1 truncate" title={opt}>{opt || '—'}</span>
                        {ok && <Check className="size-3.5 shrink-0" aria-label="Bonne réponse" />}
                    </li>
                );
            })}
        </ol>
    );
}

/* ------------------------------------------------- Filtres ZBM (écoles…) */

export interface Opt { value: string; label: string }
export const CLASSES: Opt[] = [1, 2, 3, 4, 5, 6, 7, 8].map(n => ({ value: String(n), label: n === 1 ? '1ère année' : `${n}ème année` }));

export interface ZbmFilters { schools: Opt[]; levels: Opt[]; options: Opt[]; classes: Opt[]; loaded: boolean }

/** Écoles, sections et options : mêmes appels que la page Joueurs. */
export function useZbmFilters(): ZbmFilters {
    const [f, setF] = React.useState<ZbmFilters>({ schools: [], levels: [], options: [], classes: CLASSES, loaded: false });
    React.useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const [a, b] = await Promise.all([api(cookies).get('/statistics/filters'), api(cookies).get('/players/labels')]);
                if (cancelled) return;
                const schools = ((a.data.schools ?? []) as { code: string | number; name: string }[]).map(s => ({ value: String(s.code), label: s.name }));
                const levels = ((b.data.levels ?? []) as { value: string | number; label: string }[]).map(l => ({ value: String(l.value), label: l.label }));
                const options = ((b.data.options ?? []) as { value: string | number; label: string }[]).map(o => ({ value: String(o.value), label: o.label }));
                setF({ schools, levels, options, classes: CLASSES, loaded: true });
            } catch {
                if (!cancelled) setF(x => ({ ...x, loaded: true }));
            }
        })();
        return () => { cancelled = true; };
    }, []);
    return f;
}

export const labelOf = (list: Opt[], v: string | number | null | undefined) =>
    v === null || v === undefined || v === '' ? '' : list.find(o => o.value === String(v))?.label ?? String(v);

/* -------------------------------------------------- Formulaire de session */

export interface SessionFormState {
    title: string; scheduled: string; duration: string; delay: string; points: string;
    mode: RegistrationMode; restricted: boolean;
    schools: string[]; levels: string[]; classes: string[]; options: string[];
    max: string;
}

export const EMPTY_FORM: SessionFormState = {
    title: '', scheduled: '', duration: '45', delay: '0', points: '10', mode: 'both', restricted: false,
    schools: [], levels: [], classes: [], options: [], max: '',
};

export function formFromSession(s: TvSession): SessionFormState {
    const a: Audience = s.audience ?? {};
    const restricted = !!(a.schools?.length || a.levels?.length || a.classes?.length || a.options?.length);
    return {
        title: s.title ?? '', scheduled: isoToKinshasaInput(s.scheduled_at),
        duration: String(s.question_duration_s ?? 45), delay: String(s.broadcast_delay_s ?? 0), points: String(s.points_per_win ?? 10),
        mode: s.registration_mode ?? 'both', restricted,
        schools: (a.schools ?? []).map(String), levels: (a.levels ?? []).map(String),
        classes: (a.classes ?? []).map(String), options: (a.options ?? []).map(String),
        max: s.max_players ? String(s.max_players) : '',
    };
}

const intIn = (v: string, min: number, max: number) => {
    const n = Number(v);
    return v.trim() !== '' && Number.isInteger(n) && n >= min && n <= max;
};

/** Valide et convertit le formulaire ; renvoie une erreur ou le corps de requête. */
export function formToInput(f: SessionFormState): { error: string } | { input: TvSessionInput } {
    if (!f.title.trim()) return { error: 'Le titre est obligatoire.' };
    if (!intIn(f.duration, 15, 60)) return { error: 'Le temps par question doit être compris entre 15 et 60 secondes.' };
    if (!intIn(f.delay, 0, 60)) return { error: 'Le décalage de diffusion doit être compris entre 0 et 60 secondes.' };
    if (!intIn(f.points, 1, 1000)) return { error: 'Les points doivent être un nombre entier positif.' };
    if (f.max.trim() !== '' && !intIn(f.max, 1, 10_000_000)) return { error: 'Le nombre de places doit être un entier positif (ou vide).' };
    const audience: Audience = {};
    if (f.restricted) {
        if (f.schools.length) audience.schools = f.schools;
        if (f.levels.length) audience.levels = f.levels;
        if (f.classes.length) audience.classes = f.classes;
        if (f.options.length) audience.options = f.options.map(Number);
        if (!Object.keys(audience).length) return { error: 'Public restreint : choisissez au moins une école, une section, une classe ou une option.' };
    }
    return {
        input: {
            title: f.title.trim(),
            scheduled_at: kinshasaInputToIso(f.scheduled),
            question_duration_s: Number(f.duration),
            broadcast_delay_s: Number(f.delay),
            points_per_win: Number(f.points),
            registration_mode: f.mode,
            audience,
            max_players: f.max.trim() === '' ? null : Number(f.max),
        },
    };
}

function Chips({ label, items, value, onChange, disabled, searchable }: {
    label: string; items: Opt[]; value: string[]; onChange: (v: string[]) => void; disabled?: boolean; searchable?: boolean;
}) {
    const [q, setQ] = React.useState('');
    const shown = searchable && q ? items.filter(i => i.label.toLowerCase().includes(q.toLowerCase())) : items;
    const toggle = (v: string) => onChange(value.includes(v) ? value.filter(x => x !== v) : [...value, v]);
    return (
        <fieldset disabled={disabled}>
            <legend className="mb-1.5 flex w-full items-center justify-between text-[13px] font-medium text-ink-700">
                <span>{label}</span>
                <span className="text-xs font-normal text-ink-500">{value.length ? `${value.length} choisi${value.length > 1 ? 's' : ''}` : 'Tous'}</span>
            </legend>
            {searchable && items.length > 8 && (
                <input value={q} onChange={e => setQ(e.target.value)} placeholder="Filtrer…" className={cn(inputClass, 'mb-2 h-8 text-[13px]')} aria-label={`Filtrer : ${label}`} />
            )}
            <div className={cn('flex flex-wrap gap-1.5', searchable && 'max-h-44 overflow-y-auto scroll-thin rounded-lg border border-ink-200 p-2')}>
                {shown.length === 0 && <span className="text-xs text-ink-400">Aucun élément.</span>}
                {shown.map(i => {
                    const on = value.includes(i.value);
                    return (
                        <button type="button" key={i.value} onClick={() => toggle(i.value)} aria-pressed={on}
                            className={cn('inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset transition-colors disabled:opacity-50',
                                on ? 'bg-brand-50 text-brand-700 ring-brand-200' : 'bg-white text-ink-600 ring-ink-200 hover:bg-ink-50')}>
                            {on && <Check className="size-3" />}{i.label}
                        </button>
                    );
                })}
            </div>
        </fieldset>
    );
}

export function SessionFields({ form, onChange, disabled, filters }: {
    form: SessionFormState; onChange: (f: SessionFormState) => void; disabled?: boolean; filters: ZbmFilters;
}) {
    const set = <K extends keyof SessionFormState>(k: K, v: SessionFormState[K]) => onChange({ ...form, [k]: v });
    return (
        <div className="space-y-5">
            <Field label="Titre">
                <input value={form.title} onChange={e => set('title', e.target.value)} disabled={disabled} maxLength={120}
                    placeholder="Ex. : Grande finale inter-écoles" className={inputClass} required />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Date et heure" hint="Heure de Kinshasa">
                    <input type="datetime-local" value={form.scheduled} onChange={e => set('scheduled', e.target.value)} disabled={disabled} className={inputClass} />
                </Field>
                <Field label="Places maximum" hint="Vide = illimité">
                    <input type="number" min={1} value={form.max} onChange={e => set('max', e.target.value)} disabled={disabled} placeholder="Illimité" className={inputClass} />
                </Field>
                <Field label="Temps par question (secondes)" hint="De 15 à 60 s">
                    <input type="number" min={15} max={60} value={form.duration} onChange={e => set('duration', e.target.value)} disabled={disabled} className={inputClass} />
                </Field>
                <Field label="Décalage de diffusion (secondes)" hint="Retard entre le plateau et la télé à la maison, mesuré en répétition">
                    <input type="number" min={0} max={60} value={form.delay} onChange={e => set('delay', e.target.value)} disabled={disabled} className={inputClass} />
                </Field>
                <Field label="Points par victoire">
                    <input type="number" min={1} value={form.points} onChange={e => set('points', e.target.value)} disabled={disabled} className={inputClass} />
                </Field>
                <Field label="Mode d'inscription">
                    <Select value={form.mode} onChange={e => set('mode', e.target.value as RegistrationMode)} disabled={disabled}>
                        {(Object.keys(MODE_LABELS) as RegistrationMode[]).map(m => <option key={m} value={m}>{MODE_LABELS[m]}</option>)}
                    </Select>
                </Field>
            </div>

            <fieldset disabled={disabled} className="rounded-lg border border-ink-200">
                <legend className="ml-3 px-1 text-[13px] font-medium text-ink-700">Public</legend>
                <div className="space-y-4 px-4 pb-4 pt-1">
                    <div className="flex flex-wrap gap-4 text-sm text-ink-800">
                        <label className="inline-flex items-center gap-2">
                            <input type="radio" name="audience" checked={!form.restricted} onChange={() => set('restricted', false)} className="accent-brand-600" />
                            Tous les joueurs
                        </label>
                        <label className="inline-flex items-center gap-2">
                            <input type="radio" name="audience" checked={form.restricted} onChange={() => set('restricted', true)} className="accent-brand-600" />
                            Restreint (écoles, sections, classes, options)
                        </label>
                    </div>
                    {form.restricted && (
                        <div className="space-y-4">
                            {filters.schools.length > 0
                                ? <Chips label="Écoles" items={filters.schools} value={form.schools} onChange={v => set('schools', v)} searchable />
                                : <p className="text-xs text-ink-500">{filters.loaded ? 'Liste des écoles indisponible.' : 'Chargement des écoles…'}</p>}
                            <Chips label="Sections" items={filters.levels} value={form.levels} onChange={v => set('levels', v)} />
                            <Chips label="Classes" items={filters.classes} value={form.classes} onChange={v => set('classes', v)} />
                            <Chips label="Options" items={filters.options} value={form.options} onChange={v => set('options', v)} />
                            <p className="text-xs text-ink-500">Un critère laissé vide n&apos;est pas filtré.</p>
                        </div>
                    )}
                </div>
            </fieldset>
        </div>
    );
}
