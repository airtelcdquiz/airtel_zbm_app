'use client'
import api from '@/lib/api';
import cookies from '@/lib/cookies';
import { Classement } from '@/types/permissions';
import React from 'react'
import {Pagination} from "@heroui/pagination";
import {Spinner} from "@heroui/spinner";
import {Popover, PopoverTrigger, PopoverContent, Button, Input} from "@heroui/react"

interface FilterSchool { code: string; name: string; }
interface Filters { schools: FilterSchool[]; levels: (string | number)[]; classes: (string | number)[]; options: (string | number)[]; }

export default function ClassementsPage(){

    const [classements, setClassements] = React.useState<Classement[]>([]);
    const [loading, setLoading] = React.useState<boolean>(true);
    const [pages, setPages] = React.useState<number>(1);
    const [currentPage, setCurrentPage] = React.useState<number>(1);
    const [total, setTotal] = React.useState<number>(0);
    const [search, setSearch] = React.useState<string>('');
    const [startDate, setStartDate] = React.useState<string>('');
    const [endDate, setEndDate] = React.useState<string>('');

    // Filtres école / niveau / section / option
    const [filters, setFilters] = React.useState<Filters>({ schools: [], levels: [], classes: [], options: [] });
    const [schoolCode, setSchoolCode] = React.useState<string>('');
    const [level, setLevel] = React.useState<string>('');
    const [klass, setKlass] = React.useState<string>('');
    const [option, setOption] = React.useState<string>('');

    const searchRef = React.useRef<any>(null);

    const load = async (_page: number = 1) => {
        setLoading(true);
        const params: any = { page: _page };
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;
        if (search) params.search = search;
        if (schoolCode) params.school_code = schoolCode;
        if (level) params.school_level = level;
        if (klass) params.school_class = klass;
        if (option) params.school_option = option;

        try {
            const response = (await api(cookies).get('/statistics/user-points', { params })).data;
            setClassements(response.results ?? []);
            setPages(response.pages ?? 1);
            setTotal(response.total ?? 0);
        } catch {
            setClassements([]); setPages(1); setTotal(0);
        } finally {
            setLoading(false);
        }
    }

    // Charger les valeurs de filtres disponibles (limitées à la portée du user)
    React.useEffect(() => {
        (async () => {
            try {
                const data = (await api(cookies).get('/statistics/filters')).data;
                setFilters({
                    schools: data.schools ?? [],
                    levels: data.levels ?? [],
                    classes: data.classes ?? [],
                    options: data.options ?? [],
                });
            } catch { /* filtres indisponibles : on garde des listes vides */ }
        })();
    }, []);

    React.useEffect(() => { setCurrentPage(1); load(1); }, [search]);
    React.useEffect(() => { load(currentPage); }, [currentPage]);

    const handleFilter = () => { setCurrentPage(1); load(1); }
    const resetFilters = () => {
        setSchoolCode(''); setLevel(''); setKlass(''); setOption('');
        setStartDate(''); setEndDate('');
        setCurrentPage(1);
        setTimeout(() => load(1), 0);
    }

    const selectCls = "mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-[#EC2027] focus:ring-2 focus:ring-[#EC2027]/20";
    const activeFilters = [schoolCode, level, klass, option, startDate, endDate].filter(Boolean).length;

    return (
        <div className="p-6 h-full w-full overflow-y-auto">
            <div className="flex flex-row justify-between">
                <div className="flex-1 mb-4">
                    <h1 className="text-2xl font-bold m-0">Classements</h1>
                    <p className='text-sm text-gray-500 m-0'>{total} participants en fonction de leurs points</p>
                </div>
                <div>
                    <Popover placement="bottom-end">
                        <PopoverTrigger>
                        <div className="px-[20px] py-[7px] flex flex-row bg-[#EC2027] rounded text-white items-center gap-2 cursor-pointer">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" />
                            </svg>
                            <p className='text-[13px] font-bold'>Filtrer{activeFilters ? ` (${activeFilters})` : ''}</p>
                        </div>
                        </PopoverTrigger>
                        <PopoverContent>
                            <div className='bg-white p-5 rounded-xl w-[280px]'>
                                <div className="text-sm font-bold mb-2">Filtrer les résultats</div>

                                {filters.schools.length > 0 && (
                                    <label className="block text-xs text-gray-500">École
                                        <select className={selectCls} value={schoolCode} onChange={(e) => setSchoolCode(e.target.value)}>
                                            <option value="">Toutes</option>
                                            {filters.schools.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
                                        </select>
                                    </label>
                                )}

                                <div className="mt-2 grid grid-cols-3 gap-2">
                                    <label className="block text-xs text-gray-500">Niveau
                                        <select className={selectCls} value={level} onChange={(e) => setLevel(e.target.value)}>
                                            <option value="">Tous</option>
                                            {filters.levels.map((v) => <option key={String(v)} value={String(v)}>{String(v)}</option>)}
                                        </select>
                                    </label>
                                    <label className="block text-xs text-gray-500">Section
                                        <select className={selectCls} value={klass} onChange={(e) => setKlass(e.target.value)}>
                                            <option value="">Toutes</option>
                                            {filters.classes.map((v) => <option key={String(v)} value={String(v)}>{String(v)}</option>)}
                                        </select>
                                    </label>
                                    <label className="block text-xs text-gray-500">Option
                                        <select className={selectCls} value={option} onChange={(e) => setOption(e.target.value)}>
                                            <option value="">Toutes</option>
                                            {filters.options.map((v) => <option key={String(v)} value={String(v)}>{String(v)}</option>)}
                                        </select>
                                    </label>
                                </div>

                                <div className="mt-3 grid grid-cols-2 gap-2">
                                    <label className="block text-xs text-gray-500">Du
                                        <Input type="date" size="sm" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                                    </label>
                                    <label className="block text-xs text-gray-500">Au
                                        <Input type="date" size="sm" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                                    </label>
                                </div>

                                <div className="mt-4 flex gap-2">
                                    <Button size="sm" className="flex-1 bg-[#EC2027] text-white" onClick={handleFilter}>Appliquer</Button>
                                    <Button size="sm" variant="light" onClick={resetFilters}>Réinitialiser</Button>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            <div className="w-full bg-white overflow-x-auto text-[13px] mb-[20px] p-[20px] rounded-xl shadow-xl">
                <div className="flex w-full mb-4 gap-[10px] items-center">
                    <svg onClick={() => setSearch(searchRef.current.value)} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400 cursor-pointer">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                    </svg>
                    <input ref={searchRef} onKeyDown={(e) => { if (e.key === 'Enter') setSearch(searchRef.current.value); }} className="w-full outline-none border-none flex-1" placeholder="Rechercher par nom ou téléphone..." />
                </div>
                <div className="w-full">
                    <div className="flex flex-row w-full font-bold">
                        <div className="px-4 py-2 w-[60px]">#</div>
                        <div className="px-4 py-2 w-[150px]">Téléphone</div>
                        <div className="px-4 py-2 flex-1">Nom</div>
                        <div className="px-4 py-2 w-[100px]">Points</div>
                        <div className="px-4 py-2 flex-1">École</div>
                    </div>
                </div>
                <div className="w-full divide-y divide-gray-200">
                    {loading ? <div className="flex justify-center items-center w-full min-h-[300px]"><Spinner color="primary" /></div> :
                     classements.length === 0 ? <div className="flex justify-center items-center w-full min-h-[200px] text-gray-400 text-sm">Aucun résultat</div> :
                     classements.map((c, i) => (
                        <div key={c.phone_number} className="duration-300 hover:bg-gray-100 flex flex-row w-full">
                            <div className="px-4 py-2 w-[60px] font-semibold text-gray-400">{(currentPage - 1) * 10 + i + 1}</div>
                            <div className="px-4 py-2 w-[150px]">{c.phone_number}</div>
                            <div className="px-4 py-2 flex-1">{c.name}</div>
                            <div className="px-4 py-2 w-[100px] font-semibold">{c.points}</div>
                            <div className="px-4 py-2 flex-1">{c.schoolname}</div>
                        </div>
                    ))}
                </div>
            </div>
            <Pagination initialPage={currentPage} total={pages} color='primary' onChange={(page) => setCurrentPage(page)} />
        </div>
    )
}
