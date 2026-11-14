'use client'
import api from '@/lib/api';
import cookies from '@/lib/cookies';
import { Player } from '@/lib/types';
import { Pagination } from '@heroui/pagination';
import { Spinner } from '@heroui/spinner';
import Link from 'next/link';
import React from 'react';

interface Opt { value: number | string; label: string }
interface FilterSchool { code: string; name: string }

const CLASSES: Opt[] = [1, 2, 3, 4, 5, 6, 7, 8].map(n => ({ value: n, label: n === 1 ? '1ère année' : `${n}ème année` }));
const PER_PAGE = 20;

const formatDate = (iso: string | null) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('fr-FR', {
        timeZone: 'Africa/Kinshasa', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
};

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
    const searchRef = React.useRef<HTMLInputElement>(null);

    const params = () => {
        const p: Record<string, string | number> = {};
        if (search) p.search = search;
        if (schoolCode) p.school_code = schoolCode;
        if (level) p.school_level = level;
        if (klass) p.school_class = klass;
        if (option) p.school_option = option;
        p.sort = sort;
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
                const [f, l] = await Promise.all([
                    api(cookies).get('/statistics/filters'),
                    api(cookies).get('/players/labels'),
                ]);
                setSchools(f.data.schools ?? []);
                setLevels(l.data.levels ?? []);
                setOptions(l.data.options ?? []);
            } catch { /* filtres indisponibles */ }
        })();
    }, []);

    // Tout changement de filtre repart de la page 1.
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

    const resetFilters = () => {
        setSchoolCode(''); setLevel(''); setKlass(''); setOption(''); setSort('recent');
        setSearch(''); if (searchRef.current) searchRef.current.value = '';
    };

    const sel = "rounded-md border border-gray-300 bg-white px-2 py-1.5 text-[13px] outline-none focus:border-[#EC2027]";
    const hasFilters = [schoolCode, level, klass, option, search].some(Boolean);

    return <div className='w-full h-full overflow-y-auto pr-[40px] pl-[10px]'>
        <div className="flex flex-row w-full items-center mt-[30px] gap-3 text-[13px]">
            <Link href="/app" className="cursor-pointer">Accueil</Link>
            <span>/ Joueurs</span>
        </div>

        <div className="flex flex-row flex-wrap items-end justify-between gap-3 mt-[10px]">
            <div>
                <p className="text-2xl font-bold">Joueurs</p>
                <p className="text-[13px] text-gray-500">{total.toLocaleString('fr-FR')} joueur{total > 1 ? 's' : ''}{hasFilters ? ' (filtré)' : ''}</p>
            </div>
            <button onClick={exportExcel} disabled={exporting}
                className="flex items-center gap-2 rounded bg-[#1D6F42] px-4 py-2 text-[13px] font-bold text-white hover:bg-[#185C37] disabled:opacity-60">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                {exporting ? 'Export en cours…' : 'Exporter en Excel'}
            </button>
        </div>
        {error && <p className="mt-2 text-[13px] text-red-600">{error}</p>}

        <div className='w-full mt-[20px] bg-white text-[13px] mb-[20px] p-[20px] rounded-xl shadow-xl'>
            {/* Recherche + filtres */}
            <div className="flex flex-row flex-wrap items-center gap-2 mb-3">
                <div className='relative flex flex-1 min-w-[220px] items-center border-b border-gray-300 px-2 py-1.5'>
                    <input ref={searchRef} type="text" placeholder="Rechercher par nom ou téléphone…"
                        onKeyDown={(e) => { if (e.key === 'Enter') setSearch(searchRef.current?.value ?? ''); }}
                        className="w-full bg-transparent outline-none" />
                    <svg onClick={() => setSearch(searchRef.current?.value ?? '')} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 cursor-pointer text-gray-400">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                    </svg>
                </div>
                {schools.length > 1 && (
                    <select className={sel} value={schoolCode} onChange={e => setSchoolCode(e.target.value)} aria-label="École">
                        <option value="">Toutes les écoles</option>
                        {schools.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
                    </select>
                )}
                <select className={sel} value={level} onChange={e => { setLevel(e.target.value); if (e.target.value !== '2') setOption(''); }} aria-label="Section">
                    <option value="">Toutes les sections</option>
                    {levels.map(l => <option key={l.value} value={String(l.value)}>{l.label}</option>)}
                </select>
                <select className={sel} value={klass} onChange={e => setKlass(e.target.value)} aria-label="Classe">
                    <option value="">Toutes les classes</option>
                    {CLASSES.filter(c => level !== '2' || Number(c.value) <= 4).map(c => <option key={c.value} value={String(c.value)}>{c.label}</option>)}
                </select>
                {level !== '1' && (
                    <select className={sel} value={option} onChange={e => setOption(e.target.value)} aria-label="Option">
                        <option value="">Toutes les options</option>
                        {options.map(o => <option key={o.value} value={String(o.value)}>{o.label}</option>)}
                    </select>
                )}
                <select className={sel} value={sort} onChange={e => setSort(e.target.value)} aria-label="Tri">
                    <option value="recent">Plus récents</option>
                    <option value="score">Meilleur score</option>
                    <option value="name">Nom (A→Z)</option>
                </select>
                {hasFilters && <button onClick={resetFilters} className="text-[13px] text-gray-500 underline">Réinitialiser</button>}
            </div>

            <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left">
                    <thead>
                        <tr className="font-bold border-b border-gray-200">
                            <th className="px-3 py-2">Téléphone</th>
                            <th className="px-3 py-2">Nom</th>
                            <th className="px-3 py-2">École</th>
                            <th className="px-3 py-2">Section</th>
                            <th className="px-3 py-2">Classe</th>
                            <th className="px-3 py-2">Option</th>
                            <th className="px-3 py-2 text-right">Score</th>
                            <th className="px-3 py-2 text-right">Bonnes rép.</th>
                            <th className="px-3 py-2">Inscrit le</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-gray-700">
                        {loading ? (
                            <tr><td colSpan={9} className="py-16 text-center"><Spinner color="primary" /></td></tr>
                        ) : players.length === 0 ? (
                            <tr><td colSpan={9} className="py-12 text-center text-gray-400">Aucun joueur</td></tr>
                        ) : players.map(p => (
                            <tr key={p.phone_number} className="duration-200 hover:bg-gray-50">
                                <td className="px-3 py-2 whitespace-nowrap"><Link href={`/app/users/${p.phone_number}`} className="hover:underline">{p.phone_number}</Link></td>
                                <td className="px-3 py-2"><Link href={`/app/users/${p.phone_number}`} className="hover:underline">{p.name}</Link></td>
                                <td className="px-3 py-2">{p.school_name ?? p.school_code ?? '—'}</td>
                                <td className="px-3 py-2">{p.level_label || '—'}</td>
                                <td className="px-3 py-2 whitespace-nowrap">{p.class_label || '—'}</td>
                                <td className="px-3 py-2">{p.option_label || '—'}</td>
                                <td className="px-3 py-2 text-right font-semibold">{p.points}</td>
                                <td className="px-3 py-2 text-right">{p.correct_answers}/{p.answers}</td>
                                <td className="px-3 py-2 whitespace-nowrap">{formatDate(p.created_at)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
        {pages > 1 && <Pagination page={page} total={pages} color='primary' onChange={(n) => { setPage(n); load(n); }} />}
    </div>
}
