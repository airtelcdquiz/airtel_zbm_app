'use client'
/**
 * Page « Démo et mode d'emploi » du TV Show.
 * La simulation tourne dans le navigateur (lib/tvsim) et pilote le vrai écran télé,
 * ouvert en mode `?sim=1`, par postMessage. Aucune donnée réelle n'est lue ni écrite.
 */
import React from 'react';
import {
    BookOpen, Check, Eye, ExternalLink, Flag, Hourglass, ListOrdered, Pause, Play, RotateCcw, Square, Trophy, Users, X, Zap,
} from 'lucide-react';
import {
    Alert, Avatar, Badge, Button, Card, CardHeader, Field, PageBody, PageHeader, Switch, fmtInt, inputClass,
} from '@/components/ui/kit';
import { cn } from '@/lib/utils';
import { TV_BASE_URL, fmtClock, fmtMs } from '@/lib/tvshow';
import { SIM_DEFAULTS, SIM_MAX_QUESTIONS, SimConfig, SimEngine } from '@/lib/tvsim';
import { OptionsGrid, QuestionStatusBadge, SCENE_LABELS, StatusBadge } from './shared';
import SimPhone from './SimPhone';
import TvGuide from './TvGuide';

const TV_ORIGIN = new URL(TV_BASE_URL).origin;
const screenUrl = (chroma: boolean, sound: boolean) =>
    `${TV_BASE_URL}/screen/?sim=1${chroma ? '&mode=chroma' : ''}${sound ? '' : '&sound=0'}`;

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, Math.round(v || 0)));

function useEngine(engine: SimEngine | null) {
    const subscribe = React.useCallback((fn: () => void) => (engine ? engine.subscribe(fn) : () => {}), [engine]);
    return React.useSyncExternalStore(subscribe, () => engine?.version ?? -1, () => -1);
}

/** Fait tourner l'horloge de la simulation et diffuse l'état aux écrans (cadre + fenêtre). */
function useScreenLink(engine: SimEngine | null, frame: React.RefObject<HTMLIFrameElement | null>, popup: React.MutableRefObject<Window | null>) {
    React.useEffect(() => {
        if (!engine) return;
        let lastSig = '';
        let lastCount = -1;
        let lastFull = 0;
        const targets = () => [frame.current?.contentWindow, popup.current && !popup.current.closed ? popup.current : null].filter(Boolean) as Window[];
        const post = (w: Window, msg: unknown) => { try { w.postMessage(JSON.stringify(msg), TV_ORIGIN); } catch { /* fenêtre fermée */ } };
        const sendState = (to: Window[]) => { const state = engine.liveState(); to.forEach(w => post(w, { type: 'state', state })); };

        const timer = setInterval(() => {
            engine.tick();
            const s = engine.liveState();
            const { server_now: _now, ...rest } = s;
            const sig = JSON.stringify({ ...rest, question: rest.question ? { ...rest.question, answers_count: 0 } : null });
            const now = Date.now();
            // État complet à chaque changement (et toutes les 5 s pour recaler l'horloge) ;
            // compteur de réponses à part, comme le vrai serveur.
            if (sig !== lastSig || now - lastFull > 5000) { lastSig = sig; lastFull = now; sendState(targets()); }
            const count = s.question?.answers_count ?? 0;
            if (count !== lastCount) { lastCount = count; targets().forEach(w => post(w, { type: 'answers', count })); }
        }, 100);

        // L'écran annonce « tv-sim-ready » à son démarrage : on lui renvoie l'état courant.
        const onMessage = (e: MessageEvent) => {
            if (e.origin !== TV_ORIGIN || typeof e.data !== 'string' || !e.data.includes('tv-sim-ready')) return;
            const src = e.source as Window | null;
            if (src) { sendState([src]); post(src, { type: 'answers', count: engine.liveState().question?.answers_count ?? 0 }); }
        };
        window.addEventListener('message', onMessage);
        return () => { clearInterval(timer); window.removeEventListener('message', onMessage); };
    }, [engine, frame, popup]);
}

function useNow(ms = 250) {
    const [now, setNow] = React.useState(() => Date.now());
    React.useEffect(() => { const t = setInterval(() => setNow(Date.now()), ms); return () => clearInterval(t); }, [ms]);
    return now;
}

/* ------------------------------------------------------------------ Réglages */

function Settings({ onStart }: { onStart: (c: SimConfig) => void }) {
    const [c, setC] = React.useState<SimConfig>(SIM_DEFAULTS);
    const set = (k: keyof SimConfig) => (e: React.ChangeEvent<HTMLInputElement>) =>
        setC(prev => ({ ...prev, [k]: k === 'title' || k === 'ussdCode' ? e.target.value : Number(e.target.value) }));
    const start = () => onStart({
        title: c.title.trim() || SIM_DEFAULTS.title,
        ussdCode: c.ussdCode.trim() || SIM_DEFAULTS.ussdCode,
        duration: clamp(c.duration, 15, 60), delay: clamp(c.delay, 0, 15),
        questions: clamp(c.questions, 2, SIM_MAX_QUESTIONS), players: clamp(c.players, 5, 300),
    });
    return (
        <Card className="max-w-3xl">
            <CardHeader title="Préparer la démo" description="Une session fictive : joueurs inventés, questions d'exemple, réponses simulées." />
            <div className="space-y-4 px-5 py-5">
                <Alert tone="info">La démo tourne entièrement dans votre navigateur. Elle ne touche ni aux joueurs, ni aux questions, ni aux sessions réelles, et n&apos;envoie aucun SMS.</Alert>
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Titre affiché à l'écran"><input className={inputClass} value={c.title} onChange={set('title')} maxLength={60} /></Field>
                    <Field label="Code USSD affiché"><input className={inputClass} value={c.ussdCode} onChange={set('ussdCode')} maxLength={16} /></Field>
                    <Field label="Durée par question (s)" hint="15 à 60 s"><input type="number" min={15} max={60} className={inputClass} value={c.duration} onChange={set('duration')} /></Field>
                    <Field label="Délai de diffusion (s)" hint="Retard du signal télé, 0 à 15 s"><input type="number" min={0} max={15} className={inputClass} value={c.delay} onChange={set('delay')} /></Field>
                    <Field label="Nombre de questions" hint={`2 à ${SIM_MAX_QUESTIONS}. La 4e est faite pour que personne ne trouve.`}><input type="number" min={2} max={SIM_MAX_QUESTIONS} className={inputClass} value={c.questions} onChange={set('questions')} /></Field>
                    <Field label="Joueurs fictifs" hint="5 à 300"><input type="number" min={5} max={300} className={inputClass} value={c.players} onChange={set('players')} /></Field>
                </div>
                <Button onClick={start}><Play /> Lancer la démo</Button>
            </div>
        </Card>
    );
}

/* -------------------------------------------------------------------- Écran */

function ScreenCard({ frame, popup }: { frame: React.RefObject<HTMLIFrameElement | null>; popup: React.MutableRefObject<Window | null> }) {
    const [chroma, setChroma] = React.useState(false);
    const [sound, setSound] = React.useState(false);
    const url = screenUrl(chroma, sound);
    const openWindow = () => {
        const w = window.open(screenUrl(chroma, true), 'tvshow-demo-screen', 'popup=yes,width=1280,height=720');
        if (w) { popup.current = w; w.focus(); }
    };
    return (
        <Card>
            <CardHeader title="Écran télé" description="Le vrai écran du TV Show, piloté par la simulation."
                action={<Button variant="secondary" size="sm" onClick={openWindow}><ExternalLink /> Ouvrir en grand</Button>} />
            <div className="space-y-3 p-4">
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-ink-700">
                    <label className="flex items-center gap-2"><Switch checked={chroma} onChange={setChroma} label="Fond vert" /> Fond vert (incrustation)</label>
                    <label className="flex items-center gap-2"><Switch checked={sound} onChange={setSound} label="Son" /> Son</label>
                </div>
                <div className="overflow-hidden rounded-lg bg-ink-900 ring-1 ring-ink-200">
                    <iframe key={url} ref={frame} src={url} title="Écran télé (simulation)" className="block aspect-video w-full" allow="autoplay; fullscreen" />
                </div>
                <p className="text-xs text-ink-500">
                    « Ouvrir en grand » ouvre l&apos;écran dans une fenêtre à placer sur un second écran ou un téléviseur (F11 pour le plein écran). Elle reste pilotée par cette page.
                    {sound && ' Cliquez une fois dans l’écran pour autoriser le son.'}
                </p>
            </div>
        </Card>
    );
}

/* ------------------------------------------------------------------ Pupitre */

const RESULT_TONE = { winner: 'success', correct: 'info', wrong: 'neutral' } as const;

function SimPupitre({ engine, now }: { engine: SimEngine; now: number }) {
    const q = engine.cur;
    const live = engine.liveState(now);
    const lq = live.question;
    const open = engine.questionOpen;
    const st = engine.status;
    const nextIdx = engine.nextIdx;
    const answers = q ? [...q.answers].sort((a, b) => a.elapsedMs - b.elapsedMs) : [];

    let chrono = '';
    if (q && q.status === 'displayed') chrono = `Ouverture USSD dans ${fmtClock((q.opensAt! - now) / 1000)}`;
    else if (q && q.status === 'open') chrono = `Fermeture dans ${fmtClock((q.closesAt! - now) / 1000)}`;

    return (
        <Card>
            <CardHeader title="Pupitre (simulé)" description="Les mêmes étapes que le vrai pupitre."
                action={
                    <label className="flex items-center gap-2 text-[13px] text-ink-700">
                        <Switch checked={engine.auto} onChange={v => engine.setAuto(v)} label="Déroulement automatique" /> <Zap className="size-3.5 text-amber-500" /> Automatique
                    </label>
                } />
            <div className="space-y-4 p-4">
                <div className="flex flex-wrap items-center gap-2 text-[13px]">
                    <StatusBadge status={st} />
                    <Badge tone="dark">Scène : {SCENE_LABELS[engine.scene]}</Badge>
                    {lq && <Badge>Question {lq.position}/{lq.total}</Badge>}
                    {q && <QuestionStatusBadge status={q.status} />}
                    {chrono && <span className="inline-flex items-center gap-1 text-ink-600"><Hourglass className="size-3.5" /> <span className="tabular">{chrono}</span></span>}
                </div>

                {engine.auto && <Alert tone="info">Le déroulement automatique enchaîne les étapes : question, révélation, classement toutes les deux questions, puis podium. Les boutons restent utilisables.</Alert>}

                <div className="flex flex-wrap gap-2">
                    {st === 'registration' && <Button onClick={() => engine.startLive()}><Play /> Lancer le direct</Button>}
                    {st === 'live' && !open && nextIdx >= 0 && (
                        <Button onClick={() => engine.display()}><Eye /> Afficher la question {nextIdx + 1}</Button>
                    )}
                    {open && <Button variant="danger" onClick={() => engine.close()}><Square /> Fermer la question</Button>}
                    {q?.status === 'closed' && <Button onClick={() => engine.reveal()}><Check /> Révéler la réponse</Button>}
                    {st === 'live' && !open && <Button variant="secondary" onClick={() => engine.setScene('leaderboard')}><ListOrdered /> Classement</Button>}
                    {st === 'live' && !open && <Button variant="secondary" onClick={() => engine.setScene('waiting')}><Hourglass /> Attente</Button>}
                    {st === 'live' && !open && <Button variant="secondary" onClick={() => engine.pause()}><Pause /> Pause</Button>}
                    {st === 'paused' && <Button onClick={() => engine.resume()}><Play /> Reprendre</Button>}
                    {(st === 'live' || st === 'paused') && !open && <Button variant="danger" onClick={() => engine.end()}><Flag /> Terminer</Button>}
                    {st === 'finished' && <Badge tone="success"><Trophy className="size-3.5" /> Session terminée : podium à l&apos;écran</Badge>}
                </div>
                {st === 'registration' && (
                    <p className="text-[13px] text-ink-500">
                        {engine.registering ? 'Les inscriptions arrivent…' : 'Tous les joueurs fictifs sont inscrits.'} L&apos;écran affiche l&apos;attente avec le code USSD.
                    </p>
                )}

                {q && (
                    <div className="space-y-2 rounded-lg border border-ink-100 p-3">
                        <p className="text-sm font-medium text-ink-900">Q{q.idx + 1}. {q.def.question}</p>
                        <OptionsGrid options={q.def.options} correct={q.def.correct} compact />
                        {lq?.winner
                            ? <p className="text-[13px] text-success-700">Gagnant : <b>{lq.winner.display_name}</b> ({lq.winner.school}) en {fmtMs(lq.winner.elapsed_ms)}</p>
                            : (q.status === 'closed' || q.status === 'revealed') && <p className="text-[13px] text-ink-500">Personne n&apos;a trouvé.</p>}
                    </div>
                )}

                {q && (
                    <div>
                        <p className="mb-1.5 text-[13px] font-medium text-ink-700">Réponses reçues : {fmtInt(answers.length)}</p>
                        <div className="max-h-64 overflow-y-auto rounded-lg border border-ink-100 scroll-thin">
                            {answers.length === 0 ? (
                                <p className="p-3 text-[13px] text-ink-500">{q.status === 'displayed' ? 'Les réponses s’ouvrent après le délai de diffusion.' : 'Aucune réponse pour le moment.'}</p>
                            ) : (
                                <ul className="divide-y divide-ink-100 text-[13px]">
                                    {answers.map(a => (
                                        <li key={a.playerId} className={cn('flex items-center gap-2 px-3 py-1.5', a.human && 'bg-amber-50')}>
                                            <span className="w-14 shrink-0 tabular text-ink-500">{fmtMs(a.elapsedMs)}</span>
                                            <span className="min-w-0 flex-1 truncate"><b className="font-medium text-ink-900">{a.name}</b> <span className="text-ink-500">· {a.school}</span></span>
                                            <span className="tabular text-ink-600">choix {a.choice}</span>
                                            <Badge tone={RESULT_TONE[a.winner ? 'winner' : a.correct ? 'correct' : 'wrong']}>
                                                {a.winner ? <><Trophy className="size-3" /> Gagnant</> : a.correct ? 'Juste, trop tard' : <><X className="size-3" /> Faux</>}
                                            </Badge>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
}

/* --------------------------------------------------------------- Inscrits */

function PlayersCard({ engine }: { engine: SimEngine }) {
    const ranking = engine.ranking();
    const started = engine.status !== 'registration';
    const list = started ? ranking.slice(0, 10) : [...engine.players].reverse().slice(0, 12);
    return (
        <Card>
            <CardHeader title={started ? 'Classement' : 'Inscriptions'} description={`${fmtInt(engine.players.length)} joueur${engine.players.length > 1 ? 's' : ''} inscrit${engine.players.length > 1 ? 's' : ''}`}
                action={<Users className="size-4 text-ink-400" />} />
            <ul className="divide-y divide-ink-100">
                {list.map((p, i) => (
                    <li key={p.id} className={cn('flex items-center gap-2.5 px-4 py-2 text-[13px]', p.human && 'bg-amber-50')}>
                        {started && <span className="w-5 text-right tabular text-ink-500">{i + 1}</span>}
                        <Avatar name={p.name} seed={p.id} size="sm" />
                        <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium text-ink-900">{p.name}</span>
                            <span className="block truncate text-xs text-ink-500">{p.school} · {p.phone}</span>
                        </span>
                        {started && <span className="tabular font-semibold text-ink-900">{p.points} pts</span>}
                    </li>
                ))}
            </ul>
        </Card>
    );
}

/* -------------------------------------------------------------------- Page */

export default function TvDemo() {
    const [tab, setTab] = React.useState<'sim' | 'guide'>('sim');
    const [engine, setEngine] = React.useState<SimEngine | null>(null);
    const frame = React.useRef<HTMLIFrameElement | null>(null);
    const popup = React.useRef<Window | null>(null);
    useEngine(engine);
    useScreenLink(engine, frame, popup);
    const now = useNow();

    const tabs = [
        { key: 'sim' as const, label: 'Simulation', icon: <Play /> },
        { key: 'guide' as const, label: "Mode d'emploi", icon: <BookOpen /> },
    ];

    return (
        <PageBody>
            <PageHeader
                crumbs={[{ label: 'Tableau de bord', href: '/app' }, { label: 'TV Show', href: '/app/tvshow' }, { label: 'Démo' }]}
                title="Démo et mode d'emploi"
                description="Voir une session complète sans joueurs réels : inscriptions, questions, animations, fond vert."
                actions={engine && tab === 'sim' ? <Button variant="secondary" onClick={() => setEngine(null)}><RotateCcw /> Nouvelle démo</Button> : undefined}
            />
            <div className="mb-4 inline-flex rounded-lg border border-ink-200 bg-white p-0.5 shadow-sm" role="tablist">
                {tabs.map(t => (
                    <button key={t.key} role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)}
                        className={cn('inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-[13px] font-medium transition-colors [&_svg]:size-3.5',
                            tab === t.key ? 'bg-ink-900 text-white' : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900')}>
                        {t.icon}{t.label}
                    </button>
                ))}
            </div>

            {tab === 'guide' ? <TvGuide /> : !engine ? (
                <Settings onStart={c => setEngine(new SimEngine(c))} />
            ) : (
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
                    <div className="min-w-0 space-y-4">
                        <ScreenCard frame={frame} popup={popup} />
                        <SimPupitre engine={engine} now={now} />
                    </div>
                    <div className="space-y-4">
                        <Card>
                            <CardHeader title="Votre téléphone" description="Jouez contre les joueurs fictifs, comme un vrai joueur." />
                            <div className="p-4"><SimPhone engine={engine} ussdCode={engine.cfg.ussdCode} /></div>
                        </Card>
                        <PlayersCard engine={engine} />
                    </div>
                </div>
            )}
        </PageBody>
    );
}
