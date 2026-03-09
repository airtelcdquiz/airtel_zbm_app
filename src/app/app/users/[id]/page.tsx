import UserDetailsPage from "@/components/pages/users/UserDetailsPage";
import api from "@/lib/api"; 
import { Permissions, Role, School, User, Permission } from "@/lib/types";
import { cookies } from "next/headers";
import React from "react";
import { HomeIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
export default async function Page(props: any){
    var user_permissions: Permissions | null = null;

    try{
        user_permissions = (await api(await cookies()).get("/me/permissions")).data 
        if(user_permissions === null || !user_permissions.is_superuser){ return <p>401</p> }
    }catch(e){}

    var user: User | null = null;
    var school: School | null = null; 

    var roles: string[] = [];
    var permissions: string[] = [];

    try{
        const { id } = await props.params;
        user = (await api(await cookies()).get(`/users/${id}`)).data;
        school = (await api(await cookies()).get(`/schools/${user?.code}`)).data;

    }catch(e){
        console.log(e);
    }

    if(user === null || school === null){
        return <p>404</p>
    }

    try{
        permissions = (await api(await cookies()).get(`/users/${user.phone_number}/permissions`)).data;
        roles = (await api(await cookies()).get(`/users/${user.phone_number}/roles`)).data;

        // console.log(permissions);
        // console.log(roles);
    }catch(e){
        console.log(e);
    }

    var all_permissions: Permission[] = [];
    var all_roles: Role[] = [];

    try{
        all_permissions = (await api(await cookies()).get(`/permissions`)).data;
        all_roles = (await api(await cookies()).get(`/roles`)).data;
    }catch(e){}

    if(user_permissions === null){
        return <p>401</p>
    }

    return <div className="w-full h-full pr-[30px]">
        <div className="flex flex-row w-full items-center mt-[30px] gap-3">
            <div className="flex flex-row items-center gap-2 cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                </svg>
                <p className="text-sm">Accueil</p>
            </div>
            <Link href="/app/users" className="text-sm">/ Utilisateurs</Link>
            <p className="text-sm">/ {user.name}</p>
        </div>
        <div className="flex-1">
            <div className="flex flex-row w-full items-center justify-between mt-[10px]">
                <p className="text-2xl font-bold">Détails de l'utilisateur</p> 
            </div>
        </div>
        <UserDetailsPage user={user} user_permissions={user_permissions} school={school} permissions={permissions} roles={roles} all_permissions={all_permissions} all_roles={all_roles} />
    </div>
}