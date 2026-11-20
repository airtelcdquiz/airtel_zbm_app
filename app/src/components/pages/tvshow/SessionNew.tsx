'use client'
import React from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Button, ButtonLink, Card, CardHeader, PageBody, PageHeader } from '@/components/ui/kit';
import { tv, tvError } from '@/lib/tvshow';
import { EMPTY_FORM, SessionFields, SessionFormState, formToInput, useZbmFilters } from './shared';

export default function SessionNew() {
    const router = useRouter();
    const filters = useZbmFilters();
    const [form, setForm] = React.useState<SessionFormState>(EMPTY_FORM);
    const [saving, setSaving] = React.useState(false);
    const [error, setError] = React.useState('');

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        const r = formToInput(form);
        if ('error' in r) { setError(r.error); return; }
        setSaving(true); setError('');
        try {
            const session = await tv.createSession(r.input);
            router.push(`/app/tvshow/${session.id}`);
        } catch (err) {
            setError(tvError(err, 'La création a échoué. Réessayez.'));
            setSaving(false);
        }
    };

    return (
        <PageBody className="max-w-3xl">
            <PageHeader
                crumbs={[{ label: 'Tableau de bord', href: '/app' }, { label: 'TV Show', href: '/app/tvshow' }, { label: 'Nouvelle session' }]}
                title="Nouvelle session"
                description="La session est créée en brouillon ; un code à 4 chiffres lui est attribué."
            />
            <form onSubmit={submit}>
                <Card>
                    <CardHeader title="Réglages" />
                    <div className="space-y-4 px-5 py-5">
                        <SessionFields form={form} onChange={setForm} filters={filters} disabled={saving} />
                        {error && <Alert>{error}</Alert>}
                    </div>
                    <div className="flex flex-col-reverse gap-2 rounded-b-xl border-t border-ink-100 bg-ink-25 px-5 py-3.5 sm:flex-row sm:justify-end">
                        <ButtonLink href="/app/tvshow" variant="secondary">Annuler</ButtonLink>
                        <Button type="submit" loading={saving}>Créer la session</Button>
                    </div>
                </Card>
            </form>
        </PageBody>
    );
}
