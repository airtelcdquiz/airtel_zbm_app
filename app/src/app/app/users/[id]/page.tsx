import UserDetailsPage, { PlayerStats } from "@/components/pages/users/UserDetailsPage";
import AccessDenied from "@/components/ui/AccessDenied";
import api from "@/lib/api";
import { Permissions, Role, School, User, Permission } from "@/lib/types";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

export default async function Page(props: { params: Promise<{ id: string }> }) {
    const jar = await cookies();
    const { id } = await props.params;

    let me: Permissions | null = null;
    try {
        me = (await api(jar).get("/me/permissions")).data;
    } catch (e) {
        console.log(e);
    }
    const isSuperuser = Boolean(me?.is_superuser);

    // L'API limite la fiche aux écoles visibles par l'utilisateur connecté
    // (404 hors périmètre, sans révéler l'existence du compte).
    let user: User | null = null;
    try {
        user = (await api(jar).get(`/users/${encodeURIComponent(id)}`)).data;
    } catch (e: any) {
        const status = e?.response?.status;
        if (status === 403) return <AccessDenied />;
        if (status !== 404) console.log(e);
    }
    if (!user) notFound();

    let school: School | null = null;
    if (user.school_code) {
        try {
            school = (await api(jar).get(`/schools/${encodeURIComponent(String(user.school_code))}`)).data;
        } catch { /* information secondaire */ }
    }

    // Statistiques de jeu : absentes pour un administrateur (exclu des joueurs).
    let stats: PlayerStats | null = null;
    try {
        const d = (await api(jar).get("/players", { params: { search: user.phone_number, per_page: 5 } })).data;
        const p = (d.players ?? []).find((x: any) => x.phone_number === user!.phone_number);
        if (p) stats = { points: p.points, correct_answers: p.correct_answers, answers: p.answers, questions_received: p.questions_received };
    } catch { /* tuiles masquées */ }

    let roles: string[] = [];
    let permissions: string[] = [];
    let allRoles: Role[] = [];
    let allPermissions: Permission[] = [];
    if (isSuperuser) {
        try {
            [permissions, roles, allPermissions, allRoles] = await Promise.all([
                api(jar).get(`/users/${user.phone_number}/permissions`).then(r => r.data),
                api(jar).get(`/users/${user.phone_number}/roles`).then(r => r.data),
                api(jar).get(`/permissions`).then(r => r.data),
                api(jar).get(`/roles`).then(r => r.data),
            ]);
        } catch (e) {
            console.log(e);
        }
    }

    return (
        <UserDetailsPage
            user={user}
            school={school}
            stats={stats}
            canManage={isSuperuser}
            roles={roles}
            permissions={permissions}
            allRoles={Array.isArray(allRoles) ? allRoles : []}
            allPermissions={Array.isArray(allPermissions) ? allPermissions : []}
        />
    );
}
