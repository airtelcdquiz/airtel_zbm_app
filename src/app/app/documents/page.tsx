'use client'

import api from "@/lib/api";
import cookies from "@/lib/cookies";
import { Document } from "@/types/permissions";
import React from 'react'
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter
  } from "@heroui/modal";
import { Button } from "@heroui/react";


export default function Page(props: any){

    
    const [currentPage, setCurrentPage] = React.useState(1);
    const [perPage, setPerPage] = React.useState(10);
    const [search, setSearch] = React.useState("");
    const [sortBy, setSortBy] = React.useState("created_at");
    const [sortOrder, setSortOrder] = React.useState("desc");

    const [documents, setDocuments] = React.useState([]);
    const [totalPages, setTotalPages] = React.useState(0);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);
    const [total, setTotal] = React.useState(0);
    const searchRef = React.useRef<any>(null);
    const [isOpen, setIsOpen] = React.useState(false);
    const [file, setFile] = React.useState<File | null>(null);
    const [uploading, setUploading] = React.useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
 
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            await api(cookies).post('/documents', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            setIsOpen(false);
            setFile(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            load(currentPage);
        } catch (e) {
            console.error(e);
        }
        setUploading(false);
    };

    const load = async (_page: number = 1)=>{
        setLoading(true);
        try {
            const res =( await api(cookies).get(`/documents?page=${_page}`)).data;
            setDocuments(res.items);
            setTotalPages(res.pages);
            setTotal(res.total);
        }catch(e){
            console.error(e)
        }
        setLoading(false);         
    }

    React.useEffect(()=>{
        load(currentPage);
    },[currentPage]);
    
    
    return <div className="flex flex-row w-full h-full pr-[20px]">
    <div className='flex-1'>
        <div className="flex flex-row w-full items-center justify-between mt-[30px] mb-[20px]">
            <div className="flex-1">
            <p className="text-2xl font-bold">Liste des sources</p> 
            <p className='text-sm text-gray-500 m-0'>{total} documents</p>
            </div>
            <div>
            <div onClick={() => setIsOpen(true)} className="px-[20px] py-[7px] flex flex-row bg-red-500 rounded text-white items-center gap-2 cursor-pointer hover:bg-red-600">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 7.5h-.75A2.25 2.25 0 0 0 4.5 9.75v7.5a2.25 2.25 0 0 0 2.25 2.25h7.5a2.25 2.25 0 0 0 2.25-2.25v-7.5a2.25 2.25 0 0 0-2.25-2.25h-.75m0-3-3-3m0 0-3 3m3-3v11.25m6-2.25h.75a2.25 2.25 0 0 1 2.25 2.25v7.5a2.25 2.25 0 0 1-2.25 2.25h-7.5a2.25 2.25 0 0 1-2.25-2.25v-.75" />
</svg>

                        <p className='text-[13px] font-bold'>Uploader</p>
                    </div>
            </div>
        </div>
        <div className='w-full bg-white overflow-x-scroll text-[13px] mb-[20px] p-[20px] rounded-xl shadow-xl '> 
        {
        isOpen === true && 
    
    <div >
        <div>
            <div className="flex flex-col gap-1">Ajouter un document</div>
            <div>
                <div className="flex flex-col gap-4">
                    <input
                        ref={fileInputRef}
                        type="file"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-md file:border-0
                        file:text-sm file:font-semibold
                        file:bg-red-50 file:text-red-700
                        hover:file:bg-red-100"
                    />
                    {file && (
                        <div className="text-sm text-gray-500">
                            Fichier sélectionné: {file.name}
                        </div>
                    )}
                </div>
            </div>
            <div className="flex flex-row gap-[10px] mt-[20px]">
                <Button color="danger" variant="light" onPress={()=>setIsOpen(false)}>Annuler</Button>
                <Button 
                    color="primary" 
                    onPress={handleUpload}
                    isLoading={uploading}
                    isDisabled={!file || uploading}>
                    Uploader
                </Button>
            </div>
        </div>
    </div>

    }
    {
        isOpen  === false && <> 
             <div className="flex w-full mb-4 gap-[10px]">
                
                <svg onClick={() => {
                    setSearch(searchRef.current.value);
                }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg> 
            <input
                ref={searchRef}
                className="w-full outline-none border-none flex-1"
                placeholder="Rechercher un document..."
                
            />
        </div>
        <div className="w-full divide-y divide-gray-200">
            <div className="flex flex-row w-full items-center justify-between mt-[30px] font-bold pb-[10px]">
                <p className="text-[13px] flex-1">Titre du document</p>
                <p className="text-[13px] w-[150px]">Taille</p>
                <p className="text-[13px] w-[150px]">Date de création</p>
            </div>
           {
            documents.map((doc: Document)=>(
                <div key={doc.id} className="flex flex-row w-full items-center justify-between mt-[30px]">
                    <p className="text-[13px] flex-1">{doc.name}</p> 
                    <p className="text-[13px] w-[150px]">{(doc.file_size / (1024 * 1024)).toFixed(2)} MB</p>
                    <p className="text-[13px] w-[150px]">{new Date(doc.created_at).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}</p>
                </div>
            ))
           }
           </div>
        </>
    }
           
        </div>
    </div>
    
</div>
}