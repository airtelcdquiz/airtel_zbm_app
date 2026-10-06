
import mysql from 'mysql2/promise';
import { optionalEnv, requireEnv } from './env';


/**
 * Exécute une requête SQL.
 *
 * Toute valeur dynamique doit être passée via `params` (placeholders `?`) et
 * jamais concaténée dans `sql_query` : `execute()` prépare la requête, ce qui
 * rend l'injection SQL impossible.
 *
 *     query('SELECT * FROM sessions WHERE token = ?', [token])
 */
export default async function query(sql_query: string, params: unknown[] = []) {
    const connection = await mysql.createConnection({
        host: requireEnv('DB_HOST'),
        port: Number(optionalEnv('DB_PORT', '3306')),
        user: requireEnv('DB_USER'),
        database: requireEnv('DB_NAME'),
        password: requireEnv('DB_PASSWORD')
    });
    try {
        return await connection.execute(sql_query, params);
    } finally {
        // La connexion était auparavant laissée ouverte à chaque appel.
        await connection.end();
    }
}
