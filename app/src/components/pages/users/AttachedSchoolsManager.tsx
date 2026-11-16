'use client'
import React from 'react';
import { Plus, School as SchoolIcon, X } from 'lucide-react';
import api from '@/lib/api';
import cookies from '@/lib/cookies';
import { Alert, Button, Card, CardHeader, Select, Skeleton } from '@/components/ui/kit';

interface AttachedRow { id: number; code: string; phone_number: string }
interface SchoolRow { code: string; name: string }

/** Écoles dont un administrateur d'école voit les joueurs (réservé à l'admin global). */
export default function AttachedSchoolsManager({ phoneNumber }: { phoneNumber: string }) {
    const [attached, setAttached] = React.useState<AttachedRow[]>([]);
    const [schools, setSchools] = React.useState<SchoolRow[]>([]);
    const [selected, setSelected] = React.useState('');
    const [loading, setLoading] = React.useState(true);
    const [busy, setBusy] = React.useState<string | number | null>(null);
    const [error, setError] = React.useState('');

    const nameOf = (code: string) => schools.find(s => String(s.code) === String(code))?.name ?? code;

    const load = React.useCallback(async () => {
        try {
            const [sc, at] = await Promise.all([
                api(cookies).get('/schools', { params: { per_page: 200 } }),
                api(cookies).get('/attached-schools'),
            ]);
            const all: SchoolRow[] = Array.isArray(sc.data) ? sc.data : (sc.data?.schools ?? sc.data?.data ?? []);
            const rows: AttachedRow[] = (at.data?.data ?? at.data ?? []).filter((r: AttachedRow) => String(r.phone_number) === String(phoneNumber));
            setSchools(all);
            setAttached(rows);
        } catch {
            setError('Impossible de charger les écoles.');
        } finally {
            setLoading(false);
        }
    }, [phoneNumber]);

    React.useEffect(() => { load(); }, [load]);

    const add = async () => {
        if (!selected) return;
        setBusy('add'); setError('');
        try {
            await api(cookies).post('/attached-schools', { phone_number: phoneNumber, code: selected });
            setSelected('');
            await load();
        } catch {
            setError("L'ajout de l'école a échoué.");
        } finally {
            setBusy(null);
        }
    };

    const remove = async (id: number) => {
        setBusy(id); setError('');
        try {
            await api(cookies).delete(`/attached-schools/${id}`);
            await load();
        } catch {
            setError("Le retrait de l'école a échoué.");
        } finally {
            setBusy(null);
        }
    };

    const available = schools.filter(s => !attached.some(r => String(r.code) === String(s.code)));

    return (
        <Card>
            <CardHeader title="Écoles gérées"
                description="Un administrateur d'école ne voit que les joueurs de ces écoles. Sans effet pour un administrateur global." />
            <div className="space-y-4 px-5 py-4">
                {error && <Alert>{error}</Alert>}

                {loading ? (
                    <div className="flex gap-2"><Skeleton className="h-8 w-36 rounded-full" /><Skeleton className="h-8 w-28 rounded-full" /></div>
                ) : attached.length === 0 ? (
                    <p className="text-sm text-ink-500">Aucune école rattachée.</p>
                ) : (
                    <ul className="flex flex-wrap gap-2">
                        {attached.map(r => (
                            <li key={r.id} className="inline-flex items-center gap-2 rounded-full border border-ink-200 bg-ink-25 py-1 pl-3 pr-1 text-[13px] font-medium text-ink-800">
                                <SchoolIcon className="size-3.5 text-ink-400" aria-hidden />
                                {nameOf(r.code)}
                                <span className="text-xs font-normal text-ink-500">{r.code}</span>
                                <button onClick={() => remove(r.id)} disabled={busy !== null} aria-label={`Retirer ${nameOf(r.code)}`}
                                    className="rounded-full p-1 text-ink-400 transition-colors hover:bg-brand-50 hover:text-brand-700 disabled:opacity-50">
                                    <X className="size-3.5" />
                                </button>
                            </li>
                        ))}
                    </ul>
                )}

                <div className="flex flex-col gap-2 sm:flex-row">
                    <Select value={selected} onChange={e => setSelected(e.target.value)} disabled={loading || busy !== null || available.length === 0}
                        aria-label="Ajouter une école" className="flex-1">
                        <option value="">{available.length === 0 && !loading ? 'Toutes les écoles sont rattachées' : 'Choisir une école…'}</option>
                        {available.map(s => <option key={s.code} value={s.code}>{s.name} ({s.code})</option>)}
                    </Select>
                    <Button variant="secondary" onClick={add} disabled={!selected} loading={busy === 'add'}>
                        {busy !== 'add' && <Plus />} Ajouter
                    </Button>
                </div>
            </div>
        </Card>
    );
}
