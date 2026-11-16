'use client'
import api from '@/lib/api';
import cookies from '@/lib/cookies';
import { Classement } from '@/types/permissions';
import Link from 'next/link';
import React from 'react';
import { RotateCcw, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    Avatar, Button, Card, EmptyState, PageBody, PageHeader, Pagination, SearchInput, Select, Skeleton, SkeletonRows,
    fmtInt, fmtPhone, inputClass, tableClass, tdClass, thClass, theadClass, trClass,
} from '@/components/ui/kit';

interface Opt { value: number | string; label: string }
interface FilterSchool { code: string; name: string }
type Period = 'all' | '7d' | '30d' | 'month' | 'custom';

const PER_PAGE = 20;
const CLASSES: Opt[] = [1, 2, 3, 4, 5, 6, 7, 8].map(n => ({ value: n, label: n === 1 ? '1ère année' : `${n}ème année` }));
const PERIODS: { key: Period; label: string }[] = [
    { key: 'all', label: 'Tout' },
    { key: '7d', label: '7 derniers jours' },
    { key: '30d', label: '30 derniers jours' },
    { key: 'month', label: 'Ce mois' },
    { key: 'custom', label: 'Personnalisée' },
];

/** Date du jour à Kinshasa, au format YYYY-MM-DD. */
const kinshasaDay = (offsetDays = 0) => {
    const d = new Date(Date.now() + 3600_000 + offsetDays * 86400_000);
    return d.toISOString().slice(0, 10);
};

function periodRange(p: Period): [string, string] {
    const today = kinshasaDay();
    if (p === '7d') return [kinshasaDay(-6), today];
    if (p === '30d') return [kinshasaDay(-29), today];
    if (p === 'month') return [today.slice(0, 8) + '01', today];
    return ['', ''];
}

// Médailles sobres : or, argent, bronze.
const MEDALS = [
    { ring: 'ring-amber-300', chip: 'bg-amber-100 text-amber-800', bar: 'bg-amber-400', label: '1er' },
    { ring: 'ring-ink-300', chip: 'bg-ink-100 text-ink-700', bar: 'bg-ink-400', label: '2e' },
    { ring: 'ring-orange-300', chip: 'bg-orange-100 text-orange-800', bar: 'bg-orange-400', label: '3e' },
];

function Podium({ top }: { top: Classement[] }) {
    // Ordre visuel 2 - 1 - 3 sur grand écran, 1 - 2 - 3 sur mobile.
    const order = [1, 0, 2].filter(i => top[i]);
    return (
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:items-end">
            {order.map(i => {
                const c = top[i]; const m = MEDALS[i];
                return (
                    <Link key={c.phone_number} href={`/app/users/${c.phone_number}`}
                        className={cn('group relative flex items-center gap-4 rounded-xl border border-ink-200 bg-white p-4 shadow-card transition hover:border-ink-300 hover:shadow-md sm:flex-col sm:text-center',
                            i === 0 ? 'sm:order-2 sm:py-7' : i === 1 ? 'sm:order-1 sm:py-5' : 'sm:order-3 sm:py-5', i === 0 ? 'order-1' : i === 1 ? 'order-2' : 'order-3')}>
                        <span className={cn('absolute right-3 top-3 rounded-md px-1.5 py-0.5 text-[11px] font-semibold', m.chip)}>{m.label}</span>
                        <Avatar name={c.name} seed={c.phone_number} size={i === 0 ? 'xl' : 'lg'} className={cn('ring-4 ring-offset-2', m.ring)} />
                        <div className="min-w-0 sm:w-full">
                            <p className="truncate text-sm font-semibold text-ink-900 group-hover:text-brand-700">{c.name}</p>
                            <p className="truncate text-xs text-ink-500">{c.schoolname || '—'}</p>
                            <p className="mt-1.5 text-lg font-semibold tabular text-ink-900">{fmtInt(c.points)} <span className="text-xs font-medium text-ink-500">pts</span></p>
                        </div>
                    </Link>
                );
            })}
        </div>
    );
}

export default function ClassementsPage() {
    const [rows, setRows] = React.useState<Classement[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [page, setPage] = React.useState(1);
    const [pages, setPages] = React.useState(0);
    const [total, setTotal] = React.useState(0);
    const [leader, setLeader] = React.useState(0);

    const [schools, setSchools] = React.useState<FilterSchool[]>([]);
    const [levels, setLevels] = React.useState<Opt[]>([]);
    const [options, setOptions] = React.useState<Opt[]>([]);

    const [search, setSearch] = React.useState('');
    const [schoolCode, setSchoolCode] = React.useState('');
    const [level, setLevel] = React.useState('');
    const [klass, setKlass] = React.useState('');
    const [option, setOption] = React.useState('');
    const [period, setPeriod] = React.useState<Period>('all');
    const [startDate, setStartDate] = React.useState('');
    const [endDate, setEndDate] = React.useState('');

    React.useEffect(() => {
        (async () => {
            try {
                const [f, l] = await Promise.all([api(cookies).get('/statistics/filters'), api(cookies).get('/players/labels')]);
                setSchools(f.data.schools ?? []);
                setLevels(l.data.levels ?? []);
                setOptions(l.data.options ?? []);
            } catch { /* filtres indisponibles */ }
        })();
    }, []);

    const load = React.useCallback(async (p: number) => {
        setLoading(true);
        const params: Record<string, string | number> = { page: p, per_page: PER_PAGE };
        if (search) params.search = search;
        if (schoolCode) params.school_code = schoolCode;
        if (level) params.school_level = level;
        if (klass) params.school_class = klass;
        if (option) params.school_option = option;
        // Le filtre par dates de l'API ne s'applique qu'avec les deux bornes.
        if (startDate && endDate) { params.start_date = startDate; params.end_date = endDate; }
        try {
            const d = (await api(cookies).get('/statistics/user-points', { params })).data;
            const res: Classement[] = d.results ?? [];
            setRows(res); setTotal(d.total ?? 0); setPages(d.pages ?? 0);
            if (p === 1) setLeader(res[0]?.points ?? 0);
        } catch {
            setRows([]); setTotal(0); setPages(0);
        } finally {
            setLoading(false);
        }
    }, [search, schoolCode, level, klass, option, startDate, endDate]);

    React.useEffect(() => { setPage(1); load(1); }, [load]);

    const choosePeriod = (p: Period) => {
        setPeriod(p);
        if (p !== 'custom') { const [s, e] = periodRange(p); setStartDate(s); setEndDate(e); }
    };

    const hasFilters = Boolean(search || schoolCode || level || klass || option || period !== 'all');
    const reset = () => {
        setSearch(''); setSchoolCode(''); setLevel(''); setKlass(''); setOption('');
        setPeriod('all'); setStartDate(''); setEndDate('');
    };

    const showPodium = page === 1 && !search && rows.length > 0 && rows[0].points > 0;
    const top = showPodium ? rows.slice(0, 3).filter(r => r.points > 0) : [];
    const max = Math.max(leader, rows[0]?.points ?? 0, 1);

    return (
        <PageBody>
            <PageHeader
                crumbs={[{ label: 'Tableau de bord', href: '/app' }, { label: 'Classement' }]}
                title="Classement"
                description={`${fmtInt(total)} joueur${total > 1 ? 's' : ''} classé${total > 1 ? 's' : ''} par points (10 points par bonne réponse).`}
            />

            {/* Filtres */}
            <Card className="mb-6 p-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-[minmax(220px,1.4fr)_repeat(4,minmax(0,1fr))]">
                    <SearchInput value={search} onSearch={setSearch} placeholder="Nom ou numéro" className="sm:col-span-2 lg:col-span-4 xl:col-span-1" />
                    {schools.length > 1 && (
                        <Select value={schoolCode} onChange={e => setSchoolCode(e.target.value)} aria-label="École">
                            <option value="">Toutes les écoles</option>
                            {schools.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
                        </Select>
                    )}
                    <Select value={level} aria-label="Section" onChange={e => {
                        const v = e.target.value; setLevel(v);
                        if (v !== '2') setOption('');
                        if (v === '2' && Number(klass) > 4) setKlass('');
                    }}>
                        <option value="">Toutes les sections</option>
                        {levels.map(l => <option key={l.value} value={String(l.value)}>{l.label}</option>)}
                    </Select>
                    <Select value={klass} onChange={e => setKlass(e.target.value)} aria-label="Classe">
                        <option value="">Toutes les classes</option>
                        {CLASSES.filter(c => level !== '2' || Number(c.value) <= 4).map(c => <option key={c.value} value={String(c.value)}>{c.label}</option>)}
                    </Select>
                    {level !== '1' && (
                        <Select value={option} onChange={e => setOption(e.target.value)} aria-label="Option">
                            <option value="">Toutes les options</option>
                            {options.map(o => <option key={o.value} value={String(o.value)}>{o.label}</option>)}
                        </Select>
                    )}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-ink-100 pt-3">
                    <span className="mr-1 text-[13px] font-medium text-ink-600">Période</span>
                    <div className="flex flex-wrap gap-1 rounded-lg bg-ink-100 p-1" role="group" aria-label="Période">
                        {PERIODS.map(p => (
                            <button key={p.key} onClick={() => choosePeriod(p.key)} aria-pressed={period === p.key}
                                className={cn('rounded-md px-2.5 py-1 text-[13px] font-medium transition-colors',
                                    period === p.key ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-600 hover:text-ink-900')}>
                                {p.label}
                            </button>
                        ))}
                    </div>
                    {period === 'custom' && (
                        <div className="flex flex-wrap items-center gap-2">
                            <input type="date" value={startDate} max={endDate || undefined} onChange={e => setStartDate(e.target.value)} className={cn(inputClass, 'w-auto')} aria-label="Du" />
                            <span className="text-[13px] text-ink-500">au</span>
                            <input type="date" value={endDate} min={startDate || undefined} onChange={e => setEndDate(e.target.value)} className={cn(inputClass, 'w-auto')} aria-label="Au" />
                        </div>
                    )}
                    {hasFilters && (
                        <Button variant="ghost" size="sm" onClick={reset} className="ml-auto">
                            <RotateCcw /> Réinitialiser
                        </Button>
                    )}
                </div>
            </Card>

            {loading && page === 1 && !search ? (
                <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {[0, 1, 2].map(i => <Skeleton key={i} className="h-[150px] rounded-xl" />)}
                </div>
            ) : top.length > 0 && <Podium top={top} />}

            <Card className="overflow-hidden">
                <div className="overflow-x-auto scroll-thin">
                    <table className={cn(tableClass, 'min-w-[640px]')}>
                        <thead className={theadClass}>
                            <tr>
                                <th className={cn(thClass, 'w-16 text-center')}>Rang</th>
                                <th className={thClass}>Joueur</th>
                                <th className={thClass}>Téléphone</th>
                                <th className={thClass}>École</th>
                                <th className={cn(thClass, 'w-[220px] text-right')}>Points</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? <SkeletonRows rows={10} cols={5} /> : rows.length === 0 ? (
                                <tr><td colSpan={5}>
                                    <EmptyState icon={<Trophy />} title="Aucun joueur classé"
                                        description={hasFilters ? 'Aucun résultat pour ces filtres. Essayez de les élargir.' : 'Le classement apparaîtra dès les premières réponses.'}
                                        action={hasFilters ? <Button variant="secondary" size="sm" onClick={reset}>Réinitialiser les filtres</Button> : undefined} />
                                </td></tr>
                            ) : rows.map((c, i) => {
                                const rank = (page - 1) * PER_PAGE + i + 1;
                                const medal = rank <= 3 && c.points > 0 && !search ? MEDALS[rank - 1] : null;
                                return (
                                    <tr key={c.phone_number} className={trClass}>
                                        <td className={cn(tdClass, 'text-center')}>
                                            {medal
                                                ? <span className={cn('inline-flex size-7 items-center justify-center rounded-full text-xs font-semibold tabular', medal.chip)}>{rank}</span>
                                                : <span className="text-[13px] font-medium tabular text-ink-500">{rank}</span>}
                                        </td>
                                        <td className={tdClass}>
                                            <Link href={`/app/users/${c.phone_number}`} className="group flex items-center gap-3">
                                                <Avatar name={c.name} seed={c.phone_number} size="sm" />
                                                <span className="truncate font-medium text-ink-900 group-hover:text-brand-700">{c.name || '—'}</span>
                                            </Link>
                                        </td>
                                        <td className={cn(tdClass, 'whitespace-nowrap tabular text-ink-600')}>{fmtPhone(c.phone_number)}</td>
                                        <td className={cn(tdClass, 'text-ink-600')}>{c.schoolname || '—'}</td>
                                        <td className={tdClass}>
                                            <div className="flex items-center justify-end gap-3">
                                                <div className="hidden h-1.5 w-24 overflow-hidden rounded-full bg-ink-100 sm:block" aria-hidden>
                                                    <div className={cn('h-full rounded-full', medal ? medal.bar : 'bg-brand-500')} style={{ width: `${Math.round((c.points / max) * 100)}%` }} />
                                                </div>
                                                <span className="w-14 text-right font-semibold tabular text-ink-900">{fmtInt(c.points)}</span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <Pagination page={page} pages={pages} total={total} perPage={PER_PAGE} onChange={n => { setPage(n); load(n); }} />
            </Card>
        </PageBody>
    );
}
