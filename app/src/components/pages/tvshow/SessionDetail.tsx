'use client'
import React from 'react';
import { useRouter } from 'next/navigation';
import { Ban, Info, MonitorPlay, RotateCcw, Trash2, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    Alert, Button, ButtonLink, Card, CardHeader, Modal, PageBody, PageHeader, Skeleton, fmtDate, fmtInt,
} from '@/components/ui/kit';
import { SessionQuestion, TvSession, tv, tvError } from '@/lib/tvshow';
import {
    SessionFields, SessionFormState, StatusBadge, formFromSession, formToInput, isLocked, useZbmFilters, ZbmFilters,
} from './shared';
import PlayersTab from './PlayersTab';
import QuestionsTab from './QuestionsTab';
import ScreenTab from './ScreenTab';

type Tab = 'general' | 'players' | 'questions' | 'screen';
const TABS: { id: Tab; label: string }[] = [
    { id: 'general', label: 'Général' },
    { id: 'players', label: 'Inscrits' },
    { id: 'questions', label: 'Questions' },
    { id: 'screen', label: 'Écran télé' },
];

export default function SessionDetail({ id }: { id: string }) {
    const filters = useZbmFilters();
    const [session, setSession] = React.useState<TvSession | null>(null);
    const [questions, setQuestions] = React.useState<SessionQuestion[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [notFound, setNotFound] = React.useState(false);
    const [error, setError] = React.useState('');
    const [tab, setTab] = React.useState<Tab>('general');

    React.useEffect(() => {
        const h = window.location.hash.slice(1) as Tab;
        if (TABS.some(t => t.id === h)) setTab(h);
    }, []);
    const selectTab = (t: Tab) => { setTab(t); history.replaceState(null, '', `#${t}`); };

    const reload = React.useCallback(async () => {
        try {
            const d = await tv.getSession(id);
            setSession(d.session); setQuestions(d.questions ?? []);
        } catch (e) {
            const st = (e as { response?: { status?: number } })?.response?.status;
            if (st === 404) setNotFound(true); else setError(tvError(e, 'Impossible de charger la session.'));
        } finally {
            setLoading(false);
        }
    }, [id]);
    React.useEffect(() => { reload(); }, [reload]);

    const crumbs = [{ label: 'Tableau de bord', href: '/app' }, { label: 'TV Show', href: '/app/tvshow' }, { label: session?.title ?? `Session #${id}` }];

    if (notFound) {
        return (
            <PageBody>
                <PageHeader title="Session introuvable" crumbs={crumbs} />
                <Card className="p-6">
                    <p className="text-sm text-ink-600">Cette session n&apos;existe pas ou a été supprimée.</p>
                    <ButtonLink href="/app/tvshow" variant="secondary" size="sm" className="mt-4">Retour aux sessions</ButtonLink>
                </Card>
            </PageBody>
        );
    }

    return (
        <PageBody>
            <PageHeader
                crumbs={crumbs}
                title={session ? <span className="inline-flex flex-wrap items-center gap-3">{session.title}<StatusBadge status={session.status} /></span> : <Skeleton className="h-7 w-64" />}
                description={session ? `Prévue le ${fmtDate(session.scheduled_at)} · ${fmtInt(session.players_count)} inscrit${session.players_count > 1 ? 's' : ''} · ${fmtInt(session.questions_count)} question${session.questions_count > 1 ? 's' : ''}` : 'Chargement…'}
                actions={<ButtonLink href={`/app/tvshow/${id}/live`} className="h-10 px-5 text-[15px]"><MonitorPlay /> Ouvrir le pupitre</ButtonLink>}
            />
            {error && <Alert className="mb-4">{error}</Alert>}

            <div role="tablist" aria-label="Sections de la session" className="mb-5 inline-flex w-full rounded-lg bg-ink-100 p-1 sm:w-auto">
                {TABS.map(t => (
                    <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => selectTab(t.id)}
                        className={cn('flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors sm:flex-none',
                            tab === t.id ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-800')}>
                        {t.label}
                        {t.id === 'players' && session && <span className="tabular text-xs text-ink-400">{fmtInt(session.players_count)}</span>}
                        {t.id === 'questions' && session && <span className="tabular text-xs text-ink-400">{fmtInt(session.questions_count)}</span>}
                    </button>
                ))}
            </div>

            {loading || !session ? (
                <Card className="space-y-3 p-5">{[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-9 w-full" />)}</Card>
            ) : tab === 'general' ? (
                <GeneralTab session={session} filters={filters} onSession={setSession} />
            ) : tab === 'players' ? (
                <PlayersTab session={session} filters={filters} onChanged={reload} />
            ) : tab === 'questions' ? (
                <QuestionsTab session={session} questions={questions} onQuestions={q => { setQuestions(q); reload(); }} />
            ) : (
                <ScreenTab session={session} />
            )}
        </PageBody>
    );
}

/* ---------------------------------------------------------------- Général */

type Confirm = null | 'cancel' | 'delete';

function GeneralTab({ session, filters, onSession }: { session: TvSession; filters: ZbmFilters; onSession: (s: TvSession) => void }) {
    const router = useRouter();
    const [form, setForm] = React.useState<SessionFormState>(() => formFromSession(session));
    const [saving, setSaving] = React.useState(false);
    const [busy, setBusy] = React.useState('');
    const [error, setError] = React.useState('');
    const [saved, setSaved] = React.useState(false);
    const [confirm, setConfirm] = React.useState<Confirm>(null);
    const locked = isLocked(session.status);

    React.useEffect(() => { setForm(formFromSession(session)); }, [session]);

    const save = async (e: React.FormEvent) => {
        e.preventDefault();
        const r = formToInput(form);
        if ('error' in r) { setError(r.error); return; }
        setSaving(true); setError(''); setSaved(false);
        try {
            onSession(await tv.updateSession(session.id, r.input));
            setSaved(true);
        } catch (err) {
            setError(tvError(err, "L'enregistrement a échoué."));
        } finally {
            setSaving(false);
        }
    };

    const changeStatus = async (status: 'draft' | 'registration' | 'cancelled') => {
        setBusy(status); setError(''); setSaved(false);
        try {
            onSession(await tv.setStatus(session.id, status));
            setConfirm(null);
        } catch (err) {
            setError(tvError(err, 'Le changement de statut a échoué.'));
            setConfirm(null);
        } finally {
            setBusy('');
        }
    };

    const remove = async () => {
        setBusy('delete'); setError('');
        try {
            await tv.deleteSession(session.id);
            router.push('/app/tvshow');
        } catch (err) {
            setError(tvError(err, 'La suppression a échoué.'));
            setConfirm(null); setBusy('');
        }
    };

    const st = session.status;
    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
            <form onSubmit={save}>
                <Card>
                    <CardHeader title="Réglages" description={locked ? 'Le direct a commencé : les réglages ne sont plus modifiables.' : undefined} />
                    <div className="space-y-4 px-5 py-5">
                        {locked && (
                            <Alert tone="info" className="flex items-center gap-2"><Info className="size-4 shrink-0" /> Lecture seule.</Alert>
                        )}
                        <SessionFields form={form} onChange={f => { setForm(f); setSaved(false); }} filters={filters} disabled={locked || saving} />
                        {error && <Alert>{error}</Alert>}
                        {saved && <Alert tone="success">Modifications enregistrées.</Alert>}
                    </div>
                    {!locked && (
                        <div className="flex justify-end rounded-b-xl border-t border-ink-100 bg-ink-25 px-5 py-3.5">
                            <Button type="submit" loading={saving}>Enregistrer</Button>
                        </div>
                    )}
                </Card>
            </form>

            <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
                <Card>
                    <CardHeader title="Code de session" description="À donner aux joueurs pour s'inscrire par USSD." />
                    <div className="px-5 py-6 text-center">
                        <p className="font-mono text-5xl font-bold tracking-[0.25em] text-ink-900 tabular">{session.code}</p>
                    </div>
                </Card>
                <Card>
                    <CardHeader title="Statut" action={<StatusBadge status={st} />} />
                    <div className="flex flex-col gap-2 px-5 py-4">
                        {st === 'draft' && (
                            <Button onClick={() => changeStatus('registration')} loading={busy === 'registration'} disabled={!!busy}>
                                <UserPlus /> Ouvrir les inscriptions
                            </Button>
                        )}
                        {(st === 'registration' || st === 'cancelled') && (
                            <Button variant="secondary" onClick={() => changeStatus('draft')} loading={busy === 'draft'} disabled={!!busy}>
                                <RotateCcw /> Repasser en brouillon
                            </Button>
                        )}
                        {(st === 'draft' || st === 'registration') && (
                            <Button variant="danger" onClick={() => setConfirm('cancel')} disabled={!!busy}><Ban /> Annuler la session</Button>
                        )}
                        {(st === 'draft' || st === 'cancelled') && (
                            <Button variant="danger" onClick={() => setConfirm('delete')} disabled={!!busy}><Trash2 /> Supprimer</Button>
                        )}
                        {(st === 'live' || st === 'paused') && <p className="text-[13px] text-ink-500">Le direct est en cours : pilotez-le depuis le pupitre.</p>}
                        {st === 'finished' && <p className="text-[13px] text-ink-500">Session terminée le {fmtDate(session.ended_at)}.</p>}
                    </div>
                </Card>
            </div>

            <Modal open={confirm === 'cancel'} onClose={() => !busy && setConfirm(null)} size="sm"
                title="Annuler cette session ?" description="Les inscriptions sont fermées et la session ne pourra pas passer en direct."
                footer={<>
                    <Button variant="secondary" onClick={() => setConfirm(null)} disabled={!!busy}>Retour</Button>
                    <Button onClick={() => changeStatus('cancelled')} loading={busy === 'cancelled'}><Ban /> Annuler la session</Button>
                </>} />
            <Modal open={confirm === 'delete'} onClose={() => !busy && setConfirm(null)} size="sm"
                title="Supprimer cette session ?" description="La session, ses inscrits et ses questions seront définitivement supprimés."
                footer={<>
                    <Button variant="secondary" onClick={() => setConfirm(null)} disabled={!!busy}>Retour</Button>
                    <Button onClick={remove} loading={busy === 'delete'}><Trash2 /> Supprimer</Button>
                </>} />
        </div>
    );
}
