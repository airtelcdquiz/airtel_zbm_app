'use client'
import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation'
import { API_BASE_URL } from '@/lib/env'

export default function LoginPage(props: any) {
    const router = useRouter();
    const [step, setStep] = React.useState(1);
    const [phone, setPhone] = React.useState('');
    const [otp, setOtp] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState('');

    const normalizePhoneNumber = (phone: string): string => {
        // Remove all non-digit characters
        const digits = phone.replace(/\D/g, '');

        // If number starts with 243, return as is
        if (digits.startsWith('243')) {
            return digits;
        }

        // If number starts with 0, remove it
        if (digits.startsWith('0')) {
            return '243' + digits.substring(1);
        }

        // If number starts with 9, add 243
        if (digits.startsWith('9')) {
            return '243' + digits;
        }

        // For any other case, add 243
        return '243' + digits;
    };

    const handlePhoneSubmit = async () => {
        if (!phone) {
            setError('Veuillez entrer votre numéro de téléphone');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const normalizedPhone = normalizePhoneNumber(phone);
            const res = await fetch(`${API_BASE_URL}/auth/send-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ phone_number: normalizedPhone })
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
        setError('');
        try {
            const normalizedPhone = normalizePhoneNumber(phone);
            const res = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ phone_number:normalizedPhone, otp })
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

    const onKeyDown = (e: React.KeyboardEvent, action: () => void) => {
        if (e.key === 'Enter' && !loading) action();
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#fff5f5] via-white to-[#ffe9ea] px-4 py-10">
            <div className="w-full max-w-[420px]">
                {/* Logo */}
                <div className="flex justify-center">
                    <Image
                        src="/images/airtel-french-logo.svg"
                        alt="Airtel"
                        width={160}
                        height={71}
                        className="h-auto w-[140px]"
                        priority
                    />
                </div>

                {/* Carte */}
                <div className="mt-8 rounded-2xl bg-white p-8 shadow-xl shadow-black/5 ring-1 ring-black/5">
                    <h1 className="text-center text-xl font-semibold text-gray-900">
                        Back-office Quiz
                    </h1>
                    <p className="mt-1 text-center text-sm text-gray-500">
                        {step === 1
                            ? 'Connectez-vous avec votre numéro de téléphone'
                            : `Entrez le code reçu par SMS`}
                    </p>

                    {/* Indicateur d'étape */}
                    <div className="mt-6 flex items-center justify-center gap-2">
                        <span className={`h-1.5 w-8 rounded-full transition-colors ${step >= 1 ? 'bg-[#EC2027]' : 'bg-gray-200'}`} />
                        <span className={`h-1.5 w-8 rounded-full transition-colors ${step >= 2 ? 'bg-[#EC2027]' : 'bg-gray-200'}`} />
                    </div>

                    {/* Erreur */}
                    {error && (
                        <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                            {error}
                        </div>
                    )}

                    {/* Étape 1 : téléphone */}
                    {step === 1 && (
                        <div className="mt-5">
                            <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                Numéro de téléphone
                            </label>
                            <input
                                type="tel"
                                inputMode="tel"
                                autoFocus
                                placeholder="09 70 90 84 79"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                onKeyDown={(e) => onKeyDown(e, handlePhoneSubmit)}
                                disabled={loading}
                                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-[#EC2027] focus:ring-2 focus:ring-[#EC2027]/20 disabled:opacity-60"
                            />
                            <button
                                onClick={handlePhoneSubmit}
                                disabled={loading}
                                className="mt-5 flex w-full items-center justify-center rounded-lg bg-[#EC2027] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#c91a20] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EC2027]/40 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {loading ? 'Envoi en cours…' : 'Recevoir le code'}
                            </button>
                        </div>
                    )}

                    {/* Étape 2 : code OTP */}
                    {step === 2 && (
                        <div className="mt-5">
                            <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                Code de vérification
                            </label>
                            <input
                                type="text"
                                inputMode="numeric"
                                autoFocus
                                placeholder="••••••"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                onKeyDown={(e) => onKeyDown(e, handleOtpSubmit)}
                                disabled={loading}
                                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-center text-lg tracking-[0.5em] text-gray-900 outline-none transition focus:border-[#EC2027] focus:ring-2 focus:ring-[#EC2027]/20 disabled:opacity-60"
                            />
                            <button
                                onClick={handleOtpSubmit}
                                disabled={loading}
                                className="mt-5 flex w-full items-center justify-center rounded-lg bg-[#EC2027] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#c91a20] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EC2027]/40 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {loading ? 'Vérification…' : 'Se connecter'}
                            </button>
                            <button
                                onClick={() => { setStep(1); setError(''); }}
                                disabled={loading}
                                className="mt-3 w-full text-center text-sm text-gray-500 transition-colors hover:text-gray-700 disabled:opacity-60"
                            >
                                ← Modifier le numéro
                            </button>
                        </div>
                    )}
                </div>

                <p className="mt-6 text-center text-xs text-gray-400">
                    Airtel Quiz · Espace d&apos;administration
                </p>
            </div>
        </div>
    );
}
