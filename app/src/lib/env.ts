
/**
 * Accès centralisé aux variables d'environnement.
 *
 * Les variables `NEXT_PUBLIC_*` doivent être lues **littéralement**
 * (`process.env.NEXT_PUBLIC_X`) pour que Next.js les remplace au build dans le
 * bundle client : un accès dynamique (`process.env[name]`) ne serait pas inliné.
 * C'est pourquoi elles sont exportées ici comme constantes plutôt que lues via
 * `requireEnv`.
 */

export function requireEnv(name: string): string {
    const value = process.env[name];
    if (value === undefined || value === '') {
        throw new Error(`Variable d'environnement manquante : ${name}`);
    }
    return value;
}

export function optionalEnv(name: string, fallback: string): string {
    const value = process.env[name];
    return value === undefined || value === '' ? fallback : value;
}

/** URL de base de l'API backend, avec le préfixe `/api`. */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

export function requireApiBaseUrl(): string {
    if (API_BASE_URL === '') {
        throw new Error("Variable d'environnement manquante : NEXT_PUBLIC_API_BASE_URL");
    }
    return API_BASE_URL;
}
