import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#fff5f5] via-white to-[#ffe9ea] px-4">
      <div className="w-full max-w-md text-center">
        <Image
          src="/images/airtel-french-logo.svg"
          alt="Airtel"
          width={150}
          height={67}
          className="mx-auto h-auto w-[130px]"
          priority
        />

        <div className="mt-10 select-none">
          <p className="text-[90px] leading-none font-extrabold tracking-tight text-[#EC2027]">
            404
          </p>
        </div>

        <h1 className="mt-4 text-xl font-semibold text-gray-800">
          Page introuvable
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          La page que vous cherchez n&apos;existe pas ou a été déplacée.
        </p>

        <Link
          href="/app"
          className="mt-8 inline-flex items-center justify-center rounded-lg bg-[#EC2027] px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#c91a20] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EC2027]/40"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
