import UserList from "@/components/pages/users/UserList"
import api from "@/lib/api"
import { Permissions } from "@/lib/types"
import { cookies } from "next/headers"

export default async function Page(props: any){
    try{
        const permissions: Permissions = (await api(await cookies()).get("/me/permissions")).data 
        if(!permissions.is_superuser){ return <p>401</p> }
        
    }catch(e){ }

    
    return  <div className="flex flex-row w-full h-full">
        <div className='flex-1'>
            <div className="flex flex-row w-full items-center justify-between mt-[30px]">
                <p className="text-2xl font-bold">Liste des Élèves</p> 
            </div>
            <div className='bg-[rgba(255,255,255,0.4)] w-full mt-[20px] divide-accent divide-y-[1px]'> 
               <UserList />
            </div>
        </div>
    </div>
}