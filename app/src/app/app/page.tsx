import api from "@/lib/api";
import { cookies } from "next/headers";
import Link from "next/link";

// Récupère un total de façon défensive : l'endpoint peut renvoyer { total }
// (users / quiz / documents) ou un tableau ; en cas d'échec on renvoie null
// pour afficher "—" plutôt que de faire planter la page.
async function fetchTotal(path: string): Promise<number | null> {
    try {
        const jar = await cookies();
        const data = (await api(jar).get(path)).data;
        if (typeof data?.total === "number") return data.total;
        if (Array.isArray(data)) return data.length;
        return null;
    } catch {
        return null;
    }
}

function StatCard({ label, value, href, children }: { label: string; value: string; href: string; children: React.ReactNode; }) {
    return (
        <Link
            href={href}
            className="group flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition hover:border-[#EC2027]/30 hover:shadow-md"
        >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#EC2027]/10 text-[#EC2027]">
                {children}
            </div>
            <div className="min-w-0">
                <p className="text-2xl font-bold leading-none text-gray-900">{value}</p>
                <p className="mt-1 truncate text-sm text-gray-500">{label}</p>
            </div>
        </Link>
    );
}

function QuickLink({ label, href, children }: { label: string; href: string; children: React.ReactNode; }) {
    return (
        <Link
            href={href}
            className="flex items-center gap-3 rounded-lg border border-gray-100 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm transition hover:border-[#EC2027]/30 hover:text-[#EC2027] hover:shadow-md"
        >
            <span className="text-[#EC2027]">{children}</span>
            {label}
        </Link>
    );
}

const iconUsers = (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" className="size-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
);
const iconQuiz = (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" className="size-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
    </svg>
);
const iconDocs = (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" className="size-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
    </svg>
);
const iconTrophy = (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" className="size-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 0 0 2.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 0 1 2.916.52 6.003 6.003 0 0 1-5.395 4.972m0 0a6.726 6.726 0 0 1-2.749 1.35m0 0a6.772 6.772 0 0 1-3.044 0" />
    </svg>
);

export default async function Page(){
    const [nbUsers, nbQuiz, nbDocs] = await Promise.all([
        fetchTotal("/users?page=1"),
        fetchTotal("/quiz?page=1"),
        fetchTotal("/documents?page=1"),
    ]);

    const fmt = (n: number | null) => (n === null ? "—" : n.toLocaleString("fr-FR"));

    return (
        <div className="w-full h-full overflow-y-auto px-8 py-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Vue d&apos;ensemble du back-office Airtel Quiz.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <StatCard label="Utilisateurs" value={fmt(nbUsers)} href="/app/users">{iconUsers}</StatCard>
                <StatCard label="Questions de campagne" value={fmt(nbQuiz)} href="/app/campaigns-questions">{iconQuiz}</StatCard>
                <StatCard label="Documents" value={fmt(nbDocs)} href="/app/documents">{iconDocs}</StatCard>
            </div>

            <h2 className="mt-10 mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">
                Accès rapide
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <QuickLink label="Utilisateurs" href="/app/users">{iconUsers}</QuickLink>
                <QuickLink label="Questions de campagne" href="/app/campaigns-questions">{iconQuiz}</QuickLink>
                <QuickLink label="Classements" href="/app/classements">{iconTrophy}</QuickLink>
                <QuickLink label="Documents" href="/app/documents">{iconDocs}</QuickLink>
            </div>
        </div>
    );
}
