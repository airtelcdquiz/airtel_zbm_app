'use client'
import api from '@/lib/api';
import cookies from '@/lib/cookies';
import { Admin } from '@/lib/types';
import { Spinner } from '@heroui/spinner';
import Link from 'next/link';
import React from 'react';

export default function AdminList() {
    const [admins, setAdmins] = React.useState<Admin[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [search, setSearch] = React.useState('');
    const searchRef = React.useRef<HTMLInputElement>(null);

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

    return <div className='w-full h-full overflow-y-auto pr-[40px] pl-[10px]'>
        <div className="flex flex-row w-full items-center mt-[30px] gap-3 text-[13px]">
            <Link href="/app">Accueil</Link>
            <span>/ Administrateurs</span>
        </div>
        <div className="mt-[10px]">
            <p className="text-2xl font-bold">Administrateurs</p>
            <p className="text-[13px] text-gray-500">
                {admins.length} administrateur{admins.length > 1 ? 's' : ''}. Pour nommer un administrateur, ouvrez sa fiche depuis la liste des joueurs et donnez-lui un rôle : il quitte alors la liste des joueurs.
            </p>
        </div>

        <div className='w-full mt-[20px] bg-white text-[13px] mb-[20px] p-[20px] rounded-xl shadow-xl'>
            <div className='relative flex items-center border-b border-gray-300 px-2 py-1.5 mb-3'>
                <input ref={searchRef} type="text" placeholder="Rechercher par nom ou téléphone…"
                    onKeyDown={(e) => { if (e.key === 'Enter') setSearch(searchRef.current?.value ?? ''); }}
                    className="w-full bg-transparent outline-none" />
            </div>
            <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-left">
                    <thead>
                        <tr className="font-bold border-b border-gray-200">
                            <th className="px-3 py-2">Téléphone</th>
                            <th className="px-3 py-2">Nom</th>
                            <th className="px-3 py-2">Type</th>
                            <th className="px-3 py-2">École</th>
                            <th className="px-3 py-2">Écoles gérées</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-gray-700">
                        {loading ? (
                            <tr><td colSpan={5} className="py-16 text-center"><Spinner color="primary" /></td></tr>
                        ) : admins.length === 0 ? (
                            <tr><td colSpan={5} className="py-12 text-center text-gray-400">Aucun administrateur</td></tr>
                        ) : admins.map(a => (
                            <tr key={a.phone_number} className="duration-200 hover:bg-gray-50">
                                <td className="px-3 py-2"><Link href={`/app/users/${a.phone_number}`} className="hover:underline">{a.phone_number}</Link></td>
                                <td className="px-3 py-2"><Link href={`/app/users/${a.phone_number}`} className="hover:underline">{a.name}</Link></td>
                                <td className="px-3 py-2">
                                    <span className={`rounded-full px-2 py-0.5 text-[12px] font-semibold ${a.is_superuser ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>{a.type}</span>
                                </td>
                                <td className="px-3 py-2">{a.school_name ?? a.school_code ?? '—'}</td>
                                <td className="px-3 py-2">{a.is_superuser ? 'Toutes' : (a.attached_schools.join(', ') || 'Aucune')}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
}
