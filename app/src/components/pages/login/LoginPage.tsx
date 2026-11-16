'use client'
import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BarChart3, ListChecks, ShieldCheck, Trophy } from 'lucide-react';
import { API_BASE_URL } from '@/lib/env';
import { Alert, Button, inputClass } from '@/components/ui/kit';
import { cn } from '@/lib/utils';

const OTP_LENGTH = 6;
const RESEND_DELAY = 30;

/** 0970908479 / 970908479 / +243 970 908 479 -> 243970908479 */
const normalizePhoneNumber = (phone: string): string => {
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('243')) return digits;
    if (digits.startsWith('0')) return '243' + digits.substring(1);
    return '243' + digits;
};

function OtpInput({ value, onChange, onComplete, disabled }: {
    value: string; onChange: (v: string) => void; onComplete: (v: string) => void; disabled?: boolean;
}) {
    const refs = React.useRef<(HTMLInputElement | null)[]>([]);
    const set = (v: string) => {
        const clean = v.replace(/\D/g, '').slice(0, OTP_LENGTH);
        onChange(clean);
        refs.current[Math.min(clean.length, OTP_LENGTH - 1)]?.focus();
        if (clean.length === OTP_LENGTH) onComplete(clean);
    };
    return (
        <div className="flex justify-between gap-2" onPaste={e => { e.preventDefault(); set(e.clipboardData.getData('text')); }}>
            {Array.from({ length: OTP_LENGTH }).map((_, i) => (
                <input key={i} ref={el => { refs.current[i] = el; }}
                    value={value[i] ?? ''} inputMode="numeric" autoComplete={i === 0 ? 'one-time-code' : 'off'}
                    maxLength={OTP_LENGTH} disabled={disabled} autoFocus={i === 0} aria-label={`Chiffre ${i + 1}`}
                    onChange={e => {
                        const d = e.target.value.replace(/\D/g, '');
                        if (d.length > 1) return set(value.slice(0, i) + d);
                        const arr = value.padEnd(OTP_LENGTH, ' ').split('');
                        arr[i] = d || ' ';
                        const next = arr.join('').replace(/ /g, '');
                        onChange(next);
                        if (d && i < OTP_LENGTH - 1) refs.current[i + 1]?.focus();
                        if (d && next.length === OTP_LENGTH) onComplete(next);
                    }}
                    onKeyDown={e => {
                        if (e.key === 'Backspace' && !value[i] && i > 0) refs.current[i - 1]?.focus();
                        if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus();
                        if (e.key === 'ArrowRight' && i < OTP_LENGTH - 1) refs.current[i + 1]?.focus();
                    }}
                    className={cn('h-12 w-full min-w-0 rounded-lg border border-ink-200 bg-white text-center text-lg font-semibold text-ink-900 shadow-sm outline-none transition tabular',
                        'focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 disabled:bg-ink-50')} />
            ))}
        </div>
    );
}

export default function LoginPage() {
    const router = useRouter();
    const [step, setStep] = React.useState<1 | 2>(1);
    const [phone, setPhone] = React.useState('');
    const [otp, setOtp] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState('');
    const [info, setInfo] = React.useState('');
    const [cooldown, setCooldown] = React.useState(0);

    React.useEffect(() => {
        if (cooldown <= 0) return;
        const t = setTimeout(() => setCooldown(c => c - 1), 1000);
        return () => clearTimeout(t);
    }, [cooldown]);

    const sendCode = async (e?: React.FormEvent) => {
        e?.preventDefault();
        const digits = phone.replace(/\D/g, '');
        if (digits.length < 9) { setError('Entrez un numéro de téléphone valide.'); return; }
        setLoading(true); setError(''); setInfo('');
        try {
            const res = await fetch(`${API_BASE_URL}/auth/send-otp`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone_number: normalizePhoneNumber(phone) }),
            });
            if (res.status === 404) throw new Error("Ce numéro n'a pas accès au back-office.");
            if (!res.ok) throw new Error("L'envoi du code a échoué. Réessayez.");
            setStep(2); setOtp(''); setCooldown(RESEND_DELAY);
            setInfo('Code envoyé par SMS.');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const verify = async (code: string = otp) => {
        if (code.length !== OTP_LENGTH) { setError(`Entrez les ${OTP_LENGTH} chiffres du code.`); return; }
        setLoading(true); setError(''); setInfo('');
        try {
            const res = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone_number: normalizePhoneNumber(phone), otp: code }),
            });
            if (res.status === 403) throw new Error('Ce compte est désactivé.');
            if (!res.ok) throw new Error('Code incorrect ou expiré.');
            const data = await res.json();
            if (!data.token) throw new Error('Réponse inattendue du serveur.');
            document.cookie = `session=${data.token}; path=/; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
            router.push('/app');
        } catch (err: any) {
            setError(err.message);
            setOtp('');
            setLoading(false);
        }
    };

    return (
        <div className="grid min-h-dvh w-full bg-white lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
            {/* Panneau de marque */}
            <aside className="relative hidden overflow-hidden bg-brand-600 lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
                <svg className="pointer-events-none absolute -right-40 -top-40 size-[640px] text-white/[0.07]" viewBox="0 0 200 200" aria-hidden>
                    <circle cx="100" cy="100" r="99" fill="none" stroke="currentColor" strokeWidth="0.6" />
                    <circle cx="100" cy="100" r="78" fill="none" stroke="currentColor" strokeWidth="0.6" />
                    <circle cx="100" cy="100" r="57" fill="none" stroke="currentColor" strokeWidth="0.6" />
                    <circle cx="100" cy="100" r="36" fill="none" stroke="currentColor" strokeWidth="0.6" />
                </svg>
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-brand-800/50 to-transparent" aria-hidden />

                <div className="relative flex items-center gap-3">
                    <span className="rounded-xl bg-white px-3 py-2 shadow-sm">
                        <Image src="/images/airtel-french-logo.svg" alt="Airtel" width={96} height={43} className="h-8 w-auto" priority />
                    </span>
                    <span className="text-sm font-semibold text-white/90">Quiz · Back-office</span>
                </div>

                <div className="relative max-w-md">
                    <h2 className="text-[34px] font-semibold leading-tight tracking-tight text-white">
                        Pilotez le quiz quotidien des élèves.
                    </h2>
                    <p className="mt-4 text-[15px] leading-relaxed text-white/80">
                        Suivez la participation école par école, publiez les questions du jour et récompensez les meilleurs joueurs.
                    </p>
                    <ul className="mt-8 space-y-3 text-sm text-white/90">
                        {[
                            { icon: BarChart3, t: 'Participation et résultats en temps réel' },
                            { icon: Trophy, t: 'Classements par école, classe et option' },
                            { icon: ListChecks, t: 'Banque de questions et documents sources' },
                        ].map(({ icon: Icon, t }) => (
                            <li key={t} className="flex items-center gap-3">
                                <span className="flex size-8 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/20"><Icon className="size-4" /></span>{t}
                            </li>
                        ))}
                    </ul>
                </div>

                <p className="relative text-xs text-white/60">© {new Date().getFullYear()} Airtel RDC</p>
            </aside>

            {/* Formulaire */}
            <main className="flex items-center justify-center px-5 py-12 sm:px-8">
                <div className="w-full max-w-[380px] animate-fade-in">
                    <Image src="/images/airtel-french-logo.svg" alt="Airtel" width={110} height={49} className="mb-10 h-10 w-auto lg:hidden" priority />

                    {step === 1 ? (
                        <>
                            <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Connexion</h1>
                            <p className="mt-2 text-sm text-ink-500">Entrez votre numéro Airtel. Vous recevrez un code de connexion par SMS.</p>
                            <form onSubmit={sendCode} className="mt-8 space-y-5">
                                {error && <Alert>{error}</Alert>}
                                <label className="block">
                                    <span className="mb-1.5 block text-[13px] font-medium text-ink-700">Numéro de téléphone</span>
                                    <div className="flex">
                                        <span className="inline-flex items-center rounded-l-lg border border-r-0 border-ink-200 bg-ink-50 px-3 text-sm text-ink-500">+243</span>
                                        <input type="tel" inputMode="tel" autoComplete="tel" autoFocus placeholder="97 090 8479"
                                            value={phone} onChange={e => setPhone(e.target.value)} disabled={loading}
                                            className={cn(inputClass, 'h-11 rounded-l-none text-[15px]')} />
                                    </div>
                                </label>
                                <Button type="submit" loading={loading} className="h-11 w-full text-[15px]">
                                    {loading ? 'Envoi du code…' : 'Recevoir le code'}
                                </Button>
                            </form>
                        </>
                    ) : (
                        <>
                            <button onClick={() => { setStep(1); setError(''); setInfo(''); }} disabled={loading}
                                className="mb-6 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-500 hover:text-ink-900">
                                <ArrowLeft className="size-4" /> Modifier le numéro
                            </button>
                            <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Vérification</h1>
                            <p className="mt-2 text-sm text-ink-500">
                                Saisissez le code à {OTP_LENGTH} chiffres envoyé au <span className="font-medium text-ink-800">+{normalizePhoneNumber(phone)}</span>.
                            </p>
                            <form onSubmit={e => { e.preventDefault(); verify(); }} className="mt-8 space-y-5">
                                {error ? <Alert>{error}</Alert> : info ? <Alert tone="success">{info}</Alert> : null}
                                <OtpInput value={otp} onChange={setOtp} onComplete={verify} disabled={loading} />
                                <Button type="submit" loading={loading} className="h-11 w-full text-[15px]">
                                    {loading ? 'Vérification…' : 'Se connecter'}
                                </Button>
                                <p className="text-center text-[13px] text-ink-500">
                                    Pas reçu ?{' '}
                                    {cooldown > 0
                                        ? <span className="tabular">Nouveau code dans {cooldown} s</span>
                                        : <button type="button" onClick={() => sendCode()} disabled={loading} className="font-medium text-brand-700 hover:text-brand-800">Renvoyer le code</button>}
                                </p>
                            </form>
                        </>
                    )}

                    <p className="mt-12 flex items-center gap-2 text-xs text-ink-400">
                        <ShieldCheck className="size-3.5" /> Accès réservé aux administrateurs du quiz.
                    </p>
                </div>
            </main>
        </div>
    );
}
