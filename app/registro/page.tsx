"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const CLIENTE_STORAGE_KEY = "clienteId";

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

function limpiarTelefono(value: string) {
  return value.replace(/[^\d]/g, "");
}

export default function RegistroClientePage() {
  const router = useRouter();

  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [guardando, setGuardando] = useState(false);

  const slug = useMemo(() => slugify(nombre), [nombre]);

  async function registrarCliente(e: FormEvent) {
    e.preventDefault();

    const nombreLimpio = nombre.trim();
    const telefonoLimpio = limpiarTelefono(telefono);

    if (!nombreLimpio) {
      alert("Ingresa tu nombre.");
      return;
    }

    if (!slug) {
      alert("No se pudo generar tu identificador.");
      return;
    }

    if (!telefonoLimpio) {
      alert("Ingresa tu teléfono.");
      return;
    }

    try {
      setGuardando(true);

      const clienteRef = doc(db, "clientes", slug);
      const snap = await getDoc(clienteRef);

      if (snap.exists()) {
        try {
          localStorage.setItem(CLIENTE_STORAGE_KEY, slug);
        } catch (error) {
          console.error("Error guardando cliente en localStorage:", error);
        }

        alert("Ya tenías una tarjeta registrada. Te llevamos a tu tarjeta.");
        router.push(`/cliente/${slug}`);
        return;
      }

      await setDoc(clienteRef, {
        nombre: nombreLimpio,
        telefono: telefonoLimpio,
        visitas: 0,
        premioDisponible: false,
        ultimaVisita: null,
        premioCanjeadoEn: null,
        createdAt: serverTimestamp(),
      });

      try {
        localStorage.setItem(CLIENTE_STORAGE_KEY, slug);
      } catch (error) {
        console.error("Error guardando cliente en localStorage:", error);
      }

      alert("¡Registro exitoso!");
      router.push(`/cliente/${slug}`);
    } catch (error) {
      console.error("Error registrando cliente:", error);
      alert("No se pudo completar el registro.");
    } finally {
      setGuardando(false);
    }
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
              Registro de cliente
            </p>

            <p className="mt-2 text-sm text-zinc-500">
              Escaneaste el QR del negocio. Regístrate una sola vez y tu tarjeta
              quedará lista en este mismo celular.
            </p>

            <div className="mt-6 grid gap-3 text-left">
              <div className="flex items-center gap-3 rounded-xl bg-zinc-100 p-3">
                📱
                <div>
                  <p className="font-semibold">Registro rápido</p>
                  <p className="text-sm text-zinc-600">
                    Completa tus datos en segundos.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl bg-zinc-100 p-3">
                🎁
                <div>
                  <p className="font-semibold">Acumula visitas</p>
                  <p className="text-sm text-zinc-600">
                    Sigue tu progreso hacia tu premio.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl bg-zinc-100 p-3">
                ⚡
                <div>
                  <p className="font-semibold">Acceso automático</p>
                  <p className="text-sm text-zinc-600">
                    Tu tarjeta quedará guardada en este equipo.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-3xl bg-white p-8 shadow-xl ring-1 ring-black/5">
            <h2 className="mb-4 text-2xl font-bold">
              Completa tu registro
            </h2>

            <form onSubmit={registrarCliente} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Nombre
                </label>
                <input
                  type="text"
                  placeholder="Ej: Luis Campos"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none transition focus:border-zinc-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Teléfono
                </label>
                <input
                  type="tel"
                  placeholder="Ej: 987654321"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none transition focus:border-zinc-500"
                />
              </div>

              <div className="rounded-xl bg-zinc-50 p-4 text-sm text-zinc-600">
                <p className="font-semibold text-zinc-800">
                  Tu identificador:
                </p>
                <p className="mt-1 break-all">
                  {slug || "se-generará-automaticamente"}
                </p>
              </div>

              <button
                type="submit"
                disabled={guardando}
                className="w-full rounded-xl bg-green-700 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {guardando ? "Registrando..." : "Crear mi tarjeta"}
              </button>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}