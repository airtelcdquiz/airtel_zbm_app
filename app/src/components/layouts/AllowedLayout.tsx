import api from "@/lib/api"
import { Permissions } from "@/lib/types"
import { cookies } from "next/headers"
import AccessDenied from "@/components/ui/AccessDenied"

interface AllowedLayoutProps {
    roles: string[]
    direct_permissions: string[]
    is_superuser: boolean
    children: React.ReactNode
}

export default async function AllowedLayout(props: AllowedLayoutProps) {
    let isAllowed = false
    const permissions: Permissions = (await api(await cookies()).get("/me/permissions")).data
    if (props.is_superuser === true && permissions.is_superuser === true) isAllowed = true
    if (props.roles.length > 0 && permissions.roles.find(r => props.roles.includes(r.name))) isAllowed = true
    if (props.direct_permissions.length > 0 && permissions.direct_permissions.find(r => props.direct_permissions.includes(r))) isAllowed = true

    if (isAllowed) return <>{props.children}</>
    return <AccessDenied />
}
