import api from "@/lib/api";
import { User, Permissions } from "@/lib/types";
import axios from "axios";
import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";



export default  async function DashboardLayout({children}: {children: React.ReactNode}){ 

    
    const user: User|undefined = undefined ;
    var permissions : Permissions = {
        direct_permissions: [],
        is_superuser: false,
        roles: []
    } ;

   
    try{
        permissions = (await api(await cookies()).get("/me/permissions")).data 
    }catch(e){
        console.log(e)
    }
    console.log(permissions)
    
    return <div className="flex flex-row w-screen h-screen bg-gradient-to-tl from-red-400 to-white">
        <div className="flex flex-col w-[250px] min-w-[250px] h-full bg-[rgba(255,255,255,0)]">
            <div className="flex flex-row w-full items-center justify-center mt-[20px]">
                <Image src="/images/airtel-french-logo.svg" alt="logo" width={150} height={150} />
            </div>
            <div className="flex flex-col w-full h-full mt-[20px]">
                {
                   ( permissions.is_superuser || permissions.roles.find(r => r.name === 'admin') || permissions.direct_permissions.find(r => r === 'show_users')) && <Link href="/app/users" className="duration-300 bg-gradient-to-r from-red-200 to-red-0 hover:bg-gradient-to-r hover:from-red-300 hover:to-red-0 flex items-center gap-[10px] w-full cursor-pointer px-[7px] py-[15px]">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                        </svg>
                        <p className="text-sm font-bold">Utilisateurs</p>
                    </Link>
                }
                {
                    (permissions.is_superuser || permissions.roles.find(r => r.name === 'admin') || permissions.direct_permissions.find(r => r === 'show_questions')) && (
                        <Link href="/app/campaigns-questions" className="duration-300 bg-gradient-to-r from-red-200 to-red-0 hover:bg-gradient-to-r hover:from-red-300 hover:to-red-0 flex items-center gap-[10px] w-full cursor-pointer px-[7px] py-[15px]">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
                            </svg>
                            <p className="text-sm font-bold">Questions de Campagne</p>
                        </Link>
                    )
                }
                 {
                    (permissions.is_superuser || permissions.roles.find(r => r.name === 'admin') || permissions.direct_permissions.find(r => r === 'show_classement')) && (
                 <Link href="/app/classements" className="duration-300 bg-gradient-to-r from-red-200 to-red-0 hover:bg-gradient-to-r hover:from-red-300 hover:to-red-0 flex items-center gap-[10px] w-full cursor-pointer px-[7px] py-[15px]">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
                    </svg>
                    <p className="text-sm font-bold">Classements</p>
                </Link>
                    )}
                   {
                    (permissions.is_superuser || permissions.roles.find(r => r.name === 'admin') || permissions.direct_permissions.find(r => r === 'show_documents')) && ( <Link href="/app/documents" className="duration-300 bg-gradient-to-r from-red-200 to-red-0 hover:bg-gradient-to-r hover:from-red-300 hover:to-red-0 flex items-center gap-[10px] w-full cursor-pointer px-[7px] py-[15px]">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                </svg>

                    <p className="text-sm font-bold">Documents</p>
                </Link>)}
            </div>
        </div>
        <div className="flex flex-col flex-1 h-full">
            {children}
        </div>
    </div>
}