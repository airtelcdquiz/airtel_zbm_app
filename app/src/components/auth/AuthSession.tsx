'use server'

import { cookies } from "next/headers"
import { redirect } from "next/navigation";
import jwt from 'jsonwebtoken';
import { requireEnv } from "@/lib/env";

export default async function AuthSessionWrapper(props: any){

    const JWT_SECRET = requireEnv('JWT_SECRET');
    const _cookies = await cookies()
    const session = _cookies.get("session");

    if (session === undefined) {
        return redirect('/login');
    }

    // La session est portée par le JWT, signé par airtel_zbm_api et revérifié
    // par l'API à chaque appel (la table `sessions` vit dans son Postgres).
    // `redirect()` lève une exception interne à Next : il reste hors du `try`,
    // sinon le `catch` l'intercepterait.
    let decoded: any;
    try {
        decoded = jwt.verify(session.value, JWT_SECRET);
    } catch (e) {
        console.log(e);
        return redirect('/login');
    }

    if (decoded.exp && Date.now() >= decoded.exp * 1000) {
        return redirect('/login');
    }

    return props.children;
}
