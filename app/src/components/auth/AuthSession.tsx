'use server'

import { cookies } from "next/headers"
import { redirect } from "next/navigation";
import api from "@/lib/api";

/**
 * Protège les pages sous /app.
 *
 * La validation du cookie de session est déléguée à `GET /auth/check-session`
 * de airtel_zbm_api, seule détentrice de la clé de signature et de la table
 * `sessions`. Le dashboard n'a donc plus besoin de connaître `JWT_SECRET` : il
 * n'y a plus de secret à garder synchronisé entre les deux services, ni de
 * vérification locale qui pourrait diverger de la vérité côté API.
 *
 * On ne redirige que sur un refus explicite d'authentification (401/403). Toute
 * autre défaillance — API injoignable, 5xx — remonte en erreur plutôt qu'en
 * redirection : rediriger vers /login dans ce cas provoquerait une boucle, le
 * login renvoyant ensuite vers /app.
 */
export default async function AuthSessionWrapper(props: any){

    const _cookies = await cookies()
    const session = _cookies.get("session");

    if (session === undefined) {
        return redirect('/login');
    }

    let status: number | undefined;
    try {
        status = (await api(_cookies).get('/auth/check-session')).status;
    } catch (e: any) {
        status = e?.response?.status;
        if (status === undefined) {
            // Pas de réponse HTTP du tout (DNS, TCP, timeout).
            throw new Error(
                "Service d'authentification injoignable. Réessayez dans un instant."
            );
        }
    }

    // `redirect()` lève une exception interne à Next : il doit rester hors du
    // `try`, sinon le `catch` l'intercepterait.
    if (status === 401 || status === 403) {
        return redirect('/login');
    }

    if (status !== 200) {
        throw new Error(
            `Service d'authentification en erreur (HTTP ${status}). Réessayez dans un instant.`
        );
    }

    return props.children;
}
