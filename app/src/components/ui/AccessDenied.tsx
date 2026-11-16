import Link from "next/link";
import { Lock } from "lucide-react";

export default function AccessDenied({ message }: { message?: string }) {
    return (
        <div className="flex min-h-[70vh] w-full flex-col items-center justify-center px-6 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-brand-50 text-brand-600 ring-8 ring-brand-50/50">
                <Lock className="size-5" />
            </div>
            <h1 className="mt-5 text-lg font-semibold text-ink-900">Accès non autorisé</h1>
            <p className="mt-1.5 max-w-sm text-sm text-ink-500">
                {message ?? "Votre compte n'a pas les droits nécessaires pour consulter cette page. Contactez l'administrateur global si besoin."}
            </p>
            <Link href="/app" className="mt-6 inline-flex h-9 items-center rounded-lg bg-brand-600 px-4 text-sm font-medium text-white shadow-sm hover:bg-brand-700">
                Retour au tableau de bord
            </Link>
        </div>
    );
}
