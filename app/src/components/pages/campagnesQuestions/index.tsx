"use client";
import React from "react";
import Link from "next/link";
import { Check, ChevronRight, ListChecks, Plus } from "lucide-react";
import api from "@/lib/api";
import cookies from "@/lib/cookies";
import { cn } from "@/lib/utils";
import {
  Badge, ButtonLink, Card, EmptyState, PageBody, PageHeader, Pagination, SearchInput, Skeleton,
} from "@/components/ui/kit";

export type QuestionState = "enabled" | "disabled" | "archived";

export interface Question {
  id: number;
  question: string;
  option_1: string;
  option_2: string;
  option_3: string;
  option_4: string;
  response: string | null;
  is_active: boolean;
  archived: boolean;
}

const PER_PAGE = 10;

const TABS: { state: QuestionState; label: string; href: string }[] = [
  { state: "enabled", label: "Activées", href: "/app/campaigns-questions/enabled" },
  { state: "disabled", label: "Désactivées", href: "/app/campaigns-questions/disabled" },
  { state: "archived", label: "Archivées", href: "/app/campaigns-questions/archived" },
];

export function QuestionStatus({ q }: { q: Pick<Question, "is_active" | "archived"> }) {
  if (q.archived) return <Badge tone="neutral">Archivée</Badge>;
  return q.is_active ? <Badge tone="success" dot>Active</Badge> : <Badge tone="warning" dot>Désactivée</Badge>;
}

function QuestionRow({ q }: { q: Question }) {
  const options = [q.option_1, q.option_2, q.option_3, q.option_4];
  return (
    <li>
      <Link
        href={`/app/campaigns-questions/${q.id}`}
        className="group flex gap-4 px-4 py-4 transition-colors hover:bg-ink-25 sm:px-5"
      >
        <span className="mt-0.5 inline-flex h-6 min-w-10 shrink-0 items-center justify-center rounded-md bg-ink-100 px-1.5 text-xs font-semibold text-ink-600 tabular">
          #{q.id}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="min-w-0 flex-1 text-sm font-medium leading-6 text-ink-900">{q.question || <span className="text-ink-400">Sans texte</span>}</p>
            <QuestionStatus q={q} />
          </div>
          <ol className="mt-2.5 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {options.map((opt, i) => {
              const correct = String(q.response) === String(i + 1);
              return (
                <li
                  key={i}
                  className={cn(
                    "flex min-w-0 items-center gap-2 rounded-md px-2.5 py-1.5 text-[13px]",
                    correct ? "bg-success-50 text-success-700 ring-1 ring-inset ring-success-600/20" : "bg-ink-50 text-ink-600",
                  )}
                >
                  <span className={cn("text-xs font-semibold tabular", correct ? "text-success-700" : "text-ink-400")}>{i + 1}.</span>
                  <span className="min-w-0 flex-1 truncate" title={opt}>{opt || "—"}</span>
                  {correct && <Check className="size-3.5 shrink-0" aria-label="Bonne réponse" />}
                </li>
              );
            })}
          </ol>
        </div>
        <ChevronRight className="mt-1 hidden size-4 shrink-0 text-ink-300 transition-colors group-hover:text-ink-500 sm:block" aria-hidden />
      </Link>
    </li>
  );
}

function RowSkeleton() {
  return (
    <li className="flex gap-4 px-4 py-4 sm:px-5">
      <Skeleton className="h-6 w-10" />
      <div className="flex-1 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-7 w-full" />)}
        </div>
      </div>
    </li>
  );
}

export default function CampaignsQuestionsPage({ state }: { state: QuestionState }) {
  const [questions, setQuestions] = React.useState<Question[]>([]);
  const [total, setTotal] = React.useState(0);
  const [pages, setPages] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [isSuperuser, setIsSuperuser] = React.useState(false);

  React.useEffect(() => {
    api(cookies).get("/me/permissions")
      .then(r => setIsSuperuser(!!r.data?.is_superuser))
      .catch(() => setIsSuperuser(false));
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const params: Record<string, string | number> = { page, per_page: PER_PAGE };
        if (search) params.search = search;
        const { data } = await api(cookies).get(`/quiz/${state}`, { params });
        if (cancelled) return;
        setQuestions(data.questions ?? []);
        setTotal(data.total ?? 0);
        setPages(data.pages ?? 0);
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setQuestions([]); setTotal(0); setPages(0);
          setError("Impossible de charger les questions.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [state, page, search]);

  const onSearch = (v: string) => { setPage(1); setSearch(v); };
  const current = TABS.find(t => t.state === state);

  return (
    <PageBody>
      <PageHeader
        title="Questions"
        description="Banque de questions envoyées chaque jour aux joueurs par SMS et USSD."
        crumbs={[{ label: "Tableau de bord", href: "/app" }, { label: "Questions" }]}
        actions={isSuperuser ? (
          <ButtonLink href="/app/campaigns-questions/new"><Plus /> Nouvelle question</ButtonLink>
        ) : undefined}
      />

      <Card>
        <div className="flex flex-col gap-3 border-b border-ink-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <nav className="inline-flex w-full rounded-lg bg-ink-100 p-0.5 sm:w-auto" aria-label="Statut des questions">
            {TABS.map(t => {
              const active = t.state === state;
              return (
                <Link
                  key={t.state}
                  href={t.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors sm:flex-none",
                    active ? "bg-white text-ink-900 shadow-sm" : "text-ink-500 hover:text-ink-800",
                  )}
                >
                  {t.label}
                  {active && !loading && (
                    <span className="rounded bg-ink-100 px-1.5 text-[11px] font-semibold text-ink-600 tabular">{total.toLocaleString("fr-FR")}</span>
                  )}
                </Link>
              );
            })}
          </nav>
          <SearchInput value={search} onSearch={onSearch} placeholder="Rechercher une question" className="w-full sm:w-80" />
        </div>

        {error ? (
          <EmptyState icon={<ListChecks />} title="Erreur de chargement" description={error} />
        ) : loading ? (
          <ul className="divide-y divide-ink-100">{[0, 1, 2, 3, 4].map(i => <RowSkeleton key={i} />)}</ul>
        ) : questions.length === 0 ? (
          <EmptyState
            icon={<ListChecks />}
            title={search ? "Aucun résultat" : `Aucune question ${current ? `« ${current.label.toLowerCase()} »` : ""}`}
            description={search ? `Aucune question ne correspond à « ${search} ».` : "Les questions de cet onglet apparaîtront ici."}
            action={isSuperuser && !search ? <ButtonLink href="/app/campaigns-questions/new" variant="secondary" size="sm"><Plus /> Nouvelle question</ButtonLink> : undefined}
          />
        ) : (
          <ul className="divide-y divide-ink-100">{questions.map(q => <QuestionRow key={q.id} q={q} />)}</ul>
        )}

        {!loading && !error && total > 0 && (
          <Pagination page={page} pages={pages} total={total} perPage={PER_PAGE} onChange={setPage} />
        )}
      </Card>
    </PageBody>
  );
}
