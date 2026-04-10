"use client";

import { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

type EstadoCliente = {
  existe: boolean;
  nombre: string;
  visitas: number;
  premioDisponible: boolean;
};

export default function Home() {
  const [nombre, setNombre] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [canjeando, setCanjeando] = useState(false);
  const [estadoCliente, setEstadoCliente] = useState<EstadoCliente | null>(null);

  const obtenerEstadoCliente = async (nombreBase: string) => {
    const nombreLimpio = nombreBase.trim();

    if (!nombreLimpio) {
      setEstadoCliente(null);
      return;
    }

    const idCliente = nombreLimpio.toLowerCase();
    const clienteRef = doc(db, "clientes", idCliente);
    const clienteSnap = await getDoc(clienteRef);

    if (clienteSnap.exists()) {
      const data = clienteSnap.data();

      setEstadoCliente({
        existe: true,
        nombre: typeof data.nombre === "string" ? data.nombre : nombreLimpio,
        visitas: typeof data.visitas === "number" ? data.visitas : 0,
        premioDisponible:
          typeof data.premioDisponible === "boolean"
            ? data.premioDisponible
            : false,
      });
    } else {
      setEstadoCliente({
        existe: false,
        nombre: nombreLimpio,
        visitas: 0,
        premioDisponible: false,
      });
    }
  };

  useEffect(() => {
    const consultarCliente = async () => {
      const nombreLimpio = nombre.trim();

      if (!nombreLimpio) {
        setEstadoCliente(null);
        return;
      }

      setBuscando(true);

      try {
        await obtenerEstadoCliente(nombreLimpio);
      } catch (error) {
        console.error("Error al consultar cliente:", error);
        setEstadoCliente(null);
      } finally {
        setBuscando(false);
      }
    };

    const timeout = setTimeout(() => {
      consultarCliente();
    }, 300);

    return () => clearTimeout(timeout);
  }, [nombre]);

  const registrarVisita = async () => {
    const nombreLimpio = nombre.trim();

    if (!nombreLimpio) {
      alert("Escribe el nombre del cliente");
      return;
    }

    setGuardando(true);

    try {
      const idCliente = nombreLimpio.toLowerCase();
      const clienteRef = doc(db, "clientes", idCliente);
      const clienteSnap = await getDoc(clienteRef);

      if (!clienteSnap.exists()) {
        await setDoc(clienteRef, {
          nombre: nombreLimpio,
          visitas: 1,
          ultimaVisita: serverTimestamp(),
          creadoEn: serverTimestamp(),
          premioDisponible: false,
        });

        setEstadoCliente({
          existe: true,
          nombre: nombreLimpio,
          visitas: 1,
          premioDisponible: false,
        });

        alert("Cliente creado y primera visita registrada ✅");
      } else {
        const data = clienteSnap.data();
        const visitasActuales =
          typeof data.visitas === "number" ? data.visitas : 0;

        const nuevasVisitas = visitasActuales + 1;

        if (nuevasVisitas >= 5) {
          await updateDoc(clienteRef, {
            nombre: nombreLimpio,
            visitas: 0,
            ultimaVisita: serverTimestamp(),
            premioDisponible: true,
          });

          setEstadoCliente({
            existe: true,
            nombre: nombreLimpio,
            visitas: 0,
            premioDisponible: true,
          });

          alert("🎉 ¡Cliente ganó una pizza gratis! Conteo reiniciado a 0 🍕");
        } else {
          await updateDoc(clienteRef, {
            nombre: nombreLimpio,
            visitas: nuevasVisitas,
            ultimaVisita: serverTimestamp(),
            premioDisponible: false,
          });

          setEstadoCliente({
            existe: true,
            nombre: nombreLimpio,
            visitas: nuevasVisitas,
            premioDisponible: false,
          });

          alert(`Visita registrada ✅ Lleva ${nuevasVisitas} de 5`);
        }
      }
    } catch (error) {
      console.error("Error al registrar visita:", error);
      alert("Hubo un error al registrar la visita ❌");
    } finally {
      setGuardando(false);
    }
  };

  const canjearPremio = async () => {
    const nombreLimpio = nombre.trim();

    if (!nombreLimpio) {
      alert("Escribe el nombre del cliente");
      return;
    }

    if (!estadoCliente?.existe) {
      alert("El cliente no existe todavía");
      return;
    }

    if (!estadoCliente.premioDisponible) {
      alert("Este cliente no tiene premio disponible");
      return;
    }

    setCanjeando(true);

    try {
      const idCliente = nombreLimpio.toLowerCase();
      const clienteRef = doc(db, "clientes", idCliente);

      await updateDoc(clienteRef, {
        premioDisponible: false,
        premioCanjeadoEn: serverTimestamp(),
      });

      setEstadoCliente((prev) =>
        prev
          ? {
              ...prev,
              premioDisponible: false,
            }
          : prev
      );

      alert("Premio canjeado correctamente ✅");
      await obtenerEstadoCliente(nombreLimpio);
    } catch (error) {
      console.error("Error al canjear premio:", error);
      alert("Hubo un error al canjear el premio ❌");
    } finally {
      setCanjeando(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#d9d3b3] px-6">
      <h1 className="text-5xl font-bold text-red-900 text-center">
        Maza & Pizza 🍕
      </h1>

      <p className="mt-4 text-2xl text-gray-900 text-center">
        Sistema de fidelización
      </p>

      <div className="mt-10 w-full max-w-md">
        <input
          type="text"
          placeholder="Nombre del cliente"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="w-full rounded-xl border border-gray-400 bg-white px-4 py-3 text-lg text-gray-900 outline-none focus:border-green-700"
        />

        <button
          onClick={registrarVisita}
          disabled={guardando || canjeando}
          className="mt-4 w-full rounded-xl bg-green-800 px-8 py-4 text-2xl font-semibold text-white transition hover:bg-green-900 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {guardando ? "Guardando..." : "Registrar visita"}
        </button>

        {estadoCliente?.existe && estadoCliente.premioDisponible && (
          <button
            onClick={canjearPremio}
            disabled={guardando || canjeando}
            className="mt-3 w-full rounded-xl bg-red-700 px-8 py-4 text-xl font-semibold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {canjeando ? "Canjeando..." : "Canjear premio"}
          </button>
        )}

        <div className="mt-6 rounded-xl bg-white/70 p-4 text-center shadow-sm">
          {!nombre.trim() ? (
            <p className="text-gray-700">Escribe un nombre para consultar.</p>
          ) : buscando ? (
            <p className="text-gray-700">Buscando cliente...</p>
          ) : estadoCliente?.existe ? (
            <div className="space-y-2">
              <p className="text-lg font-semibold text-gray-900">
                Cliente: {estadoCliente.nombre}
              </p>
              <p className="text-gray-800">
                Visitas: <strong>{estadoCliente.visitas} / 5</strong>
              </p>
              {estadoCliente.premioDisponible ? (
                <p className="text-lg font-bold text-green-700">
                  🎉 Premio disponible: pizza gratis
                </p>
              ) : (
                <p className="text-gray-700">Aún no tiene premio disponible.</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-lg font-semibold text-gray-900">
                Cliente nuevo
              </p>
              <p className="text-gray-700">
                Al registrar la visita empezará con 1 de 5.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}