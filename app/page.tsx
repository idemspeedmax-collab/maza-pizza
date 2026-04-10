"use client";

import { useEffect, useMemo, useState } from "react";
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

const CLIENTE_STORAGE_KEY = "clienteId";

export default function HomePage() {
  const router = useRouter();
  const [clienteInput, setClienteInput] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [revisandoSesion, setRevisandoSesion] = useState(true);

  const slugCliente = useMemo(() => slugify(clienteInput), [clienteInput]);

  useEffect(() => {
    try {
      const clienteGuardado = localStorage.getItem(CLIENTE_STORAGE_KEY);

      if (clienteGuardado) {
        router.replace(`/cliente/${clienteGuardado}`);
        return;
      }
    } catch (error) {
      console.error("Error leyendo localStorage:", error);
    } finally {
      setRevisandoSesion(false);
    }
  }, [router]);

  function irATarjeta() {
    if (!slugCliente) {
      alert("Escribe tu nombre o identificador.");
      return;
    }

    setBuscando(true);

    try {
      localStorage.setItem(CLIENTE_STORAGE_KEY, slugCliente);
    } catch (error) {
      console.error("Error guardando cliente en localStorage:", error);
    }

    router.push(`/cliente/${slugCliente}`);
  }

  function irAdmin() {
    router.push("/admin");
  }

  function irARegistro() {
    router.push("/registro");
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    irATarjeta();
  }

  if (revisandoSesion) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-100 via-amber-100 to-orange-200 px-4 py-10">
        <div className="rounded-2xl bg-white px-6 py-5 shadow-lg text-center">
          <p className="text-lg font-semibold text-zinc-800">
            Cargando...
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            Verificando acceso del cliente
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-yellow-100 via-amber-100 to-orange-200 px-4 py-10 text-zinc-900">
      <div className="mx-auto flex min-h-[85vh] max-w-5xl items-center justify-center">
        <div className="grid w-full gap-6 md:grid-cols-2">
          <section className="rounded-3xl bg-white/90 p-8 shadow-xl ring-1 ring-black/5 backdrop-blur text-center">
            <div className="mb-4 flex justify-center">
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
              <div className="flex items-center gap-3 rounded-xl bg-zinc-100 p-3">
                🎁
                <div>
                  <p className="font-semibold">Premios por visitas</p>
                  <p className="text-sm text-zinc-600">
                    Gana una pizza gratis.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl bg-zinc-100 p-3">
                📱
                <div>
                  <p className="font-semibold">Tarjeta digital</p>
                  <p className="text-sm text-zinc-600">
                    Sin tarjeta física.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl bg-zinc-100 p-3">
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

          <section className="rounded-3xl bg-white p-8 shadow-xl ring-1 ring-black/5">
            <h2 className="mb-4 text-2xl font-bold">
              Bienvenido
            </h2>

            <div className="mb-5 rounded-2xl bg-zinc-50 p-5">
              <h3 className="mb-2 font-bold">Consultar mi tarjeta</h3>

              <form onSubmit={onSubmit} className="space-y-3">
                <input
                  type="text"
                  placeholder="Ej: alvaro pizero"
                  value={clienteInput}
                  onChange={(e) => setClienteInput(e.target.value)}
                  className="w-full rounded-xl border px-4 py-3"
                />

                <button
                  type="submit"
                  disabled={buscando}
                  className="w-full rounded-xl bg-green-700 py-3 font-semibold text-white"
                >
                  {buscando ? "Ingresando..." : "Consultar mi tarjeta"}
                </button>
              </form>
            </div>

            <div className="mb-5 rounded-2xl border bg-white p-5">
              <h3 className="mb-2 font-bold">¿Eres cliente nuevo?</h3>

              <p className="mb-3 text-sm text-zinc-600">
                Regístrate una sola vez y tu tarjeta quedará guardada en tu celular.
              </p>

              <button
                onClick={irARegistro}
                className="w-full rounded-xl bg-red-600 py-3 font-semibold text-white"
              >
                Registrarme
              </button>
            </div>

            <div className="rounded-2xl border bg-white p-5">
              <h3 className="mb-2 font-bold">Administrador</h3>

              <button
                onClick={irAdmin}
                className="w-full rounded-xl bg-black py-3 font-semibold text-white"
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