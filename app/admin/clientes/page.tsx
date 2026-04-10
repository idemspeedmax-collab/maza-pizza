"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

type Cliente = {
  id: string;
  nombre: string;
  telefono?: string;
  visitas: number;
  premioDisponible: boolean;
  ultimaVisita?: Timestamp | null;
  premioCanjeadoEn?: Timestamp | null;
  createdAt?: Timestamp | null;
};

const ADMIN_KEY = "adminAuth";

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

function formatFecha(value?: Timestamp | null) {
  if (!value) return "—";
  try {
    return value.toDate().toLocaleString("es-PE");
  } catch {
    return "—";
  }
}

export default function AdminClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);

  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [slugManual, setSlugManual] = useState("");
  const [guardando, setGuardando] = useState(false);

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editTelefono, setEditTelefono] = useState("");
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);

  const [accionandoId, setAccionandoId] = useState<string | null>(null);

  const baseUrl = useMemo(() => {
    if (typeof window !== "undefined") return window.location.origin;
    return "http://localhost:3000";
  }, []);

  const slugGenerado = useMemo(() => slugify(nombre), [nombre]);
  const slugFinal = slugify(slugManual || slugGenerado);

  // 🔐 PROTECCIÓN ADMIN
  useEffect(() => {
    try {
      const auth = localStorage.getItem(ADMIN_KEY);
      if (auth !== "ok") {
        window.location.href = "/admin";
      }
    } catch (error) {
      console.error("Error validando admin:", error);
      window.location.href = "/admin";
    }
  }, []);

  async function cargarClientes() {
    try {
      setLoading(true);

      const q = query(collection(db, "clientes"), orderBy("nombre"));
      const snap = await getDocs(q);

      const data: Cliente[] = snap.docs.map((d) => {
        const x = d.data();
        return {
          id: d.id,
          nombre: x.nombre ?? "",
          telefono: x.telefono ?? "",
          visitas: Number(x.visitas ?? 0),
          premioDisponible: Boolean(x.premioDisponible ?? false),
          ultimaVisita: x.ultimaVisita ?? null,
          premioCanjeadoEn: x.premioCanjeadoEn ?? null,
          createdAt: x.createdAt ?? null,
        };
      });

      setClientes(data);
    } catch (error) {
      console.error("Error cargando clientes:", error);
      alert("No se pudieron cargar los clientes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargarClientes();
  }, []);

  async function crearCliente() {
    const nombreLimpio = nombre.trim();
    const telefonoLimpio = telefono.trim();
    const slug = slugFinal;

    if (!nombreLimpio) {
      alert("Ingresa el nombre del cliente.");
      return;
    }

    if (!slug) {
      alert("No se pudo generar el slug del cliente.");
      return;
    }

    try {
      setGuardando(true);

      const ref = doc(db, "clientes", slug);
      const existe = await getDoc(ref);

      if (existe.exists()) {
        alert("Ya existe un cliente con ese slug.");
        return;
      }

      await setDoc(ref, {
        nombre: nombreLimpio,
        telefono: telefonoLimpio,
        visitas: 0,
        premioDisponible: false,
        ultimaVisita: null,
        premioCanjeadoEn: null,
        createdAt: serverTimestamp(),
      });

      setNombre("");
      setTelefono("");
      setSlugManual("");

      await cargarClientes();
      alert("Cliente creado.");
    } catch (error) {
      console.error(error);
      alert("Error al crear cliente.");
    } finally {
      setGuardando(false);
    }
  }

  async function sumarVisita(cliente: Cliente) {
    try {
      setAccionandoId(cliente.id);

      const nuevasVisitas = cliente.visitas + 1;
      const ref = doc(db, "clientes", cliente.id);

      if (nuevasVisitas >= 5) {
        await updateDoc(ref, {
          visitas: 0,
          premioDisponible: true,
          ultimaVisita: serverTimestamp(),
        });
        alert("🎉 ¡Ganó premio!");
      } else {
        await updateDoc(ref, {
          visitas: nuevasVisitas,
          ultimaVisita: serverTimestamp(),
        });
      }

      await cargarClientes();
    } catch (error) {
      console.error(error);
      alert("Error registrando visita.");
    } finally {
      setAccionandoId(null);
    }
  }

  function cerrarSesion() {
    localStorage.removeItem(ADMIN_KEY);
    window.location.href = "/admin";
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-8 text-zinc-900">
      <div className="mx-auto max-w-6xl">

        {/* HEADER + LOGOUT */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">
              Panel de Clientes
            </h1>
            <p className="text-sm text-zinc-600">
              Administración
            </p>
          </div>

          <button
            onClick={cerrarSesion}
            className="bg-red-600 text-white px-4 py-2 rounded-xl font-semibold"
          >
            Cerrar sesión
          </button>
        </div>

        {/* CREAR CLIENTE */}
        <div className="bg-white p-5 rounded-xl mb-6">
          <input
            placeholder="Nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="border p-2 mr-2"
          />

          <button
            onClick={crearCliente}
            className="bg-black text-white px-4 py-2 rounded"
          >
            Crear
          </button>
        </div>

        {/* LISTA */}
        {loading ? (
          <p>Cargando...</p>
        ) : (
          <div className="grid gap-4">
            {clientes.map((c) => (
              <div key={c.id} className="bg-white p-4 rounded-xl">

                <h3 className="font-bold">{c.nombre}</h3>
                <p>Visitas: {c.visitas}</p>

                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => sumarVisita(c)}
                    className="bg-black text-white px-3 py-1 rounded"
                  >
                    + Visita
                  </button>

                  <Link href={`/cliente/${c.id}`}>
                    Ver tarjeta
                  </Link>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}