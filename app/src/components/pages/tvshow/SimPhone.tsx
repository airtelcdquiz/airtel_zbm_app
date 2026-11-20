'use client'
/**
 * Téléphone du joueur test : reproduit les écrans USSD du TV Show
 * (mêmes textes que le service USSD) sur le simulateur.
 * Comme le vrai USSD, l'écran ne se met pas à jour tout seul : on « Actualise ».
 */
import React from 'react';
import { Phone, PhoneOff, SendHorizontal } from 'lucide-react';
import { Button, inputClass } from '@/components/ui/kit';
import { cn } from '@/lib/utils';
import { AnswerResult, HUMAN_ID, SimEngine } from '@/lib/tvsim';

const seconds = (ms = 0) => (Math.round(ms / 100) / 10).toString().replace('.', ',');
const pts = (n = 0) => `${n} pt${n > 1 ? 's' : ''}`;

type Seen = { idx: number; position: number; options: string[] };
type Step = 'live' | 'options' | 'input' | 'submit';
interface Screen { text: string; end?: boolean; next?: Record<string, Step>; free?: Step; again?: Step }

function resultText(result: AnswerResult, r: { elapsedMs?: number; points: number; winnerName?: string | null }) {
    switch (result) {
        case 'winner': return `Bonne reponse ! 1er en ${seconds(r.elapsedMs)} s.\nTotal : ${pts(r.points)}`;
        case 'correct_late': return `Bonne reponse, mais ${r.winnerName || 'un autre joueur'} a ete plus rapide.\nTotal : ${pts(r.points)}`;
        case 'wrong': return `Mauvaise reponse.\nAttendez la question suivante.\nTotal : ${pts(r.points)}`;
        case 'too_late': return r.winnerName ? `Trop tard : ${r.winnerName} a trouve en premier.\nTotal : ${pts(r.points)}` : `Trop tard, la question est terminee.\nTotal : ${pts(r.points)}`;
        case 'already_answered': return `Vous avez deja repondu a cette question.\nTotal : ${pts(r.points)}`;
        default: return null;
    }
}

const wait = (text: string): Screen => ({ text: `${text}\n1. Actualiser`, next: { '1': 'live' }, again: 'live' });

export default function SimPhone({ engine, ussdCode }: { engine: SimEngine; ussdCode: string }) {
    const [screen, setScreen] = React.useState<Screen | null>(null);
    const [input, setInput] = React.useState('');
    const seen = React.useRef<Seen | null>(null);
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => { setScreen(null); seen.current = null; }, [engine]);

    const live = React.useCallback((): Screen => {
        const st = engine.ussdState();
        if (st.mode === 'upcoming') return { text: `TV Show "${st.title}"\nVous etes inscrit.\nLe direct va bientot commencer.\nA bientot !`, end: true };
        if (st.mode === 'ended') {
            return { text: `TV Show "${st.title}" termine.\nVous etes ${st.rank === 1 ? '1er' : `${st.rank}e`} sur ${st.total} avec ${pts(st.points)}.\nMerci d'avoir joue !`, end: true };
        }
        if (st.phase === 'paused') return wait(`TV Show en pause.\nOn revient tout de suite !\nScore : ${pts(st.points)}`);
        if (st.phase === 'question' && st.question) {
            const q = st.question;
            if (st.answered) return wait(resultText(st.answered.result, { elapsedMs: st.answered.elapsedMs, points: st.points }) || 'Reponse enregistree.');
            seen.current = { idx: q.idx, position: q.position, options: q.options };
            return { text: `TV Show - Q${q.position}/${q.total}\n${q.question}\n1. Voir les options`, next: { '1': 'options' }, again: 'live' };
        }
        if (st.phase === 'closed' && st.last) {
            const l = st.last;
            const head = l.mine === 'winner' ? `Bravo ! Vous avez gagne la Q${l.position}.`
                : `Q${l.position} terminee.\n${l.winnerName ? `Gagnant : ${l.winnerName}` : "Personne n'a trouve."}`;
            return wait(`${head}\nBonne reponse : ${l.correct}\nScore : ${pts(st.points)}`);
        }
        return wait(`TV Show "${st.title}"\nLa prochaine question arrive. Regardez la tele !\nScore : ${pts(st.points)}`);
    }, [engine]);

    const go = (step: Step, value = ''): Screen => {
        const q = seen.current;
        if (step === 'live') return live();
        if (!q) return wait('Question introuvable.');
        if (step === 'options') {
            const hint = value && value !== '1' ? 'Tapez 0 pour repondre.\n' : '';
            return { text: `${hint}${q.options.map((o, i) => `${i + 1}. ${o}`).join('\n')}\n0. Repondre`, next: { '0': 'input' }, again: 'options' };
        }
        if (step === 'input') return { text: `Q${q.position} - Votre reponse (1 a 4) :`, free: 'submit' };
        // submit
        if (!/^[1-4]$/.test(value)) return { text: `Choix invalide, tapez 1 a 4.\nQ${q.position} - Votre reponse :`, free: 'submit' };
        // La réponse est rattachée à la question VUE : si une autre a pris sa place, c'est trop tard.
        const r = engine.current === q.idx ? engine.answer(HUMAN_ID, Number(value)) : { result: 'too_late' as AnswerResult, winnerName: null };
        const points = engine.playerById(HUMAN_ID)?.points ?? 0;
        const text = resultText(r.result, { ...r, points });
        if (text) { seen.current = null; return wait(text); }
        return live();
    };

    const send = () => {
        if (!screen || screen.end) return;
        const v = input.trim();
        setInput('');
        if (screen.free) setScreen(go(screen.free, v));
        else if (screen.next?.[v]) setScreen(go(screen.next[v], v));
        else if (screen.again) setScreen(go(screen.again, v));
        inputRef.current?.focus();
    };

    const dial = () => { seen.current = null; setInput(''); setScreen(live()); setTimeout(() => inputRef.current?.focus(), 0); };
    const hangUp = () => { seen.current = null; setInput(''); setScreen(null); };

    return (
        <div className="mx-auto w-full max-w-[280px] rounded-[28px] border border-ink-300 bg-ink-900 p-3 shadow-sm">
            <div className="mx-auto mb-2 h-1.5 w-14 rounded-full bg-ink-700" aria-hidden />
            <div className="flex min-h-[220px] flex-col rounded-2xl bg-[#dfe6d8] p-3 font-mono text-[12.5px] leading-snug text-ink-900">
                {screen ? (
                    <p className="flex-1 whitespace-pre-wrap break-words" aria-live="polite">{screen.text}</p>
                ) : (
                    <div className="flex flex-1 flex-col items-center justify-center gap-1 text-center text-ink-600">
                        <span className="text-sm font-semibold text-ink-900">{ussdCode}</span>
                        <span>Composez le code pour voir ce que voit un joueur.</span>
                    </div>
                )}
                {screen && !screen.end && (
                    <form className="mt-2 flex gap-1.5" onSubmit={e => { e.preventDefault(); send(); }}>
                        <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} inputMode="numeric" maxLength={4}
                            className={cn(inputClass, 'h-8 bg-white font-mono')} aria-label="Saisie USSD" placeholder="Votre choix" />
                        <Button type="submit" size="sm" aria-label="Envoyer"><SendHorizontal /></Button>
                    </form>
                )}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
                <Button variant="success" size="sm" onClick={dial}><Phone /> {screen ? 'Rappeler' : 'Appeler'}</Button>
                <Button variant="secondary" size="sm" onClick={hangUp} disabled={!screen}><PhoneOff /> Raccrocher</Button>
            </div>
        </div>
    );
}
