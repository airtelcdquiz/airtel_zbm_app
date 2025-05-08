import Image from "next/image";


export default  async function DashboardLayout({children}: {children: React.ReactNode}){ 
    return <div className="flex flex-row w-screen h-screen bg-gradient-to-tl from-red-400 to-white">
        <div className="flex flex-col w-[250px] min-w-[250px] h-full bg-[rgba(255,255,255,0)]">
            <div className="flex flex-row w-full items-center justify-center mt-[20px]">
                <Image src="/images/airtel-french-logo.svg" alt="logo" width={150} height={150} />
            </div>
            <div className="flex flex-col w-full h-full mt-[20px]">
                <div className="duration-300 bg-gradient-to-r from-red-200 to-red-0 hover:bg-gradient-to-r hover:from-red-300 hover:to-red-0 flex items-center gap-[10px] w-full cursor-pointer px-[7px] py-[15px]">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                    </svg>
                    <p className="text-sm font-bold">Élèves</p>
                </div>
            </div>
        </div>
        <div className="flex flex-col flex-1 h-full">
            {children}
        </div>
    </div>
}