import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh w-full flex-col items-center justify-center bg-ink-50 px-6 text-center">
      <Image src="/images/airtel-french-logo.svg" alt="Airtel" width={120} height={54} className="h-10 w-auto" priority />
      <p className="mt-12 text-sm font-semibold text-brand-600">Erreur 404</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">Page introuvable</h1>
      <p className="mt-3 max-w-md text-[15px] text-ink-500">
        La page que vous cherchez n&apos;existe pas ou a été déplacée.
      </p>
      <Link href="/app" className="mt-8 inline-flex h-10 items-center rounded-lg bg-brand-600 px-5 text-sm font-medium text-white shadow-sm hover:bg-brand-700">
        Retour au tableau de bord
      </Link>
    </div>
  );
}
