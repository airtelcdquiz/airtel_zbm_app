'use client'
import api from '@/lib/api';
import cookies from '@/lib/cookies';
import { Admin } from '@/lib/types';
import Link from 'next/link';
import React from 'react';
import { Info, ShieldCheck } from 'lucide-react';
import {
    Avatar, Badge, Card, EmptyState, PageBody, PageHeader, SearchInput, SkeletonRows,
    fmtPhone, tableClass, tdClass, thClass, theadClass, trClass,
} from '@/components/ui/kit';

export default function AdminList() {
    const [admins, setAdmins] = React.useState<Admin[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [search, setSearch] = React.useState('');

    React.useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const data = (await api(cookies).get('/admins', { params: search ? { search } : {} })).data;
                setAdmins(data.admins ?? []);
            } catch (e) {
                console.error(e); setAdmins([]);
            } finally {
                setLoading(false);
            }
        })();
    }, [search]);

    const globals = admins.filter(a => a.is_superuser).length;

    return (
        <PageBody>
            <PageHeader
                crumbs={[{ label: 'Tableau de bord', href: '/app' }, { label: 'Administrateurs' }]}
                title="Administrateurs"
                description={loading ? 'Chargement…' : `${admins.length} administrateur${admins.length > 1 ? 's' : ''} · ${globals} global${globals > 1 ? 'aux' : ''}, ${admins.length - globals} d'école`}
            />

            <div className="mb-4 flex gap-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-[13px] text-sky-900">
                <Info className="mt-0.5 size-4 shrink-0 text-sky-600" />
                <p>
                    Pour nommer un administrateur, ouvrez sa fiche depuis la liste des <Link href="/app/players" className="font-medium underline underline-offset-2">joueurs</Link> et
                    donnez-lui un rôle ou les droits d&apos;admin global. Il quitte alors la liste des joueurs et le classement.
                </p>
            </div>

            <Card>
                <div className="border-b border-ink-100 p-4">
                    <SearchInput value={search} onSearch={setSearch} placeholder="Rechercher un nom ou un numéro" className="sm:w-72" />
                </div>
                <div className="overflow-x-auto scroll-thin">
                    <table className={`${tableClass} min-w-[720px]`}>
                        <thead className={theadClass}>
                            <tr>
                                <th className={thClass}>Administrateur</th>
                                <th className={thClass}>Type</th>
                                <th className={thClass}>Rôles</th>
                                <th className={thClass}>Écoles gérées</th>
                                <th className={thClass}>Statut</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? <SkeletonRows cols={5} rows={4} /> : admins.length === 0 ? (
                                <tr><td colSpan={5}><EmptyState icon={<ShieldCheck />} title="Aucun administrateur trouvé" /></td></tr>
                            ) : admins.map(a => (
                                <tr key={a.phone_number} className={trClass}>
                                    <td className={tdClass}>
                                        <Link href={`/app/users/${a.phone_number}`} className="group flex items-center gap-3">
                                            <Avatar name={a.name} seed={a.phone_number} />
                                            <span className="min-w-0">
                                                <span className="block truncate font-medium text-ink-900 group-hover:text-brand-700">{a.name || 'Sans nom'}</span>
                                                <span className="block text-xs text-ink-500 tabular">{fmtPhone(a.phone_number)}</span>
                                            </span>
                                        </Link>
                                    </td>
                                    <td className={tdClass}>
                                        <Badge tone={a.is_superuser ? 'brand' : 'neutral'}>{a.is_superuser && <ShieldCheck className="size-3" />}{a.type}</Badge>
                                    </td>
                                    <td className={`${tdClass} text-ink-700`}>{a.roles.length ? a.roles.join(', ') : <span className="text-ink-400">—</span>}</td>
                                    <td className={tdClass}>
                                        {a.is_superuser ? <span className="text-ink-700">Toutes les écoles</span>
                                            : a.attached_schools.length ? (
                                                <div className="flex flex-wrap gap-1">{a.attached_schools.map(c => <Badge key={c}>{c}</Badge>)}</div>
                                            ) : <Badge tone="warning">Aucune école</Badge>}
                                    </td>
                                    <td className={tdClass}>
                                        <Badge tone={a.is_active ? 'success' : 'neutral'} dot>{a.is_active ? 'Actif' : 'Désactivé'}</Badge>
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
