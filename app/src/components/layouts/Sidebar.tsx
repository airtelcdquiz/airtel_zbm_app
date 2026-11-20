'use client'
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React from 'react';
import { BookOpen, LayoutDashboard, ListChecks, LogOut, Menu, ShieldCheck, Trophy, Tv, Users, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, fmtPhone } from '@/components/ui/kit';
import cookies from '@/lib/cookies';
import { API_BASE_URL } from '@/lib/env';

const ICONS = { home: LayoutDashboard, players: Users, admins: ShieldCheck, questions: ListChecks, ranking: Trophy, documents: BookOpen, tvshow: Tv };
export type NavIcon = keyof typeof ICONS;
export interface NavItem { href: string; label: string; icon: NavIcon }
export interface NavGroup { label?: string; items: NavItem[] }
export interface SessionUser { name: string; phone_number: string; role: string }

function isActive(pathname: string, href: string) {
    if (href === '/app') return pathname === '/app';
    // La fiche d'un utilisateur appartient à la rubrique Joueurs.
    if (href === '/app/players' && pathname.startsWith('/app/users')) return true;
    return pathname === href || pathname.startsWith(href + '/');
}

function NavContent({ groups, user, onNavigate }: { groups: NavGroup[]; user: SessionUser | null; onNavigate?: () => void }) {
    const pathname = usePathname();
    const router = useRouter();
    const [leaving, setLeaving] = React.useState(false);

    const logout = async () => {
        setLeaving(true);
        try {
            const token = cookies.get('session')?.value;
            if (token) {
                await fetch(`${API_BASE_URL}/auth/logout`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
            }
        } finally {
            document.cookie = 'session=; path=/; max-age=0';
            router.replace('/login');
        }
    };

    return (
        <div className="flex h-full flex-col">
            <div className="flex h-16 shrink-0 items-center gap-2.5 px-5">
                <Image src="/images/airtel-french-logo.svg" alt="Airtel" width={92} height={41} className="h-8 w-auto" priority />
                <span className="h-5 w-px bg-ink-200" aria-hidden />
                <span className="text-[13px] font-semibold tracking-tight text-ink-800">Quiz</span>
            </div>

            <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4 scroll-thin" aria-label="Navigation principale">
                {groups.map((g, gi) => (
                    <div key={gi}>
                        {g.label && <p className="mb-1.5 px-2.5 text-[11px] font-semibold uppercase tracking-wider text-ink-400">{g.label}</p>}
                        <ul className="space-y-0.5">
                            {g.items.map(item => {
                                const Icon = ICONS[item.icon];
                                const active = isActive(pathname, item.href);
                                return (
                                    <li key={item.href}>
                                        <Link href={item.href} onClick={onNavigate} aria-current={active ? 'page' : undefined}
                                            className={cn('group relative flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors',
                                                active ? 'bg-brand-50 text-brand-700' : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900')}>
                                            {active && <span className="absolute -left-3 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-brand-600" aria-hidden />}
                                            <Icon className={cn('size-[18px] shrink-0', active ? 'text-brand-600' : 'text-ink-400 group-hover:text-ink-600')} strokeWidth={1.8} />
                                            {item.label}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
            </nav>

            <div className="shrink-0 border-t border-ink-200 p-3">
                <div className="flex items-center gap-3 rounded-lg px-2 py-2">
                    <Avatar name={user?.name} seed={user?.phone_number} size="md" />
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-semibold text-ink-900">{user?.name || 'Administrateur'}</p>
                        <p className="truncate text-xs text-ink-500">{user ? `${user.role} · ${fmtPhone(user.phone_number)}` : ''}</p>
                    </div>
                    <button onClick={logout} disabled={leaving} title="Se déconnecter" aria-label="Se déconnecter"
                        className="rounded-lg p-2 text-ink-400 transition-colors hover:bg-ink-100 hover:text-brand-700 disabled:opacity-50">
                        <LogOut className="size-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function Sidebar({ groups, user }: { groups: NavGroup[]; user: SessionUser | null }) {
    const [open, setOpen] = React.useState(false);
    const pathname = usePathname();
    React.useEffect(() => { setOpen(false); }, [pathname]);

    return (
        <>
            {/* Bureau */}
            <aside className="hidden w-[248px] shrink-0 border-r border-ink-200 bg-white lg:block">
                <NavContent groups={groups} user={user} />
            </aside>

            {/* Mobile : barre supérieure + tiroir */}
            <div className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-ink-200 bg-white/90 px-4 backdrop-blur lg:hidden">
                <div className="flex items-center gap-2">
                    <Image src="/images/airtel-french-logo.svg" alt="Airtel" width={72} height={32} className="h-7 w-auto" />
                    <span className="text-[13px] font-semibold text-ink-800">Quiz</span>
                </div>
                <button onClick={() => setOpen(true)} className="rounded-lg p-2 text-ink-600 hover:bg-ink-100" aria-label="Ouvrir le menu">
                    <Menu className="size-5" />
                </button>
            </div>
            {open && (
                <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
                    <div className="absolute inset-0 bg-ink-900/40 animate-in fade-in" onClick={() => setOpen(false)} />
                    <div className="absolute inset-y-0 left-0 w-[280px] max-w-[85vw] bg-white shadow-pop animate-in slide-in-from-left">
                        <button onClick={() => setOpen(false)} className="absolute right-3 top-4 rounded-lg p-1.5 text-ink-400 hover:bg-ink-100" aria-label="Fermer le menu">
                            <X className="size-5" />
                        </button>
                        <NavContent groups={groups} user={user} onNavigate={() => setOpen(false)} />
                    </div>
                </div>
            )}
        </>
    );
}
