"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function HomePage() {
  const router = useRouter();
  const [clienteInput, setClienteInput] = useState("");
  const [buscando, setBuscando] = useState(false);

  const slugCliente = useMemo(() => slugify(clienteInput), [clienteInput]);

  function irATarjeta() {
    const slug = slugCliente;

    if (!slug) {
      alert("Escribe tu nombre, código o identificador.");
      return;
    }

    setBuscando(true);
    router.push(`/cliente/${slug}`);
  }

  function irAdmin() {
    router.push("/admin/clientes");
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    irATarjeta();
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-yellow-100 via-amber-100 to-orange-200 px-4 py-10 text-zinc-900">
      <div className="mx-auto flex min-h-[85vh] max-w-5xl items-center justify-center">
        <div className="grid w-full gap-6 md:grid-cols-2">
          {/* BLOQUE IZQUIERDO */}
          <section className="rounded-3xl bg-white/90 p-8 shadow-xl ring-1 ring-black/5 backdrop-blur">
            <div className="mb-6">
              <h1 className="text-4xl font-extrabold tracking-tight text-red-700 md:text-5xl">
                Maza & Pizza 🍕
              </h1>
              <p className="mt-3 text-lg text-zinc-700">
                Sistema de fidelización digital
              </p>
              <p className="mt-2 text-sm text-zinc-500">
                Consulta tus visitas, revisa si ya tienes premio y accede a tu
                tarjeta digital en segundos.
              </p>
            </div>

            <div className="grid gap-3 rounded-2xl bg-zinc-50 p-4 ring-1 ring-zinc-200">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-lg">
                  🎁
                </div>
                <div>
                  <p className="font-semibold">Premios por visitas</p>
                  <p className="text-sm text-zinc-600">
                    Acumula visitas y gana tu pizza gratis.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-lg">
                  📱
                </div>
                <div>
                  <p className="font-semibold">Tarjeta digital</p>
                  <p className="text-sm text-zinc-600">
                    Sin tarjeta física. Todo desde tu celular.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-lg">
                  ⚡
                </div>
                <div>
                  <p className="font-semibold">Acceso rápido</p>
                  <p className="text-sm text-zinc-600">
                    Ingresa con tu identificador y consulta tu avance.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* BLOQUE DERECHO */}
          <section className="rounded-3xl bg-white p-8 shadow-xl ring-1 ring-black/5">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-zinc-900">
                Bienvenido
              </h2>
              <p className="mt-2 text-sm text-zinc-600">
                Elige cómo deseas ingresar al sistema.
              </p>
            </div>

            {/* CLIENTE */}
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-zinc-900">
                  Consultar mi tarjeta
                </h3>
                <p className="mt-1 text-sm text-zinc-600">
                  Escribe tu nombre o identificador para ir a tu tarjeta.
                </p>
              </div>

              <form onSubmit={onSubmit} className="space-y-3">
                <input
                  type="text"
                  placeholder="Ej: alvaro pizero"
                  value={clienteInput}
                  onChange={(e) => setClienteInput(e.target.value)}
                  className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 outline-none transition focus:border-zinc-500"
                />

                <div className="rounded-xl bg-white px-4 py-3 text-sm text-zinc-500 ring-1 ring-zinc-200">
                  Ruta final:{" "}
                  <span className="font-medium text-zinc-700">
                    /cliente/{slugCliente || "slug-del-cliente"}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={buscando}
                  className="w-full rounded-2xl bg-green-700 px-4 py-3 text-base font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {buscando ? "Ingresando..." : "Consultar mi tarjeta"}
                </button>
              </form>
            </div>

            {/* ADMIN */}
            <div className="mt-5 rounded-2xl border border-zinc-200 bg-white p-5">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-zinc-900">
                  Administrador
                </h3>
                <p className="mt-1 text-sm text-zinc-600">
                  Accede al panel para registrar visitas, crear clientes y
                  gestionar premios.
                </p>
              </div>

              <button
                onClick={irAdmin}
                className="w-full rounded-2xl bg-black px-4 py-3 text-base font-semibold text-white transition hover:opacity-90"
              >
                Ir al panel de administración
              </button>
            </div>

            <p className="mt-6 text-center text-xs text-zinc-500">
              Maza & Pizza · fidelización digital
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}