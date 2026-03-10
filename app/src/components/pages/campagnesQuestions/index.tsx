"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import cookies from '@/lib/cookies'
import Link from "next/link";
import Tab from "@/components/ui/tab";
import {Pagination, PaginationItem, PaginationCursor} from "@heroui/pagination";
import { Spinner } from "@heroui/spinner";

interface CampaignsQuestionsPageProps {
  state: "enabled" | "disabled" | "archived";
}

export default function CampaignsQuestionsPage(props: CampaignsQuestionsPageProps) {
  
  

  const [questions, setQuestions] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const load = async (_page: number = 1) => {
    setLoading(true);
    try{
      const response = await api(cookies).get(`/quiz/${props.state}?page=${_page}${ search ? `&search=${search}` : ""}`);
      console.log(response.data)
      setQuestions(response.data.questions);
      setTotal(response.data.total);
      setPage(response.data.pages);  
    }catch(e){
      console.error(e);
    }
    setLoading(false);
  }

  useEffect(() => {
    load(currentPage);
  }, [currentPage]);
 

  return (
    <div className="flex flex-col p-6 h-full w-full overflow-y-hidden">
      <div className="flex flex-row justify-between">
        <div className="flex-1">
        <h1 className="text-2xl font-bold mb-4">Questions de Campagne</h1>
        </div> 
        <button
          className="mb-4 text-[13px] font-bold px-4 py-[5px] bg-red-500 text-white rounded"
          onClick={() => router.push("/app/campaigns-questions/new")}>
          Nouvelle Question
        </button>
      </div>
      <div className="w-full flex pt-[10px]">
        <Link href="/app/campaigns-questions/enabled" className={`px-[20px] py-[10px] cursor-pointer text-[13px] border-b-[2px] border-red-0 duration-300 ${ props.state === "enabled" ? "border-red-500 font-bold" : ""}`}><p className={`${props.state === "enabled" ? "text-red-500" : ""} px-[20px] text-bold`}>Activées { props.state === "enabled" ? <span className="text-[10px]">({total})</span> : "" }</p></Link>
        <Link href="/app/campaigns-questions/disabled" className={`px-[20px] py-[10px] cursor-pointer text-[13px] border-b-[2px] border-red-0 duration-300 ${ props.state === "disabled" ? "border-red-500 font-bold" : ""}`}><p className={`${props.state === "disabled" ? "text-red-500" : ""} px-[20px] text-bold`}>Désactivées { props.state === "disabled" ? <span className="text-[10px]">({total})</span> : "" }</p></Link>
        <Link href="/app/campaigns-questions/archived" className={`px-[20px] py-[10px] cursor-pointer text-[13px] border-b-[2px] border-red-0 duration-300 ${ props.state === "archived" ? "border-red-500 font-bold" : ""}`}><p className={`${props.state === "archived" ? "text-red-500" : ""} px-[20px] text-bold`}>Archivées { props.state === "archived" ? <span className="text-[10px]">({total})</span> : "" }</p></Link>
      </div>
      <div className="w-full bg-white flex-1 h-full overflow-y-hidden  text-[13px] p-[20px] rounded-xl shadow-xl mb-[20px]">
        
        <div className="flex w-full mb-4 gap-[10px]">
              
              <svg onClick={() => {
                  // setSearch(searchRef.current.value);
              }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg> 
          <input
              // ref={searchRef}
              className="w-full outline-none border-none flex-1"
              placeholder="Rechercher une question..."
              
          />
                </div>
        <div className="w-full">
          <div className="flex flex-row w-full text-black font-bold">
            <div className=" px-4 py-2 w-[80px]">ID</div>
            <div className=" px-4 py-2 flex-1 ">Question</div>
            <div className=" px-4 py-2 w-[150px]">Opt. 1</div>
            <div className=" px-4 py-2 w-[150px]">Opt. 2</div>
            <div className=" px-4 py-2 w-[150px]">Opt. 3</div>
            <div className=" px-4 py-2 w-[150px]">Opt. 4</div> 
          </div>
        </div>
        <div className="flex flex-1 h-full overflow-y-scroll flex-col divide-y divide-gray-200">
          {loading ? <div className="flex justify-center items-center min-h-[300px] w-full">
            <Spinner />
          </div> : 
          <>
          {questions.map((q) => (
            <Link key={q.id} href={`/app/campaigns-questions/${q.id}`} className="flex flex-row hover:bg-gray-200 duration-300">
              <div className=" px-4 py-2 w-[80px]">{q.id}</div>
              <div className=" px-4 py-2 flex-1 ">{q.question}</div>
              <div className={` px-4 py-2 w-[150px] ${q.response == 1 ? "bg-green-400" : ""}`}>{q.option_1}</div>
              <div className={` px-4 py-2 w-[150px] ${q.response == 2 ? "bg-green-400" : ""}`}>{q.option_2}</div>
              <div className={` px-4 py-2 w-[150px] ${q.response == 3 ? "bg-green-400" : ""}`}>{q.option_3}</div>
              <div className={` px-4 py-2 w-[150px] ${q.response == 4 ? "bg-green-400" : ""}`}>{q.option_4}</div>
            </Link>
          ))}
          </>
          }
          {/* <div className="h-[70px] min-h-[70px] w-full"></div> */}
        </div>
        
      </div>
      <Pagination  initialPage={currentPage} total={page} color='primary' onChange={(page) => setCurrentPage(page)} />
    </div>
  );
} 