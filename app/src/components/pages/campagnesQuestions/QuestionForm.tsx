"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { Check, Info, Smartphone, Trash2 } from "lucide-react";
import api from "@/lib/api";
import cookies from "@/lib/cookies";
import { cn } from "@/lib/utils";
import {
  Alert, Button, ButtonLink, Card, CardHeader, Field, Modal, PageBody, PageHeader, Skeleton, Switch, inputClass,
} from "@/components/ui/kit";
import { Question, QuestionStatus } from "./index";

const USSD_LIMIT = 160;
const MAX_LEN = 255;

type FormState = Omit<Question, "id">;

const EMPTY: FormState = {
  question: "", option_1: "", option_2: "", option_3: "", option_4: "",
  response: "", is_active: true, archived: false,
};

const apiError = (e: unknown, fallback: string) => {
  const err = e as { response?: { status?: number; data?: { error?: string } } };
  if (err?.response?.status === 403) return "Action réservée à l'administrateur global.";
  return err?.response?.data?.error ?? fallback;
};

/** Aperçu de l'écran d'un téléphone simple : question puis options. */
function UssdPreview({ form }: { form: FormState }) {
  const options = [form.option_1, form.option_2, form.option_3, form.option_4];
  return (
    <div className="mx-auto w-[220px] rounded-[28px] bg-ink-900 p-3 shadow-pop">
      <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-ink-700" aria-hidden />
      <div className="space-y-2 rounded-xl bg-[#dfe7d3] p-3 font-mono text-[11px] leading-[1.45] text-ink-900">
        <div className="rounded-md bg-white/50 p-2">
          <p className="whitespace-pre-wrap break-words">{form.question || "Votre question…"}</p>
          <p className="mt-1.5">1. Suivant</p>
        </div>
        <div className="rounded-md bg-white/50 p-2">
          <p>Options :</p>
          {options.map((o, i) => (
            <p key={i} className={cn("break-words", String(form.response) === String(i + 1) && "font-bold")}>
              {i + 1}. {o || "…"}
            </p>
          ))}
        </div>
      </div>
      <div className="mt-2.5 flex justify-center gap-2" aria-hidden>
        <span className="h-2 w-8 rounded-full bg-ink-700" />
        <span className="h-2 w-8 rounded-full bg-ink-700" />
      </div>
    </div>
  );
}

export default function QuestionForm({ id }: { id?: string }) {
  const router = useRouter();
  const isEdit = !!id;
  const [form, setForm] = React.useState<FormState>(EMPTY);
  const [original, setOriginal] = React.useState<Question | null>(null);
  const [loading, setLoading] = React.useState(isEdit);
  const [notFound, setNotFound] = React.useState(false);
  const [canWrite, setCanWrite] = React.useState<boolean | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [error, setError] = React.useState("");
  const [saved, setSaved] = React.useState(false);

  React.useEffect(() => {
    api(cookies).get("/me/permissions")
      .then(r => setCanWrite(!!r.data?.is_superuser))
      .catch(() => setCanWrite(false));
  }, []);

  React.useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const { data } = await api(cookies).get(`/quiz/${id}`);
        setOriginal(data);
        setForm({
          question: data.question ?? "", option_1: data.option_1 ?? "", option_2: data.option_2 ?? "",
          option_3: data.option_3 ?? "", option_4: data.option_4 ?? "", response: data.response ? String(data.response) : "",
          is_active: !!data.is_active, archived: !!data.archived,
        });
      } catch (e) {
        const status = (e as { response?: { status?: number } })?.response?.status;
        if (status === 404) setNotFound(true); else setError("Impossible de charger la question.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => { setForm(f => ({ ...f, [k]: v })); setSaved(false); };

  const readOnly = canWrite === false;
  const qLen = form.question.length;
  const missing = !form.question.trim() || [form.option_1, form.option_2, form.option_3, form.option_4].some(o => !o.trim()) || !form.response;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) return;
    if (missing) { setError("Renseignez la question, les quatre options et la bonne réponse."); return; }
    setSaving(true); setError(""); setSaved(false);
    const payload = {
      question: form.question.trim(), option_1: form.option_1.trim(), option_2: form.option_2.trim(),
      option_3: form.option_3.trim(), option_4: form.option_4.trim(), response: String(form.response),
      is_active: form.is_active, ...(isEdit ? { archived: form.archived } : {}),
    };
    try {
      if (isEdit) {
        const { data } = await api(cookies).put(`/quiz/${id}`, payload);
        setOriginal(data);
        setSaved(true);
      } else {
        await api(cookies).post("/quiz", payload);
        router.push("/app/campaigns-questions");
        return;
      }
    } catch (err) {
      setError(apiError(err, "L'enregistrement a échoué. Réessayez."));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setDeleting(true); setError("");
    try {
      await api(cookies).delete(`/quiz/${id}`);
      router.push("/app/campaigns-questions");
    } catch (err) {
      setConfirmDelete(false);
      setError(apiError(err, "La suppression a échoué."));
      setDeleting(false);
    }
  };

  const crumbs = [
    { label: "Tableau de bord", href: "/app" },
    { label: "Questions", href: "/app/campaigns-questions" },
    { label: isEdit ? `Question #${id}` : "Nouvelle question" },
  ];

  if (notFound) {
    return (
      <PageBody>
        <PageHeader title="Question introuvable" crumbs={crumbs} />
        <Card className="p-6">
          <p className="text-sm text-ink-600">Cette question n&apos;existe pas ou a été supprimée.</p>
          <ButtonLink href="/app/campaigns-questions" variant="secondary" size="sm" className="mt-4">Retour aux questions</ButtonLink>
        </Card>
      </PageBody>
    );
  }

  return (
    <PageBody>
      <PageHeader
        title={isEdit ? (
          <span className="inline-flex flex-wrap items-center gap-3">Question #{id}{original && <QuestionStatus q={original} />}</span>
        ) : "Nouvelle question"}
        description={isEdit ? "Modifiez le texte, les options ou le statut de la question." : "La question sera proposée aux joueurs une fois activée."}
        crumbs={crumbs}
        actions={isEdit && canWrite ? (
          <Button variant="danger" onClick={() => setConfirmDelete(true)}><Trash2 /> Supprimer</Button>
        ) : undefined}
      />

      {readOnly && (
        <Alert tone="info" className="mb-4 flex items-center gap-2">
          <Info className="size-4 shrink-0" /> Lecture seule : seul l&apos;administrateur global peut créer ou modifier les questions.
        </Alert>
      )}

      <form onSubmit={submit} className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <Card>
          <CardHeader title="Contenu" description="Choisissez la bonne réponse avec le bouton à gauche de chaque option." />
          <div className="space-y-5 px-5 py-5">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-9 w-full" />)}
              </div>
            ) : (
              <>
                <Field
                  label="Question"
                  error={qLen > USSD_LIMIT ? `${qLen} caractères : au-delà de ${USSD_LIMIT}, l'écran USSD risque d'être tronqué.` : undefined}
                  hint={`${qLen} / ${USSD_LIMIT} caractères recommandés (USSD)`}
                >
                  <textarea
                    value={form.question}
                    onChange={e => set("question", e.target.value)}
                    maxLength={MAX_LEN}
                    rows={4}
                    disabled={readOnly}
                    placeholder="Ex. : Quelle est la capitale de la RDC ?"
                    className={cn(inputClass, "h-auto resize-y py-2 leading-relaxed", qLen > USSD_LIMIT && "border-warning-600 focus:border-warning-600 focus:ring-warning-600/10")}
                  />
                </Field>

                <fieldset>
                  <legend className="mb-1.5 text-[13px] font-medium text-ink-700">Options</legend>
                  <div className="space-y-2">
                    {([1, 2, 3, 4] as const).map(n => {
                      const key = `option_${n}` as const;
                      const correct = String(form.response) === String(n);
                      return (
                        <div key={n} className={cn(
                          "flex items-center gap-2 rounded-lg border p-1.5 pl-2.5 transition-colors",
                          correct ? "border-success-600/40 bg-success-50" : "border-ink-200 bg-white",
                        )}>
                          <label className="flex shrink-0 cursor-pointer items-center" title="Marquer comme bonne réponse">
                            <input
                              type="radio"
                              name="response"
                              value={n}
                              checked={correct}
                              disabled={readOnly}
                              onChange={() => set("response", String(n))}
                              className="peer sr-only"
                            />
                            <span className={cn(
                              "flex size-6 items-center justify-center rounded-full border text-xs font-semibold tabular transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-500",
                              correct ? "border-success-600 bg-success-600 text-white" : "border-ink-300 text-ink-500 hover:border-ink-400",
                            )}>
                              {correct ? <Check className="size-3.5" /> : n}
                            </span>
                            <span className="sr-only">Option {n} est la bonne réponse</span>
                          </label>
                          <input
                            value={form[key]}
                            onChange={e => set(key, e.target.value)}
                            maxLength={MAX_LEN}
                            disabled={readOnly}
                            placeholder={`Option ${n}`}
                            aria-label={`Option ${n}`}
                            className="h-8 min-w-0 flex-1 rounded-md bg-transparent px-2 text-sm text-ink-900 outline-none placeholder:text-ink-400 disabled:text-ink-500"
                          />
                          {correct && <span className="hidden shrink-0 pr-2 text-xs font-medium text-success-700 sm:inline">Bonne réponse</span>}
                        </div>
                      );
                    })}
                  </div>
                  {!form.response && !readOnly && <p className="mt-1.5 text-xs text-ink-500">Aucune bonne réponse sélectionnée.</p>}
                </fieldset>

                <div className="divide-y divide-ink-100 rounded-lg border border-ink-200">
                  <div className="flex items-center justify-between gap-4 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-ink-900">Active</p>
                      <p className="text-xs text-ink-500">Une question active peut être envoyée aux joueurs.</p>
                    </div>
                    <Switch checked={form.is_active} onChange={v => set("is_active", v)} disabled={readOnly} label="Active" />
                  </div>
                  {isEdit && (
                    <div className="flex items-center justify-between gap-4 px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-ink-900">Archivée</p>
                        <p className="text-xs text-ink-500">Retirée de la rotation, conservée pour l&apos;historique.</p>
                      </div>
                      <Switch checked={form.archived} onChange={v => set("archived", v)} disabled={readOnly} label="Archivée" />
                    </div>
                  )}
                </div>
              </>
            )}

            {error && <Alert>{error}</Alert>}
            {saved && <Alert tone="success">Modifications enregistrées.</Alert>}
          </div>

          {!readOnly && (
            <div className="flex flex-col-reverse gap-2 rounded-b-xl border-t border-ink-100 bg-ink-25 px-5 py-3.5 sm:flex-row sm:justify-end">
              <ButtonLink href="/app/campaigns-questions" variant="secondary">Annuler</ButtonLink>
              <Button type="submit" loading={saving} disabled={loading || canWrite === null}>
                {isEdit ? "Enregistrer" : "Créer la question"}
              </Button>
            </div>
          )}
        </Card>

        <div className="lg:sticky lg:top-6 lg:self-start">
          <Card>
            <CardHeader title={<span className="inline-flex items-center gap-2"><Smartphone className="size-4 text-ink-400" /> Aperçu USSD</span>} description="Rendu sur un téléphone simple." />
            <div className="px-5 py-6">
              <UssdPreview form={form} />
            </div>
          </Card>
        </div>
      </form>

      <Modal
        open={confirmDelete}
        onClose={() => !deleting && setConfirmDelete(false)}
        title="Supprimer cette question ?"
        description="La question sera définitivement supprimée. Pour la retirer sans la perdre, archivez-la plutôt."
        size="sm"
        footer={<>
          <Button variant="secondary" onClick={() => setConfirmDelete(false)} disabled={deleting}>Annuler</Button>
          <Button onClick={remove} loading={deleting}><Trash2 /> Supprimer</Button>
        </>}
      />
    </PageBody>
  );
}
