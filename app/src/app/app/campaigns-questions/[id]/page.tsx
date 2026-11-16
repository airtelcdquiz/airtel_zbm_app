"use client";
import { useParams } from "next/navigation";
import QuestionForm from "@/components/pages/campagnesQuestions/QuestionForm";

export default function EditCampaignsQuestionPage() {
  const params = useParams();
  return <QuestionForm id={String(params?.id ?? "")} />;
}
