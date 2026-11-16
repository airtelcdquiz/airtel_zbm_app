'use client'
import api from "@/lib/api";
import cookies from "@/lib/cookies";
import { Permission, Role, School, User } from "@/lib/types";
import React from "react";
import { Award, CheckCircle2, Inbox, KeyRound, Percent, Power, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Alert, Avatar, Badge, Button, Card, CardHeader, PageBody, PageHeader, Spinner, Switch, fmtDate, fmtInt, fmtPhone,
} from "@/components/ui/kit";
import AttachedSchoolsManager from "./AttachedSchoolsManager";

export interface PlayerStats {
    points: number
    correct_answers: number
    answers: number
    questions_received: number
}

interface Props {
    user: User
    school: School | null
    stats: PlayerStats | null
    canManage: boolean
    roles: string[]
    permissions: string[]
    allRoles: Role[]
    allPermissions: Permission[]
}

function StatTile({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint?: string }) {
    return (
        <Card className="p-4">
            <div className="flex items-center gap-2 text-[13px] font-medium text-ink-500">
                <span className="text-ink-400 [&_svg]:size-4">{icon}</span>{label}
            </div>
            <p className="mt-2 text-2xl font-semibold tabular tracking-tight text-ink-900">{value}</p>
            {hint && <p className="mt-0.5 text-xs text-ink-500">{hint}</p>}
        </Card>
    );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="grid grid-cols-[minmax(110px,40%)_1fr] gap-3 px-5 py-3 text-sm">
            <dt className="text-ink-500">{label}</dt>
            <dd className="min-w-0 font-medium text-ink-900">{children}</dd>
        </div>
    );
}

/** Ligne avec interrupteur ; `pending` affiche un indicateur à la place. */
function ToggleRow({ title, description, checked, pending, disabled, note, onChange }: {
    title: string; description?: string; checked: boolean; pending?: boolean; disabled?: boolean; note?: string;
    onChange: (v: boolean) => void;
}) {
    return (
        <div className="flex items-center justify-between gap-4 px-5 py-3">
            <div className="min-w-0">
                <p className="text-sm font-medium text-ink-900">{title}</p>
                {(description || note) && (
                    <p className="mt-0.5 text-xs text-ink-500">
                        {description}{description && note ? ' · ' : ''}{note && <span className="text-ink-600">{note}</span>}
                    </p>
                )}
            </div>
            <div className="flex w-9 shrink-0 justify-end">
                {pending ? <Spinner className="size-4" /> : <Switch checked={checked} onChange={onChange} disabled={disabled} label={title} />}
            </div>
        </div>
    );
}

export default function UserDetailsPage(props: Props) {
    const [user, setUser] = React.useState<User>(props.user);
    const [roles, setRoles] = React.useState<string[]>(props.roles);
    const [perms, setPerms] = React.useState<string[]>(props.permissions);
    const [busy, setBusy] = React.useState<Record<string, boolean>>({});
    const [error, setError] = React.useState('');

    const run = async (key: string, fn: () => Promise<void>) => {
        setBusy(b => ({ ...b, [key]: true })); setError('');
        try {
            await fn();
        } catch (e: any) {
            setError(e?.response?.data?.error || "L'opération a échoué. Réessayez.");
        } finally {
            setBusy(b => ({ ...b, [key]: false }));
        }
    };

    const phone = user.phone_number;
    const toggleActive = () => run('active', async () => {
        const r = await api(cookies).post(`/users/${phone}/${user.is_active ? 'deactivate' : 'activate'}`);
        if (r.data?.user) setUser(r.data.user);
        else setUser(u => ({ ...u, is_active: !u.is_active }));
    });
    const toggleSuperuser = (on: boolean) => run('superuser', async () => {
        await api(cookies).post(`/users/${phone}/${on ? 'set_superuser' : 'unset_superuser'}`);
        setUser(u => ({ ...u, is_superuser: on }));
    });
    const toggleRole = (role: Role, on: boolean) => run(`role-${role.id}`, async () => {
        if (on) await api(cookies).post(`/users/${phone}/roles/${role.id}`);
        else await api(cookies).delete(`/users/${phone}/roles/${role.id}`);
        // Les permissions héritées du rôle changent aussi : on recharge la liste effective.
        setRoles(r => on ? [...r, role.name] : r.filter(x => x !== role.name));
        try { setPerms((await api(cookies).get(`/users/${phone}/permissions`)).data); } catch { /* affichage seul */ }
    });
    const togglePerm = (p: Permission, on: boolean) => run(`perm-${p.id}`, async () => {
        if (on) await api(cookies).post(`/users/${phone}/permissions/${p.id}`, { permission_id: p.id });
        else await api(cookies).delete(`/users/${phone}/permissions/${p.id}`);
        setPerms(x => on ? [...x, p.name] : x.filter(n => n !== p.name));
    });

    // Une permission héritée d'un rôle ne se retire pas ici : il faut retirer le rôle.
    const inheritedFrom = (permName: string) =>
        props.allRoles.filter(r => roles.includes(r.name) && r.permissions?.some(p => p.name === permName)).map(r => r.name);

    const s = props.stats;
    const successRate = s && s.answers > 0 ? Math.round((100 * s.correct_answers) / s.answers) : null;
    const isHumanites = user.level_label === 'Humanités';
    const schoolName = props.school?.name;

    return (
        <PageBody>
            <PageHeader
                crumbs={[{ label: 'Tableau de bord', href: '/app' }, { label: 'Joueurs', href: '/app/players' }, { label: user.name || fmtPhone(phone) }]}
                title="Fiche utilisateur"
            />

            {error && <Alert className="mb-4">{error}</Alert>}

            {/* En-tête de profil */}
            <Card className="mb-6 p-5 sm:p-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                    <Avatar name={user.name} seed={phone} size="xl" />
                    <div className="min-w-0 flex-1">
                        <h2 className="truncate text-xl font-semibold tracking-tight text-ink-900">{user.name || 'Sans nom'}</h2>
                        <p className="mt-0.5 text-sm tabular text-ink-500">{fmtPhone(phone)}</p>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                            {user.is_active ? <Badge tone="success" dot>Actif</Badge> : <Badge tone="neutral" dot>Désactivé</Badge>}
                            {user.is_subscribed === false ? <Badge tone="warning">Désabonné</Badge> : user.is_subscribed ? <Badge tone="info">Abonné</Badge> : null}
                            {user.is_superuser && <Badge tone="dark"><ShieldCheck className="size-3" />Admin global</Badge>}
                            {!user.is_superuser && roles.length > 0 && <Badge tone="brand">Admin d&apos;école</Badge>}
                        </div>
                    </div>
                    <Button variant={user.is_active ? 'danger' : 'success'} onClick={toggleActive} loading={busy.active} className="self-start sm:self-center">
                        {!busy.active && <Power />}
                        {user.is_active ? 'Désactiver le compte' : 'Activer le compte'}
                    </Button>
                </div>
            </Card>

            {/* Statistiques de jeu */}
            {s && (
                <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <StatTile icon={<Award />} label="Points" value={fmtInt(s.points)} hint="10 points par bonne réponse" />
                    <StatTile icon={<CheckCircle2 />} label="Bonnes réponses" value={fmtInt(s.correct_answers)} hint={`sur ${fmtInt(s.answers)} réponse${s.answers > 1 ? 's' : ''}`} />
                    <StatTile icon={<Percent />} label="Taux de réussite" value={successRate === null ? '—' : `${successRate} %`} hint={successRate === null ? 'Aucune réponse' : undefined} />
                    <StatTile icon={<Inbox />} label="Questions reçues" value={fmtInt(s.questions_received)}
                        hint={s.questions_received > 0 ? `${Math.round((100 * s.answers) / s.questions_received)} % de participation` : undefined} />
                </div>
            )}

            <div className={cn('grid grid-cols-1 gap-6', props.canManage && 'xl:grid-cols-2')}>
                <div className="space-y-6">
                    <Card>
                        <CardHeader title="Inscription" description="Informations saisies lors de l'inscription USSD." />
                        <dl className="divide-y divide-ink-100">
                            <InfoRow label="École">
                                {schoolName ? <>{schoolName} <span className="font-normal text-ink-500">({user.school_code})</span></> : (user.school_code || '—')}
                            </InfoRow>
                            <InfoRow label="Section">{user.level_label || '—'}</InfoRow>
                            <InfoRow label="Classe">{user.class_label || '—'}</InfoRow>
                            {isHumanites && <InfoRow label="Option">{user.option_label || '—'}</InfoRow>}
                            <InfoRow label="Inscrit le">{fmtDate(user.created_at)}</InfoRow>
                        </dl>
                    </Card>
                    {props.canManage && <AttachedSchoolsManager phoneNumber={phone} />}
                </div>

                {props.canManage && (
                    <div className="space-y-6">
                        <Card>
                            <CardHeader title="Accès au back-office" description="Un administrateur n'apparaît plus dans la liste des joueurs ni dans le classement." />
                            <div className="divide-y divide-ink-100">
                                <ToggleRow title="Administrateur global" description="Voit toutes les écoles et gère les droits."
                                    checked={Boolean(user.is_superuser)} pending={busy.superuser} onChange={toggleSuperuser} />
                            </div>
                        </Card>

                        <Card>
                            <CardHeader title="Rôles" description="Un rôle donne un ensemble de permissions." />
                            {props.allRoles.length === 0 ? <p className="px-5 py-4 text-sm text-ink-500">Aucun rôle défini.</p> : (
                                <div className="divide-y divide-ink-100">
                                    {props.allRoles.map(r => (
                                        <ToggleRow key={r.id} title={r.name}
                                            description={r.permissions?.length ? `${r.permissions.length} permission${r.permissions.length > 1 ? 's' : ''}` : undefined}
                                            checked={roles.includes(r.name)} pending={busy[`role-${r.id}`]} onChange={on => toggleRole(r, on)} />
                                    ))}
                                </div>
                            )}
                        </Card>

                        <Card>
                            <CardHeader title={<span className="inline-flex items-center gap-2"><KeyRound className="size-4 text-ink-400" />Permissions</span>}
                                description="Permissions accordées directement ou héritées d'un rôle." />
                            {props.allPermissions.length === 0 ? <p className="px-5 py-4 text-sm text-ink-500">Aucune permission définie.</p> : (
                                <div className="divide-y divide-ink-100">
                                    {props.allPermissions.map(p => {
                                        const via = inheritedFrom(p.name);
                                        return (
                                            <ToggleRow key={p.id} title={p.name} description={p.description || undefined}
                                                note={via.length ? `via le rôle ${via.join(', ')}` : undefined}
                                                checked={perms.includes(p.name)} disabled={via.length > 0}
                                                pending={busy[`perm-${p.id}`]} onChange={on => togglePerm(p, on)} />
                                        );
                                    })}
                                </div>
                            )}
                        </Card>
                    </div>
                )}
            </div>
        </PageBody>
    );
}
