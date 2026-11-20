"use client";
import { useParams } from "next/navigation";
import SessionDetail from "@/components/pages/tvshow/SessionDetail";

export default function Page() {
    const params = useParams();
    return <SessionDetail id={String(params?.id ?? "")} />;
}
