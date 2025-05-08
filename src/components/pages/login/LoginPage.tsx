'use client'
import React from 'react';
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"


export default function LoginPage(props: any) {

    const [step, setStep] = React.useState(1);

    return <div className='h-screen w-screen'>
        <div className='h-screen w-screen flex items-center justify-center'>
            {
                step === 1 && <div className='max-w-[400px] w-[400px]'>
                    <Input placeholder='Téléphone' className='w-full' />
                    <div className='flex justify-end mt-[10px]'>
                        <Button variant="outline">Suivant &gt; </Button>
                    </div>
                </div>
            }
            
        </div>
    </div>
}