
import api from "@/lib/api"; 
import { cookies } from "next/headers";


export default async function QuestionsPage() {

    const res = await api(await cookies()).get("/quiz");

    return <div>
        <p>{JSON.stringify(res.data)}</p>
    </div>;
}