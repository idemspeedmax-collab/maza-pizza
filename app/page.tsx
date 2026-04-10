"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

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
    if (!slugCliente) {
      alert("Escribe tu nombre o identificador.");
      return;
    }

    setBuscando(true);
    router.push(`/cliente/${slugCliente}`);
  }

  function irAdmin() {
    router.push("/admin/clientes");
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    irATarjeta();
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-yellow-100 via-amber-100 to-orange-200 px-4 py-10 text-zinc-900">
      <div className="mx-auto flex min-h-[85vh] max-w-5xl items-center justify-center">
        <div className="grid w-full gap-6 md:grid-cols-2">

          {/* IZQUIERDA */}
          <section className="rounded-3xl bg-white/90 p-8 shadow-xl ring-1 ring-black/5 backdrop-blur text-center">

            {/* LOGO */}
            <div className="flex justify-center mb-4">
              <Image
                src="/logo.png"
                alt="Maza & Pizza"
                width={140}
                height={140}
                className="rounded-full"
              />
            </div>

            <h1 className="text-4xl font-extrabold text-red-600">
              Maza & Pizza 🍕
            </h1>

            <p className="mt-3 text-lg text-zinc-700">
              Sistema de fidelización digital
            </p>

            <p className="mt-2 text-sm text-zinc-500">
              Consulta tus visitas, revisa tus premios y accede a tu tarjeta digital.
            </p>

            <div className="mt-6 grid gap-3 text-left">

              <div className="flex items-center gap-3 bg-zinc-100 p-3 rounded-xl">
                🎁
                <div>
                  <p className="font-semibold">Premios por visitas</p>
                  <p className="text-sm text-zinc-600">
                    Gana una pizza gratis.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-zinc-100 p-3 rounded-xl">
                📱
                <div>
                  <p className="font-semibold">Tarjeta digital</p>
                  <p className="text-sm text-zinc-600">
                    Sin tarjeta física.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-zinc-100 p-3 rounded-xl">
                ⚡
                <div>
                  <p className="font-semibold">Acceso rápido</p>
                  <p className="text-sm text-zinc-600">
                    Ingresa en segundos.
                  </p>
                </div>
              </div>

            </div>
          </section>

          {/* DERECHA */}
          <section className="rounded-3xl bg-white p-8 shadow-xl ring-1 ring-black/5">

            <h2 className="text-2xl font-bold mb-4">
              Bienvenido
            </h2>

            {/* CLIENTE */}
            <div className="bg-zinc-50 p-5 rounded-2xl mb-5">
              <h3 className="font-bold mb-2">Consultar mi tarjeta</h3>

              <form onSubmit={onSubmit} className="space-y-3">

                <input
                  type="text"
                  placeholder="Ej: alvaro pizero"
                  value={clienteInput}
                  onChange={(e) => setClienteInput(e.target.value)}
                  className="w-full border px-4 py-3 rounded-xl"
                />

                <button
                  type="submit"
                  disabled={buscando}
                  className="w-full bg-green-700 text-white py-3 rounded-xl font-semibold"
                >
                  {buscando ? "Ingresando..." : "Consultar mi tarjeta"}
                </button>

              </form>
            </div>

            {/* ADMIN */}
            <div className="bg-white p-5 rounded-2xl border">
              <h3 className="font-bold mb-2">Administrador</h3>

              <button
                onClick={irAdmin}
                className="w-full bg-black text-white py-3 rounded-xl font-semibold"
              >
                Ir al panel de administración
              </button>
            </div>

          </section>

        </div>
      </div>
    </main>
  );
}