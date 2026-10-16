import UserDetailsPage from "@/components/pages/users/UserDetailsPage";
import api from "@/lib/api";
import { Permissions, Role, School, User, Permission } from "@/lib/types";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import React from "react";
import Link from "next/link";

function AccessDenied() {
    return (
        <div className="flex h-full w-full flex-col items-center justify-center py-24 text-center">
            <p className="text-5xl font-extrabold text-[#EC2027]">403</p>
            <h1 className="mt-4 text-lg font-semibold text-gray-800">Accès refusé</h1>
            <p className="mt-2 max-w-sm text-sm text-gray-500">
                Vous n&apos;avez pas les droits nécessaires pour consulter cette page.
            </p>
            <Link href="/app" className="mt-6 inline-flex items-center justify-center rounded-lg bg-[#EC2027] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#c91a20]">
                Retour à l&apos;accueil
            </Link>
        </div>
    );
}

export default async function Page(props: any){
    let user_permissions: Permissions | null = null;

    try{
        user_permissions = (await api(await cookies()).get("/me/permissions")).data
    }catch(e){
        console.log(e);
    }

    if(user_permissions === null || !user_permissions.is_superuser){
        return <AccessDenied />;
    }

    let user: User | null = null;
    let school: School | null = null;

    let roles: string[] = [];
    let permissions: string[] = [];

    const { id } = await props.params;

    // L'utilisateur est indispensable : son absence est une vraie 404.
    try{
        user = (await api(await cookies()).get(`/users/${id}`)).data;
    }catch(e){
        console.log(e);
    }

    if(user === null){
        notFound();
    }

    // L'école est secondaire : si elle n'est pas récupérée, on affiche quand
    // même la fiche. (L'API renvoie `school_code`, pas `code`.)
    try{
        school = (await api(await cookies()).get(`/schools/${user.school_code}`)).data;
    }catch(e){
        console.log(e);
    }

    const safeSchool: School = school ?? { code: String(user.school_code ?? ""), name: "—" };

    try{
        permissions = (await api(await cookies()).get(`/users/${user.phone_number}/permissions`)).data;
        roles = (await api(await cookies()).get(`/users/${user.phone_number}/roles`)).data;
    }catch(e){
        console.log(e);
    }

    let all_permissions: Permission[] = [];
    let all_roles: Role[] = [];

    try{
        all_permissions = (await api(await cookies()).get(`/permissions`)).data;
        all_roles = (await api(await cookies()).get(`/roles`)).data;
    }catch(e){}

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
                <p className="text-2xl font-bold">Détails de l&apos;utilisateur</p> 
            </div>
        </div>
        <UserDetailsPage user={user} user_permissions={user_permissions} school={safeSchool} permissions={permissions} roles={roles} all_permissions={all_permissions} all_roles={all_roles} />
    </div>
}