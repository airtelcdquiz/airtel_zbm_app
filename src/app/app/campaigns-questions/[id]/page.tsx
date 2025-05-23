"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import api from "@/lib/api";
import cookies from "@/lib/cookies";

export default function EditCampaignsQuestionPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;
  const [question, setQuestion] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    api(cookies)
      .get(`/quiz/${id}`)
      .then((res) => {
        setQuestion(res.data);
        setForm(res.data);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div>Chargement...</div>;
  if (!question) return <div>Introuvable</div>;

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setIsSaving(true);
    await api(cookies).put(`/quiz/${id}`, form);
    // router.push("/app/quiz");
    setIsSaving(false);
  };

  return (
    <div className="flex flex-col w-full mt-[20px] pl-[40px]">
      <h1 className="text-2xl font-bold mb-4">Modifier la Question</h1>
      <div className="w-full bg-white rounded overflow-x-scroll text-[13px] p-[20px]">
      <form onSubmit={handleSubmit} className="w-full">
        <p className="text-sm text-gray-500 m-0 mt-[15px]">Question</p>
        <textarea maxLength={160} name="campaign_question" value={form.campaign_question || ""} onChange={handleChange} className="w-full border p-2" placeholder="Question" />
        <p className="text-sm text-gray-500 m-0 mt-[15px]">Réponse 1</p>
        <input name="campaign_value1" value={form.campaign_value1 || ""} onChange={handleChange} className="w-full border p-2" placeholder="Réponse 1" />
        <p className="text-sm text-gray-500 m-0 mt-[15px]">Réponse 2</p>
        <input name="campaign_value2" value={form.campaign_value2 || ""} onChange={handleChange} className="w-full border p-2" placeholder="Réponse 2" />
        <p className="text-sm text-gray-500 m-0 mt-[15px]">Réponse 3</p>
        <input name="campaign_value3" value={form.campaign_value3 || ""} onChange={handleChange} className="w-full border p-2" placeholder="Réponse 3" />
        <p className="text-sm text-gray-500 m-0 mt-[15px]">Réponse 4</p>
        <input name="campaign_value4" value={form.campaign_value4 || ""} onChange={handleChange} className="w-full border p-2" placeholder="Réponse 4" />
        
        <p className="text-sm text-gray-500 m-0 mt-[15px]">Réponse correcte</p>
        <input name="campaign_answer"  value={form.campaign_answer || ""} onChange={handleChange} className="w-full border p-2" placeholder="Numéro de la bonne réponse (1-4)" type="number" min="1" max="4" />
        <label className="flex items-center gap-2">
          <input type="checkbox" name="is_active" checked={!!form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} />
          Active
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="archived" checked={!!form.archived} onChange={e => setForm({ ...form, archived: e.target.checked })} />
          Archivée
        </label>
        <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded" disabled={isSaving}>{isSaving ? "Enregistrement en cours..." : "Enregistrer"}</button>
      </form>
        </div>
    </div>
  );
} 