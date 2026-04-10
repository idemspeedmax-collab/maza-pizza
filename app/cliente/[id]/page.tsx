"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  Timestamp,
  where,
} from "firebase/firestore";
import { QRCodeSVG } from "qrcode.react";
import { db } from "@/lib/firebase";

type Cliente = {
  nombre: string;
  visitas: number;
  premioDisponible: boolean;
};

type Movimiento = {
  id: string;
  clienteId: string;
  clienteNombre: string;
  tipo: "visita" | "canje";
  visitasAntes: number;
  visitasDespues: number;
  premioActivado: boolean;
  createdAt?: Timestamp | null;
};

type Promocion = {
  titulo: string;
  descripcion: string;
  activa: boolean;
};

const CLIENTE_STORAGE_KEY = "clienteId";
const DEFAULT_VISITAS_PARA_PREMIO = 5;

function formatFecha(value?: Timestamp | null) {
  if (!value) return "—";
  try {
    return value.toDate().toLocaleString("es-PE");
  } catch {
    return "—";
  }
}

export default function ClientePage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id).toLowerCase();

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [promocion, setPromocion] = useState<Promocion | null>(null);
  const [visitasParaPremio, setVisitasParaPremio] = useState(
    DEFAULT_VISITAS_PARA_PREMIO
  );

  const [loading, setLoading] = useState(true);
  const [loadingMovimientos, setLoadingMovimientos] = useState(true);
  const [loadingPromocion, setLoadingPromocion] = useState(true);
  const [loadingReglas, setLoadingReglas] = useState(true);

  const enlaceCliente = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/cliente/${id}`;
  }, [id]);

  async function obtenerCliente() {
    try {
      const clienteRef = doc(db, "clientes", id);
      const snap = await getDoc(clienteRef);

      if (snap.exists()) {
        const data = snap.data();

        setCliente({
          nombre: data.nombre || id,
          visitas: data.visitas || 0,
          premioDisponible: data.premioDisponible || false,
        });

        try {
          localStorage.setItem(CLIENTE_STORAGE_KEY, id);
        } catch (error) {
          console.error("Error guardando cliente en localStorage:", error);
        }
      } else {
        setCliente(null);

        try {
          const guardado = localStorage.getItem(CLIENTE_STORAGE_KEY);
          if (guardado === id) {
            localStorage.removeItem(CLIENTE_STORAGE_KEY);
          }
        } catch (error) {
          console.error("Error limpiando localStorage:", error);
        }
      }
    } catch (error) {
      console.error(error);
      setCliente(null);
    }
  }

  async function obtenerMovimientos() {
    try {
      setLoadingMovimientos(true);

      const q = query(
        collection(db, "cliente_movimientos"),
        where("clienteId", "==", id)
      );

      const snap = await getDocs(q);

      const data: Movimiento[] = snap.docs.map((d) => {
        const x = d.data();
        return {
          id: d.id,
          clienteId: x.clienteId ?? "",
          clienteNombre: x.clienteNombre ?? "",
          tipo: x.tipo ?? "visita",
          visitasAntes: Number(x.visitasAntes ?? 0),
          visitasDespues: Number(x.visitasDespues ?? 0),
          premioActivado: Boolean(x.premioActivado ?? false),
          createdAt: x.createdAt ?? null,
        };
      });

      data.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() ?? 0;
        const bTime = b.createdAt?.toMillis?.() ?? 0;
        return bTime - aTime;
      });

      setMovimientos(data);
    } catch (error) {
      console.error("Error obteniendo movimientos del cliente:", error);
      setMovimientos([]);
    } finally {
      setLoadingMovimientos(false);
    }
  }

  async function obtenerPromocionActiva() {
    try {
      setLoadingPromocion(true);

      const promoRef = doc(db, "promociones", "activa");
      const snap = await getDoc(promoRef);

      if (!snap.exists()) {
        setPromocion(null);
        return;
      }

      const data = snap.data();

      if (!data?.activa) {
        setPromocion(null);
        return;
      }

      setPromocion({
        titulo: data.titulo || "Promoción especial",
        descripcion: data.descripcion || "",
        activa: Boolean(data.activa),
      });
    } catch (error) {
      console.error("Error obteniendo promoción activa:", error);
      setPromocion(null);
    } finally {
      setLoadingPromocion(false);
    }
  }

  async function obtenerReglas() {
    try {
      setLoadingReglas(true);

      const ref = doc(db, "configuracion", "reglas");
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        setVisitasParaPremio(DEFAULT_VISITAS_PARA_PREMIO);
        return;
      }

      const data = snap.data();
      const valor = Number(data?.visitasParaPremio ?? DEFAULT_VISITAS_PARA_PREMIO);

      setVisitasParaPremio(
        Number.isFinite(valor) && valor > 0
          ? Math.floor(valor)
          : DEFAULT_VISITAS_PARA_PREMIO
      );
    } catch (error) {
      console.error("Error obteniendo reglas:", error);
      setVisitasParaPremio(DEFAULT_VISITAS_PARA_PREMIO);
    } finally {
      setLoadingReglas(false);
    }
  }

  useEffect(() => {
    async function cargar() {
      try {
        setLoading(true);
        await Promise.all([
          obtenerCliente(),
          obtenerMovimientos(),
          obtenerPromocionActiva(),
          obtenerReglas(),
        ]);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      cargar();
    }
  }, [id]);

  function cambiarCliente() {
    try {
      localStorage.removeItem(CLIENTE_STORAGE_KEY);
    } catch (error) {
      console.error("Error eliminando cliente de localStorage:", error);
    }

    router.push("/");
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-yellow-200 to-orange-300 px-4 py-10">
      <div className="mx-auto w-full max-w-5xl">
        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <div className="rounded-2xl bg-white p-6 text-center shadow-xl">
            <h1 className="text-3xl font-bold text-red-600">
              Maza & Pizza 🍕
            </h1>

            <p className="mt-1 mb-4 text-gray-600">
              Tu tarjeta de fidelidad
            </p>

            {loading ? (
              <p className="text-gray-500">Cargando...</p>
            ) : !cliente ? (
              <div className="space-y-4">
                <p className="font-semibold text-red-600">
                  Cliente no encontrado
                </p>

                <button
                  onClick={cambiarCliente}
                  className="w-full rounded-xl bg-black py-3 font-semibold text-white"
                >
                  Volver al inicio
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                <h2 className="text-2xl font-semibold text-gray-800">
                  {cliente.nombre}
                </h2>

                <div className="rounded-xl bg-gray-100 p-4">
                  <p className="text-lg text-gray-700">Visitas</p>
                  <p className="text-3xl font-bold text-green-700">
                    {cliente.visitas} / {loadingReglas ? "..." : visitasParaPremio}
                  </p>
                </div>

                {cliente.premioDisponible ? (
                  <div className="rounded-2xl border-2 border-green-300 bg-gradient-to-r from-green-100 to-emerald-100 p-5 text-left shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="text-3xl">🎉</div>
                      <div>
                        <p className="text-xl font-extrabold text-green-800">
                          ¡Tienes una pizza gratis!
                        </p>
                        <p className="mt-1 text-sm text-green-700">
                          Acércate al local y reclama tu premio disponible.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-600">
                    Sigue visitándonos para ganar tu pizza 🍕
                  </p>
                )}

                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <p className="mb-3 text-sm font-semibold text-gray-700">
                    Tu código QR
                  </p>

                  <div className="flex justify-center">
                    {enlaceCliente ? (
                      <QRCodeSVG value={enlaceCliente} size={180} />
                    ) : (
                      <p className="text-gray-500">Generando QR...</p>
                    )}
                  </div>

                  <p className="mt-3 text-sm text-gray-600">
                    Muestra este código en tienda para identificar tu tarjeta.
                  </p>

                  <p className="mt-2 break-all text-xs text-gray-400">
                    {enlaceCliente}
                  </p>
                </div>

                <button
                  onClick={cambiarCliente}
                  className="w-full rounded-xl border border-gray-300 py-3 font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cambiar cliente
                </button>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl bg-white p-6 shadow-xl">
              <div className="mb-4">
                <h3 className="text-2xl font-bold text-zinc-900">
                  Promoción del día
                </h3>
                <p className="mt-1 text-sm text-zinc-600">
                  Revisa si hoy hay una promoción especial para ti.
                </p>
              </div>

              {loading || loadingPromocion ? (
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 text-sm text-zinc-500">
                  Cargando promoción...
                </div>
              ) : !promocion ? (
                <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-5 text-sm text-zinc-500">
                  Hoy no hay promoción publicada.
                </div>
              ) : (
                <div className="rounded-2xl border border-red-200 bg-gradient-to-r from-red-50 via-orange-50 to-yellow-50 p-5">
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">🔥</div>
                    <div>
                      <h4 className="text-xl font-extrabold text-red-700">
                        {promocion.titulo}
                      </h4>
                      <p className="mt-2 text-zinc-700">
                        {promocion.descripcion}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-xl">
              <div className="mb-4">
                <h3 className="text-2xl font-bold text-zinc-900">
                  Mi historial
                </h3>
                <p className="mt-1 text-sm text-zinc-600">
                  Aquí puedes ver tus visitas registradas y tus canjes.
                </p>
              </div>

              {loading || loadingMovimientos ? (
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 text-sm text-zinc-500">
                  Cargando historial...
                </div>
              ) : !cliente ? (
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 text-sm text-zinc-500">
                  No se pudo cargar el historial porque el cliente no existe.
                </div>
              ) : movimientos.length === 0 ? (
                <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center text-zinc-500">
                  Aún no tienes movimientos registrados.
                </div>
              ) : (
                <div className="space-y-3">
                  {movimientos.map((mov) => (
                    <div
                      key={mov.id}
                      className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            {mov.tipo === "visita" ? (
                              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                                Visita
                              </span>
                            ) : (
                              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                                Canje
                              </span>
                            )}

                            {mov.premioActivado && (
                              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                                Premio activado
                              </span>
                            )}
                          </div>

                          <p className="mt-3 text-sm text-zinc-600">
                            Fecha:{" "}
                            <span className="font-medium text-zinc-800">
                              {formatFecha(mov.createdAt)}
                            </span>
                          </p>
                        </div>

                        <div className="rounded-xl bg-white px-4 py-3 text-sm text-zinc-700">
                          <p>
                            <span className="font-semibold">Antes:</span>{" "}
                            {mov.visitasAntes}
                          </p>
                          <p>
                            <span className="font-semibold">Después:</span>{" "}
                            {mov.visitasDespues}
                          </p>
                        </div>
                      </div>

                      {mov.tipo === "visita" ? (
                        <p className="mt-3 text-sm text-zinc-700">
                          Se registró una visita en tu tarjeta.
                        </p>
                      ) : (
                        <p className="mt-3 text-sm text-zinc-700">
                          Se registró el canje de tu premio.
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}