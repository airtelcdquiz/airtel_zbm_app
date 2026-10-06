
import mysql from 'mysql2/promise';
import { optionalEnv, requireEnv } from './env';



export default async function query(sql_query: string) {
    const connection = await mysql.createConnection({
        host: requireEnv('DB_HOST'),
        port: Number(optionalEnv('DB_PORT', '3306')),
        user: requireEnv('DB_USER'),
        database: requireEnv('DB_NAME'),
        password: requireEnv('DB_PASSWORD')
    }); 
    return await connection.execute(sql_query)
}
