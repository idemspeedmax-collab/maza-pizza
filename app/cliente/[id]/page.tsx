"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { QRCodeSVG } from "qrcode.react";
import { db } from "@/lib/firebase";

type Cliente = {
  nombre: string;
  visitas: number;
  premioDisponible: boolean;
};

export default function ClientePage() {
  const params = useParams();
  const id = String(params.id).toLowerCase();

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(true);

  const enlaceCliente = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/cliente/${id}`;
  }, [id]);

  const obtenerCliente = async () => {
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
      } else {
        setCliente(null);
      }
    } catch (error) {
      console.error(error);
      setCliente(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) obtenerCliente();
  }, [id]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-200 to-orange-300 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl p-6 text-center">
        <h1 className="text-3xl font-bold text-red-600">
          Maza & Pizza 🍕
        </h1>

        <p className="text-gray-600 mt-1 mb-4">
          Tu tarjeta de fidelidad
        </p>

        {loading ? (
          <p className="text-gray-500">Cargando...</p>
        ) : !cliente ? (
          <p className="text-red-600 font-semibold">
            Cliente no encontrado
          </p>
        ) : (
          <div className="space-y-5">
            <h2 className="text-2xl font-semibold text-gray-800">
              {cliente.nombre}
            </h2>

            <div className="bg-gray-100 rounded-xl p-4">
              <p className="text-gray-700 text-lg">Visitas</p>
              <p className="text-3xl font-bold text-green-700">
                {cliente.visitas} / 5
              </p>
            </div>

            {cliente.premioDisponible ? (
              <div className="bg-green-100 text-green-800 p-4 rounded-xl font-bold text-lg">
                🎉 ¡Tienes una pizza gratis!
              </div>
            ) : (
              <p className="text-gray-600">
                Sigue visitándonos para ganar tu pizza 🍕
              </p>
            )}

            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-sm font-semibold text-gray-700 mb-3">
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
          </div>
        )}
      </div>
    </main>
  );
}