import api from "@/lib/api";
import { cookies } from "next/headers";
import Link from "next/link";
import { ArrowDownRight, ArrowRight, ArrowUpRight, CheckCircle2, MessageSquareText, UserPlus, Users } from "lucide-react";
import { Avatar, Badge, ButtonLink, Card, CardHeader, EmptyState, PageBody, PageHeader } from "@/components/ui/kit";
import { fmtInt } from "@/lib/format";
import { BarChart, SplitBar } from "@/components/pages/home/Charts";

export const metadata = { title: "Tableau de bord" };

interface Overview {
    today: string;
    scope: 'all' | 'schools';
    kpis: {
        players_total: number; new_players: number; new_players_prev: number; active_players: number;
        participation_rate: number | null; participation_rate_prev: number | null;
        success_rate: number | null; success_rate_prev: number | null;
        answers: number; answers_prev: number; active_questions: number; window_days: number;
    };
    series: { date: string; registrations: number; sent: number; answered: number; correct: number }[];
    top_players: { phone_number: string; name: string; school_name: string | null; level_label: string; class_label: string; points: number; correct_answers: number; answers: number }[];
    schools: { code: string; name: string; players: number; answers: number; success_rate: number | null }[];
    sections: { label: string; count: number }[];
}

const dayLabel = (iso: string) => new Date(iso + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
const pct = (v: number | null) => (v === null ? "—" : `${v.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`);

function Delta({ cur, prev, unit = "", suffix = "vs 7 j préc." }: { cur: number | null; prev: number | null; unit?: string; suffix?: string }) {
    if (cur === null || prev === null) return <span className="text-xs text-ink-400">Pas de comparaison</span>;
    const d = Math.round((cur - prev) * 10) / 10;
    if (d === 0) return <span className="text-xs text-ink-500">Stable <span className="text-ink-400">{suffix}</span></span>;
    const up = d > 0;
    const Icon = up ? ArrowUpRight : ArrowDownRight;
    return (
        <span className="inline-flex items-center gap-1 text-xs">
            <span className={`inline-flex items-center gap-0.5 font-medium ${up ? "text-success-700" : "text-brand-700"}`}>
                <Icon className="size-3.5" />{up ? "+" : "−"}{Math.abs(d).toLocaleString("fr-FR")}{unit}
            </span>
            <span className="text-ink-400">{suffix}</span>
        </span>
    );
}

function Kpi({ label, value, icon, footer }: { label: string; value: string; icon: React.ReactNode; footer: React.ReactNode }) {
    return (
        <Card className="p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
                <p className="text-[13px] font-medium text-ink-500">{label}</p>
                <span className="hidden size-8 sm:flex items-center justify-center rounded-lg bg-ink-50 text-ink-500 ring-1 ring-ink-200 [&_svg]:size-4">{icon}</span>
            </div>
            <p className="mt-2 text-2xl sm:text-[28px] font-semibold leading-none tracking-tight text-ink-900 tabular">{value}</p>
            <div className="mt-3">{footer}</div>
        </Card>
    );
}

export default async function Page() {
    const jar = await cookies();
    let data: Overview | null = null;
    let name = "";
    let superuser = false;
    try { data = (await api(jar).get("/dashboard/overview?days=30")).data; } catch (e) { console.log(e); }
    try { name = (await api(jar).get("/auth/check-session")).data?.user?.name ?? ""; } catch { }
    try { superuser = !!(await api(jar).get("/me/permissions")).data?.is_superuser; } catch { }

    const first = name.trim().split(/\s+/)[0] ?? "";
    const today = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Kinshasa" });

    if (!data) {
        return (
            <PageBody>
                <PageHeader title="Tableau de bord" />
                <Card><EmptyState title="Indicateurs indisponibles" description="Le service de statistiques ne répond pas. Réessayez dans un instant." /></Card>
            </PageBody>
        );
    }

    const k = data.kpis;
    const answered = data.series.map(d => ({
        key: d.date, label: dayLabel(d.date), value: d.answered,
        details: [
            { label: "Questions envoyées", value: fmtInt(d.sent) },
            { label: "Bonnes réponses", value: fmtInt(d.correct) },
            { label: "Participation", value: d.sent ? `${Math.round((d.answered / d.sent) * 100)} %` : "—" },
        ],
    }));
    const registrations = data.series.map(d => ({ key: d.date, label: dayLabel(d.date), value: d.registrations }));
    const totalReg30 = data.series.reduce((s, d) => s + d.registrations, 0);
    const totalAns30 = data.series.reduce((s, d) => s + d.answered, 0);
    const maxSchool = Math.max(1, ...data.schools.map(s => s.players));

    return (
        <PageBody>
            <PageHeader
                title={first ? `Bonjour, ${first}` : "Tableau de bord"}
                description={<span className="first-letter:uppercase">{today} · {data.scope === "all" ? "toutes les écoles" : "vos écoles"}</span>}
                actions={<>
                    <ButtonLink href="/app/classements" variant="secondary">Voir le classement</ButtonLink>
                    {superuser && <ButtonLink href="/app/campaigns-questions/new">Nouvelle question</ButtonLink>}
                </>}
            />

            <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
                <Kpi label="Joueurs inscrits" value={fmtInt(k.players_total)} icon={<Users />}
                    footer={<span className="text-xs text-ink-500"><span className="font-medium text-ink-800">+{fmtInt(k.new_players)}</span> sur 7 jours <span className="text-ink-400">({fmtInt(k.new_players_prev)} la semaine d&apos;avant)</span></span>} />
                <Kpi label="Joueurs actifs · 7 j" value={fmtInt(k.active_players)} icon={<UserPlus />}
                    footer={<span className="text-xs text-ink-500">{k.players_total ? Math.round((k.active_players / k.players_total) * 100) : 0} % des inscrits ont répondu</span>} />
                <Kpi label="Participation · 7 j" value={pct(k.participation_rate)} icon={<MessageSquareText />}
                    footer={<Delta cur={k.participation_rate} prev={k.participation_rate_prev} unit=" pt" />} />
                <Kpi label="Bonnes réponses · 7 j" value={pct(k.success_rate)} icon={<CheckCircle2 />}
                    footer={<Delta cur={k.success_rate} prev={k.success_rate_prev} unit=" pt" />} />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
                <Card className="xl:col-span-2">
                    <CardHeader title="Réponses par jour"
                        description={`${fmtInt(totalAns30)} réponses sur 30 jours · ${fmtInt(k.active_questions)} questions actives`} />
                    <div className="px-5 pb-4 pt-5">
                        <BarChart data={answered} height={240} valueLabel="réponses" ariaLabel="Nombre de réponses par jour sur 30 jours" />
                    </div>
                </Card>

                <Card className="flex flex-col">
                    <CardHeader title="Meilleurs joueurs" description="Depuis le lancement"
                        action={<Link href="/app/classements" className="inline-flex items-center gap-1 text-[13px] font-medium text-brand-700 hover:text-brand-800">Tout voir <ArrowRight className="size-3.5" /></Link>} />
                    {data.top_players.length === 0 ? <EmptyState title="Aucun joueur pour l'instant" /> : (
                        <ol className="flex-1 divide-y divide-ink-100">
                            {data.top_players.map((p, i) => (
                                <li key={p.phone_number}>
                                    <Link href={`/app/users/${p.phone_number}`} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-ink-25">
                                        <span className={`w-5 text-center text-[13px] font-semibold tabular ${i === 0 ? "text-brand-600" : "text-ink-400"}`}>{i + 1}</span>
                                        <Avatar name={p.name} seed={p.phone_number} size="sm" />
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-[13px] font-medium text-ink-900">{p.name}</p>
                                            <p className="truncate text-xs text-ink-500">{[p.school_name, p.class_label].filter(Boolean).join(" · ") || "—"}</p>
                                        </div>
                                        <span className="text-[13px] font-semibold text-ink-900 tabular">{fmtInt(p.points)} <span className="text-xs font-normal text-ink-400">pts</span></span>
                                    </Link>
                                </li>
                            ))}
                        </ol>
                    )}
                </Card>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
                <Card>
                    <CardHeader title="Inscriptions" description={`${fmtInt(totalReg30)} nouveaux joueurs sur 30 jours`} />
                    <div className="px-5 pb-4 pt-5">
                        <BarChart data={registrations} height={160} valueLabel="inscriptions" ariaLabel="Inscriptions par jour sur 30 jours" />
                    </div>
                </Card>

                <Card>
                    <CardHeader title="Par école" description="Joueurs inscrits et taux de bonnes réponses" />
                    {data.schools.length === 0 ? <EmptyState title="Aucune école" /> : (
                        <ul className="space-y-4 px-5 py-4">
                            {data.schools.slice(0, 6).map(s => (
                                <li key={s.code ?? s.name}>
                                    <div className="flex items-baseline justify-between gap-3 text-[13px]">
                                        <span className="truncate font-medium text-ink-800">{s.name}</span>
                                        <span className="shrink-0 tabular text-ink-500"><span className="font-semibold text-ink-900">{fmtInt(s.players)}</span> joueur{s.players > 1 ? "s" : ""} · {pct(s.success_rate)}</span>
                                    </div>
                                    <div className="mt-1.5 h-1.5 w-full rounded-full bg-ink-100">
                                        <div className="h-full rounded-full bg-brand-600" style={{ width: `${(s.players / maxSchool) * 100}%` }} />
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>

                <Card className="lg:col-span-2 xl:col-span-1">
                    <CardHeader title="Par section" description="Répartition des joueurs inscrits" />
                    <div className="px-5 py-5">
                        <SplitBar parts={data.sections.map(s => ({ label: s.label, value: s.count }))} />
                        <div className="mt-5 rounded-lg bg-ink-50 px-3.5 py-3 text-xs text-ink-600">
                            Questions envoyées chaque jour à 7 h. <Badge tone="success" dot className="ml-1">{fmtInt(k.active_questions)} actives</Badge>
                        </div>
                    </div>
                </Card>
            </div>
        </PageBody>
    );
}
