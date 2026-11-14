import { redirect } from "next/navigation"

// La liste des utilisateurs est séparée en « Joueurs » et « Administrateurs ».
export default function Page(){
    redirect("/app/players")
}
