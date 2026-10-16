'use client'
import React from 'react';
import api from '@/lib/api';
import cookies from '@/lib/cookies';

interface AttachedRow { id: number; code: string; phone_number: string; }
interface SchoolRow { code: string; name: string; }

export default function AttachedSchoolsManager({ phoneNumber }: { phoneNumber: string }) {
    const [attached, setAttached] = React.useState<AttachedRow[]>([]);
    const [schools, setSchools] = React.useState<SchoolRow[]>([]);
    const [selected, setSelected] = React.useState<string>('');
    const [loading, setLoading] = React.useState<boolean>(true);
    const [busy, setBusy] = React.useState<boolean>(false);
    const [error, setError] = React.useState<string>('');

    const nameOf = (code: string) => schools.find((s) => String(s.code) === String(code))?.name ?? code;

    const load = async () => {
        setLoading(true);
        try {
            const [sc, at] = await Promise.all([
                api(cookies).get('/schools'),
                api(cookies).get('/attached-schools'),
            ]);
            const allSchools: SchoolRow[] = Array.isArray(sc.data) ? sc.data : (sc.data?.data ?? sc.data?.schools ?? []);
            const rows: AttachedRow[] = (at.data?.data ?? at.data ?? []).filter(
                (r: AttachedRow) => String(r.phone_number) === String(phoneNumber)
            );
            setSchools(allSchools);
            setAttached(rows);
        } catch {
            setError("Impossible de charger les écoles.");
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => { load(); /* eslint-disable-next-line */ }, [phoneNumber]);

    const add = async () => {
        if (!selected) return;
        if (attached.some((r) => String(r.code) === String(selected))) { setSelected(''); return; }
        setBusy(true); setError('');
        try {
            await api(cookies).post('/attached-schools', { phone_number: phoneNumber, code: selected });
            setSelected('');
            await load();
        } catch {
            setError("Échec de l'ajout de l'école.");
        } finally {
            setBusy(false);
        }
    };

    const remove = async (id: number) => {
        setBusy(true); setError('');
        try {
            await api(cookies).delete(`/attached-schools/${id}`);
            await load();
        } catch {
            setError("Échec du retrait de l'école.");
        } finally {
            setBusy(false);
        }
    };

    const available = schools.filter((s) => !attached.some((r) => String(r.code) === String(s.code)));

    return (
        <div className="mt-6 rounded-xl bg-white p-5 shadow-sm ring-1 ring-black/5">
            <h3 className="text-base font-semibold text-gray-900">Écoles autorisées</h3>
            <p className="mt-1 text-sm text-gray-500">
                Les écoles rattachées déterminent le périmètre des classements visibles par cet utilisateur
                (sans effet pour un administrateur, qui voit toutes les écoles).
            </p>

            {error && <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}

            <div className="mt-4 flex flex-wrap items-end gap-2">
                <label className="flex-1 min-w-[200px] text-xs text-gray-500">
                    Ajouter une école
                    <select
                        className="mt-1 w-full rounded-md border border-gray-300 px-2 py-2 text-sm outline-none focus:border-[#EC2027] focus:ring-2 focus:ring-[#EC2027]/20"
                        value={selected}
                        onChange={(e) => setSelected(e.target.value)}
                        disabled={loading || busy}
                    >
                        <option value="">Sélectionner…</option>
                        {available.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
                    </select>
                </label>
                <button
                    onClick={add}
                    disabled={!selected || busy}
                    className="rounded-lg bg-[#EC2027] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#c91a20] disabled:cursor-not-allowed disabled:opacity-60"
                >
                    Ajouter
                </button>
            </div>

            <div className="mt-4">
                {loading ? (
                    <p className="text-sm text-gray-400">Chargement…</p>
                ) : attached.length === 0 ? (
                    <p className="text-sm text-gray-400">Aucune école rattachée.</p>
                ) : (
                    <ul className="flex flex-wrap gap-2">
                        {attached.map((r) => (
                            <li key={r.id} className="flex items-center gap-2 rounded-full bg-[#EC2027]/10 px-3 py-1.5 text-sm text-[#b01519]">
                                {nameOf(r.code)}
                                <button
                                    onClick={() => remove(r.id)}
                                    disabled={busy}
                                    aria-label="Retirer"
                                    className="text-[#EC2027] hover:text-[#c91a20] disabled:opacity-60"
                                >
                                    ✕
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
