import api from "@/lib/api";
import { Permissions } from "@/lib/types";
import { cookies } from "next/headers";
import Sidebar, { NavGroup, NavItem, SessionUser } from "./Sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const jar = await cookies();
    let permissions: Permissions = { direct_permissions: [], is_superuser: false, roles: [] };
    let user: SessionUser | null = null;

    try {
        permissions = (await api(jar).get("/me/permissions")).data;
    } catch (e) {
        console.log(e);
    }
    try {
        const u = (await api(jar).get("/auth/check-session")).data?.user;
        if (u) user = { name: u.name, phone_number: u.phone_number, role: permissions.is_superuser ? "Admin global" : "Admin d'école" };
    } catch { /* l'identité n'est qu'informative */ }

    // Une permission peut être directe OU héritée d'un rôle. Un admin/superuser a tout.
    const can = (perm: string): boolean => {
        if (permissions.is_superuser) return true;
        if (permissions.roles?.some(r => r.name === 'admin')) return true;
        if (permissions.direct_permissions?.includes(perm)) return true;
        return permissions.roles?.some(r => r.permissions?.some(p => p.name === perm)) ?? false;
    };

    const when = (ok: boolean, item: NavItem): NavItem[] => (ok ? [item] : []);
    const groups: NavGroup[] = [
        { items: [{ href: "/app", label: "Tableau de bord", icon: "home" }] },
        {
            label: "Participants", items: [
                ...when(can('show_users'), { href: "/app/players", label: "Joueurs", icon: "players" }),
                ...when(can('show_classement'), { href: "/app/classements", label: "Classement", icon: "ranking" }),
            ]
        },
        {
            label: "Contenu", items: [
                ...when(can('show_questions'), { href: "/app/campaigns-questions", label: "Questions", icon: "questions" }),
                ...when(can('show_documents'), { href: "/app/documents", label: "Documents", icon: "documents" }),
            ]
        },
        {
            label: "Direct", items: [
                ...when(permissions.is_superuser, { href: "/app/tvshow", label: "TV Show", icon: "tvshow" }),
            ]
        },
        {
            label: "Administration", items: [
                ...when(permissions.is_superuser, { href: "/app/admins", label: "Administrateurs", icon: "admins" }),
                ...when(permissions.is_superuser, { href: "/app/sms-logs", label: "Logs SMS", icon: "sms" }),
            ]
        },
    ];

    return (
        <div className="flex h-dvh w-full overflow-hidden bg-ink-50">
            <Sidebar groups={groups.filter(g => g.items.length > 0)} user={user} />
            <main className="flex-1 overflow-y-auto pt-14 scroll-thin lg:pt-0">
                {children}
            </main>
        </div>
    );
}
