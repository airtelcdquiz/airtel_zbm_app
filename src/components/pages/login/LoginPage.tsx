'use client'
import React from 'react';
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useRouter } from 'next/navigation'

export default function LoginPage(props: any) {
    const router = useRouter();
    const [step, setStep] = React.useState(1);
    const [phone, setPhone] = React.useState('');
    const [otp, setOtp] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState('');

    const handlePhoneSubmit = async () => {
        if (!phone) {
            setError('Veuillez entrer votre numéro de téléphone');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch('/api/auth/send-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ phone_number:phone })
            });
            
            if (!res.ok) throw new Error('Erreur lors de l\'envoi du code');
            
            setStep(2);
            setError('');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleOtpSubmit = async () => {
        if (!otp) {
            setError('Veuillez entrer le code OTP');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch('/api/auth/verify-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ phone_number:phone, otp })
            });

            if (!res.ok) throw new Error('Code OTP invalide');

            const data = await res.json();
            if (data.token) {
                document.cookie = `session=${data.token}; path=/`;
                router.push('/app');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return <div className='h-screen w-screen'>
        <div className='h-screen w-screen flex items-center justify-center'>
            {error && <div className='text-red-500 mb-4'>{error}</div>}
            {
                step === 1 && <div className='max-w-[400px] w-[400px]'>
                    <Input 
                        placeholder='Téléphone' 
                        className='w-full'
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        disabled={loading}
                    />
                    <div className='flex justify-end mt-[10px]'>
                        <Button 
                            variant="outline" 
                            onClick={handlePhoneSubmit}
                            disabled={loading}
                        >
                            {loading ? 'Chargement...' : 'Suivant >'} 
                        </Button>
                    </div>
                </div>
            }
            {
                step === 2 && <div className='max-w-[400px] w-[400px]'>
                    <Input 
                        placeholder='Code OTP' 
                        className='w-full'
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        disabled={loading}
                    />
                    <div className='flex justify-between mt-[10px]'>
                        <Button 
                            variant="outline" 
                            onClick={() => setStep(1)}
                            disabled={loading}
                        >
                            &lt; Retour
                        </Button>
                        <Button 
                            variant="outline"
                            onClick={handleOtpSubmit}
                            disabled={loading}
                        >
                            {loading ? 'Vérification...' : 'Vérifier'}
                        </Button>
                    </div>
                </div>
            }
        </div>
    </div>
}