"use client";

import { useMemo } from "react";
import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";

export default function QrNegocioPage() {
  const urlRegistro = useMemo(() => {
    if (typeof window === "undefined") {
      return "https://mazza-pizza.vercel.app/registro";
    }

    return `${window.location.origin}/registro`;
  }, []);

  function imprimir() {
    window.print();
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-yellow-100 via-amber-100 to-orange-200 px-4 py-10 text-zinc-900 print:bg-white print:py-0">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-3xl bg-white p-8 shadow-xl ring-1 ring-black/5 print:shadow-none print:ring-0">
          <div className="text-center">
            <div className="mb-4 flex justify-center">
              <Image
                src="/logo.png"
                alt="Maza & Pizza"
                width={120}
                height={120}
                className="rounded-full"
              />
            </div>

            <h1 className="text-4xl font-extrabold text-red-600">
              Maza & Pizza 🍕
            </h1>

            <p className="mt-3 text-lg text-zinc-700">
              Escanea y regístrate
            </p>

            <p className="mt-2 text-sm text-zinc-500">
              Crea tu tarjeta digital, acumula visitas y gana premios.
            </p>
          </div>

          <div className="mt-8 flex justify-center">
            <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
              <QRCodeSVG value={urlRegistro} size={280} />
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-lg font-semibold text-zinc-800">
              Escanea este código con tu celular
            </p>
            <p className="mt-2 text-sm text-zinc-600">
              Regístrate una sola vez y tu tarjeta quedará guardada en tu equipo.
            </p>

            <p className="mt-4 break-all text-xs text-zinc-400">
              {urlRegistro}
            </p>
          </div>

          <div className="mt-8 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-zinc-100 p-4 text-center">
              <p className="text-2xl">📱</p>
              <p className="mt-2 font-semibold">Escanea</p>
              <p className="mt-1 text-sm text-zinc-600">
                Abre el registro desde tu celular.
              </p>
            </div>

            <div className="rounded-2xl bg-zinc-100 p-4 text-center">
              <p className="text-2xl">📝</p>
              <p className="mt-2 font-semibold">Regístrate</p>
              <p className="mt-1 text-sm text-zinc-600">
                Completa tus datos una sola vez.
              </p>
            </div>

            <div className="rounded-2xl bg-zinc-100 p-4 text-center">
              <p className="text-2xl">🎁</p>
              <p className="mt-2 font-semibold">Acumula premios</p>
              <p className="mt-1 text-sm text-zinc-600">
                Sigue tus visitas y gana tu pizza.
              </p>
            </div>
          </div>

          <div className="mt-8 flex justify-center print:hidden">
            <button
              onClick={imprimir}
              className="rounded-xl bg-black px-5 py-3 font-semibold text-white transition hover:opacity-90"
            >
              Imprimir QR
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}