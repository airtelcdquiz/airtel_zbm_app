'use client'
/**
 * Pupitre de l'animateur : pilotage du direct.
 * Initialisation par GET /live, puis WebSocket ; chaque action renvoie le nouvel état.
 */
import React from 'react';
import Link from 'next/link';
import {
    ArrowLeft, Ban, Check, Eye, Flag, Hourglass, ListOrdered, Pause, Play, Radio, Replace, Square, Trophy, UserX, Wifi, WifiOff, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    Alert, Badge, Button, Card, CardHeader, EmptyState, Modal, PageBody, SearchInput, Skeleton, Spinner, fmtInt,
} from '@/components/ui/kit';
import {
    Answer, LiveAction, LiveState, QuestionStatus, SessionQuestion, TvPlayer, WsStatus,
    clockOffset, connectLive, fmtClock, fmtMs, tv, tvError,
} from '@/lib/tvshow';
import { OptionsGrid, QuestionStatusBadge, SCENE_LABELS, StatusBadge } from './shared';

const isOpen = (s?: QuestionStatus | null) => s === 'displayed' || s === 'open';
const answerKey = (a: Answer) => `${a.phone_masked}|${a.received_at}|${a.choice}`;
const mergeAnswers = (prev: Answer[], incoming: Answer[]) => {
    const m = new Map(prev.map(a => [answerKey(a), a]));
    incoming.forEach(a => m.set(answerKey(a), a));
    return [...m.values()].sort((a, b) => a.elapsed_ms - b.elapsed_ms);
};

type Confirm =
    | null
    | { kind: 'end' }
    | { kind: 'cancel_question'; q: SessionQuestion }
    | { kind: 'replace'; q: SessionQuestion }
    | { kind: 'exclude' };

export default function Pupitre({ id }: { id: string }) {
    const [live, setLive] = React.useState<LiveState | null>(null);
    const [loadError, setLoadError] = React.useState('');
    const [error, setError] = React.useState('');
    const [busy, setBusy] = React.useState<string>('');
    const busyRef = React.useRef('');
    const offsetRef = React.useRef(0);
    const [now, setNow] = React.useState(() => Date.now());
    const [ws, setWs] = React.useState<{ status: WsStatus; retryIn?: number }>({ status: 'connecting' });
    const [answers, setAnswers] = React.useState<Answer[]>([]);
    const [wsCount, setWsCount] = React.useState<number | null>(null);
    const [confirm, setConfirm] = React.useState<Confirm>(null);

    /** N'accepte que l'état de cette session, et jamais un état plus ancien que l'actuel. */
    const applyState = React.useCallback((s: LiveState) => {
        if (!s?.session || String(s.session.id) !== String(id)) return;
        setLive(prev => (prev && Date.parse(s.server_now) < Date.parse(prev.server_now) ? prev : s));
    }, [id]);

    const load = React.useCallback(async () => {
        setLoadError('');
        try {
            const s = await tv.live(id);
            offsetRef.current = clockOffset(s.server_now);
            applyState(s);
        } catch (e) {
            setLoadError(tvError(e, "Impossible de charger l'état du direct."));
        }
    }, [id, applyState]);

    React.useEffect(() => { load(); }, [load]);

    React.useEffect(() => connectLive(id, {
        onState: applyState,
        onOffset: o => { offsetRef.current = o; },
        onAnswers: c => setWsCount(c),
        onAnswer: a => setAnswers(prev => mergeAnswers(prev, [a])),
        onStatus: (status, retryIn) => setWs({ status, retryIn }),
    }), [id, applyState]);

    React.useEffect(() => {
        const t = setInterval(() => setNow(Date.now()), 200);
        return () => clearInterval(t);
    }, []);

    // Réponses de la question en cours : rechargées à chaque changement de question.
    const qid = live?.question?.id ?? null;
    React.useEffect(() => {
        setAnswers([]); setWsCount(null);
        if (qid === null) return;
        let cancelled = false;
        tv.answers(id, qid).then(a => { if (!cancelled) setAnswers(prev => mergeAnswers(prev, a)); }).catch(() => { /* le WebSocket complétera */ });
        return () => { cancelled = true; };
    }, [id, qid]);

    const act = React.useCallback(async (action: LiveAction, body?: Record<string, unknown>) => {
        if (busyRef.current) return false;
        (document.activeElement as HTMLElement | null)?.blur?.();
        busyRef.current = action; setBusy(action); setError('');
        try {
            const s = await tv.action(id, action, body);
            offsetRef.current = clockOffset(s.server_now);
            applyState(s);
            return true;
        } catch (e) {
            setError(tvError(e));
            return false;
        } finally {
            busyRef.current = ''; setBusy('');
        }
    }, [id, applyState]);

    /* --------------------------------------------------- Actions possibles */

    const st = live?.session.status;
    const q = live?.question ?? null;
    const questions = React.useMemo(
        () => [...(live?.questions ?? [])].sort((a, b) => Number(a.is_reserve) - Number(b.is_reserve) || a.position - b.position),
        [live?.questions],
    );
    const mainQs = questions.filter(x => !x.is_reserve);
    const reserves = (live?.reserves ?? questions.filter(x => x.is_reserve)).filter(x => x.status === 'pending');
    const anyOpen = isOpen(q?.status) || questions.some(x => isOpen(x.status));
    const nextQ = live?.next !== undefined ? live.next : mainQs.find(x => x.status === 'pending') ?? null;
    const onAir = st === 'live' || st === 'paused';

    const can = {
        start: (st === 'draft' || st === 'registration') && ((live?.session.questions_count ?? 0) > 0 || mainQs.length > 0),
        display: st === 'live' && !anyOpen && !!nextQ,
        close: st === 'live' && !!q && isOpen(q.status),
        reveal: st === 'live' && q?.status === 'closed',
        scene: onAir,
        pause: st === 'live' && !anyOpen,
        resume: st === 'paused',
        end: onAir && !anyOpen,
    };

    /** Action déclenchée par la barre d'espace. */
    const spaceAction: { label: string; run: () => void } | null =
        can.start ? { label: 'Lancer le direct', run: () => act('start') }
            : can.resume ? { label: 'Reprendre', run: () => act('resume') }
                : can.reveal ? { label: 'Révéler la réponse', run: () => act('reveal') }
                    : can.display ? { label: `Afficher la question ${nextQ?.position ?? ''}`.trim(), run: () => act('display') }
                        : can.end ? { label: 'Terminer (confirmation)', run: () => setConfirm({ kind: 'end' }) }
                            : null;

    const keysRef = React.useRef({ spaceAction, can, act });
    keysRef.current = { spaceAction, can, act };

    React.useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
            const t = e.target as HTMLElement | null;
            if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
            if (document.querySelector('[role="dialog"]')) return;
            const { spaceAction: sp, can: c, act: a } = keysRef.current;
            const k = e.key.toLowerCase();
            if (e.code === 'Space' || k === ' ') {
                e.preventDefault();
                (document.activeElement as HTMLElement | null)?.blur?.();
                sp?.run();
            } else if (k === 'r') {
                if (c.reveal) { e.preventDefault(); a('reveal'); }
            } else if (k === 'c') {
                if (c.scene) { e.preventDefault(); a('scene', { scene: 'leaderboard' }); }
            } else if (k === 'p') {
                if (c.pause) { e.preventDefault(); a('pause'); } else if (c.resume) { e.preventDefault(); a('resume'); }
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    /* -------------------------------------------------------------- Rendu */

    if (!live) {
        return (
            <PageBody>
                <BackLink id={id} />
                {loadError ? (
                    <Card className="p-6">
                        <Alert>{loadError}</Alert>
                        <Button variant="secondary" size="sm" className="mt-4" onClick={load}>Réessayer</Button>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-64 w-full" />
                    </div>
                )}
            </PageBody>
        );
    }

    const serverNow = now + offsetRef.current;
    const count = q ? Math.max(q.answers_count ?? 0, wsCount ?? 0) : 0;
    const scene = live.scene;

    return (
        <PageBody className="max-w-[1600px] space-y-5">
            <BackLink id={id} />

            {/* En-tête */}
            <Card className={cn('px-5 py-4', st === 'live' && 'border-brand-200')}>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2.5">
                            <h1 className="truncate text-xl font-semibold tracking-tight text-ink-900">{live.session.title}</h1>
                            <StatusBadge status={live.session.status} />
                        </div>
                        <p className="mt-1 text-[13px] text-ink-500">
                            Code <span className="font-mono font-semibold text-ink-800">{live.session.code}</span>
                            {live.ussd_code && <> · USSD <span className="font-mono font-semibold text-ink-800">{live.ussd_code}</span></>}
                            {' · '}Décalage diffusion {live.session.broadcast_delay_s} s
                        </p>
                    </div>
                    <HeaderStat label="Inscrits" value={fmtInt(live.session.players_count)} />
                    <HeaderStat label="Scène" value={SCENE_LABELS[scene] ?? scene} />
                    <HeaderStat label="Question" value={q ? `Q${q.position}/${q.total}` : '—'} />
                    <WsIndicator status={ws.status} retryIn={ws.retryIn} />
                </div>
            </Card>

            {error && (
                <Alert className="flex items-start justify-between gap-3">
                    <span>{error}</span>
                    <button onClick={() => setError('')} aria-label="Fermer le message" className="shrink-0 rounded p-0.5 hover:bg-brand-100"><X className="size-4" /></button>
                </Alert>
            )}

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
                {/* Question en cours */}
                <CurrentQuestion live={live} serverNow={serverNow} count={count} />

                {/* Commandes */}
                <Card className="p-4">
                    <div className="mb-3 flex items-center justify-between gap-2">
                        <h2 className="text-[15px] font-semibold text-ink-900">Commandes</h2>
                        {busy && <Spinner className="size-4" />}
                    </div>
                    <div className="space-y-2.5">
                        {can.start && <Big icon={<Radio />} kbd="Espace" onClick={() => act('start')} busy={busy === 'start'} disabled={!!busy}>Lancer le direct</Big>}
                        {can.resume && <Big icon={<Play />} kbd="P" onClick={() => act('resume')} busy={busy === 'resume'} disabled={!!busy}>Reprendre</Big>}
                        {can.display && (
                            <Big icon={<Play />} kbd={spaceAction?.label.startsWith('Afficher') ? 'Espace' : undefined} onClick={() => act('display')} busy={busy === 'display'} disabled={!!busy}>
                                Afficher la question suivante{nextQ ? ` (Q${nextQ.position})` : ''}
                            </Big>
                        )}
                        {can.close && <Big icon={<Square />} variant="secondary" onClick={() => act('close')} busy={busy === 'close'} disabled={!!busy}>Fermer la question</Big>}
                        {can.reveal && <Big icon={<Eye />} kbd="R" variant="success" onClick={() => act('reveal')} busy={busy === 'reveal'} disabled={!!busy}>Révéler la réponse</Big>}
                        {can.scene && (
                            <div className="grid grid-cols-2 gap-2.5">
                                <Big icon={<ListOrdered />} kbd="C" variant="secondary" active={scene === 'leaderboard'} onClick={() => act('scene', { scene: 'leaderboard' })} busy={busy === 'scene'} disabled={!!busy} small>Classement</Big>
                                <Big icon={<Hourglass />} variant="secondary" active={scene === 'waiting'} onClick={() => act('scene', { scene: 'waiting' })} disabled={!!busy} small>Écran d&apos;attente</Big>
                                {q && q.status !== 'pending' && q.status !== 'cancelled' && scene !== 'question' && scene !== 'reveal' && (
                                    <Big icon={<Eye />} variant="secondary" className="col-span-2" disabled={!!busy} small
                                        onClick={() => act('scene', { scene: q.status === 'revealed' ? 'reveal' : 'question' })}>
                                        Revenir à la question
                                    </Big>
                                )}
                            </div>
                        )}
                        {can.pause && <Big icon={<Pause />} kbd="P" variant="secondary" onClick={() => act('pause')} busy={busy === 'pause'} disabled={!!busy} small>Pause</Big>}
                        {can.end && <Big icon={<Flag />} variant="danger" onClick={() => setConfirm({ kind: 'end' })} disabled={!!busy} small>Terminer la session</Big>}
                        {!Object.values(can).some(Boolean) && (
                            <p className="rounded-lg bg-ink-50 px-3 py-3 text-[13px] text-ink-600">
                                {st === 'finished' ? 'Session terminée.' : st === 'cancelled' ? 'Session annulée.'
                                    : anyOpen ? 'Question en cours : attendez la fermeture ou fermez-la.' : 'Aucune action disponible.'}
                            </p>
                        )}
                        {onAir && (
                            <Button variant="ghost" size="sm" className="w-full" onClick={() => setConfirm({ kind: 'exclude' })} disabled={!!busy}>
                                <UserX /> Exclure un joueur
                            </Button>
                        )}
                    </div>
                    <div className="mt-4 border-t border-ink-100 pt-3 text-xs text-ink-500">
                        <p><Kbd>Espace</Kbd> {spaceAction ? spaceAction.label : <span className="text-ink-400">aucune action</span>}</p>
                        <p className="mt-1.5"><Kbd>R</Kbd> révéler · <Kbd>C</Kbd> classement · <Kbd>P</Kbd> pause / reprise</p>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <AnswersPanel answers={answers} count={count} hasQuestion={!!q} correct={q?.correct_option ?? null} />
                <Card>
                    <CardHeader title="Classement" description="Top 10" />
                    {live.leaderboard.length === 0 ? (
                        <EmptyState icon={<Trophy />} title="Aucun point marqué" className="py-10" />
                    ) : (
                        <ol className="divide-y divide-ink-100">
                            {live.leaderboard.slice(0, 10).map(r => (
                                <li key={`${r.rank}-${r.phone_masked}`} className="flex items-center gap-3 px-5 py-2.5">
                                    <span className={cn('inline-flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular',
                                        r.rank === 1 ? 'bg-amber-100 text-amber-800' : r.rank <= 3 ? 'bg-ink-200 text-ink-800' : 'bg-ink-100 text-ink-500')}>{r.rank}</span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-sm font-medium text-ink-900">{r.display_name}</span>
                                        <span className="block truncate text-xs text-ink-500">{r.school} · {r.phone_masked}</span>
                                    </span>
                                    <span className="text-right tabular">
                                        <span className="block text-sm font-semibold text-ink-900">{fmtInt(r.points)} pts</span>
                                        <span className="block text-xs text-ink-400">{fmtMs(r.win_time_ms)}</span>
                                    </span>
                                </li>
                            ))}
                        </ol>
                    )}
                </Card>
            </div>

            <QuestionList questions={questions} currentId={q?.id ?? null} canEdit={st !== 'finished' && st !== 'cancelled'} hasReserves={reserves.length > 0}
                onReplace={x => setConfirm({ kind: 'replace', q: x })} onCancel={x => setConfirm({ kind: 'cancel_question', q: x })} />

            {/* Confirmations */}
            <Modal open={confirm?.kind === 'end'} onClose={() => !busy && setConfirm(null)} size="sm" title="Terminer la session ?"
                description={`Le podium s'affiche à l'écran et la session ne pourra plus reprendre.${mainQs.filter(x => x.status === 'pending').length ? ` ${mainQs.filter(x => x.status === 'pending').length} question(s) n'ont pas été jouées.` : ''}`}
                footer={<>
                    <Button variant="secondary" onClick={() => setConfirm(null)} disabled={!!busy}>Retour</Button>
                    <Button onClick={async () => { await act('end'); setConfirm(null); }} loading={busy === 'end'}><Flag /> Terminer</Button>
                </>} />

            <Modal open={confirm?.kind === 'cancel_question'} onClose={() => !busy && setConfirm(null)} size="sm" title="Annuler cette question ?"
                description={confirm?.kind === 'cancel_question'
                    ? `Q${confirm.q.position} sera annulée${confirm.q.winner ? ` et les points de ${confirm.q.winner.display_name} retirés` : ''}.`
                    : undefined}
                footer={<>
                    <Button variant="secondary" onClick={() => setConfirm(null)} disabled={!!busy}>Retour</Button>
                    <Button onClick={async () => { if (confirm?.kind === 'cancel_question') await act('cancel_question', { question_id: confirm.q.id }); setConfirm(null); }}
                        loading={busy === 'cancel_question'}><Ban /> Annuler la question</Button>
                </>} />

            <Modal open={confirm?.kind === 'replace'} onClose={() => !busy && setConfirm(null)} title="Remplacer par une réserve"
                description={confirm?.kind === 'replace' ? `Q${confirm.q.position} : ${confirm.q.question}` : undefined}
                footer={<Button variant="secondary" onClick={() => setConfirm(null)} disabled={!!busy}>Annuler</Button>}>
                {reserves.length === 0 ? <p className="text-sm text-ink-500">Aucune réserve disponible.</p> : (
                    <ul className="max-h-[50vh] space-y-2 overflow-y-auto scroll-thin">
                        {reserves.map(r => (
                            <li key={r.id} className="rounded-lg border border-ink-200 p-3">
                                <div className="flex items-start gap-3">
                                    <p className="min-w-0 flex-1 text-sm text-ink-900">{r.question}</p>
                                    <Button size="sm" loading={busy === 'replace'} disabled={!!busy}
                                        onClick={async () => { if (confirm?.kind === 'replace') { await act('replace', { question_id: confirm.q.id, reserve_id: r.id }); setConfirm(null); } }}>
                                        <Replace /> Choisir
                                    </Button>
                                </div>
                                {r.too_long && <Badge tone="warning" className="mt-2">Trop longue pour l&apos;USSD</Badge>}
                                <div className="mt-2"><OptionsGrid options={r.options} correct={Number(r.response)} compact /></div>
                            </li>
                        ))}
                    </ul>
                )}
            </Modal>

            {confirm?.kind === 'exclude' && <ExcludeModal sessionId={id} onClose={() => setConfirm(null)} onError={setError} />}
        </PageBody>
    );
}

/* ------------------------------------------------------------ Morceaux */

function BackLink({ id }: { id: string }) {
    return (
        <Link href={`/app/tvshow/${id}`} className="inline-flex items-center gap-1.5 text-[13px] text-ink-500 hover:text-ink-900">
            <ArrowLeft className="size-4" /> Retour à la fiche
        </Link>
    );
}

function HeaderStat({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="text-right">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">{label}</p>
            <p className="text-lg font-semibold text-ink-900 tabular">{value}</p>
        </div>
    );
}

function WsIndicator({ status, retryIn }: { status: WsStatus; retryIn?: number }) {
    if (status === 'open') return <Badge tone="success" dot><Wifi className="size-3" /> Temps réel</Badge>;
    if (status === 'connecting') return <Badge tone="warning"><Spinner className="size-3 text-current" /> Connexion…</Badge>;
    return <Badge tone="brand"><WifiOff className="size-3" /> Déconnecté{retryIn ? ` · nouvel essai dans ${Math.ceil(retryIn / 1000)} s` : ''}</Badge>;
}

function Kbd({ children }: { children: React.ReactNode }) {
    return <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-ink-200 bg-white px-1.5 font-mono text-[11px] font-medium text-ink-700 shadow-sm">{children}</kbd>;
}

function Big({ children, icon, kbd, onClick, busy, disabled, variant = 'primary', active, small, className }: {
    children: React.ReactNode; icon?: React.ReactNode; kbd?: string; onClick: () => void; busy?: boolean; disabled?: boolean;
    variant?: 'primary' | 'secondary' | 'success' | 'danger'; active?: boolean; small?: boolean; className?: string;
}) {
    return (
        <Button variant={variant} onClick={onClick} loading={busy} disabled={disabled}
            className={cn('w-full justify-between', small ? 'h-11 text-sm' : 'h-14 text-base [&_svg]:size-5',
                active && 'border-ink-900 ring-2 ring-ink-900/10', className)}>
            <span className="inline-flex items-center gap-2">{!busy && icon}{children}</span>
            {kbd && <span className="rounded border border-current/30 px-1.5 font-mono text-[11px] opacity-70">{kbd}</span>}
        </Button>
    );
}

function Chrono({ label, value, tone, progress }: { label: string; value: string; tone: 'live' | 'wait' | 'off'; progress?: number }) {
    return (
        <div className={cn('rounded-xl border px-4 py-3', tone === 'live' ? 'border-brand-200 bg-brand-50' : tone === 'wait' ? 'border-warning-600/20 bg-warning-50' : 'border-ink-200 bg-ink-50')}>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">{label}</p>
            <p className={cn('mt-0.5 text-2xl font-bold tabular', tone === 'live' ? 'text-brand-700' : tone === 'wait' ? 'text-warning-700' : 'text-ink-500')}>{value}</p>
            {progress !== undefined && (
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/80">
                    <div className={cn('h-full rounded-full transition-[width] duration-200', tone === 'live' ? 'bg-brand-600' : 'bg-warning-600')} style={{ width: `${Math.max(0, Math.min(100, progress * 100))}%` }} />
                </div>
            )}
        </div>
    );
}

function CurrentQuestion({ live, serverNow, count }: { live: LiveState; serverNow: number; count: number }) {
    const q = live.question;
    if (!q) {
        return (
            <Card className="flex items-center">
                <EmptyState icon={<Hourglass />} className="w-full"
                    title={live.session.status === 'finished' ? 'Session terminée' : 'Aucune question affichée'}
                    description={live.next ? `Prochaine : Q${live.next.position} — ${live.next.question}` : undefined} />
            </Card>
        );
    }

    const open = isOpen(q.status);
    // Chrono écran : displayed_at -> displayed_at + duration_s.
    let screen: { value: string; tone: 'live' | 'wait' | 'off'; progress?: number } = { value: '—', tone: 'off' };
    if (q.displayed_at) {
        const start = Date.parse(q.displayed_at), end = start + q.duration_s * 1000;
        screen = open && serverNow < end
            ? { value: fmtClock((end - serverNow) / 1000), tone: 'live', progress: (end - serverNow) / (end - start) }
            : { value: open ? '00:00' : 'Terminé', tone: 'off' };
    }
    // Fenêtre USSD : opens_at -> closes_at.
    let ussd: { label: string; value: string; tone: 'live' | 'wait' | 'off'; progress?: number } = { label: 'USSD', value: 'Fermé', tone: 'off' };
    if (open && q.opens_at) {
        const o = Date.parse(q.opens_at), c = q.closes_at ? Date.parse(q.closes_at) : o + q.duration_s * 1000;
        if (serverNow < o) ussd = { label: 'USSD ouvert dans', value: `${Math.ceil((o - serverNow) / 1000)} s`, tone: 'wait' };
        else if (serverNow < c) ussd = { label: 'USSD', value: `${Math.ceil((c - serverNow) / 1000)} s restantes`, tone: 'live', progress: (c - serverNow) / (c - o) };
        else ussd = { label: 'USSD', value: 'Fermeture…', tone: 'off' };
    }

    return (
        <Card className="p-5">
            <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex h-8 items-center rounded-lg bg-ink-900 px-3 text-base font-bold text-white tabular">Q{q.position}/{q.total}</span>
                <QuestionStatusBadge status={q.status} />
                <span className="ml-auto text-sm text-ink-600"><span className="text-lg font-semibold text-ink-900 tabular">{fmtInt(count)}</span> réponse{count > 1 ? 's' : ''}</span>
            </div>
            <p className="mt-4 text-xl font-semibold leading-snug text-ink-900 sm:text-2xl">{q.question}</p>
            <div className="mt-4"><OptionsGrid options={q.options} correct={q.correct_option} /></div>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Chrono label="Écran" {...screen} />
                <Chrono {...ussd} />
            </div>
            {q.winner ? (
                <div className="mt-4 flex items-center gap-3 rounded-xl border border-success-600/20 bg-success-50 px-4 py-3">
                    <Trophy className="size-6 shrink-0 text-success-700" />
                    <div className="min-w-0 flex-1">
                        <p className="text-base font-semibold text-success-700">{q.winner.display_name}</p>
                        <p className="truncate text-[13px] text-success-700/80">{q.winner.school} · {q.winner.phone_masked}</p>
                    </div>
                    <span className="text-lg font-bold text-success-700 tabular">{fmtMs(q.winner.elapsed_ms)}</span>
                </div>
            ) : (q.status === 'closed' || q.status === 'revealed') && (
                <p className="mt-4 rounded-xl bg-ink-50 px-4 py-3 text-sm text-ink-600">Aucun gagnant pour cette question.</p>
            )}
        </Card>
    );
}

function AnswersPanel({ answers, count, hasQuestion, correct }: { answers: Answer[]; count: number; hasQuestion: boolean; correct: number | null }) {
    const right = answers.filter(a => a.is_correct).length;
    return (
        <Card>
            <CardHeader title="Réponses à la question en cours"
                description={hasQuestion ? `${fmtInt(count)} reçue${count > 1 ? 's' : ''} · ${fmtInt(right)} bonne${right > 1 ? 's' : ''} parmi les ${fmtInt(answers.length)} affichées` : 'Aucune question en cours'} />
            {answers.length === 0 ? (
                <EmptyState icon={<Check />} title={hasQuestion ? 'Aucune réponse pour le moment' : 'En attente'} className="py-10" />
            ) : (
                <ol className="max-h-[420px] divide-y divide-ink-100 overflow-y-auto scroll-thin">
                    {answers.map((a, i) => (
                        <li key={answerKey(a)} className={cn('flex items-center gap-3 px-5 py-2.5', a.is_winner && 'bg-success-50')}>
                            <span className="w-6 shrink-0 text-right text-xs text-ink-400 tabular">{i + 1}</span>
                            <span className={cn('inline-flex size-6 shrink-0 items-center justify-center rounded-full', a.is_correct ? 'bg-success-600 text-white' : 'bg-brand-100 text-brand-700')}
                                aria-label={a.is_correct ? 'Bonne réponse' : 'Mauvaise réponse'}>
                                {a.is_correct ? <Check className="size-3.5" /> : <X className="size-3.5" />}
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className={cn('block truncate text-sm', a.is_winner ? 'font-semibold text-success-700' : 'font-medium text-ink-900')}>
                                    {a.display_name}{a.is_winner && <Trophy className="ml-1.5 inline size-3.5" aria-label="Gagnant" />}
                                </span>
                                <span className="block truncate text-xs text-ink-500">{a.school} · {a.phone_masked}</span>
                            </span>
                            <span className={cn('shrink-0 rounded px-1.5 text-xs font-semibold tabular', correct !== null && a.choice === correct ? 'text-success-700' : 'text-ink-500')}>Rép. {a.choice}</span>
                            <span className="w-16 shrink-0 text-right text-sm text-ink-700 tabular">{fmtMs(a.elapsed_ms)}</span>
                        </li>
                    ))}
                </ol>
            )}
        </Card>
    );
}

function QuestionList({ questions, currentId, canEdit, hasReserves, onReplace, onCancel }: {
    questions: SessionQuestion[]; currentId: number | null; canEdit: boolean; hasReserves: boolean;
    onReplace: (q: SessionQuestion) => void; onCancel: (q: SessionQuestion) => void;
}) {
    const main = questions.filter(q => !q.is_reserve);
    const reserves = questions.filter(q => q.is_reserve);
    return (
        <Card>
            <CardHeader title="Questions" description={`${main.length} question${main.length > 1 ? 's' : ''} · ${reserves.filter(r => r.status === 'pending').length} réserve(s) disponible(s)`} />
            {questions.length === 0 ? <EmptyState icon={<ListOrdered />} title="Aucune question" className="py-10" /> : (
                <ol className="divide-y divide-ink-100">
                    {[...main, ...reserves].map(q => (
                        <li key={q.id} className={cn('flex flex-wrap items-center gap-3 px-5 py-3', q.id === currentId && 'bg-brand-50/60', q.status === 'cancelled' && 'opacity-60')}>
                            <span className={cn('inline-flex h-6 min-w-10 shrink-0 items-center justify-center rounded-md px-1.5 text-xs font-semibold tabular',
                                q.is_reserve ? 'bg-ink-100 text-ink-500' : q.id === currentId ? 'bg-brand-600 text-white' : 'bg-ink-900 text-white')}>
                                {q.is_reserve ? 'Rés.' : `Q${q.position}`}
                            </span>
                            <p className={cn('min-w-0 flex-1 truncate text-sm text-ink-900', q.status === 'cancelled' && 'line-through')} title={q.question}>{q.question}</p>
                            {q.too_long && <Badge tone="warning">Trop longue</Badge>}
                            {q.winner && <span className="hidden truncate text-xs text-success-700 sm:inline">{q.winner.display_name}</span>}
                            {q.status !== 'pending' && <span className="text-xs text-ink-500 tabular">{fmtInt(q.answers_count)} rép.</span>}
                            <QuestionStatusBadge status={q.status} />
                            {canEdit && !q.is_reserve && q.status === 'pending' && (
                                <Button variant="ghost" size="sm" onClick={() => onReplace(q)} disabled={!hasReserves} title={hasReserves ? undefined : 'Aucune réserve disponible'}>
                                    <Replace /> Remplacer par une réserve
                                </Button>
                            )}
                            {canEdit && (q.status === 'closed' || q.status === 'revealed') && (
                                <Button variant="ghost" size="sm" onClick={() => onCancel(q)}><Ban /> Annuler la question</Button>
                            )}
                        </li>
                    ))}
                </ol>
            )}
        </Card>
    );
}

function ExcludeModal({ sessionId, onClose, onError }: { sessionId: string; onClose: () => void; onError: (m: string) => void }) {
    const [search, setSearch] = React.useState('');
    const [rows, setRows] = React.useState<TvPlayer[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [target, setTarget] = React.useState<TvPlayer | null>(null);
    const [busy, setBusy] = React.useState(false);
    const [done, setDone] = React.useState('');

    React.useEffect(() => {
        if (!search) { setRows([]); return; }
        let cancelled = false;
        setLoading(true);
        tv.listPlayers(sessionId, { search, page: 1, per_page: 10 })
            .then(d => { if (!cancelled) setRows(d.players ?? []); })
            .catch(() => { if (!cancelled) setRows([]); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [sessionId, search]);

    const exclude = async () => {
        if (!target) return;
        setBusy(true);
        try {
            await tv.removePlayer(sessionId, target.phone_number);
            setDone(`${target.display_name} a été exclu de la session.`);
            setRows(r => r.filter(x => x.phone_number !== target.phone_number));
            setTarget(null);
        } catch (e) {
            onError(tvError(e, "L'exclusion a échoué."));
            onClose();
        } finally {
            setBusy(false);
        }
    };

    if (target) {
        return (
            <Modal open onClose={() => !busy && setTarget(null)} size="sm" title="Exclure ce joueur ?"
                description={`${target.name || target.display_name} (${target.phone_masked}, ${target.school}) sera retiré de la session. Ses réponses suivantes seront refusées.`}
                footer={<>
                    <Button variant="secondary" onClick={() => setTarget(null)} disabled={busy}>Retour</Button>
                    <Button onClick={exclude} loading={busy}><UserX /> Exclure</Button>
                </>} />
        );
    }
    return (
        <Modal open onClose={onClose} title="Exclure un joueur" description="Recherchez le joueur parmi les inscrits de la session."
            footer={<Button variant="secondary" onClick={onClose}>Fermer</Button>}>
            {done && <Alert tone="success" className="mb-3">{done}</Alert>}
            <SearchInput value={search} onSearch={setSearch} placeholder="Nom ou numéro" />
            <div className="mt-3 max-h-[45vh] overflow-y-auto scroll-thin">
                {loading ? <div className="flex justify-center py-6"><Spinner /></div>
                    : !search ? <p className="py-4 text-center text-[13px] text-ink-500">Saisissez un nom ou un numéro.</p>
                        : rows.length === 0 ? <p className="py-4 text-center text-[13px] text-ink-500">Aucun inscrit trouvé.</p>
                            : (
                                <ul className="divide-y divide-ink-100 rounded-lg border border-ink-200">
                                    {rows.map(p => (
                                        <li key={p.phone_number} className="flex items-center gap-3 px-3 py-2.5">
                                            <span className="min-w-0 flex-1">
                                                <span className="block truncate text-sm font-medium text-ink-900">{p.name || p.display_name}</span>
                                                <span className="block truncate text-xs text-ink-500">{p.phone_masked} · {p.school} · {fmtInt(p.points)} pts</span>
                                            </span>
                                            <Button size="sm" variant="danger" onClick={() => setTarget(p)}><UserX /> Exclure</Button>
                                        </li>
                                    ))}
                                </ul>
                            )}
            </div>
        </Modal>
    );
}

