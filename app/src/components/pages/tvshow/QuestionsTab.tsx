'use client'
import React from 'react';
import { ArrowDown, ArrowUp, Info, ListChecks, ListPlus, RefreshCw, Shuffle, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    Alert, Badge, Button, Card, CardHeader, EmptyState, Field, Modal, Pagination, SearchInput, Spinner,
    fmtDate, fmtInt, inputClass,
} from '@/components/ui/kit';
import { BankQuestion, QuestionItem, SessionQuestion, TvSession, tv, tvError } from '@/lib/tvshow';
import { OptionsGrid, QuestionStatusBadge } from './shared';

const sortQuestions = (qs: SessionQuestion[]) =>
    [...qs].sort((a, b) => Number(a.is_reserve) - Number(b.is_reserve) || a.position - b.position);

const toItems = (qs: SessionQuestion[]): QuestionItem[] =>
    qs.filter(q => q.source_question_id !== null)
        .map(q => ({ question_id: q.source_question_id as number, is_reserve: q.is_reserve, duration_s: q.duration_s }));

export default function QuestionsTab({ session, questions, onQuestions }: {
    session: TvSession; questions: SessionQuestion[]; onQuestions: (q: SessionQuestion[]) => void;
}) {
    const readOnly = ['live', 'paused', 'finished'].includes(session.status);
    const list = React.useMemo(() => sortQuestions(questions), [questions]);
    const main = list.filter(q => !q.is_reserve);
    const reserves = list.filter(q => q.is_reserve);

    const [mode, setMode] = React.useState<'draw' | 'manual'>('draw');
    const [count, setCount] = React.useState(String(Math.max(main.length, 10)));
    const [nReserves, setNReserves] = React.useState(String(reserves.length || 3));
    const [excludeDaily, setExcludeDaily] = React.useState(true);
    const [available, setAvailable] = React.useState<number | null>(null);
    const [confirmDraw, setConfirmDraw] = React.useState(false);
    const [picking, setPicking] = React.useState(false);
    const [busy, setBusy] = React.useState('');
    const [error, setError] = React.useState('');

    const run = async (key: string, fn: () => Promise<SessionQuestion[]>) => {
        setBusy(key); setError('');
        try { onQuestions(await fn()); }
        catch (e) { setError(tvError(e, "L'opération a échoué.")); }
        finally { setBusy(''); }
    };

    const put = (next: SessionQuestion[]) => run('put', () => tv.putQuestions(session.id, toItems(next)));

    const draw = () => {
        const c = Number(count), r = Number(nReserves);
        if (!Number.isInteger(c) || c < 1 || !Number.isInteger(r) || r < 0) { setError('Indiquez un nombre de questions (≥ 1) et de réserves (≥ 0).'); return; }
        setConfirmDraw(false);
        run('draw', async () => {
            const d = await tv.draw(session.id, { count: c, reserves: r, exclude_daily: excludeDaily });
            setAvailable(d.available);
            return d.questions;
        });
    };

    /** Déplace une question dans son groupe (principales ou réserves). */
    const move = (q: SessionQuestion, dir: -1 | 1) => {
        const group = q.is_reserve ? [...reserves] : [...main];
        const i = group.findIndex(x => x.id === q.id), j = i + dir;
        if (j < 0 || j >= group.length) return;
        [group[i], group[j]] = [group[j], group[i]];
        put(q.is_reserve ? [...main, ...group] : [...group, ...reserves]);
    };
    const toggleReserve = (q: SessionQuestion) => {
        const others = list.filter(x => x.id !== q.id);
        const moved = { ...q, is_reserve: !q.is_reserve };
        // Placée entre les deux groupes : en tête des réserves, ou à la fin des principales.
        const m = others.filter(x => !x.is_reserve), r = others.filter(x => x.is_reserve);
        put([...m, moved, ...r]);
    };
    const removeQ = (q: SessionQuestion) => put(list.filter(x => x.id !== q.id));

    const setDuration = (q: SessionQuestion, v: number) => {
        if (v === q.duration_s) return;
        if (!Number.isInteger(v) || v < 15 || v > 60) { setError('Le temps par question doit être compris entre 15 et 60 secondes.'); return; }
        run(`dur${q.id}`, () => tv.patchQuestion(session.id, q.id, v));
    };

    const applySelection = (picked: BankQuestion[]) => {
        setPicking(false);
        const ids = new Set(picked.map(p => p.id));
        const kept = list.filter(q => q.source_question_id !== null && ids.has(q.source_question_id));
        const keptIds = new Set(kept.map(q => q.source_question_id));
        const added: QuestionItem[] = picked.filter(p => !keptIds.has(p.id)).map(p => ({ question_id: p.id, is_reserve: false }));
        const km = toItems(kept.filter(q => !q.is_reserve)), kr = toItems(kept.filter(q => q.is_reserve));
        setBusy('put'); setError('');
        tv.putQuestions(session.id, [...km, ...added, ...kr])
            .then(onQuestions)
            .catch(e => setError(tvError(e, "L'enregistrement de la sélection a échoué.")))
            .finally(() => setBusy(''));
    };

    const tooLong = list.filter(q => q.too_long).length;

    return (
        <div className="space-y-6">
            {readOnly && (
                <Alert tone="info" className="flex items-center gap-2"><Info className="size-4 shrink-0" /> Le direct a commencé : la liste des questions est en lecture seule. Les remplacements se font depuis le pupitre.</Alert>
            )}
            {error && <Alert>{error}</Alert>}

            {!readOnly && (
                <Card>
                    <CardHeader title="Composer la liste"
                        action={
                            <div className="inline-flex rounded-lg bg-ink-100 p-1" role="tablist">
                                {([['draw', 'Tirage aléatoire'], ['manual', 'Sélection manuelle']] as const).map(([m, l]) => (
                                    <button key={m} role="tab" aria-selected={mode === m} onClick={() => setMode(m)}
                                        className={cn('rounded-md px-3 py-1 text-[13px] font-medium', mode === m ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-800')}>{l}</button>
                                ))}
                            </div>
                        } />
                    <div className="px-5 py-4">
                        {mode === 'draw' ? (
                            <div className="flex flex-wrap items-end gap-4">
                                <Field label="Questions" className="w-28">
                                    <input type="number" min={1} value={count} onChange={e => setCount(e.target.value)} className={inputClass} />
                                </Field>
                                <Field label="Réserves" className="w-28">
                                    <input type="number" min={0} value={nReserves} onChange={e => setNReserves(e.target.value)} className={inputClass} />
                                </Field>
                                <label className="flex h-9 items-center gap-2 text-sm text-ink-800">
                                    <input type="checkbox" checked={excludeDaily} onChange={e => setExcludeDaily(e.target.checked)} className="size-4 accent-brand-600" />
                                    Exclure les questions déjà jouées au quiz quotidien
                                </label>
                                <Button onClick={() => (list.length ? setConfirmDraw(true) : draw())} loading={busy === 'draw'} disabled={!!busy} className="ml-auto">
                                    <Shuffle /> Lancer le tirage
                                </Button>
                                {available !== null && (
                                    <p className="w-full text-[13px] text-ink-500">{fmtInt(available)} question{available > 1 ? 's' : ''} disponible{available > 1 ? 's' : ''} dans la banque pour ce tirage.</p>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <p className="text-[13px] text-ink-500">Choisissez les questions dans la banque. Les nouvelles questions sont ajoutées à la fin des principales.</p>
                                <Button onClick={() => setPicking(true)} disabled={!!busy}><ListPlus /> Choisir dans la banque</Button>
                            </div>
                        )}
                    </div>
                </Card>
            )}

            <Card>
                <CardHeader
                    title="Questions de la session"
                    description={`${main.length} principale${main.length > 1 ? 's' : ''} · ${reserves.length} réserve${reserves.length > 1 ? 's' : ''}${tooLong ? ` · ${tooLong} trop longue${tooLong > 1 ? 's' : ''} pour l'USSD` : ''}`}
                    action={busy === 'put' ? <Spinner className="size-4" /> : undefined}
                />
                {list.length === 0 ? (
                    <EmptyState icon={<ListChecks />} title="Aucune question" description="Lancez un tirage aléatoire ou choisissez les questions dans la banque." />
                ) : (
                    <ol className="divide-y divide-ink-100">
                        {list.map((q, idx) => {
                            const group = q.is_reserve ? reserves : main;
                            const gi = group.findIndex(x => x.id === q.id);
                            const firstReserve = q.is_reserve && idx === main.length;
                            return (
                                <React.Fragment key={q.id}>
                                    {firstReserve && <li className="bg-ink-25 px-5 py-2 text-xs font-semibold uppercase tracking-wider text-ink-500">Réserves</li>}
                                    <li className={cn('flex gap-4 px-4 py-4 sm:px-5', q.is_reserve && 'bg-ink-25/60')}>
                                        <span className={cn('mt-0.5 inline-flex h-6 min-w-10 shrink-0 items-center justify-center rounded-md px-1.5 text-xs font-semibold tabular',
                                            q.is_reserve ? 'bg-ink-100 text-ink-500' : 'bg-ink-900 text-white')}>
                                            {q.is_reserve ? `R${gi + 1}` : `Q${gi + 1}`}
                                        </span>
                                        <div className="min-w-0 flex-1 space-y-2.5">
                                            <div className="flex flex-wrap items-start gap-2">
                                                <p className="min-w-0 flex-1 text-sm font-medium leading-6 text-ink-900">{q.question}</p>
                                                {q.too_long && <Badge tone="warning">Trop longue pour l&apos;USSD</Badge>}
                                                {readOnly && <QuestionStatusBadge status={q.status} />}
                                            </div>
                                            <OptionsGrid options={q.options} correct={Number(q.response)} compact />
                                            <div className="flex flex-wrap items-center gap-2">
                                                <label className="flex items-center gap-2 text-xs text-ink-500">
                                                    Temps
                                                    <input key={`${q.id}-${q.duration_s}`} type="number" min={15} max={60} defaultValue={q.duration_s} disabled={readOnly || !!busy}
                                                        onBlur={e => setDuration(q, Number(e.target.value))}
                                                        onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                                                        className={cn(inputClass, 'h-7 w-16 px-2 text-xs tabular')} aria-label="Temps (secondes)" />
                                                    s
                                                </label>
                                                {!readOnly && (
                                                    <div className="ml-auto flex flex-wrap items-center gap-1">
                                                        <Button variant="ghost" size="sm" onClick={() => move(q, -1)} disabled={!!busy || gi === 0} aria-label="Monter" title="Monter"><ArrowUp /></Button>
                                                        <Button variant="ghost" size="sm" onClick={() => move(q, 1)} disabled={!!busy || gi === group.length - 1} aria-label="Descendre" title="Descendre"><ArrowDown /></Button>
                                                        <Button variant="ghost" size="sm" onClick={() => toggleReserve(q)} disabled={!!busy}>{q.is_reserve ? 'Passer en principale' : 'Passer en réserve'}</Button>
                                                        <Button variant="ghost" size="sm" onClick={() => run(`redraw${q.id}`, () => tv.redraw(session.id, q.id))} loading={busy === `redraw${q.id}`} disabled={!!busy} title="Remplacer par une autre question tirée au hasard">
                                                            <RefreshCw /> Relancer
                                                        </Button>
                                                        <Button variant="ghost" size="sm" onClick={() => removeQ(q)} disabled={!!busy} aria-label="Retirer" title="Retirer"><Trash2 /></Button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </li>
                                </React.Fragment>
                            );
                        })}
                    </ol>
                )}
            </Card>

            <Modal open={confirmDraw} onClose={() => setConfirmDraw(false)} size="sm" title="Remplacer la liste ?"
                description="Le tirage remplace toutes les questions actuelles de la session (principales et réserves)."
                footer={<>
                    <Button variant="secondary" onClick={() => setConfirmDraw(false)}>Retour</Button>
                    <Button onClick={draw}><Shuffle /> Lancer le tirage</Button>
                </>} />

            {picking && <BankPicker session={session} current={list} onClose={() => setPicking(false)} onApply={applySelection} />}
        </div>
    );
}

/* ------------------------------------------------------ Sélection manuelle */

const BANK_PER_PAGE = 10;

function BankPicker({ session, current, onClose, onApply }: {
    session: TvSession; current: SessionQuestion[]; onClose: () => void; onApply: (picked: BankQuestion[]) => void;
}) {
    const [search, setSearch] = React.useState('');
    const [page, setPage] = React.useState(1);
    const [eligible, setEligible] = React.useState(false);
    const [rows, setRows] = React.useState<BankQuestion[]>([]);
    const [total, setTotal] = React.useState(0);
    const [pages, setPages] = React.useState(0);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState('');
    // Sélection conservée d'une page à l'autre. Les questions déjà dans la session sont cochées.
    const [picked, setPicked] = React.useState<Map<number, BankQuestion>>(() => {
        const m = new Map<number, BankQuestion>();
        current.forEach(q => {
            if (q.source_question_id !== null) m.set(q.source_question_id, {
                id: q.source_question_id, question: q.question, options: q.options, response: q.response,
                archived: false, played_daily: false, tv_played_at: null, tv_reserved_session_id: session.id, too_long: q.too_long,
            });
        });
        return m;
    });

    React.useEffect(() => {
        let cancelled = false;
        setLoading(true); setError('');
        tv.bank({ search: search || undefined, page, per_page: BANK_PER_PAGE, ...(eligible ? { eligible: 1 as const } : {}) })
            .then(d => { if (!cancelled) { setRows(d.questions ?? []); setTotal(d.total ?? 0); setPages(d.pages ?? 0); } })
            .catch(e => { if (!cancelled) { setRows([]); setError(tvError(e, 'Impossible de charger la banque de questions.')); } })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [search, page, eligible]);

    const toggle = (q: BankQuestion) => setPicked(m => {
        const n = new Map(m);
        if (n.has(q.id)) n.delete(q.id); else n.set(q.id, q);
        return n;
    });

    return (
        <Modal open onClose={onClose} size="lg" title="Sélection manuelle" description={`${picked.size} question${picked.size > 1 ? 's' : ''} sélectionnée${picked.size > 1 ? 's' : ''}`}
            footer={<>
                <Button variant="secondary" onClick={onClose}>Annuler</Button>
                <Button onClick={() => onApply([...picked.values()])}>Enregistrer la sélection</Button>
            </>}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <SearchInput value={search} onSearch={v => { setPage(1); setSearch(v); }} placeholder="Rechercher une question" className="sm:flex-1" />
                <label className="flex items-center gap-2 text-[13px] text-ink-700">
                    <input type="checkbox" checked={eligible} onChange={e => { setPage(1); setEligible(e.target.checked); }} className="size-4 accent-brand-600" />
                    Éligibles seulement
                </label>
            </div>
            {error && <Alert className="mt-3">{error}</Alert>}
            <div className="mt-3 max-h-[55vh] overflow-y-auto scroll-thin rounded-lg border border-ink-200">
                <table className="w-full text-left text-[13px]">
                    <thead className="sticky top-0 border-b border-ink-200 bg-ink-25 text-xs text-ink-500">
                        <tr>
                            <th className="w-8 px-3 py-2"><span className="sr-only">Choisir</span></th>
                            <th className="px-3 py-2 font-medium">Question</th>
                            <th className="px-3 py-2 font-medium whitespace-nowrap">Déjà jouée au quotidien</th>
                            <th className="px-3 py-2 font-medium">Réservée</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={4} className="py-10"><div className="flex justify-center"><Spinner /></div></td></tr>
                        ) : rows.length === 0 ? (
                            <tr><td colSpan={4} className="py-8 text-center text-ink-500">Aucune question.</td></tr>
                        ) : rows.map(q => {
                            const on = picked.has(q.id);
                            const reservedElsewhere = q.tv_reserved_session_id !== null && q.tv_reserved_session_id !== session.id;
                            return (
                                <tr key={q.id} onClick={() => toggle(q)} className={cn('cursor-pointer border-b border-ink-100 last:border-0 align-top', on ? 'bg-brand-50/50' : 'hover:bg-ink-25')}>
                                    <td className="px-3 py-2.5">
                                        <input type="checkbox" checked={on} onChange={() => toggle(q)} onClick={e => e.stopPropagation()} className="size-4 accent-brand-600" aria-label={`Choisir la question ${q.id}`} />
                                    </td>
                                    <td className="px-3 py-2.5">
                                        <p className="text-ink-900">{q.question}</p>
                                        <p className="mt-0.5 text-xs text-ink-500">
                                            Réponse : <span className="font-medium text-success-700">{q.options[Number(q.response) - 1] ?? q.response}</span>
                                            {q.too_long && <Badge tone="warning" className="ml-2">Trop longue pour l&apos;USSD</Badge>}
                                            {q.archived && <Badge className="ml-2">Archivée</Badge>}
                                            {q.tv_played_at && <span className="ml-2">· Jouée au TV Show le {fmtDate(q.tv_played_at, false)}</span>}
                                        </p>
                                    </td>
                                    <td className="px-3 py-2.5">{q.played_daily ? <Badge tone="warning">Oui</Badge> : <span className="text-ink-400">Non</span>}</td>
                                    <td className="px-3 py-2.5 whitespace-nowrap">
                                        {q.tv_reserved_session_id === null ? <span className="text-ink-400">—</span>
                                            : reservedElsewhere ? <Badge tone="info">Session #{q.tv_reserved_session_id}</Badge>
                                                : <Badge>Cette session</Badge>}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <Pagination page={page} pages={pages} total={total} perPage={BANK_PER_PAGE} onChange={setPage} className="border-t-0 px-0" />
        </Modal>
    );
}
