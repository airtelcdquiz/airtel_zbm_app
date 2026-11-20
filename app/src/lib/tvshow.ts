/**
 * Client du service TV Show (quiz en direct).
 *
 * Contrat : airtel-quiz-tvshow/docs/CONTRACT.md.
 * Base dérivée de l'API ZBM : `https://…/api` -> `https://…/tv`
 * (REST sous `/tv/api`, WebSocket sous `/tv/ws`).
 *
 * Utilisable uniquement côté client (lit le cookie `session` via document.cookie).
 */
import axios, { AxiosInstance } from 'axios';
import cookies from './cookies';
import { API_BASE_URL } from './env';

/* ------------------------------------------------------------------ Types */

export type SessionStatus = 'draft' | 'registration' | 'live' | 'paused' | 'finished' | 'cancelled';
export type QuestionStatus = 'pending' | 'displayed' | 'open' | 'closed' | 'revealed' | 'cancelled';
export type Scene = 'waiting' | 'question' | 'reveal' | 'leaderboard' | 'podium' | 'pause';
export type RegistrationMode = 'admin' | 'ussd' | 'both';
export type Options4 = [string, string, string, string];

export interface Audience { schools?: string[]; levels?: string[]; classes?: string[]; options?: number[] }

export interface Winner { phone_masked: string; display_name: string; school: string; elapsed_ms: number }

export interface TvSession {
    id: number; title: string; code: string;
    status: SessionStatus;
    scheduled_at: string | null;
    question_duration_s: number;
    broadcast_delay_s: number;
    points_per_win: number;
    registration_mode: RegistrationMode;
    audience: Audience;
    max_players: number | null;
    started_at: string | null; ended_at: string | null; created_at: string;
    players_count: number; questions_count: number; reserves_count: number;
    winner?: { display_name: string; school: string; points: number } | null;
}

/** Champs modifiables d'une session (POST / PATCH). */
export interface TvSessionInput {
    title: string;
    code?: string;
    scheduled_at: string | null;
    question_duration_s: number;
    broadcast_delay_s: number;
    points_per_win: number;
    registration_mode: RegistrationMode;
    audience: Audience;
    max_players: number | null;
}

export interface SessionQuestion {
    id: number;
    source_question_id: number | null;
    position: number;
    is_reserve: boolean;
    question: string; options: Options4;
    response: '1' | '2' | '3' | '4';
    duration_s: number;
    status: QuestionStatus;
    too_long: boolean;
    displayed_at: string | null; ussd_opened_at: string | null; closed_at: string | null;
    winner: Winner | null;
    answers_count: number;
}

export interface TvPlayer {
    phone_number: string; phone_masked: string; name: string; display_name: string;
    school_code: string; school: string; school_level: string; school_class: string; school_option: number | null;
    source: 'admin' | 'ussd'; registered_at: string; points: number; win_time_ms: number;
}

export interface LeaderRow { rank: number; display_name: string; school: string; phone_masked: string; points: number; win_time_ms: number }

export interface BankQuestion {
    id: number; question: string; options: Options4; response: string;
    archived: boolean; played_daily: boolean; tv_played_at: string | null;
    tv_reserved_session_id: number | null; too_long: boolean;
}

export interface Answer {
    phone_masked: string; display_name: string; school: string;
    choice: number; is_correct: boolean; is_winner: boolean; elapsed_ms: number; received_at: string;
}

export interface LiveQuestion {
    id: number; position: number; total: number;
    question: string; options: Options4;
    status: QuestionStatus;
    displayed_at: string | null; opens_at: string | null; closes_at: string | null; closed_at: string | null;
    duration_s: number;
    correct_option: number | null;
    winner: Winner | null;
    answers_count: number;
}

export interface LiveState {
    server_now: string;
    session: TvSession;
    scene: Scene;
    ussd_code: string;
    question: LiveQuestion | null;
    leaderboard: LeaderRow[];
    next?: SessionQuestion | null;
    reserves?: SessionQuestion[];
    questions?: SessionQuestion[];
}

export interface Paged { total: number; page: number; pages: number }

export interface PlayerFilter { school_code?: string; school_level?: string; school_class?: string; school_option?: number }

export interface QuestionItem { question_id: number; is_reserve: boolean; duration_s?: number }

export type LiveAction =
    | 'start' | 'display' | 'close' | 'reveal' | 'scene' | 'pause' | 'resume' | 'replace' | 'cancel_question' | 'end';

export type WsMessage =
    | { type: 'state'; state: LiveState }
    | { type: 'answers'; count: number }
    | { type: 'answer'; answer: Answer }
    | { type: 'pong'; server_now: string };

/* ------------------------------------------------------------------- URLs */

/** `https://…/tv` (sans barre finale). */
export const TV_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '') + '/tv';
export const TV_API_URL = `${TV_BASE_URL}/api`;

export function tvWsUrl(jwt: string, sessionId: number | string): string {
    const base = TV_BASE_URL.replace(/^http/, 'ws'); // http -> ws, https -> wss
    return `${base}/ws?auth=${encodeURIComponent(jwt)}&session=${encodeURIComponent(String(sessionId))}`;
}

export const sessionToken = (): string | undefined => cookies.get('session')?.value;

/* ---------------------------------------------------------------- Erreurs */

/** Message d'erreur lisible (champ `error` du contrat, sinon message générique). */
export function tvError(e: unknown, fallback = "L'opération a échoué. Réessayez."): string {
    const err = e as { response?: { status?: number; data?: { error?: string } }; request?: unknown; message?: string };
    const msg = err?.response?.data?.error;
    if (msg) return msg;
    const status = err?.response?.status;
    if (status === 401) return 'Session expirée : reconnectez-vous.';
    if (status === 403) return "Action réservée à l'administrateur global.";
    if (status === 404) return 'Élément introuvable.';
    if (!err?.response && err?.request) return 'Service TV Show injoignable. Vérifiez la connexion.';
    return fallback;
}

/* ------------------------------------------------------------ Client REST */

let instance: AxiosInstance | null = null;
function http(): AxiosInstance {
    if (instance) return instance;
    instance = axios.create({ baseURL: TV_API_URL, headers: { 'Content-Type': 'application/json' } });
    instance.interceptors.request.use(config => {
        const token = sessionToken();
        if (token) config.headers['Authorization'] = `Bearer ${token}`;
        return config;
    });
    return instance;
}

const s = (id: number | string) => `/sessions/${encodeURIComponent(String(id))}`;

export const tv = {
    listSessions: async (status?: SessionStatus | '') =>
        (await http().get<{ sessions: TvSession[] }>('/sessions', { params: status ? { status } : {} })).data.sessions ?? [],
    createSession: async (body: TvSessionInput) =>
        (await http().post<{ session: TvSession }>('/sessions', body)).data.session,
    getSession: async (id: number | string) =>
        (await http().get<{ session: TvSession; questions: SessionQuestion[] }>(s(id))).data,
    updateSession: async (id: number | string, body: Partial<TvSessionInput>) =>
        (await http().patch<{ session: TvSession }>(s(id), body)).data.session,
    deleteSession: async (id: number | string) => { await http().delete(s(id)); },
    setStatus: async (id: number | string, status: 'draft' | 'registration' | 'cancelled') =>
        (await http().post<{ session: TvSession }>(`${s(id)}/status`, { status })).data.session,

    listPlayers: async (id: number | string, params: { search?: string; page?: number; per_page?: number }) =>
        (await http().get<{ players: TvPlayer[] } & Paged>(`${s(id)}/players`, { params })).data,
    addPlayers: async (id: number | string, phones: string[]) =>
        (await http().post<{ added: number; skipped: number; total: number }>(`${s(id)}/players`, { phones })).data,
    previewFilter: async (id: number | string, filter: PlayerFilter) =>
        (await http().post<{ count: number }>(`${s(id)}/players`, { filter, preview: true })).data.count,
    addByFilter: async (id: number | string, filter: PlayerFilter) =>
        (await http().post<{ added: number; skipped: number; total: number }>(`${s(id)}/players`, { filter })).data,
    removePlayer: async (id: number | string, phone: string) => {
        await http().delete(`${s(id)}/players/${encodeURIComponent(phone)}`);
    },

    bank: async (params: { search?: string; page?: number; per_page?: number; eligible?: 1 }) =>
        (await http().get<{ questions: BankQuestion[] } & Paged>('/bank', { params })).data,
    putQuestions: async (id: number | string, items: QuestionItem[]) =>
        (await http().put<{ questions: SessionQuestion[] }>(`${s(id)}/questions`, { items })).data.questions,
    draw: async (id: number | string, body: { count: number; reserves: number; exclude_daily: boolean }) =>
        (await http().post<{ questions: SessionQuestion[]; available: number }>(`${s(id)}/questions/draw`, body)).data,
    redraw: async (id: number | string, qid: number) =>
        (await http().post<{ questions: SessionQuestion[] }>(`${s(id)}/questions/${qid}/redraw`)).data.questions,
    patchQuestion: async (id: number | string, qid: number, duration_s: number) =>
        (await http().patch<{ questions: SessionQuestion[] }>(`${s(id)}/questions/${qid}`, { duration_s })).data.questions,

    displayToken: async (id: number | string) =>
        (await http().post<{ token: string; url: string }>(`${s(id)}/display-token`)).data,

    live: async (id: number | string) => (await http().get<LiveState>(`${s(id)}/live`)).data,
    action: async (id: number | string, action: LiveAction, body: Record<string, unknown> = {}) =>
        (await http().post<LiveState>(`${s(id)}/live/${action}`, body)).data,
    answers: async (id: number | string, qid: number) =>
        (await http().get<{ answers: Answer[] }>(`${s(id)}/answers`, { params: { question: qid } })).data.answers ?? [],
    leaderboard: async (id: number | string) =>
        (await http().get<{ leaderboard: LeaderRow[] }>(`${s(id)}/leaderboard`)).data.leaderboard ?? [],
};

/* -------------------------------------------------------------- Horloge */

/** Décalage (ms) à ajouter à Date.now() pour obtenir l'heure du serveur. */
export const clockOffset = (serverNow: string, localAt = Date.now()) => {
    const t = Date.parse(serverNow);
    return Number.isNaN(t) ? 0 : t - localAt;
};

/* ------------------------------------------------------------ WebSocket */

export type WsStatus = 'connecting' | 'open' | 'closed';

export interface LiveSocketHandlers {
    onState?: (state: LiveState) => void;
    onAnswers?: (count: number) => void;
    onAnswer?: (answer: Answer) => void;
    /** Nouveau décalage d'horloge calculé depuis `server_now`. */
    onOffset?: (offsetMs: number) => void;
    onStatus?: (status: WsStatus, retryInMs?: number) => void;
}

/**
 * Ouvre le WebSocket du pupitre et le maintient : reconnexion avec délai croissant
 * (1 s, 2 s, 4 s… plafonné à 30 s), ping toutes les 15 s pour recaler l'horloge.
 * Renvoie une fonction d'arrêt.
 */
export function connectLive(sessionId: number | string, h: LiveSocketHandlers): () => void {
    let ws: WebSocket | null = null;
    let stopped = false;
    let attempt = 0;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let pingTimer: ReturnType<typeof setInterval> | null = null;
    let pingSentAt = 0;

    const clearTimers = () => {
        if (retryTimer) { clearTimeout(retryTimer); retryTimer = null; }
        if (pingTimer) { clearInterval(pingTimer); pingTimer = null; }
    };

    const schedule = () => {
        if (stopped) return;
        const delay = Math.min(30_000, 1000 * 2 ** attempt) + Math.floor(Math.random() * 300);
        attempt++;
        h.onStatus?.('closed', delay);
        retryTimer = setTimeout(open, delay);
    };

    const open = () => {
        if (stopped) return;
        const token = sessionToken();
        if (!token) { h.onStatus?.('closed'); return; }
        h.onStatus?.('connecting');
        try {
            ws = new WebSocket(tvWsUrl(token, sessionId));
        } catch {
            schedule();
            return;
        }
        ws.onopen = () => {
            attempt = 0;
            h.onStatus?.('open');
            const ping = () => {
                if (ws?.readyState === WebSocket.OPEN) {
                    pingSentAt = Date.now();
                    ws.send(JSON.stringify({ type: 'ping' }));
                }
            };
            ping();
            pingTimer = setInterval(ping, 15_000);
        };
        ws.onmessage = ev => {
            let msg: WsMessage;
            try { msg = JSON.parse(String(ev.data)); } catch { return; }
            switch (msg.type) {
                case 'state':
                    if (msg.state?.server_now) h.onOffset?.(clockOffset(msg.state.server_now));
                    h.onState?.(msg.state);
                    break;
                case 'answers': h.onAnswers?.(msg.count); break;
                case 'answer': h.onAnswer?.(msg.answer); break;
                case 'pong': {
                    // Milieu de l'aller-retour : meilleure estimation que la réception seule.
                    const now = Date.now();
                    const at = pingSentAt && now - pingSentAt < 10_000 ? (pingSentAt + now) / 2 : now;
                    h.onOffset?.(clockOffset(msg.server_now, at));
                    break;
                }
            }
        };
        ws.onclose = () => {
            if (pingTimer) { clearInterval(pingTimer); pingTimer = null; }
            ws = null;
            schedule();
        };
        ws.onerror = () => { /* onclose suit */ };
    };

    open();

    return () => {
        stopped = true;
        clearTimers();
        if (ws) {
            ws.onclose = null;
            ws.close();
            ws = null;
        }
    };
}

/* ------------------------------------------------------------ Divers */

/** Heure de Kinshasa (UTC+1, sans heure d'été) pour <input type="datetime-local">. */
const KIN_OFFSET_MS = 60 * 60 * 1000;
export const isoToKinshasaInput = (iso: string | null | undefined) =>
    iso ? new Date(Date.parse(iso) + KIN_OFFSET_MS).toISOString().slice(0, 16) : '';
export const kinshasaInputToIso = (v: string) => {
    if (!v) return null;
    const t = Date.parse(`${v}:00+01:00`);
    return Number.isNaN(t) ? null : new Date(t).toISOString();
};

/** 12345 ms -> "12,3 s" */
export const fmtMs = (ms: number | null | undefined) =>
    ms === null || ms === undefined ? '—' : `${(ms / 1000).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} s`;

/** secondes -> "00:12" */
export const fmtClock = (sec: number) => {
    const v = Math.max(0, Math.ceil(sec));
    return `${String(Math.floor(v / 60)).padStart(2, '0')}:${String(v % 60).padStart(2, '0')}`;
};
