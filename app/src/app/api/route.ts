
import query from '@/lib/query'; 


export async function GET(req: any, res: any) {
   

    const [rows, fields] = await query('select * from users');


    return new Response(JSON.stringify(rows), {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
        },
    });
}