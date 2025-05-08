import { normalizePhone } from '@/lib/functions/normalizers';
import query from '@/lib/query';
import redisenQueue from '@/lib/queue/redisenQueue'
// import smsSend from '@/lib/queue/sendSMS';
// import sendSMPP from '@/lib/queue/smpp';
// import axios from 'axios';

export async function POST(req: Request) {
    const body = await req.json(); //  Utiliser .json() pour lire le corps
    const sql_query = "SELECT * FROM `userLogins` WHERE `participant_phone` = '" + normalizePhone(body.tel) + "'"
    // Exemple de requête MySQL
    const [rows] = await query(sql_query);
    if (JSON.parse(JSON.stringify(rows)).length === 0) {
        return new Response(JSON.stringify([
            "No Active account found for this number",
            sql_query
        ]), {
            status: 401,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }
    const row = JSON.parse(JSON.stringify(rows))[0]

    // await axios.post(`http://sms_api.saas.cd:3000/send-sms`,{
    //     phone: `+${normalizePhone(body.tel)}`,
    //     fullname: "dkdkd",
    //     message: "Take OTP  ->>>"
    // })

    // sendSMPP(
    //     `+${normalizePhone(body.tel)}`,
    //     "Take OTP  ->>>"
    // )
    try {
        // smsSend({
        //     phone: `+${normalizePhone(body.tel)}`,
        //     fullname: "dkdkd",
        //     message: "Take OTP  ->>>"
        // })
        // enqueueSMS()
        await redisenQueue(
            `+${normalizePhone(body.tel)}`,
            "Take OTP  ->>>"
        )
    } catch (e) {
        console.log(e)
    }

    return new Response(JSON.stringify({ received: body, user: row }), {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
        },
    });
}