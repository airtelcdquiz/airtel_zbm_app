'use client'
import React from 'react';
import { Check, Plus, Trash2, UserPlus, Users } from 'lucide-react';
import api from '@/lib/api';
import cookies from '@/lib/cookies';
import { Player } from '@/lib/types';
import {
    Alert, Avatar, Badge, Button, Card, EmptyState, Field, Modal, Pagination, SearchInput, Select, SkeletonRows, Spinner,
    fmtDate, fmtInt, fmtPhone, tableClass, tdClass, thClass, theadClass, trClass,
} from '@/components/ui/kit';
import { PlayerFilter, TvPlayer, TvSession, tv, tvError } from '@/lib/tvshow';
import { ZbmFilters, labelOf } from './shared';

const PER_PAGE = 20;

export default function PlayersTab({ session, filters, onChanged }: { session: TvSession; filters: ZbmFilters; onChanged: () => void }) {
    // L'ajout groupé ne propose que les écoles participantes (le serveur l'impose aussi).
    const sessionFilters = React.useMemo(() => {
        const allowed = new Set((session.audience?.schools ?? []).map(String));
        return { ...filters, schools: filters.schools.filter(s => allowed.has(s.value)) };
    }, [filters, session.audience]);
    const [players, setPlayers] = React.useState<TvPlayer[]>([]);
    const [page, setPage] = React.useState(1);
    const [pages, setPages] = React.useState(0);
    const [total, setTotal] = React.useState(0);
    const [search, setSearch] = React.useState('');
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState('');
    const [notice, setNotice] = React.useState('');
    const [adding, setAdding] = React.useState(false);
    const [bulk, setBulk] = React.useState(false);
    const [removing, setRemoving] = React.useState<TvPlayer | null>(null);
    const [busy, setBusy] = React.useState(false);

    const load = React.useCallback(async (p: number, q: string) => {
        setLoading(true);
        try {
            const d = await tv.listPlayers(session.id, { search: q || undefined, page: p, per_page: PER_PAGE });
            setPlayers(d.players ?? []); setTotal(d.total ?? 0); setPages(d.pages ?? 0);
        } catch (e) {
            setPlayers([]); setTotal(0); setPages(0);
            setError(tvError(e, 'Impossible de charger les inscrits.'));
        } finally {
            setLoading(false);
        }
    }, [session.id]);

    React.useEffect(() => { load(page, search); }, [load, page, search]);

    const refresh = (msg?: string) => { if (msg) setNotice(msg); load(page, search); onChanged(); };

    const remove = async () => {
        if (!removing) return;
        setBusy(true); setError('');
        try {
            await tv.removePlayer(session.id, removing.phone_number);
            setRemoving(null);
            refresh(`${removing.display_name || removing.name} a été retiré de la session.`);
        } catch (e) {
            setError(tvError(e, 'Le retrait a échoué.'));
            setRemoving(null);
        } finally {
            setBusy(false);
        }
    };

    const live = session.status === 'live' || session.status === 'paused';
    const closed = session.status === 'finished' || session.status === 'cancelled';

    return (
        <>
            {error && <Alert className="mb-4">{error}</Alert>}
            {notice && <Alert tone="success" className="mb-4">{notice}</Alert>}
            <Card>
                <div className="flex flex-col gap-2 border-b border-ink-100 p-4 sm:flex-row sm:items-center">
                    <SearchInput value={search} onSearch={v => { setPage(1); setSearch(v); }} placeholder="Nom ou numéro" className="sm:max-w-sm sm:flex-1" />
                    <p className="text-[13px] text-ink-500 sm:ml-2">
                        {fmtInt(total)} inscrit{total > 1 ? 's' : ''}{session.max_players ? ` sur ${fmtInt(session.max_players)} places` : ''}
                    </p>
                    {!closed && (
                        <div className="flex gap-2 sm:ml-auto">
                            <Button variant="secondary" onClick={() => { setNotice(''); setBulk(true); }}><Users /> Ajout groupé</Button>
                            <Button onClick={() => { setNotice(''); setAdding(true); }}><UserPlus /> Ajouter un joueur</Button>
                        </div>
                    )}
                </div>
                <div className="overflow-x-auto scroll-thin">
                    <table className={`${tableClass} min-w-[820px]`}>
                        <thead className={theadClass}>
                            <tr>
                                <th className={thClass}>Joueur</th>
                                <th className={thClass}>École</th>
                                <th className={thClass}>Section / classe</th>
                                <th className={thClass}>Source</th>
                                <th className={`${thClass} text-right`}>Points</th>
                                <th className={thClass}>Inscrit le</th>
                                <th className={thClass}><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? <SkeletonRows cols={7} rows={8} /> : players.length === 0 ? (
                                <tr><td colSpan={7}>
                                    <EmptyState icon={<Users />} title={search ? 'Aucun inscrit ne correspond' : 'Aucun inscrit'}
                                        description={search ? 'Modifiez la recherche.' : 'Ajoutez des joueurs ou ouvrez les inscriptions par USSD.'} />
                                </td></tr>
                            ) : players.map(p => (
                                <tr key={p.phone_number} className={trClass}>
                                    <td className={tdClass}>
                                        <span className="flex items-center gap-3">
                                            <Avatar name={p.name} seed={p.phone_number} />
                                            <span className="min-w-0">
                                                <span className="block max-w-[200px] truncate font-medium text-ink-900">{p.name || p.display_name || 'Sans nom'}</span>
                                                <span className="block text-xs text-ink-500 tabular">{fmtPhone(p.phone_number)}</span>
                                            </span>
                                        </span>
                                    </td>
                                    <td className={`${tdClass} text-ink-700`}><span className="block max-w-[180px] truncate">{p.school || p.school_code || '—'}</span></td>
                                    <td className={`${tdClass} whitespace-nowrap text-ink-700`}>
                                        {[labelOf(filters.levels, p.school_level), labelOf(filters.classes, p.school_class), labelOf(filters.options, p.school_option)].filter(Boolean).join(' · ') || '—'}
                                    </td>
                                    <td className={tdClass}><Badge tone={p.source === 'ussd' ? 'info' : 'neutral'}>{p.source === 'ussd' ? 'USSD' : 'Admin'}</Badge></td>
                                    <td className={`${tdClass} text-right tabular font-medium text-ink-900`}>{fmtInt(p.points)}</td>
                                    <td className={`${tdClass} whitespace-nowrap text-ink-600`}>{fmtDate(p.registered_at)}</td>
                                    <td className={`${tdClass} text-right`}>
                                        {session.status !== 'finished' && (
                                            <Button variant="ghost" size="sm" onClick={() => setRemoving(p)} aria-label={`Retirer ${p.name}`} title={live ? 'Exclure' : 'Retirer'}>
                                                <Trash2 />
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <Pagination page={page} pages={pages} total={total} perPage={PER_PAGE} onChange={setPage} />
            </Card>

            <AddPlayerModal open={adding} session={session} onClose={() => setAdding(false)} onAdded={msg => refresh(msg)} />
            <BulkAddModal open={bulk} session={session} filters={sessionFilters} onClose={() => setBulk(false)} onAdded={msg => { setBulk(false); refresh(msg); }} />

            <Modal open={!!removing} onClose={() => !busy && setRemoving(null)} size="sm"
                title={live ? 'Exclure ce joueur ?' : 'Retirer ce joueur ?'}
                description={removing ? `${removing.name || removing.display_name} (${fmtPhone(removing.phone_number)}) ne fera plus partie de la session.${live ? ' Ses réponses suivantes seront refusées.' : ''}` : undefined}
                footer={<>
                    <Button variant="secondary" onClick={() => setRemoving(null)} disabled={busy}>Retour</Button>
                    <Button onClick={remove} loading={busy}><Trash2 /> {live ? 'Exclure' : 'Retirer'}</Button>
                </>} />
        </>
    );
}

/* ------------------------------------------------------ Ajout individuel */

function AddPlayerModal({ open, session, onClose, onAdded }: {
    open: boolean; session: TvSession; onClose: () => void; onAdded: (msg: string) => void;
}) {
    const [search, setSearch] = React.useState('');
    const [results, setResults] = React.useState<Player[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [busy, setBusy] = React.useState('');
    const [done, setDone] = React.useState<Record<string, string>>({});
    const [error, setError] = React.useState('');

    React.useEffect(() => { if (!open) { setSearch(''); setResults([]); setDone({}); setError(''); } }, [open]);

    React.useEffect(() => {
        if (!open || !search) { setResults([]); return; }
        let cancelled = false;
        setLoading(true);
        api(cookies).get('/players', { params: { search, page: 1, per_page: 8 } })
            .then(r => { if (!cancelled) setResults(r.data.players ?? []); })
            .catch(() => { if (!cancelled) setResults([]); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [open, search]);

    const add = async (p: Player) => {
        setBusy(p.phone_number); setError('');
        try {
            const r = await tv.addPlayers(session.id, [p.phone_number]);
            const msg = r.added > 0 ? 'Ajouté' : 'Déjà inscrit ou non éligible';
            setDone(d => ({ ...d, [p.phone_number]: msg }));
            if (r.added > 0) onAdded(`${p.name || fmtPhone(p.phone_number)} a été ajouté à la session.`);
        } catch (e) {
            setError(tvError(e, "L'ajout a échoué."));
        } finally {
            setBusy('');
        }
    };

    return (
        <Modal open={open} onClose={onClose} title="Ajouter un joueur" description="Recherchez parmi les joueurs inscrits au quiz." size="lg"
            footer={<Button variant="secondary" onClick={onClose}>Fermer</Button>}>
            <SearchInput value={search} onSearch={setSearch} placeholder="Nom ou numéro de téléphone" />
            {error && <Alert className="mt-3">{error}</Alert>}
            <div className="mt-3 max-h-[50vh] overflow-y-auto scroll-thin">
                {loading ? <div className="flex justify-center py-8"><Spinner /></div>
                    : !search ? <p className="py-6 text-center text-[13px] text-ink-500">Saisissez un nom ou un numéro.</p>
                        : results.length === 0 ? <p className="py-6 text-center text-[13px] text-ink-500">Aucun joueur trouvé.</p>
                            : (
                                <ul className="divide-y divide-ink-100 rounded-lg border border-ink-200">
                                    {results.map(p => (
                                        <li key={p.phone_number} className="flex items-center gap-3 px-3 py-2.5">
                                            <Avatar name={p.name} seed={p.phone_number} size="sm" />
                                            <span className="min-w-0 flex-1">
                                                <span className="block truncate text-sm font-medium text-ink-900">{p.name || 'Sans nom'}</span>
                                                <span className="block truncate text-xs text-ink-500">{fmtPhone(p.phone_number)} · {p.school_name ?? p.school_code ?? '—'} · {p.class_label || ''}</span>
                                            </span>
                                            {done[p.phone_number]
                                                ? <span className="inline-flex items-center gap-1 text-xs font-medium text-success-700"><Check className="size-3.5" /> {done[p.phone_number]}</span>
                                                : <Button size="sm" variant="secondary" onClick={() => add(p)} loading={busy === p.phone_number} disabled={!!busy}><Plus /> Ajouter</Button>}
                                        </li>
                                    ))}
                                </ul>
                            )}
            </div>
        </Modal>
    );
}

/* ---------------------------------------------------------- Ajout groupé */

function BulkAddModal({ open, session, filters, onClose, onAdded }: {
    open: boolean; session: TvSession; filters: ZbmFilters; onClose: () => void; onAdded: (msg: string) => void;
}) {
    const [school, setSchool] = React.useState('');
    const [level, setLevel] = React.useState('');
    const [klass, setKlass] = React.useState('');
    const [option, setOption] = React.useState('');
    const [count, setCount] = React.useState<number | null>(null);
    const [busy, setBusy] = React.useState<'' | 'preview' | 'add'>('');
    const [error, setError] = React.useState('');

    React.useEffect(() => { if (!open) { setSchool(''); setLevel(''); setKlass(''); setOption(''); setCount(null); setError(''); } }, [open]);
    React.useEffect(() => { setCount(null); }, [school, level, klass, option]);

    const filter = (): PlayerFilter => {
        const f: PlayerFilter = {};
        if (school) f.school_code = school;
        if (level) f.school_level = level;
        if (klass) f.school_class = klass;
        if (option) f.school_option = Number(option);
        return f;
    };
    const empty = !school && !level && !klass && !option;

    const preview = async () => {
        setBusy('preview'); setError('');
        try { setCount(await tv.previewFilter(session.id, filter())); }
        catch (e) { setError(tvError(e, "L'aperçu a échoué.")); }
        finally { setBusy(''); }
    };
    const add = async () => {
        setBusy('add'); setError('');
        try {
            const r = await tv.addByFilter(session.id, filter());
            onAdded(`${fmtInt(r.added)} joueur${r.added > 1 ? 's' : ''} ajouté${r.added > 1 ? 's' : ''}${r.skipped ? `, ${fmtInt(r.skipped)} ignoré${r.skipped > 1 ? 's' : ''} (déjà inscrits ou non éligibles)` : ''}. Total : ${fmtInt(r.total)}.`);
        } catch (e) {
            setError(tvError(e, "L'ajout groupé a échoué."));
        } finally {
            setBusy('');
        }
    };

    return (
        <Modal open={open} onClose={() => !busy && onClose()} title="Ajout groupé" description="Inscrivez d'un coup les joueurs d'une école, d'une section, d'une classe ou d'une option."
            footer={<>
                <Button variant="secondary" onClick={onClose} disabled={!!busy}>Annuler</Button>
                {count === null
                    ? <Button onClick={preview} loading={busy === 'preview'} disabled={empty}>Aperçu</Button>
                    : <Button onClick={add} loading={busy === 'add'} disabled={count === 0}><UserPlus /> Ajouter {fmtInt(count)} joueur{count > 1 ? 's' : ''}</Button>}
            </>}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="École" className="sm:col-span-2">
                    <Select value={school} onChange={e => setSchool(e.target.value)}>
                        <option value="">Toutes les écoles participantes</option>
                        {filters.schools.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </Select>
                </Field>
                <Field label="Section">
                    <Select value={level} onChange={e => { setLevel(e.target.value); if (e.target.value === '1') setOption(''); }}>
                        <option value="">Toutes</option>
                        {filters.levels.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                    </Select>
                </Field>
                <Field label="Classe">
                    <Select value={klass} onChange={e => setKlass(e.target.value)}>
                        <option value="">Toutes</option>
                        {filters.classes.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </Select>
                </Field>
                <Field label="Option" className="sm:col-span-2">
                    <Select value={option} onChange={e => setOption(e.target.value)} disabled={level === '1'}>
                        <option value="">Toutes</option>
                        {filters.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </Select>
                </Field>
            </div>
            {empty && <p className="mt-3 text-xs text-ink-500">Choisissez au moins un critère.</p>}
            {count !== null && (
                <Alert tone="info" className="mt-4">
                    {count === 0 ? 'Aucun joueur ne correspond (ou tous sont déjà inscrits).' : <><strong>{fmtInt(count)}</strong> joueur{count > 1 ? 's' : ''} correspond{count > 1 ? 'ent' : ''} à ces critères. Confirmez pour les inscrire.</>}
                </Alert>
            )}
            {error && <Alert className="mt-4">{error}</Alert>}
        </Modal>
    );
}
