
import api from "@/lib/api"
import { Permissions } from "@/lib/types"
import { cookies } from "next/headers"

interface AllowedLayoutProps { 
    roles: string[]
    direct_permissions: string[]
    is_superuser: boolean
    children: React.ReactNode
}
export default async function AllowedLayout(props : AllowedLayoutProps){
    var isAllowed = false 
    const permissions: Permissions = (await api(await cookies()).get("/me/permissions")).data 
    if(props.is_superuser === true && permissions.is_superuser === true) isAllowed = true
    if(props.roles.length > 0 && permissions.roles.find(r => props.roles.includes(r.name))) isAllowed = true
    if(props.direct_permissions.length > 0 && permissions.direct_permissions.find(r => props.direct_permissions.includes(r))) isAllowed = true

    if(isAllowed) return <>{props.children}</>
    
    return <div className="flex flex-col items-center justify-center w-full h-full">
        {/* <img src="/images/airtel-french-logo.svg" alt="logo" className="w-[200px] mb-8" /> */}
        <div className="text-2xl font-bold text-red-500">Accès non autorisé</div>
        <div className="text-gray-500 mt-2">Vous n'avez pas la permission d'accéder à cette page</div>
    </div>
}