/**
 * Simulateur du TV Show, entièrement dans le navigateur.
 *
 * Il reproduit les règles du service tvshow (un essai par joueur, le premier bon
 * répondant gagne et ferme la question, fenêtre USSD décalée du délai de diffusion)
 * avec des joueurs fictifs, et fabrique des messages identiques au contrat
 * (`LiveState`) pour piloter le vrai écran télé en mode `?sim=1`.
 * Rien n'est envoyé au serveur : aucune donnée réelle n'est lue ni écrite.
 */
import type { LeaderRow, LiveQuestion, LiveState, Options4, QuestionStatus, Scene, SessionStatus, TvSession } from './tvshow';

export interface SimConfig { title: string; duration: number; delay: number; questions: number; players: number; ussdCode: string }

export const SIM_DEFAULTS: SimConfig = { title: 'Démo inter-écoles', duration: 20, delay: 3, questions: 5, players: 40, ussdCode: '*4405#' };

interface SimQuestionDef { question: string; options: Options4; correct: 1 | 2 | 3 | 4; ease: number }

/** Questions de démonstration (la 4e est faite pour que personne ne trouve). */
export const SIM_QUESTIONS: SimQuestionDef[] = [
    { question: 'Quelle est la capitale de la province du Kongo-Central ?', options: ['Matadi', 'Boma', 'Mbanza-Ngungu', 'Muanda'], correct: 1, ease: 0.7 },
    { question: 'Quel fleuve traverse la ville de Kinshasa ?', options: ['Le Nil', 'Le fleuve Congo', 'Le Niger', 'Le Zambèze'], correct: 2, ease: 0.9 },
    { question: 'Combien de provinces compte la RDC depuis 2015 ?', options: ['11 provinces', '21 provinces', '26 provinces', '30 provinces'], correct: 3, ease: 0.55 },
    { question: 'Quel gaz les plantes absorbent-elles pour la photosynthèse ?', options: ['Oxygène', 'Azote', 'Dioxyde de carbone', 'Hydrogène'], correct: 3, ease: 0 },
    { question: 'Combien font 7 × 8 ?', options: ['54', '56', '63', '48'], correct: 2, ease: 0.8 },
    { question: 'Quelle planète est la plus proche du Soleil ?', options: ['Vénus', 'Mercure', 'Mars', 'La Terre'], correct: 2, ease: 0.6 },
    { question: 'Qui a écrit « Le Petit Prince » ?', options: ['Victor Hugo', 'Antoine de Saint-Exupéry', 'Jules Verne', 'Molière'], correct: 2, ease: 0.5 },
    { question: 'Quelle est la monnaie de la RDC ?', options: ['Le franc congolais', 'Le dollar', 'Le shilling', 'Le kwacha'], correct: 1, ease: 0.95 },
];
export const SIM_MAX_QUESTIONS = SIM_QUESTIONS.length;

const FIRST = ['Grâce', 'Merveille', 'Exaucé', 'Jonathan', 'Divine', 'Christelle', 'Patrick', 'Rachel', 'Glody', 'Bénédicte', 'Josué', 'Ornella',
    'Dieumerci', 'Sarah', 'Prince', 'Esther', 'David', 'Plamedi', 'Gloire', 'Naomie', 'Daniel', 'Rebecca', 'Héritier', 'Chancelvie', 'Moïse',
    'Arlette', 'Samuel', 'Fiston', 'Ruth', 'Emmanuel', 'Princesse', 'Junior', 'Nathalie', 'Christian', 'Joëlle', 'Trésor', 'Miriam', 'Jérémie', 'Lydia', 'Caleb'];
const LAST = 'KMTNBLMKSNTBKMLE';
const SCHOOLS = ['Lycée Les Palmiers', 'Collège La Sagesse', 'Institut Lisanga', 'Complexe scolaire Mont-Fleuri', 'Collège Saint-Luc',
    'Institut Bel Avenir', 'Lycée Étoile du Matin', 'C.S. Les Bâtisseurs'];

export const HUMAN_ID = 'vous';

export interface SimPlayer {
    id: string; name: string; school: string; phone: string; skill: number;
    order: number; points: number; winMs: number; human?: boolean;
}

export type AnswerResult = 'winner' | 'correct_late' | 'wrong' | 'too_late' | 'not_open' | 'already_answered' | 'invalid';

export interface SimAnswer {
    playerId: string; name: string; school: string; phone: string; human?: boolean;
    questionIdx: number; choice: number; correct: boolean; winner: boolean; elapsedMs: number; at: number;
}

interface SimQ {
    idx: number; def: SimQuestionDef; status: QuestionStatus;
    displayedAt: number | null; opensAt: number | null; closesAt: number | null; closedAt: number | null;
    winnerId: string | null; winnerMs: number;
    answers: SimAnswer[];
    plan: { playerId: string; at: number; choice: number }[];
}

/** État vu par le téléphone du joueur test (même forme que `UssdState` du contrat). */
export type SimUssdState =
    | { mode: 'upcoming'; title: string }
    | { mode: 'live'; title: string; phase: 'waiting' | 'paused' | 'question' | 'closed'; points: number;
        question?: { idx: number; position: number; total: number; question: string; options: string[] };
        answered?: { result: AnswerResult; elapsedMs: number };
        last?: { position: number; correct: number; winnerName: string | null; mine: AnswerResult | null } }
    | { mode: 'ended'; title: string; rank: number; total: number; points: number };

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const iso = (t: number | null) => (t == null ? null : new Date(t).toISOString());
const maskPhone = () => `0${[81, 82, 84, 85, 89, 97, 98, 99][Math.floor(Math.random() * 8)]}•••${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;

export class SimEngine {
    readonly cfg: SimConfig;
    status: SessionStatus = 'registration';
    scene: Scene = 'waiting';
    players: SimPlayer[] = [];
    questions: SimQ[];
    current = -1;
    auto = false;
    /** Instant du dernier changement d'étape (sert au déroulement automatique). */
    changedAt = Date.now();
    startedAt = Date.now();
    feed: SimAnswer[] = [];
    version = 0;
    private arrivals: { at: number; player: SimPlayer }[] = [];
    private listeners = new Set<() => void>();

    constructor(cfg: SimConfig) {
        this.cfg = cfg;
        const n = Math.max(1, Math.min(SIM_MAX_QUESTIONS, cfg.questions));
        this.questions = SIM_QUESTIONS.slice(0, n).map((def, idx) => ({
            idx, def, status: 'pending', displayedAt: null, opensAt: null, closesAt: null, closedAt: null,
            winnerId: null, winnerMs: 0, answers: [], plan: [],
        }));
        // Le joueur test (vous) est inscrit d'office ; les autres arrivent au fil des secondes.
        this.players.push({ id: HUMAN_ID, name: 'Vous', school: 'Joueur test', phone: '099•••000', skill: 0, order: 0, points: 0, winMs: 0, human: true });
        const t0 = Date.now() + 600;
        const span = Math.min(14000, 400 * cfg.players);
        for (let i = 0; i < cfg.players; i++) {
            const first = FIRST[i % FIRST.length];
            const name = `${first} ${LAST[(i * 7 + Math.floor(i / FIRST.length)) % LAST.length]}.`;
            this.arrivals.push({
                at: t0 + Math.pow(Math.random(), 0.8) * span,
                player: { id: `p${i}`, name, school: SCHOOLS[(i * 3) % SCHOOLS.length], phone: maskPhone(), skill: rand(0.45, 0.95), order: i + 1, points: 0, winMs: 0 },
            });
        }
        this.arrivals.sort((a, b) => a.at - b.at);
    }

    subscribe(fn: () => void) { this.listeners.add(fn); return () => { this.listeners.delete(fn); }; }
    private changed(step = false) {
        this.version++;
        if (step) this.changedAt = Date.now();
        this.listeners.forEach(fn => fn());
    }

    get registering() { return this.arrivals.length > 0; }
    get cur(): SimQ | null { return this.current >= 0 ? this.questions[this.current] : null; }
    get nextIdx(): number { return this.questions.findIndex(q => q.status === 'pending'); }
    get questionOpen() { const s = this.cur?.status; return s === 'displayed' || s === 'open'; }
    playerById(id: string) { return this.players.find(p => p.id === id); }

    // --- Actions du pupitre ------------------------------------------------------

    startLive() {
        if (this.status !== 'registration') return;
        this.arrivals.forEach(a => this.players.push(a.player));
        this.arrivals = [];
        this.status = 'live'; this.scene = 'waiting'; this.startedAt = Date.now();
        this.changed(true);
    }

    display() {
        if (this.status !== 'live' || this.questionOpen) return;
        const idx = this.nextIdx;
        if (idx < 0) return;
        const q = this.questions[idx];
        const now = Date.now();
        q.status = 'displayed';
        q.displayedAt = now;
        q.opensAt = now + this.cfg.delay * 1000;
        q.closesAt = q.opensAt + this.cfg.duration * 1000;
        // Chaque joueur fictif répond (ou non) à un instant tiré au hasard dans la fenêtre USSD.
        const win = this.cfg.duration * 1000;
        q.plan = this.players.filter(p => !p.human && Math.random() < 0.85).map(p => {
            const correct = Math.random() < p.skill * q.def.ease;
            const wrong = [1, 2, 3, 4].filter(c => c !== q.def.correct);
            return {
                playerId: p.id,
                // Lire la question, ouvrir les options puis taper la réponse : 5 à 8 s au plus vite
                // pour une bonne réponse ; les plus pressés répondent plus tôt, souvent faux.
                at: q.opensAt! + (correct ? 5000 + Math.random() * 3000 : 2500 + Math.random() * 2500)
                    + Math.pow(Math.random(), 1.2) * Math.max(1000, win - 8500),
                choice: correct ? q.def.correct : wrong[Math.floor(Math.random() * 3)],
            };
        }).filter(a => a.at < q.closesAt!).sort((a, b) => a.at - b.at);
        this.current = idx;
        this.scene = 'question';
        this.changed(true);
    }

    close(at = Date.now()) {
        const q = this.cur;
        if (!q || !this.questionOpen) return;
        q.status = 'closed';
        q.closedAt = at;
        q.plan = [];
        this.changed(true);
    }

    reveal() {
        const q = this.cur;
        if (!q || q.status !== 'closed') return;
        q.status = 'revealed';
        this.scene = 'reveal';
        this.changed(true);
    }

    setScene(scene: Scene) {
        if (this.status !== 'live') return;
        if ((scene === 'question' || scene === 'reveal') && !this.cur) return;
        this.scene = scene;
        this.changed(true);
    }

    pause() {
        if (this.status !== 'live' || this.questionOpen) return;
        this.status = 'paused'; this.scene = 'pause';
        this.changed(true);
    }

    resume() {
        if (this.status !== 'paused') return;
        this.status = 'live'; this.scene = 'waiting';
        this.changed(true);
    }

    end() {
        if ((this.status !== 'live' && this.status !== 'paused') || this.questionOpen) return;
        this.status = 'finished'; this.scene = 'podium';
        this.changed(true);
    }

    setAuto(on: boolean) { this.auto = on; this.changed(true); }

    // --- Réponses ----------------------------------------------------------------

    /** Applique les règles du serveur ; renvoie le résultat vu par le joueur. */
    answer(playerId: string, choice: number, now = Date.now()): { result: AnswerResult; elapsedMs?: number; winnerName?: string | null } {
        const q = this.cur;
        const p = this.playerById(playerId);
        if (!p || !q || this.status !== 'live') return { result: 'not_open' };
        if (!(choice >= 1 && choice <= 4)) return { result: 'invalid' };
        if (q.answers.some(a => a.playerId === playerId)) return { result: 'already_answered' };
        if (q.status === 'closed' || q.status === 'revealed') {
            return { result: 'too_late', winnerName: q.winnerId ? this.playerById(q.winnerId)?.name ?? null : null };
        }
        if (q.status !== 'open' || now < (q.opensAt ?? 0)) return { result: 'not_open' };
        const elapsedMs = Math.max(0, Math.round(now - q.opensAt!));
        const correct = choice === q.def.correct;
        const winner = correct && !q.winnerId;
        const a: SimAnswer = {
            playerId, name: p.name, school: p.school, phone: p.phone, human: p.human,
            questionIdx: q.idx, choice, correct, winner, elapsedMs, at: now,
        };
        q.answers.push(a);
        this.feed = [a, ...this.feed].slice(0, 200);
        if (winner) {
            q.winnerId = playerId; q.winnerMs = elapsedMs;
            p.points += 10; p.winMs += elapsedMs;
            this.close(now);
        } else {
            this.changed();
        }
        return { result: winner ? 'winner' : correct ? 'correct_late' : 'wrong', elapsedMs };
    }

    // --- Horloge -----------------------------------------------------------------

    tick(now = Date.now()) {
        let dirty = false;
        while (this.arrivals.length && this.arrivals[0].at <= now) {
            this.players.push(this.arrivals.shift()!.player);
            dirty = true;
        }
        const q = this.cur;
        if (q && q.status === 'displayed' && now >= q.opensAt!) { q.status = 'open'; dirty = true; }
        if (q && q.status === 'open') {
            while (q.status === 'open' && q.plan.length && q.plan[0].at <= now) {
                const a = q.plan.shift()!;
                this.answer(a.playerId, a.choice, a.at);
            }
            if (q.status === 'open' && now >= q.closesAt!) this.close(q.closesAt!);
        }
        if (this.auto) this.autopilot(now);
        if (dirty) this.changed();
    }

    /** Déroulement automatique : enchaîne les étapes comme le ferait l'animateur. */
    private autopilot(now: number) {
        const since = now - this.changedAt;
        const q = this.cur;
        const hasNext = this.nextIdx >= 0;
        if (this.status === 'registration') { if (!this.registering && since > 2500) this.startLive(); return; }
        if (this.status !== 'live') return;
        if (q && this.questionOpen) return;
        if (q && q.status === 'closed') { if (since > 3500) this.reveal(); return; }
        if (this.scene === 'reveal' && since > 6000) {
            if (hasNext && (q!.idx + 1) % 2 === 1) this.display();
            else this.setScene('leaderboard');
            return;
        }
        if (this.scene === 'leaderboard' && since > 7000) { if (hasNext) this.display(); else this.end(); return; }
        if (this.scene === 'waiting' && since > 4000) { if (hasNext) this.display(); else this.end(); }
    }

    // --- Vues --------------------------------------------------------------------

    ranking(): SimPlayer[] {
        return [...this.players].sort((a, b) => b.points - a.points || a.winMs - b.winMs || a.order - b.order);
    }

    leaderboard(limit = 10): LeaderRow[] {
        return this.ranking().slice(0, limit).map((p, i) => ({
            rank: i + 1, display_name: p.name, school: p.school, phone_masked: p.phone, points: p.points, win_time_ms: p.winMs,
        }));
    }

    session(): TvSession {
        const top = this.ranking()[0];
        return {
            id: 0, title: this.cfg.title, code: '4821', status: this.status, scheduled_at: null,
            question_duration_s: this.cfg.duration, broadcast_delay_s: this.cfg.delay, points_per_win: 10,
            registration_mode: 'both', audience: {}, max_players: null,
            started_at: iso(this.startedAt), ended_at: null, created_at: iso(this.startedAt)!,
            players_count: this.players.length, questions_count: this.questions.length, reserves_count: 0,
            winner: this.status === 'finished' && top && top.points > 0 ? { display_name: top.name, school: top.school, points: top.points } : null,
        };
    }

    liveQuestion(q: SimQ): LiveQuestion {
        const w = q.winnerId ? this.playerById(q.winnerId) : null;
        return {
            id: 900 + q.idx, position: q.idx + 1, total: this.questions.length,
            question: q.def.question, options: q.def.options, status: q.status,
            displayed_at: iso(q.displayedAt), opens_at: iso(q.opensAt), closes_at: iso(q.closesAt), closed_at: iso(q.closedAt),
            duration_s: this.cfg.duration,
            correct_option: q.status === 'revealed' ? q.def.correct : null,
            winner: w ? { phone_masked: w.phone, display_name: w.name, school: w.school, elapsed_ms: q.winnerMs } : null,
            answers_count: q.answers.length,
        };
    }

    /** État envoyé à l'écran (version écran du contrat). */
    liveState(now = Date.now()): LiveState {
        const q = this.cur;
        return {
            server_now: new Date(now).toISOString(),
            session: this.session(),
            scene: this.scene,
            ussd_code: this.cfg.ussdCode,
            question: q ? this.liveQuestion(q) : null,
            leaderboard: this.leaderboard(),
        };
    }

    /** Ce que voit le joueur test sur son téléphone. */
    ussdState(): SimUssdState {
        const me = this.playerById(HUMAN_ID)!;
        const title = this.cfg.title;
        if (this.status === 'registration') return { mode: 'upcoming', title };
        if (this.status === 'finished') {
            const rank = this.ranking().findIndex(p => p.id === HUMAN_ID) + 1;
            return { mode: 'ended', title, rank, total: this.players.length, points: me.points };
        }
        const base = { mode: 'live' as const, title, points: me.points };
        if (this.status === 'paused') return { ...base, phase: 'paused' };
        const q = this.cur;
        if (!q || q.status === 'displayed') return { ...base, phase: 'waiting' };
        const mine = q.answers.find(a => a.playerId === HUMAN_ID);
        const mineResult: AnswerResult | null = mine ? (mine.winner ? 'winner' : mine.correct ? 'correct_late' : 'wrong') : null;
        if (q.status === 'open') {
            return {
                ...base, phase: 'question',
                question: { idx: q.idx, position: q.idx + 1, total: this.questions.length, question: q.def.question, options: q.def.options },
                answered: mine ? { result: mineResult!, elapsedMs: mine.elapsedMs } : undefined,
            };
        }
        return {
            ...base, phase: 'closed',
            last: { position: q.idx + 1, correct: q.def.correct, winnerName: q.winnerId ? this.playerById(q.winnerId)?.name ?? null : null, mine: mineResult },
        };
    }
}
