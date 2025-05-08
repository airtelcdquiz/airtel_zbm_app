// import cookie from 'cookie';
import { NextResponse, NextRequest } from 'next/server';
import query from './lib/query';
import { AuthSession } from './lib/types';

export async function middleware(req: NextRequest) { 
  const session = req.cookies.get("session"); 
  var res: NextResponse  = NextResponse.next();

  if (session === undefined) {
    res =  NextResponse.redirect(new URL('/login', req.url));
  }else{
    try{
      
      // const row: AuthSession[] = JSON.parse(JSON.stringify(rows))
      // const session_row: AuthSession = row[0] ; 

      // const date_now = Date.now()
      // // Vérifier si la session a expiré
      // if (!session_row || date_now > new Date(session_row.expire_at).getTime()) {
      //   // Session invalide ou expirée
      //   res =  NextResponse.redirect(new URL('/login', req.url));
      // } 

    }catch(e){
      res =  NextResponse.redirect(new URL('/login', req.url));
    }
  } 
  return res;
}

export const config = {
  matcher: ['/app/:path*'], // Définir les routes protégées que vous voulez vérifier
};
