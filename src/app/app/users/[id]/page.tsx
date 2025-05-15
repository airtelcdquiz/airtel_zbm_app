import UserDetailsPage from "@/components/pages/users/UserDetailsPage";
import api from "@/lib/api"; 
import { Permissions, Role, School, User, Permission } from "@/lib/types";
import { cookies } from "next/headers";
import React from "react";

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
        school = (await api(await cookies()).get(`/schools/${user?.school_id}`)).data;

    }catch(e){
        console.log(e);
    }

    if(user === null || school === null){
        return <p>404</p>
    }

    try{
        permissions = (await api(await cookies()).get(`/users/${user.id}/permissions`)).data;
        roles = (await api(await cookies()).get(`/users/${user.id}/roles`)).data;

        console.log(permissions);
        console.log(roles);
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
        <div className="flex-1">
            <div className="flex flex-row w-full items-center justify-between mt-[30px]">
                <p className="text-2xl font-bold">Détails de l'utilisateur</p> 
            </div>
        </div>
        <UserDetailsPage user={user} user_permissions={user_permissions} school={school} permissions={permissions} roles={roles} all_permissions={all_permissions} all_roles={all_roles} />
    </div>
}