"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

export default function NewCampaignsQuestionPage() {
  const router = useRouter();
  const [form, setForm] = useState<any>({ is_active: true });

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    await api().post("/campaigns-questions", form);
    router.push("/app/campaigns-questions");
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Nouvelle Question de Campagne</h1>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
        <input name="campaign_question" value={form.campaign_question || ""} onChange={handleChange} className="w-full border p-2" placeholder="Question" />
        <input name="campaign_value1" value={form.campaign_value1 || ""} onChange={handleChange} className="w-full border p-2" placeholder="Réponse 1" />
        <input name="campaign_value2" value={form.campaign_value2 || ""} onChange={handleChange} className="w-full border p-2" placeholder="Réponse 2" />
        <input name="campaign_value3" value={form.campaign_value3 || ""} onChange={handleChange} className="w-full border p-2" placeholder="Réponse 3" />
        <input name="campaign_value4" value={form.campaign_value4 || ""} onChange={handleChange} className="w-full border p-2" placeholder="Réponse 4" />
        <input name="campaign_answer" value={form.campaign_answer || ""} onChange={handleChange} className="w-full border p-2" placeholder="Numéro de la bonne réponse (1-4)" type="number" min="1" max="4" />
        <label className="flex items-center gap-2">
          <input type="checkbox" name="is_active" checked={!!form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} />
          Active
        </label>
        <button type="submit" className="px-4 py-2 bg-red-500 text-white rounded">Créer</button>
      </form>
    </div>
  );
} 