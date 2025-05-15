'use client'
import api from '@/lib/api';
import cookies from '@/lib/cookies';
import { User } from '@/lib/types';
import Link from 'next/link';
import React from 'react';

export default function UserList(){
    const [users, setUsers] = React.useState<User[]>([]);
    const [currentPage, setCurrentPage] = React.useState<number>(1);
    const [total, setTotal] = React.useState<number>(0);
    const [search, setSearch] = React.useState<string>("");
    const [loading, setLoading] = React.useState<boolean>(false);
    const searchRef = React.useRef<any>(null);

    const load = async (page: number)=>{
        try{
            const response = await api(cookies).get(`/users?page=${page}${search !== "" ?`&search=${search}` : ""}`);
            setUsers(response.data.users);
            setTotal(response.data.total);
            setCurrentPage(response.data.current_page);
        }catch(e){
            console.error(e);
        }
    }
    React.useEffect(()=>{
        load(currentPage);
    },[currentPage]);

    React.useEffect(()=>{
        load(1);
    },[search]);

    return <>
         {/* Search Bar */}
         <div className='flex items-center gap-[10px] px-[15px] py-[7px]'>
                    <div className='flex-1 relative flex items-center gap-[10px] w-full px-3 py-2 bg-white rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent'>
                        {
                            search !== "" && <svg onClick={()=>{
                                setSearch("");
                                searchRef.current.value = "";
                            }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                          </svg>
                          
                        }
                        <input 
                            ref={searchRef}
                            // value={search}
                            // onChange={(e)=>setSearch(e.target.value)}
                            type="text"
                            placeholder="Rechercher un élève..."
                            className="w-full bg-transparent outline-none"
                        />
                        <svg 
                            onClick={()=>{
                                setSearch(searchRef.current.value);
                            }}
                            xmlns="http://www.w3.org/2000/svg" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            strokeWidth={1.5} 
                            stroke="currentColor" 
                            className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                        </svg>
                    </div>
                </div>
                { /** Column Header */}
                <div className='flex items-center gap-[10px] px-[15px] py-[7px] cursor-pointer text-[13px] font-bold'>
                    <p className='w-[100px]'>Téléphone</p> 
                    <p className='flex-1'>Nom</p>
                </div>
                {/** User List */}
                {
                    users.map((user: User, index: number) => (
                    <Link key={index} href={`/app/users/${user.id}`} className='duration-300 hover:bg-accent flex items-center gap-[10px] px-[15px] py-[7px] cursor-pointer text-[13px] text-gray-700'>
                        <p className='w-[100px]'>{user.participant_phone}</p> 
                        <p className='flex-1'>{user.participant_full_name}</p>
                    </Link>
                    ))
                }
    </>
}