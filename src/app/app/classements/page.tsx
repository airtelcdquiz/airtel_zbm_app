'use client'
import api from '@/lib/api';
import cookies from '@/lib/cookies';
import { Classement } from '@/types/permissions';
import React from 'react'
import {Pagination, PaginationItem, PaginationCursor} from "@heroui/pagination";
import {Spinner} from "@heroui/spinner";
import {Popover, PopoverTrigger, PopoverContent, Button, Input} from "@heroui/react"

export default function ClassementsPage(){

    const [classements, setClassements] = React.useState<Classement[]>([]);
    const [loading, setLoading] = React.useState<boolean>(true);
    const [pages, setPages] = React.useState<number>(1);
    const [currentPage, setCurrentPage] = React.useState<number>(1); 
    const [total, setTotal] = React.useState<number>(0);
    const [search, setSearch] = React.useState<string>('');
    const [startDate, setStartDate] = React.useState<string>('');
    const [endDate, setEndDate] = React.useState<string>('');
    const searchRef = React.useRef<any>(null);

    const load = async (_page: number = 1) => {
        setLoading(true);
        const params: any = {
            page: _page
        };
        
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;
        if (search) params.search = search;

        const response = (await api(cookies).get('/statistics/user-points', {params})).data;
        setClassements(response.results);
        setPages(response.pages);
        setTotal(response.total);
        setLoading(false);
    }

    React.useEffect(() => {
        setCurrentPage(1);
        load(1);
    }, [search]);

    React.useEffect(() => {
        load(currentPage);
    }, [currentPage]);

    const handleFilter = () => {
        setCurrentPage(1);
        load(1);
    }



    return (
        <div className="p-6 h-full w-full">
            <div className="flex flex-row justify-between">
                <div className="flex-1 mb-4">
                    <h1 className="text-2xl font-bold m-0">Classements</h1>
                    <p className='text-sm text-gray-500 m-0'>{total} participants en fonction de leurs points</p>
                </div> 
                <div>
                   
                    <Popover placement="right">
                        <PopoverTrigger>
                        <div className="px-[20px] py-[7px] flex flex-row bg-red-500 rounded text-white  items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" />
                        </svg>
                        <p className='text-[13px] font-bold'>Filtrer</p>
                    </div>
                        </PopoverTrigger>
                        <PopoverContent>
                            <div className='bg-white p-[20px] shadow-2xl rounded-xl'>
                                <div className="px-1 py-2">
                                <div className="text-small font-bold">Filtrer les resultats</div>
                                <div className="text-tiny">Date de début</div>
                                <Input 
                                    type="date" 
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                                <div className="text-tiny">Date de fin</div>
                                <Input 
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                                <Button className='mt-[10px]' onClick={handleFilter}>Filtrer</Button>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
            </div>
            <div className="w-full bg-white overflow-x-scroll text-[13px] mb-[20px] p-[20px] rounded-xl shadow-xl">
                <div className="flex w-full mb-4 gap-[10px]">
              
                        <svg onClick={() => {
                            setSearch(searchRef.current.value);
                        }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                        </svg> 
                    <input
                        ref={searchRef}
                        className="w-full outline-none border-none flex-1"
                        placeholder="Rechercher par nom, téléphone ou école..."
                       
                    />
                </div>
                <div className="w-full">
                    <div className="flex flex-row w-full font-bold">
                        <div className=" px-4 py-2 w-[150px]">Téléphone</div>
                        <div className=" px-4 py-2 flex-1 ">Nom</div>
                        <div className=" px-4 py-2 w-[150px]">Points</div>
                        <div className=" px-4 py-2 flex-1">Ecole</div> 
                    </div>
                </div>
                <div className="w-full divide-y divide-gray-200">
                    {loading ? <div className="flex justify-center items-center w-full min-h-[300px] h-full"><Spinner color="primary" /></div> :
                   <>
                     {classements.map((classement) => (
                        <div key={classement.participant_phone} className="duration-300 hover:bg-gray-100 flex flex-row w-full">
                            <div className=" px-4 py-2 w-[150px]">{classement.participant_phone}</div>
                            <div className=" px-4 py-2 flex-1 ">{classement.participant_full_name}</div>
                            <div className=" px-4 py-2 w-[150px]">{classement.points}</div>
                            <div className=" px-4 py-2 flex-1">{classement.schoolname}</div>
                        </div>
                    ))}
                   </> }
                </div>
            </div>
            <Pagination  initialPage={currentPage} total={pages} color='primary' onChange={(page) => setCurrentPage(page)} />
        </div>
    )
}