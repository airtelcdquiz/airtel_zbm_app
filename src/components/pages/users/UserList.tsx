'use client'
import api from '@/lib/api';
import cookies from '@/lib/cookies';
import { User } from '@/lib/types';
import { Pagination } from '@heroui/pagination';
import Link from 'next/link';
import React from 'react';

export default function UserList(){
    const [users, setUsers] = React.useState<User[]>([]);
    const [currentPage, setCurrentPage] = React.useState<number>(1);
    const [total, setTotal] = React.useState<number>(0);
    const [pages, setPages] = React.useState<number>(0);
    const [search, setSearch] = React.useState<string>("");
    const [loading, setLoading] = React.useState<boolean>(false);
    const searchRef = React.useRef<any>(null);

    const load = async (page: number)=>{
        try{
            const response = await api(cookies).get(`/users?page=${page}${search !== "" ?`&search=${search}` : ""}`);
            setUsers(response.data.users);
            setTotal(response.data.total);
            setCurrentPage(response.data.current_page);
            setPages(response.data.pages);
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

    return <div className='w-full pr-[40px]'>
        <div className="flex flex-row w-full items-center mt-[30px] gap-3 text-[13px]">
            <div className="flex flex-row items-center gap-2 cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                </svg>
                <p className="">Accueil</p>
            </div>
            <Link href="/app/users" className="">/ Utilisateurs</Link> 
        </div>
            <div className="w-full items-center justify-between mt-[10px]">
                <p className="text-2xl font-bold">Liste des Inscrits</p> 
                <p className="text-[13px] text-gray-500">{total} Inscrits</p> 

            </div>
            <div className='w-full mt-[20px]  bg-white overflow-x-scroll text-[13px] mb-[20px] p-[20px] rounded-xl shadow-xl'>
         {/* Search Bar */}
         <div>
        <div className='flex-1 relative flex items-center gap-[10px] w-full px-3 py-2 bg-white border-b border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent'>
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
        <div className='w-full divide-y divide-gray-300'>
        {
            users.map((user: User, index: number) => (
            <Link key={index} href={`/app/users/${user.id}`} className='duration-300 hover:bg-accent flex items-center gap-[10px] px-[15px] py-[7px] cursor-pointer text-[13px] text-gray-700'>
                <p className='w-[100px]'>{user.participant_phone}</p> 
                <p className='flex-1'>{user.participant_full_name}</p>
            </Link>
            ))
        }
            </div>
        </div>
        <Pagination  initialPage={currentPage} total={pages} color='primary' onChange={(page) => setCurrentPage(page)} />
    </div>
}