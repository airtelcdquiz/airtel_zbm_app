'use server'

// import query from "@/lib/query"
import { cookies } from "next/headers"

export default async function AuthSession(props: any){
    
    const _cookies = await cookies()
    const session = _cookies.get("session")
    // const [rows, fields] = await query(`SELECT * FROM sessions WHERE token = "${session}"`)
    return props.children;
    // return <>
    //     <div className="w-screen h-screen flex items-center justify-center">
            
    //     </div>
    // </>
}