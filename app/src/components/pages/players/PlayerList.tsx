'use client'
import api from '@/lib/api';
import cookies from '@/lib/cookies';
import { Player } from '@/lib/types';
import Link from 'next/link';
import React from 'react';
import { Download, Users } from 'lucide-react';
import {
    Alert, Avatar, Badge, Button, Card, EmptyState, PageBody, PageHeader, Pagination, SearchInput, Select, SkeletonRows,
    fmtDate, fmtInt, fmtPhone, tableClass, tdClass, thClass, theadClass, trClass,
} from '@/components/ui/kit';

interface Opt { value: number | string; label: string }
interface FilterSchool { code: string; name: string }

const CLASSES: Opt[] = [1, 2, 3, 4, 5, 6, 7, 8].map(n => ({ value: n, label: n === 1 ? '1ère année' : `${n}ème année` }));
const PER_PAGE = 20;

export default function PlayerList() {
    const [players, setPlayers] = React.useState<Player[]>([]);
    const [page, setPage] = React.useState(1);
    const [pages, setPages] = React.useState(0);
    const [total, setTotal] = React.useState(0);
    const [loading, setLoading] = React.useState(true);
    const [exporting, setExporting] = React.useState(false);
    const [error, setError] = React.useState('');

    const [schools, setSchools] = React.useState<FilterSchool[]>([]);
    const [levels, setLevels] = React.useState<Opt[]>([]);
    const [options, setOptions] = React.useState<Opt[]>([]);

    const [search, setSearch] = React.useState('');
    const [schoolCode, setSchoolCode] = React.useState('');
    const [level, setLevel] = React.useState('');
    const [klass, setKlass] = React.useState('');
    const [option, setOption] = React.useState('');
    const [sort, setSort] = React.useState('recent');

    const params = () => {
        const p: Record<string, string | number> = { sort };
        if (search) p.search = search;
        if (schoolCode) p.school_code = schoolCode;
        if (level) p.school_level = level;
        if (klass) p.school_class = klass;
        if (option) p.school_option = option;
        return p;
    };

    const load = async (_page: number) => {
        setLoading(true);
        try {
            const data = (await api(cookies).get('/players', { params: { ...params(), page: _page, per_page: PER_PAGE } })).data;
            setPlayers(data.players ?? []);
            setTotal(data.total ?? 0);
            setPages(data.pages ?? 0);
        } catch (e) {
            console.error(e);
            setPlayers([]); setTotal(0); setPages(0);
        } finally {
            setLoading(false);
        }
    };

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

    // Tout changement de filtre repart de la page 1.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    React.useEffect(() => { setPage(1); load(1); }, [search, schoolCode, level, klass, option, sort]);

    const exportExcel = async () => {
        setExporting(true); setError('');
        try {
            const res = await api(cookies).get('/players/export', { params: params(), responseType: 'blob' });
            const cd: string = res.headers['content-disposition'] ?? '';
            const name = /filename="?([^";]+)"?/.exec(cd)?.[1] ?? 'joueurs-airtel-quiz.xlsx';
            const url = URL.createObjectURL(res.data);
            const a = document.createElement('a');
            a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error(e);
            setError("L'export a échoué. Réessayez.");
        } finally {
            setExporting(false);
        }
    };

    const resetFilters = () => { setSchoolCode(''); setLevel(''); setKlass(''); setOption(''); setSort('recent'); setSearch(''); };
    const hasFilters = [schoolCode, level, klass, option, search].some(Boolean);

    return (
        <PageBody>
            <PageHeader
                crumbs={[{ label: 'Tableau de bord', href: '/app' }, { label: 'Joueurs' }]}
                title="Joueurs"
                description={loading && !total ? 'Chargement…' : `${fmtInt(total)} joueur${total > 1 ? 's' : ''}${hasFilters ? ' correspondant aux filtres' : ' inscrits'}`}
                actions={
                    <Button variant="secondary" onClick={exportExcel} loading={exporting} disabled={total === 0}>
                        {!exporting && <Download />} {exporting ? 'Export en cours…' : 'Exporter en Excel'}
                    </Button>
                }
            />
            {error && <Alert className="mb-4">{error}</Alert>}

            <Card>
                <div className="space-y-3 border-b border-ink-100 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <SearchInput value={search} onSearch={setSearch} placeholder="Nom ou numéro de téléphone" className="sm:max-w-sm sm:flex-1" />
                        <div className="flex items-center gap-2 sm:ml-auto">
                            {hasFilters && <Button variant="ghost" size="sm" onClick={resetFilters}>Réinitialiser</Button>}
                            <Select value={sort} onChange={e => setSort(e.target.value)} aria-label="Tri" className="w-full sm:w-44">
                                <option value="recent">Plus récents</option>
                                <option value="score">Meilleur score</option>
                                <option value="name">Nom (A → Z)</option>
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                        {schools.length > 1 && (
                            <Select value={schoolCode} onChange={e => setSchoolCode(e.target.value)} aria-label="École">
                                <option value="">École : toutes</option>
                                {schools.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
                            </Select>
                        )}
                        <Select value={level} onChange={e => { setLevel(e.target.value); if (e.target.value === '1') setOption(''); }} aria-label="Section">
                            <option value="">Section : toutes</option>
                            {levels.map(l => <option key={l.value} value={String(l.value)}>{l.label}</option>)}
                        </Select>
                        <Select value={klass} onChange={e => setKlass(e.target.value)} aria-label="Classe">
                            <option value="">Classe : toutes</option>
                            {CLASSES.filter(c => level !== '2' || Number(c.value) <= 4).map(c => <option key={c.value} value={String(c.value)}>{c.label}</option>)}
                        </Select>
                        <Select value={option} onChange={e => setOption(e.target.value)} aria-label="Option" disabled={level === '1'}>
                            <option value="">{level === '1' ? 'Option : —' : 'Option : toutes'}</option>
                            {options.map(o => <option key={o.value} value={String(o.value)}>{o.label}</option>)}
                        </Select>
                    </div>
                </div>

                <div className="overflow-x-auto scroll-thin">
                    <table className={`${tableClass} min-w-[880px]`}>
                        <thead className={theadClass}>
                            <tr>
                                <th className={thClass}>Joueur</th>
                                <th className={thClass}>École</th>
                                <th className={thClass}>Section</th>
                                <th className={thClass}>Classe</th>
                                <th className={thClass}>Option</th>
                                <th className={`${thClass} text-right`}>Score</th>
                                <th className={`${thClass} text-right`}>Réussite</th>
                                <th className={thClass}>Inscrit le</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? <SkeletonRows cols={8} rows={10} /> : players.length === 0 ? (
                                <tr><td colSpan={8}>
                                    <EmptyState icon={<Users />} title={hasFilters ? 'Aucun joueur ne correspond' : 'Aucun joueur inscrit'}
                                        description={hasFilters ? 'Modifiez ou réinitialisez les filtres.' : 'Les élèves apparaissent ici après leur inscription par USSD.'}
                                        action={hasFilters ? <Button variant="secondary" size="sm" onClick={resetFilters}>Réinitialiser les filtres</Button> : undefined} />
                                </td></tr>
                            ) : players.map(p => {
                                const rate = p.answers ? Math.round((p.correct_answers / p.answers) * 100) : null;
                                return (
                                    <tr key={p.phone_number} className={trClass}>
                                        <td className={tdClass}>
                                            <Link href={`/app/users/${p.phone_number}`} className="group flex items-center gap-3">
                                                <Avatar name={p.name} seed={p.phone_number} />
                                                <span className="min-w-0">
                                                    <span className="block max-w-[200px] truncate font-medium text-ink-900 group-hover:text-brand-700">{p.name || 'Sans nom'}</span>
                                                    <span className="block text-xs text-ink-500 tabular">{fmtPhone(p.phone_number)}</span>
                                                </span>
                                            </Link>
                                        </td>
                                        <td className={`${tdClass} text-ink-700`}>
                                            <span className="block max-w-[160px] truncate">{p.school_name ?? p.school_code ?? '—'}</span>
                                        </td>
                                        <td className={tdClass}>
                                            {p.level_label ? <Badge tone={p.school_level === 2 ? 'info' : 'neutral'}>{p.level_label}</Badge> : <span className="text-ink-400">—</span>}
                                        </td>
                                        <td className={`${tdClass} whitespace-nowrap text-ink-700`}>{p.class_label || '—'}</td>
                                        <td className={`${tdClass} text-ink-700`}>{p.option_label || <span className="text-ink-400">—</span>}</td>
                                        <td className={`${tdClass} text-right tabular`}>
                                            <span className="whitespace-nowrap"><span className="font-semibold text-ink-900">{fmtInt(p.points)}</span> <span className="text-xs text-ink-400">pts</span></span>
                                        </td>
                                        <td className={`${tdClass} text-right tabular`}>
                                            <span className="text-ink-800">{rate === null ? '—' : `${rate} %`}</span>
                                            <span className="block whitespace-nowrap text-xs text-ink-400">{p.correct_answers}/{p.answers} rép.</span>
                                        </td>
                                        <td className={`${tdClass} whitespace-nowrap text-ink-600`} title={fmtDate(p.created_at)}>{fmtDate(p.created_at, false)}</td>
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
