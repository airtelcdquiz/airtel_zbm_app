'use client'
import Link from 'next/link';
import React from 'react';
import { MonitorPlay, Plus, Trophy, Tv } from 'lucide-react';
import {
    Alert, ButtonLink, Card, EmptyState, PageBody, PageHeader, Select, SkeletonRows,
    fmtDate, fmtInt, tableClass, tdClass, thClass, theadClass, trClass,
} from '@/components/ui/kit';
import { SessionStatus, TvSession, tv, tvError } from '@/lib/tvshow';
import { STATUS_LABELS, StatusBadge } from './shared';

export default function SessionList() {
    const [sessions, setSessions] = React.useState<TvSession[]>([]);
    const [status, setStatus] = React.useState<SessionStatus | ''>('');
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState('');

    React.useEffect(() => {
        let cancelled = false;
        setLoading(true); setError('');
        tv.listSessions(status)
            .then(s => { if (!cancelled) setSessions(s); })
            .catch(e => { if (!cancelled) { setSessions([]); setError(tvError(e, 'Impossible de charger les sessions.')); } })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [status]);

    return (
        <PageBody>
            <PageHeader
                crumbs={[{ label: 'Tableau de bord', href: '/app' }, { label: 'TV Show' }]}
                title="TV Show"
                description="Quiz en direct : l'animateur pilote la session, les joueurs répondent par USSD."
                actions={<>
                    <ButtonLink href="/app/tvshow/demo" variant="secondary"><MonitorPlay /> Démo et mode d&apos;emploi</ButtonLink>
                    <ButtonLink href="/app/tvshow/new"><Plus /> Nouvelle session</ButtonLink>
                </>}
            />
            {error && <Alert className="mb-4">{error}</Alert>}

            <Card>
                <div className="flex items-center justify-between gap-3 border-b border-ink-100 p-4">
                    <p className="text-[13px] text-ink-500">{loading ? 'Chargement…' : `${fmtInt(sessions.length)} session${sessions.length > 1 ? 's' : ''}`}</p>
                    <Select value={status} onChange={e => setStatus(e.target.value as SessionStatus | '')} aria-label="Statut" className="w-full sm:w-56">
                        <option value="">Statut : tous</option>
                        {(Object.keys(STATUS_LABELS) as SessionStatus[]).map(s => <option key={s} value={s}>{STATUS_LABELS[s].label}</option>)}
                    </Select>
                </div>
                <div className="overflow-x-auto scroll-thin">
                    <table className={`${tableClass} min-w-[820px]`}>
                        <thead className={theadClass}>
                            <tr>
                                <th className={thClass}>Session</th>
                                <th className={thClass}>Date prévue</th>
                                <th className={thClass}>Statut</th>
                                <th className={`${thClass} text-right`}>Inscrits</th>
                                <th className={`${thClass} text-right`}>Questions</th>
                                <th className={thClass}>Gagnant</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? <SkeletonRows cols={6} rows={6} /> : sessions.length === 0 ? (
                                <tr><td colSpan={6}>
                                    <EmptyState icon={<Tv />} title={status ? 'Aucune session avec ce statut' : 'Aucune session'}
                                        description="Créez une session pour préparer un direct."
                                        action={<ButtonLink href="/app/tvshow/new" size="sm"><Plus /> Nouvelle session</ButtonLink>} />
                                </td></tr>
                            ) : sessions.map(s => (
                                <tr key={s.id} className={trClass}>
                                    <td className={tdClass}>
                                        <Link href={`/app/tvshow/${s.id}`} className="group block">
                                            <span className="block max-w-[280px] truncate font-medium text-ink-900 group-hover:text-brand-700">{s.title}</span>
                                            <span className="block text-xs text-ink-500 tabular">Code {s.code}</span>
                                        </Link>
                                    </td>
                                    <td className={`${tdClass} whitespace-nowrap text-ink-700`}>{fmtDate(s.scheduled_at)}</td>
                                    <td className={tdClass}><StatusBadge status={s.status} /></td>
                                    <td className={`${tdClass} text-right tabular text-ink-800`}>
                                        {fmtInt(s.players_count)}{s.max_players ? <span className="text-xs text-ink-400"> / {fmtInt(s.max_players)}</span> : null}
                                    </td>
                                    <td className={`${tdClass} text-right tabular text-ink-800`}>
                                        {fmtInt(s.questions_count)}
                                        {s.reserves_count > 0 && <span className="block text-xs text-ink-400">+ {s.reserves_count} réserve{s.reserves_count > 1 ? 's' : ''}</span>}
                                    </td>
                                    <td className={tdClass}>
                                        {s.status === 'finished' && s.winner ? (
                                            <span className="flex items-center gap-2">
                                                <Trophy className="size-4 shrink-0 text-warning-600" />
                                                <span className="min-w-0">
                                                    <span className="block truncate font-medium text-ink-900">{s.winner.display_name}</span>
                                                    <span className="block truncate text-xs text-ink-500">{s.winner.school} · {fmtInt(s.winner.points)} pts</span>
                                                </span>
                                            </span>
                                        ) : <span className="text-ink-400">—</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </PageBody>
    );
}
