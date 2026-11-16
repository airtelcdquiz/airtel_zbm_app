'use client'
import React from 'react';
import { Download, FileText, FileUp, Trash2, UploadCloud } from 'lucide-react';
import api from '@/lib/api';
import cookies from '@/lib/cookies';
import { cn } from '@/lib/utils';
import {
    Alert, Badge, Button, Card, EmptyState, Modal, PageBody, PageHeader, Pagination, SearchInput, SkeletonRows,
    fmtDate, tableClass, tdClass, thClass, theadClass, trClass,
} from '@/components/ui/kit';

interface DocumentItem {
    id: number;
    name: string;
    description?: string | null;
    file_size: number;
    mime_type?: string | null;
    created_at: string;
    processing_status?: string | null;
    processing_error?: string | null;
    current_page?: number | null;
    total_pages?: number | null;
}

const PER_PAGE = 10;
const MAX_UPLOAD_MB = 50;

const fmtSize = (bytes: number | null | undefined) => {
    if (!bytes && bytes !== 0) return '—';
    if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024)).toLocaleString('fr-FR')} Ko`;
    return `${(bytes / (1024 * 1024)).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} Mo`;
};

const isPdf = (f: File) => f.type === 'application/pdf' || /\.pdf$/i.test(f.name);

const apiError = (e: unknown, fallback: string) =>
    (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? fallback;

function StatusBadge({ doc }: { doc: DocumentItem }) {
    const s = (doc.processing_status ?? 'pending').toLowerCase();
    if (s === 'completed') return <Badge tone="success" dot>Traité</Badge>;
    if (s === 'failed' || s === 'error') {
        return <span title={doc.processing_error ?? undefined}><Badge tone="brand" dot>Échec</Badge></span>;
    }
    const progress = doc.total_pages ? ` · ${doc.current_page ?? 0}/${doc.total_pages} p.` : '';
    return <Badge tone="warning" dot>{s === 'processing' ? 'En traitement' : 'En attente'}{progress}</Badge>;
}

function UploadModal({ open, onClose, onUploaded }: { open: boolean; onClose: () => void; onUploaded: () => void }) {
    const [file, setFile] = React.useState<File | null>(null);
    const [drag, setDrag] = React.useState(false);
    const [progress, setProgress] = React.useState<number | null>(null);
    const [error, setError] = React.useState('');
    const inputRef = React.useRef<HTMLInputElement>(null);

    const reset = () => { setFile(null); setProgress(null); setError(''); setDrag(false); if (inputRef.current) inputRef.current.value = ''; };
    const close = () => { if (progress !== null) return; reset(); onClose(); };

    const pick = (f?: File | null) => {
        setError('');
        if (!f) return;
        if (!isPdf(f)) { setFile(null); setError('Seuls les fichiers PDF sont acceptés.'); return; }
        if (f.size > MAX_UPLOAD_MB * 1024 * 1024) { setFile(null); setError(`Fichier trop volumineux (maximum ${MAX_UPLOAD_MB} Mo).`); return; }
        setFile(f);
    };

    const upload = async () => {
        if (!file) return;
        setError(''); setProgress(0);
        try {
            const fd = new FormData();
            fd.append('file', file);
            await api(cookies).post('/documents', fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (e) => { if (e.total) setProgress(Math.round((e.loaded / e.total) * 100)); },
            });
            reset();
            onUploaded();
            onClose();
        } catch (e) {
            setProgress(null);
            setError(apiError(e, "L'import a échoué. Réessayez."));
        }
    };

    const uploading = progress !== null;

    return (
        <Modal
            open={open}
            onClose={close}
            title="Importer un PDF"
            description="Le document sera analysé automatiquement pour générer des questions."
            footer={<>
                <Button variant="secondary" onClick={close} disabled={uploading}>Annuler</Button>
                <Button onClick={upload} disabled={!file} loading={uploading}><FileUp /> Importer</Button>
            </>}
        >
            <div
                role="button"
                tabIndex={0}
                onClick={() => !uploading && inputRef.current?.click()}
                onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !uploading) { e.preventDefault(); inputRef.current?.click(); } }}
                onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                onDragLeave={() => setDrag(false)}
                onDrop={(e) => { e.preventDefault(); setDrag(false); if (!uploading) pick(e.dataTransfer.files?.[0]); }}
                className={cn(
                    'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-9 text-center transition-colors',
                    drag ? 'border-brand-500 bg-brand-50' : 'border-ink-200 bg-ink-25 hover:border-ink-300 hover:bg-ink-50',
                    uploading && 'pointer-events-none opacity-70',
                )}
            >
                <div className="flex size-10 items-center justify-center rounded-full bg-white text-ink-500 shadow-card ring-1 ring-ink-200">
                    <UploadCloud className="size-5" />
                </div>
                <p className="mt-3 text-sm text-ink-700">
                    <span className="font-semibold text-brand-700">Cliquez pour choisir</span> ou glissez un fichier ici
                </p>
                <p className="mt-1 text-xs text-ink-500">PDF uniquement, {MAX_UPLOAD_MB} Mo maximum</p>
                <input ref={inputRef} type="file" accept="application/pdf,.pdf" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
            </div>

            {file && (
                <div className="mt-4 flex items-center gap-3 rounded-lg border border-ink-200 px-3 py-2.5">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                        <FileText className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink-900">{file.name}</p>
                        <p className="text-xs text-ink-500">{fmtSize(file.size)}{uploading ? ` · ${progress} %` : ''}</p>
                        {uploading && (
                            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
                                <div className="h-full rounded-full bg-brand-600 transition-[width]" style={{ width: `${progress}%` }} />
                            </div>
                        )}
                    </div>
                    {!uploading && (
                        <button onClick={() => { setFile(null); if (inputRef.current) inputRef.current.value = ''; }}
                            className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700" aria-label="Retirer le fichier">
                            <Trash2 className="size-4" />
                        </button>
                    )}
                </div>
            )}
            {error && <Alert className="mt-4">{error}</Alert>}
        </Modal>
    );
}

export default function DocumentsPage() {
    const [documents, setDocuments] = React.useState<DocumentItem[]>([]);
    const [page, setPage] = React.useState(1);
    const [pages, setPages] = React.useState(0);
    const [total, setTotal] = React.useState(0);
    const [search, setSearch] = React.useState('');
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState('');
    const [notice, setNotice] = React.useState('');
    const [uploadOpen, setUploadOpen] = React.useState(false);
    const [toDelete, setToDelete] = React.useState<DocumentItem | null>(null);
    const [deleting, setDeleting] = React.useState(false);
    const [downloading, setDownloading] = React.useState<number | null>(null);
    const [reload, setReload] = React.useState(0);

    React.useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true); setError('');
            try {
                const params: Record<string, string | number> = { page, per_page: PER_PAGE };
                if (search) params.search = search;
                const { data } = await api(cookies).get('/documents', { params });
                if (cancelled) return;
                setDocuments(data.items ?? []);
                setPages(data.pages ?? 0);
                setTotal(data.total ?? 0);
            } catch (e) {
                console.error(e);
                if (!cancelled) { setDocuments([]); setPages(0); setTotal(0); setError('Impossible de charger les documents.'); }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [page, search, reload]);

    const download = async (doc: DocumentItem) => {
        setDownloading(doc.id); setNotice('');
        try {
            const res = await api(cookies).get(`/documents/${doc.id}`, { responseType: 'blob' });
            const url = URL.createObjectURL(res.data);
            const a = document.createElement('a');
            a.href = url;
            a.download = /\.pdf$/i.test(doc.name) ? doc.name : `${doc.name}.pdf`;
            document.body.appendChild(a); a.click(); a.remove();
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error(e);
            setNotice('Le téléchargement a échoué : fichier introuvable sur le serveur ?');
        } finally {
            setDownloading(null);
        }
    };

    const remove = async () => {
        if (!toDelete) return;
        setDeleting(true); setNotice('');
        try {
            await api(cookies).delete(`/documents/${toDelete.id}`);
            setToDelete(null);
            if (documents.length === 1 && page > 1) setPage(page - 1); else setReload(r => r + 1);
        } catch (e) {
            setToDelete(null);
            setNotice(apiError(e, 'La suppression a échoué.'));
        } finally {
            setDeleting(false);
        }
    };

    return (
        <PageBody>
            <PageHeader
                title="Documents"
                description="Sources PDF utilisées pour générer les questions du quiz."
                crumbs={[{ label: 'Tableau de bord', href: '/app' }, { label: 'Documents' }]}
                actions={<Button onClick={() => setUploadOpen(true)}><FileUp /> Importer un PDF</Button>}
            />

            {notice && <Alert className="mb-4">{notice}</Alert>}

            <Card>
                <div className="flex flex-col gap-3 border-b border-ink-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <p className="text-sm text-ink-500">
                        {loading ? 'Chargement…' : <><span className="font-medium text-ink-800 tabular">{total.toLocaleString('fr-FR')}</span> document{total > 1 ? 's' : ''}{search ? ' trouvé' + (total > 1 ? 's' : '') : ''}</>}
                    </p>
                    <SearchInput value={search} onSearch={(v) => { setPage(1); setSearch(v); }} placeholder="Rechercher un document…" className="w-full sm:w-72" />
                </div>

                {error ? (
                    <EmptyState icon={<FileText />} title="Erreur de chargement" description={error} />
                ) : !loading && documents.length === 0 ? (
                    <EmptyState
                        icon={<FileText />}
                        title={search ? 'Aucun résultat' : 'Aucun document'}
                        description={search ? `Aucun document ne correspond à « ${search} ».` : 'Importez un premier PDF pour alimenter la génération de questions.'}
                        action={!search ? <Button variant="secondary" size="sm" onClick={() => setUploadOpen(true)}><FileUp /> Importer un PDF</Button> : undefined}
                    />
                ) : (
                    <div className="overflow-x-auto scroll-thin">
                        <table className={cn(tableClass, 'min-w-[680px]')}>
                            <thead className={theadClass}>
                                <tr>
                                    <th className={thClass}>Document</th>
                                    <th className={thClass}>Taille</th>
                                    <th className={thClass}>Statut</th>
                                    <th className={thClass}>Importé le</th>
                                    <th className={cn(thClass, 'text-right')}><span className="sr-only">Actions</span></th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? <SkeletonRows rows={6} cols={5} /> : documents.map(doc => (
                                    <tr key={doc.id} className={trClass}>
                                        <td className={tdClass}>
                                            <div className="flex min-w-0 items-center gap-3">
                                                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                                                    <FileText className="size-4" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="max-w-[320px] truncate font-medium text-ink-900" title={doc.name}>{doc.name}</p>
                                                    {doc.description && <p className="max-w-[320px] truncate text-xs text-ink-500">{doc.description}</p>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className={cn(tdClass, 'whitespace-nowrap text-ink-600 tabular')}>{fmtSize(doc.file_size)}</td>
                                        <td className={tdClass}><StatusBadge doc={doc} /></td>
                                        <td className={cn(tdClass, 'whitespace-nowrap text-ink-600')}>{fmtDate(doc.created_at)}</td>
                                        <td className={cn(tdClass, 'text-right')}>
                                            <div className="inline-flex items-center gap-1">
                                                <button onClick={() => download(doc)} disabled={downloading === doc.id} title="Télécharger" aria-label={`Télécharger ${doc.name}`}
                                                    className="rounded-lg p-2 text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-900 disabled:opacity-50">
                                                    <Download className="size-4" />
                                                </button>
                                                <button onClick={() => setToDelete(doc)} title="Supprimer" aria-label={`Supprimer ${doc.name}`}
                                                    className="rounded-lg p-2 text-ink-500 transition-colors hover:bg-brand-50 hover:text-brand-700">
                                                    <Trash2 className="size-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {!loading && !error && total > 0 && (
                    <Pagination page={page} pages={pages} total={total} perPage={PER_PAGE} onChange={setPage} />
                )}
            </Card>

            <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} onUploaded={() => { setPage(1); setReload(r => r + 1); }} />

            <Modal
                open={!!toDelete}
                onClose={() => !deleting && setToDelete(null)}
                title="Supprimer ce document ?"
                description={toDelete ? `« ${toDelete.name} » et son fichier seront définitivement supprimés.` : undefined}
                size="sm"
                footer={<>
                    <Button variant="secondary" onClick={() => setToDelete(null)} disabled={deleting}>Annuler</Button>
                    <Button onClick={remove} loading={deleting}><Trash2 /> Supprimer</Button>
                </>}
            />
        </PageBody>
    );
}
