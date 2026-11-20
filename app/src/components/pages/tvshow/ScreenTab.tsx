'use client'
import React from 'react';
import { Check, Copy, ExternalLink, KeyRound, TriangleAlert } from 'lucide-react';
import { Alert, Button, Card, CardHeader, inputClass } from '@/components/ui/kit';
import { cn } from '@/lib/utils';
import { TvSession, tv, tvError } from '@/lib/tvshow';

async function copyText(text: string) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        const ta = document.createElement('textarea');
        ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        const ok = document.execCommand('copy');
        ta.remove();
        return ok;
    }
}

function UrlRow({ label, hint, url }: { label: string; hint: string; url: string }) {
    const [copied, setCopied] = React.useState(false);
    const copy = async () => {
        if (await copyText(url)) { setCopied(true); setTimeout(() => setCopied(false), 1800); }
    };
    return (
        <div>
            <p className="text-[13px] font-medium text-ink-800">{label}</p>
            <p className="mb-1.5 text-xs text-ink-500">{hint}</p>
            <div className="flex gap-2">
                <input readOnly value={url} onFocus={e => e.target.select()} className={cn(inputClass, 'font-mono text-xs')} aria-label={label} />
                <Button variant="secondary" onClick={copy} aria-label={`Copier : ${label}`}>{copied ? <Check /> : <Copy />} {copied ? 'Copié' : 'Copier'}</Button>
                <a href={url} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center rounded-lg px-2.5 text-ink-500 hover:bg-ink-100 hover:text-ink-900" aria-label="Ouvrir dans un nouvel onglet" title="Ouvrir">
                    <ExternalLink className="size-4" />
                </a>
            </div>
        </div>
    );
}

export default function ScreenTab({ session }: { session: TvSession }) {
    const [url, setUrl] = React.useState('');
    const [busy, setBusy] = React.useState(false);
    const [error, setError] = React.useState('');

    const generate = async () => {
        setBusy(true); setError('');
        try { setUrl((await tv.displayToken(session.id)).url); }
        catch (e) { setError(tvError(e, 'La génération du lien a échoué.')); }
        finally { setBusy(false); }
    };

    const chroma = url ? `${url}${url.includes('?') ? '&' : '?'}mode=chroma` : '';
    const ended = session.status === 'finished' || session.status === 'cancelled';

    return (
        <Card className="max-w-3xl">
            <CardHeader title="Écran télé" description="Page plein écran affichée en régie : questions, chrono, classement et podium." />
            <div className="space-y-4 px-5 py-5">
                <Alert tone="info" className="flex items-start gap-2">
                    <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                    <span>Générer un nouveau lien invalide le précédent : un écran déjà ouvert avec l&apos;ancien lien cesse de fonctionner. Le lien ne fonctionne plus après la fin de la session.</span>
                </Alert>
                {ended && <Alert>Cette session est terminée ou annulée : un lien d&apos;écran ne servirait plus.</Alert>}
                <Button onClick={generate} loading={busy} disabled={ended}><KeyRound /> {url ? 'Générer un nouveau lien' : "Générer le lien de l'écran"}</Button>
                {error && <Alert>{error}</Alert>}
                {url && (
                    <div className="space-y-4 border-t border-ink-100 pt-4">
                        <UrlRow label="Écran normal" hint="Affichage complet, avec fond." url={url} />
                        <UrlRow label="Incrustation (fond vert)" hint="Fond vert uni pour l'incrustation en régie (chroma key)." url={chroma} />
                    </div>
                )}
            </div>
        </Card>
    );
}
