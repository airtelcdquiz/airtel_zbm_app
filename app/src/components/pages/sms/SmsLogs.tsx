'use client'
/**
 * Logs SMS : chaque SMS envoyé par la plateforme et son accusé de réception Airtel.
 * Réservé à l'administrateur global.
 */
import api from '@/lib/api';
import cookies from '@/lib/cookies';
import React from 'react';
import { AlertTriangle, CheckCircle2, Clock, MessageSquareText, RefreshCw, Send } from 'lucide-react';
import {
    Badge, Button, Card, EmptyState, PageBody, PageHeader, SearchInput, Select, SkeletonRows, Switch, Tone,
    fmtInt, fmtPhone, tableClass, tdClass, thClass, theadClass,
} from '@/components/ui/kit';
import { cn } from '@/lib/utils';

type SmsStatus = 'submitted' | 'delivered' | 'rejected' | 'undelivered' | 'failed';
type SmsKind = 'otp' | 'message' | 'bulk';

export interface SmsLog {
    id: string; at: string; phone: string; kind: SmsKind; part: number; parts: number; preview: string;
    status: SmsStatus; message_id: string | null; error: string | null;
    receipt_at: string | null; receipt_stat: string | null; receipt_err: string | null;
}
interface SmsStats { since: string; total: number; delivered: number; failed: number; awaiting: number }
interface SmsLogsResponse { logs: SmsLog[]; next_before: number | null; stats: SmsStats }

const PAGE = 50;
const NO_RECEIPT_AFTER_MS = 10 * 60 * 1000;   // au-delà, « Sans accusé »

const KIND_LABEL: Record<SmsKind, string> = { otp: 'Code de connexion', message: 'Message', bulk: 'Quiz quotidien' };
const STATUS_OPTIONS: { value: '' | SmsStatus; label: string }[] = [
    { value: '', label: 'Tous les statuts' },
    { value: 'delivered', label: 'Livré' },
    { value: 'submitted', label: 'En attente / sans accusé' },
    { value: 'rejected', label: 'Rejeté par Airtel' },
    { value: 'undelivered', label: 'Non livré' },
    { value: 'failed', label: "Échec d'envoi" },
];

/** 0997…, 997…, +243 997…, 243997… → 243997300087 ; sinon le texte tel quel (recherche partielle). */
export function normalizePhone(input: string) {
    const d = input.replace(/\D/g, '');
    if (/^243\d{9}$/.test(d)) return d;
    if (/^0\d{9}$/.test(d)) return `243${d.slice(1)}`;
    if (/^\d{9}$/.test(d)) return `243${d}`;
    return d;
}

const fmtDateTime = (iso: string) => new Date(iso).toLocaleString('fr-FR', {
    timeZone: 'Africa/Kinshasa', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
});

function fmtDelay(from: string, to: string | null) {
    if (!to) return '—';
    const s = Math.max(0, (new Date(to).getTime() - new Date(from).getTime()) / 1000);
    if (s < 60) return `${s.toFixed(s < 10 ? 1 : 0).replace('.', ',')} s`;
    if (s < 3600) return `${Math.round(s / 60)} min`;
    return `${(s / 3600).toFixed(1).replace('.', ',')} h`;
}

function statusView(l: SmsLog, now: number): { tone: Tone; label: string; bad: boolean; warn: boolean } {
    const code = l.receipt_err && l.receipt_err !== '000' ? ` · err ${l.receipt_err}` : '';
    switch (l.status) {
        case 'delivered': return { tone: 'success', label: 'Livré', bad: false, warn: false };
        case 'rejected': return { tone: 'brand', label: `Rejeté${code}`, bad: true, warn: false };
        case 'undelivered': return { tone: 'brand', label: `Non livré${l.receipt_stat ? ` (${l.receipt_stat})` : ''}${code}`, bad: true, warn: false };
        case 'failed': return { tone: 'brand', label: "Échec d'envoi", bad: true, warn: false };
        default:
            return now - new Date(l.at).getTime() > NO_RECEIPT_AFTER_MS
                ? { tone: 'warning', label: 'Sans accusé', bad: false, warn: true }
                : { tone: 'neutral', label: 'En attente', bad: false, warn: false };
    }
}

function StatTile({ icon, label, value, hint, tone }: { icon: React.ReactNode; label: string; value: string; hint?: string; tone?: 'bad' | 'good' }) {
    return (
        <Card className="p-4">
            <div className="flex items-center gap-2 text-[13px] font-medium text-ink-500">
                <span className={cn('[&_svg]:size-4', tone === 'bad' ? 'text-brand-600' : tone === 'good' ? 'text-success-600' : 'text-ink-400')}>{icon}</span>{label}
            </div>
            <p className={cn('mt-2 text-2xl font-semibold tabular tracking-tight', tone === 'bad' ? 'text-brand-700' : 'text-ink-900')}>{value}</p>
            {hint && <p className="mt-0.5 text-xs text-ink-500">{hint}</p>}
        </Card>
    );
}

export default function SmsLogs() {
    const [phone, setPhone] = React.useState('');
    const [status, setStatus] = React.useState<'' | SmsStatus>('');
    const [kind, setKind] = React.useState<'' | SmsKind>('');
    const [auto, setAuto] = React.useState(false);
    const [logs, setLogs] = React.useState<SmsLog[]>([]);
    const [stats, setStats] = React.useState<SmsStats | null>(null);
    const [next, setNext] = React.useState<number | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [more, setMore] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [now, setNow] = React.useState(() => Date.now());

    const fetchPage = React.useCallback(async (before?: number) => {
        const params: Record<string, string | number> = { limit: PAGE };
        const p = normalizePhone(phone);
        if (p) params.phone = p;
        if (status) params.status = status;
        if (kind) params.kind = kind;
        if (before) params.before = before;
        return (await api(cookies).get<SmsLogsResponse>('/sms-logs', { params })).data;
    }, [phone, status, kind]);

    const load = React.useCallback(async (quiet = false) => {
        if (!quiet) setLoading(true);
        try {
            const d = await fetchPage();
            setLogs(d.logs ?? []); setStats(d.stats ?? null); setNext(d.next_before ?? null); setError(null);
        } catch (e: unknown) {
            console.error(e);
            const st = (e as { response?: { status?: number } })?.response?.status;
            setError(st === 403 ? "Réservé à l'administrateur global." : 'Impossible de charger les logs SMS. Réessayez dans un instant.');
            if (!quiet) setLogs([]);
        } finally {
            setNow(Date.now());
            if (!quiet) setLoading(false);
        }
    }, [fetchPage]);

    React.useEffect(() => { load(); }, [load]);
    React.useEffect(() => {
        if (!auto) return;
        const t = setInterval(() => load(true), 30000);
        return () => clearInterval(t);
    }, [auto, load]);

    const loadMore = async () => {
        if (!next) return;
        setMore(true);
        try {
            const d = await fetchPage(next);
            setLogs(prev => [...prev, ...(d.logs ?? [])]); setNext(d.next_before ?? null);
        } catch (e) {
            console.error(e); setError('Impossible de charger la suite.');
        } finally { setMore(false); }
    };

    const filtered = Boolean(phone || status || kind);

    return (
        <PageBody>
            <PageHeader
                crumbs={[{ label: 'Tableau de bord', href: '/app' }, { label: 'Logs SMS' }]}
                title="Logs SMS"
                description="Chaque SMS envoyé par la plateforme et l'accusé de réception d'Airtel : livré, rejeté ou sans réponse."
            />

            <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <StatTile icon={<Send />} label="Envoyés" value={stats ? fmtInt(stats.total) : '—'} hint="24 dernières heures" />
                <StatTile icon={<CheckCircle2 />} label="Livrés" tone="good" value={stats ? fmtInt(stats.delivered) : '—'}
                    hint={stats && stats.total ? `${Math.round((stats.delivered * 100) / stats.total)} % des envois` : undefined} />
                <StatTile icon={<AlertTriangle />} label="Échecs et rejets" tone={stats && stats.failed > 0 ? 'bad' : undefined}
                    value={stats ? fmtInt(stats.failed) : '—'} hint="Rejetés, non livrés ou non envoyés" />
                <StatTile icon={<Clock />} label="En attente" value={stats ? fmtInt(stats.awaiting) : '—'} hint="Accusé pas encore reçu" />
            </div>

            <Card>
                <div className="flex flex-col gap-2 border-b border-ink-100 p-4 sm:flex-row sm:flex-wrap sm:items-center">
                    <SearchInput value={phone} onSearch={setPhone} placeholder="Numéro (ex. 0997 300 087)" className="sm:w-64" />
                    <Select value={status} onChange={e => setStatus(e.target.value as '' | SmsStatus)} className="sm:w-56" aria-label="Statut">
                        {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </Select>
                    <Select value={kind} onChange={e => setKind(e.target.value as '' | SmsKind)} className="sm:w-48" aria-label="Type">
                        <option value="">Tous les types</option>
                        {(Object.keys(KIND_LABEL) as SmsKind[]).map(k => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}
                    </Select>
                    <div className="flex items-center gap-3 sm:ml-auto">
                        <label className="flex items-center gap-2 text-[13px] text-ink-600">
                            <Switch checked={auto} onChange={setAuto} label="Actualiser toutes les 30 s" /> Auto (30 s)
                        </label>
                        <Button variant="secondary" size="sm" onClick={() => load()} loading={loading}><RefreshCw /> Actualiser</Button>
                    </div>
                </div>

                {error && (
                    <div className="flex items-center gap-2 border-b border-brand-100 bg-brand-50 px-4 py-2.5 text-[13px] text-brand-800">
                        <AlertTriangle className="size-4 shrink-0" /> {error}
                    </div>
                )}

                <div className="overflow-x-auto scroll-thin">
                    <table className={`${tableClass} min-w-[900px]`}>
                        <thead className={theadClass}>
                            <tr>
                                <th className={thClass}>Date et heure</th>
                                <th className={thClass}>Numéro</th>
                                <th className={thClass}>Type</th>
                                <th className={thClass}>Aperçu</th>
                                <th className={thClass}>Statut</th>
                                <th className={cn(thClass, 'text-right')}>Délai de l&apos;accusé</th>
                            </tr>
                        </thead>
                        {loading ? <tbody><SkeletonRows rows={8} cols={6} /></tbody> : (
                            <tbody>
                                {logs.map(l => {
                                    const v = statusView(l, now);
                                    return (
                                        <tr key={l.id} className={cn('border-b border-ink-100 last:border-0 transition-colors',
                                            v.bad ? 'bg-brand-50/60 hover:bg-brand-50' : v.warn ? 'bg-warning-50/40 hover:bg-warning-50/70' : 'hover:bg-ink-25')}>
                                            <td className={cn(tdClass, 'whitespace-nowrap tabular text-ink-700', v.bad && 'border-l-2 border-l-brand-600')}>{fmtDateTime(l.at)}</td>
                                            <td className={cn(tdClass, 'whitespace-nowrap tabular font-medium text-ink-900')}>
                                                <button type="button" className="hover:underline" title="Filtrer sur ce numéro" onClick={() => setPhone(l.phone)}>{fmtPhone(l.phone)}</button>
                                            </td>
                                            <td className={cn(tdClass, 'whitespace-nowrap text-ink-600')}>
                                                {KIND_LABEL[l.kind] ?? l.kind}
                                                {l.parts > 1 && <span className="ml-1 text-xs text-ink-400">{l.part}/{l.parts}</span>}
                                            </td>
                                            <td className={cn(tdClass, 'max-w-[320px]')}>
                                                <span className="block truncate text-ink-600" title={l.preview}>{l.preview}</span>
                                                {l.error && <span className="block truncate text-xs text-brand-700" title={l.error}>{l.error}</span>}
                                            </td>
                                            <td className={tdClass}>
                                                <span title={l.message_id ? `Identifiant Airtel : ${l.message_id}` : undefined}>
                                                    <Badge tone={v.tone} dot>{v.label}</Badge>
                                                </span>
                                            </td>
                                            <td className={cn(tdClass, 'whitespace-nowrap text-right tabular text-ink-600')}>{fmtDelay(l.at, l.receipt_at)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        )}
                    </table>
                </div>

                {!loading && !error && logs.length === 0 && (
                    <EmptyState icon={<MessageSquareText />}
                        title={filtered ? 'Aucun SMS pour ces critères' : 'Aucun SMS enregistré'}
                        description={filtered ? 'Changez le numéro, le statut ou le type.' : 'Les SMS apparaîtront ici dès le prochain envoi.'} />
                )}

                {next && !loading && (
                    <div className="flex justify-center border-t border-ink-100 p-3">
                        <Button variant="secondary" size="sm" onClick={loadMore} loading={more}>Charger plus</Button>
                    </div>
                )}
            </Card>
        </PageBody>
    );
}
