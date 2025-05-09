'use server'

// import query from "@/lib/query"
import { cookies } from "next/headers"
import { redirect } from "next/navigation";
import jwt from 'jsonwebtoken';
import query from "@/lib/query";
import { AuthSession } from "@/lib/types";

const JWT_SECRET = 'votre_cle_secrete_jwt'; // À changer en production

export default async function AuthSessionWrapper(props: any){
    
    const _cookies = await cookies()
    const session = _cookies.get("session"); 

   
    try {
        if(session === undefined){
            return redirect('/login')
        }
        // Vérifier le token JWT
        const decoded: any = jwt.verify(session.value, JWT_SECRET);
        
        // Vérifier si le token a expiré
        if (decoded.exp && Date.now() >= decoded.exp * 1000) {
            return redirect('/login');
        }
  
        // Vérifier la session dans la base de données
        const [rows] = await query(`SELECT * FROM sessions WHERE token = "${session.value}"`);
        const sessions: AuthSession[] = JSON.parse(JSON.stringify(rows));
        
        if (sessions.length === 0) {
            return redirect('/login');
        } else {
          const session_row: AuthSession = sessions[0];
          const date_now = Date.now();
          
          // Vérifier si la session a expiré
          if (date_now > new Date(session_row.expire_at).getTime()) {
            return redirect('/login');
          }
        }
      } catch (e) {
        return redirect('/login');
      }
 
    return props.children; 
}