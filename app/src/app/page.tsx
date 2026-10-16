import { redirect } from "next/navigation";

// La racine n'a pas de contenu propre : on envoie vers l'espace applicatif,
// qui redirige lui-même vers /login si la session est absente ou invalide.
export default async function Home() {
  redirect("/app");
}
