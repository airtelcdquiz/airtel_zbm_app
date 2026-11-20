"use client";
import { useParams } from "next/navigation";
import Pupitre from "@/components/pages/tvshow/Pupitre";

export default function Page() {
    const params = useParams();
    return <Pupitre id={String(params?.id ?? "")} />;
}
