// import cookie from 'cookie';
import { NextResponse, NextRequest } from 'next/server';
import query from './lib/query';
import { AuthSession } from './lib/types';
import jwt from 'jsonwebtoken';
import { requireEnv } from './lib/env';

export async function middleware(req: NextRequest) { 
  const JWT_SECRET = requireEnv('JWT_SECRET');
  const session = req.cookies.get("session"); 
  let res: NextResponse = NextResponse.next();

  if (session === undefined) {
    res = NextResponse.redirect(new URL('/login', req.url));
  } else {
    try {
      // Vérifier le token JWT
      const decoded: any = jwt.verify(session.value, JWT_SECRET);
      
      // Vérifier si le token a expiré
      if (decoded.exp && Date.now() >= decoded.exp * 1000) {
        res = NextResponse.redirect(new URL('/login', req.url));
      }

      // Vérifier la session dans la base de données
      const [rows] = await query('SELECT * FROM sessions WHERE token = ?', [session.value]);
      const sessions: AuthSession[] = JSON.parse(JSON.stringify(rows));
      
      if (sessions.length === 0) {
        res = NextResponse.redirect(new URL('/login', req.url));
      } else {
        const session_row: AuthSession = sessions[0];
        const date_now = Date.now();
        
        // Vérifier si la session a expiré
        if (date_now > new Date(session_row.expire_at).getTime()) {
          res = NextResponse.redirect(new URL('/login', req.url));
        }
      }
    } catch (e) {
      res = NextResponse.redirect(new URL('/login', req.url));
    }
  } 
  return res;
}

export const config = {
  matcher: ['/app/:path*'], // Définir les routes protégées que vous voulez vérifier
};
