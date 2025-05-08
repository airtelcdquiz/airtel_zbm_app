
import mysql from 'mysql2/promise';



export default async function query(sql_query: string) {
    const connection = await mysql.createConnection({
        host: '41.243.25.144',
        user: 'trivia_user',
        database: 'airtel_trivia',
        password: "Adm!n2024$"
    }); 
    return await connection.execute(sql_query)
}