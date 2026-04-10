"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
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

const ADMIN_KEY = "adminAuth";
const DEFAULT_ADMIN_PASSWORD = "1234";

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

function esHoy(value?: Timestamp | null) {
  if (!value) return false;

  try {
    const fecha = value.toDate();
    const ahora = new Date();

    return (
      fecha.getFullYear() === ahora.getFullYear() &&
      fecha.getMonth() === ahora.getMonth() &&
      fecha.getDate() === ahora.getDate()
    );
  } catch {
    return false;
  }
}

export default function AdminClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMovimientos, setLoadingMovimientos] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [slugManual, setSlugManual] = useState("");
  const [guardando, setGuardando] = useState(false);

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editTelefono, setEditTelefono] = useState("");
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);

  const [accionandoId, setAccionandoId] = useState<string | null>(null);

  const [promoTitulo, setPromoTitulo] = useState("");
  const [promoDescripcion, setPromoDescripcion] = useState("");
  const [promoActiva, setPromoActiva] = useState(false);
  const [cargandoPromo, setCargandoPromo] = useState(true);
  const [guardandoPromo, setGuardandoPromo] = useState(false);

  const [claveActual, setClaveActual] = useState("");
  const [nuevaClave, setNuevaClave] = useState("");
  const [confirmarClave, setConfirmarClave] = useState("");
  const [guardandoClave, setGuardandoClave] = useState(false);
  const [cargandoConfigAdmin, setCargandoConfigAdmin] = useState(true);

  const baseUrl = useMemo(() => {
    if (typeof window !== "undefined") return window.location.origin;
    return "http://localhost:3000";
  }, []);

  const slugGenerado = useMemo(() => slugify(nombre), [nombre]);
  const slugFinal = slugify(slugManual || slugGenerado);

  const totalClientes = clientes.length;
  const premiosActivos = clientes.filter((c) => c.premioDisponible).length;
  const visitasHoy = movimientos.filter(
    (m) => m.tipo === "visita" && esHoy(m.createdAt)
  ).length;

  useEffect(() => {
    try {
      const auth = localStorage.getItem(ADMIN_KEY);

      if (auth !== "ok") {
        window.location.href = "/admin";
        return;
      }

      setAuthChecked(true);
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

  async function cargarMovimientos() {
    try {
      setLoadingMovimientos(true);

      const q = query(
        collection(db, "cliente_movimientos"),
        orderBy("createdAt", "desc"),
        limit(50)
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

      setMovimientos(data);
    } catch (error) {
      console.error("Error cargando movimientos:", error);
    } finally {
      setLoadingMovimientos(false);
    }
  }

  async function cargarPromocion() {
    try {
      setCargandoPromo(true);

      const promoRef = doc(db, "promociones", "activa");
      const snap = await getDoc(promoRef);

      if (!snap.exists()) {
        setPromoTitulo("");
        setPromoDescripcion("");
        setPromoActiva(false);
        return;
      }

      const data = snap.data();

      setPromoTitulo(data?.titulo ?? "");
      setPromoDescripcion(data?.descripcion ?? "");
      setPromoActiva(Boolean(data?.activa ?? false));
    } catch (error) {
      console.error("Error cargando promoción:", error);
    } finally {
      setCargandoPromo(false);
    }
  }

  async function cargarConfigAdmin() {
    try {
      setCargandoConfigAdmin(true);
      await getDoc(doc(db, "configuracion", "admin"));
    } catch (error) {
      console.error("Error cargando configuración admin:", error);
    } finally {
      setCargandoConfigAdmin(false);
    }
  }

  useEffect(() => {
    if (!authChecked) return;
    cargarClientes();
    cargarMovimientos();
    cargarPromocion();
    cargarConfigAdmin();
  }, [authChecked]);

  async function obtenerClaveAdminGuardada() {
    try {
      const ref = doc(db, "configuracion", "admin");
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        return DEFAULT_ADMIN_PASSWORD;
      }

      const data = snap.data();
      return typeof data?.adminPassword === "string" && data.adminPassword.trim()
        ? data.adminPassword.trim()
        : DEFAULT_ADMIN_PASSWORD;
    } catch (error) {
      console.error("Error obteniendo clave admin guardada:", error);
      return DEFAULT_ADMIN_PASSWORD;
    }
  }

  async function registrarMovimiento(data: {
    clienteId: string;
    clienteNombre: string;
    tipo: "visita" | "canje";
    visitasAntes: number;
    visitasDespues: number;
    premioActivado: boolean;
  }) {
    await addDoc(collection(db, "cliente_movimientos"), {
      clienteId: data.clienteId,
      clienteNombre: data.clienteNombre,
      tipo: data.tipo,
      visitasAntes: data.visitasAntes,
      visitasDespues: data.visitasDespues,
      premioActivado: data.premioActivado,
      createdAt: serverTimestamp(),
    });
  }

  async function guardarPromocion() {
    const titulo = promoTitulo.trim();
    const descripcion = promoDescripcion.trim();

    if (promoActiva) {
      if (!titulo) {
        alert("Ingresa el título de la promoción.");
        return;
      }

      if (!descripcion) {
        alert("Ingresa la descripción de la promoción.");
        return;
      }
    }

    try {
      setGuardandoPromo(true);

      await setDoc(
        doc(db, "promociones", "activa"),
        {
          titulo,
          descripcion,
          activa: promoActiva,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      alert("Promoción actualizada correctamente.");
      await cargarPromocion();
    } catch (error) {
      console.error("Error guardando promoción:", error);
      alert("No se pudo guardar la promoción.");
    } finally {
      setGuardandoPromo(false);
    }
  }

  async function cambiarClaveAdmin() {
    const actual = claveActual.trim();
    const nueva = nuevaClave.trim();
    const confirmar = confirmarClave.trim();

    if (!actual || !nueva || !confirmar) {
      alert("Completa los tres campos de clave.");
      return;
    }

    if (nueva.length < 4) {
      alert("La nueva clave debe tener al menos 4 caracteres.");
      return;
    }

    if (nueva !== confirmar) {
      alert("La confirmación no coincide con la nueva clave.");
      return;
    }

    try {
      setGuardandoClave(true);

      const claveGuardada = await obtenerClaveAdminGuardada();

      if (actual !== claveGuardada) {
        alert("La clave actual no es correcta.");
        return;
      }

      await setDoc(
        doc(db, "configuracion", "admin"),
        {
          adminPassword: nueva,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setClaveActual("");
      setNuevaClave("");
      setConfirmarClave("");

      alert("Clave del panel actualizada correctamente.");
      await cargarConfigAdmin();
    } catch (error) {
      console.error("Error cambiando clave admin:", error);
      alert("No se pudo actualizar la clave.");
    } finally {
      setGuardandoClave(false);
    }
  }

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
        alert("Ya existe un cliente con ese slug. Usa otro nombre o cámbialo.");
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

      await Promise.all([cargarClientes(), cargarMovimientos()]);
      alert("Cliente creado correctamente.");
    } catch (error) {
      console.error("Error creando cliente:", error);
      alert("No se pudo crear el cliente.");
    } finally {
      setGuardando(false);
    }
  }

  function iniciarEdicion(cliente: Cliente) {
    setEditandoId(cliente.id);
    setEditNombre(cliente.nombre || "");
    setEditTelefono(cliente.telefono || "");
  }

  function cancelarEdicion() {
    setEditandoId(null);
    setEditNombre("");
    setEditTelefono("");
  }

  async function guardarEdicion(clienteId: string) {
    const nombreLimpio = editNombre.trim();
    const telefonoLimpio = editTelefono.trim();

    if (!nombreLimpio) {
      alert("El nombre no puede estar vacío.");
      return;
    }

    try {
      setGuardandoEdicion(true);

      await updateDoc(doc(db, "clientes", clienteId), {
        nombre: nombreLimpio,
        telefono: telefonoLimpio,
      });

      cancelarEdicion();
      await cargarClientes();
      alert("Cliente actualizado correctamente.");
    } catch (error) {
      console.error("Error actualizando cliente:", error);
      alert("No se pudo actualizar el cliente.");
    } finally {
      setGuardandoEdicion(false);
    }
  }

  async function eliminarCliente(cliente: Cliente) {
    const ok = window.confirm(
      `¿Seguro que deseas eliminar a "${cliente.nombre}"?\n\nEsta acción no se puede deshacer.`
    );

    if (!ok) return;

    try {
      setAccionandoId(cliente.id);

      await deleteDoc(doc(db, "clientes", cliente.id));

      if (editandoId === cliente.id) {
        cancelarEdicion();
      }

      await cargarClientes();
      alert(`Cliente "${cliente.nombre}" eliminado correctamente.`);
    } catch (error) {
      console.error("Error eliminando cliente:", error);
      alert("No se pudo eliminar el cliente.");
    } finally {
      setAccionandoId(null);
    }
  }

  async function sumarVisita(cliente: Cliente) {
    try {
      setAccionandoId(cliente.id);

      const visitasAntes = Number(cliente.visitas ?? 0);
      const nuevasVisitas = visitasAntes + 1;
      const ref = doc(db, "clientes", cliente.id);

      if (nuevasVisitas >= 5) {
        await updateDoc(ref, {
          visitas: 0,
          premioDisponible: true,
          ultimaVisita: serverTimestamp(),
        });

        await registrarMovimiento({
          clienteId: cliente.id,
          clienteNombre: cliente.nombre,
          tipo: "visita",
          visitasAntes,
          visitasDespues: 0,
          premioActivado: true,
        });

        alert(`¡${cliente.nombre} ganó una pizza!`);
      } else {
        await updateDoc(ref, {
          visitas: nuevasVisitas,
          ultimaVisita: serverTimestamp(),
        });

        await registrarMovimiento({
          clienteId: cliente.id,
          clienteNombre: cliente.nombre,
          tipo: "visita",
          visitasAntes,
          visitasDespues: nuevasVisitas,
          premioActivado: false,
        });
      }

      await Promise.all([cargarClientes(), cargarMovimientos()]);
    } catch (error) {
      console.error("Error sumando visita:", error);
      alert("No se pudo registrar la visita.");
    } finally {
      setAccionandoId(null);
    }
  }

  async function canjearPremio(cliente: Cliente) {
    if (!cliente.premioDisponible) {
      alert("Este cliente aún no tiene premio disponible.");
      return;
    }

    try {
      setAccionandoId(cliente.id);

      await updateDoc(doc(db, "clientes", cliente.id), {
        premioDisponible: false,
        premioCanjeadoEn: serverTimestamp(),
      });

      await registrarMovimiento({
        clienteId: cliente.id,
        clienteNombre: cliente.nombre,
        tipo: "canje",
        visitasAntes: Number(cliente.visitas ?? 0),
        visitasDespues: Number(cliente.visitas ?? 0),
        premioActivado: false,
      });

      await Promise.all([cargarClientes(), cargarMovimientos()]);
      alert(`Premio canjeado para ${cliente.nombre}.`);
    } catch (error) {
      console.error("Error canjeando premio:", error);
      alert("No se pudo canjear el premio.");
    } finally {
      setAccionandoId(null);
    }
  }

  async function copiarLink(id: string) {
    const link = `${baseUrl}/cliente/${id}`;

    try {
      await navigator.clipboard.writeText(link);
      alert("Link copiado:\n" + link);
    } catch (error) {
      console.error("Error copiando link:", error);
      alert("No se pudo copiar el link.");
    }
  }

  function abrirWhatsApp(cliente: Cliente) {
    const telefonoCliente = (cliente.telefono || "").trim();

    if (!telefonoCliente) {
      alert("Este cliente no tiene número registrado.");
      return;
    }

    const link = `${baseUrl}/cliente/${cliente.id}`;

    const mensaje = `Hola ${cliente.nombre} 👋

Aquí tienes tu tarjeta de cliente de Maza & Pizza 🍕

${link}

¡Ya llevas ${cliente.visitas} visitas! 🔥`;

    const url = `https://wa.me/${telefonoCliente}?text=${encodeURIComponent(
      mensaje
    )}`;

    window.open(url, "_blank");
  }

  function cerrarSesion() {
    try {
      localStorage.removeItem(ADMIN_KEY);
    } catch (error) {
      console.error("Error cerrando sesión admin:", error);
    }

    window.location.href = "/admin";
  }

  if (!authChecked) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-zinc-50 px-4 py-8 text-zinc-900">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-500 shadow-sm">
          Verificando acceso...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-8 text-zinc-900">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Panel de Clientes
            </h1>
            <p className="mt-2 text-sm text-zinc-600">
              Administra visitas, premios, clientes y promociones.
            </p>
          </div>

          <button
            onClick={cerrarSesion}
            className="shrink-0 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Cerrar sesión
          </button>
        </div>

        <section className="mb-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-zinc-500">Clientes totales</p>
            <p className="mt-2 text-3xl font-extrabold text-zinc-900">
              {loading ? "..." : totalClientes}
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-zinc-500">Premios activos</p>
            <p className="mt-2 text-3xl font-extrabold text-green-700">
              {loading ? "..." : premiosActivos}
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-zinc-500">Visitas de hoy</p>
            <p className="mt-2 text-3xl font-extrabold text-blue-700">
              {loadingMovimientos ? "..." : visitasHoy}
            </p>
          </div>
        </section>

        <section className="mb-8 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold">Seguridad del panel</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Cambia la clave de acceso del administrador.
          </p>

          {cargandoConfigAdmin ? (
            <div className="mt-5 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-500">
              Cargando configuración...
            </div>
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-4">
              <div className="md:col-span-1">
                <label className="mb-2 block text-sm font-medium">
                  Clave actual
                </label>
                <input
                  type="password"
                  value={claveActual}
                  onChange={(e) => setClaveActual(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 outline-none transition focus:border-zinc-500"
                />
              </div>

              <div className="md:col-span-1">
                <label className="mb-2 block text-sm font-medium">
                  Nueva clave
                </label>
                <input
                  type="password"
                  value={nuevaClave}
                  onChange={(e) => setNuevaClave(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 outline-none transition focus:border-zinc-500"
                />
              </div>

              <div className="md:col-span-1">
                <label className="mb-2 block text-sm font-medium">
                  Confirmar clave
                </label>
                <input
                  type="password"
                  value={confirmarClave}
                  onChange={(e) => setConfirmarClave(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 outline-none transition focus:border-zinc-500"
                />
              </div>

              <div className="md:col-span-1 flex items-end">
                <button
                  onClick={cambiarClaveAdmin}
                  disabled={guardandoClave}
                  className="w-full rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {guardandoClave ? "Guardando..." : "Actualizar clave"}
                </button>
              </div>
            </div>
          )}
        </section>

        <section className="mb-8 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold">Promoción activa</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Edita la promoción que verán los clientes en su tarjeta.
          </p>

          {cargandoPromo ? (
            <div className="mt-5 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-500">
              Cargando promoción...
            </div>
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-4">
              <div className="md:col-span-1">
                <label className="mb-2 block text-sm font-medium">
                  Título
                </label>
                <input
                  type="text"
                  placeholder="Ej: 🔥 Promo del día"
                  value={promoTitulo}
                  onChange={(e) => setPromoTitulo(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 outline-none transition focus:border-zinc-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium">
                  Descripción
                </label>
                <input
                  type="text"
                  placeholder="Ej: Por la compra de una pizza, llévate pan al ajo especial."
                  value={promoDescripcion}
                  onChange={(e) => setPromoDescripcion(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 outline-none transition focus:border-zinc-500"
                />
              </div>

              <div className="md:col-span-1 flex flex-col justify-end gap-3">
                <label className="flex items-center gap-3 rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={promoActiva}
                    onChange={(e) => setPromoActiva(e.target.checked)}
                    className="h-4 w-4"
                  />
                  Promo activa
                </label>

                <button
                  onClick={guardarPromocion}
                  disabled={guardandoPromo}
                  className="w-full rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {guardandoPromo ? "Guardando..." : "Guardar promoción"}
                </button>
              </div>
            </div>
          )}
        </section>

        <section className="mb-8 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold">Crear cliente</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Registra un nuevo cliente y genera su tarjeta digital.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-4">
            <div className="md:col-span-1">
              <label className="mb-2 block text-sm font-medium">
                Nombre del cliente
              </label>
              <input
                type="text"
                placeholder="Ej: Luis Campos"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 outline-none transition focus:border-zinc-500"
              />
            </div>

            <div className="md:col-span-1">
              <label className="mb-2 block text-sm font-medium">
                Teléfono
              </label>
              <input
                type="text"
                placeholder="Ej: 51987654321"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 outline-none transition focus:border-zinc-500"
              />
            </div>

            <div className="md:col-span-1">
              <label className="mb-2 block text-sm font-medium">
                Slug / identificador
              </label>
              <input
                type="text"
                placeholder="Ej: luis-campos"
                value={slugManual || slugGenerado}
                onChange={(e) => setSlugManual(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 outline-none transition focus:border-zinc-500"
              />
              <p className="mt-2 text-xs text-zinc-500">
                URL final: /cliente/{slugFinal || "slug-del-cliente"}
              </p>
            </div>

            <div className="md:col-span-1 flex items-end">
              <button
                onClick={crearCliente}
                disabled={guardando}
                className="w-full rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {guardando ? "Creando..." : "Crear cliente"}
              </button>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Clientes registrados</h2>
            <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-sm text-zinc-600 shadow-sm">
              {clientes.length} cliente{clientes.length === 1 ? "" : "s"}
            </span>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-500 shadow-sm">
              Cargando clientes...
            </div>
          ) : clientes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center text-zinc-500">
              Aún no hay clientes registrados.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {clientes.map((cliente) => {
                const linkCliente = `${baseUrl}/cliente/${cliente.id}`;
                const ocupando = accionandoId === cliente.id;
                const enEdicion = editandoId === cliente.id;

                return (
                  <article
                    key={cliente.id}
                    className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
                  >
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        {enEdicion ? (
                          <div className="space-y-3">
                            <div>
                              <label className="mb-1 block text-xs font-medium text-zinc-600">
                                Nombre
                              </label>
                              <input
                                type="text"
                                value={editNombre}
                                onChange={(e) => setEditNombre(e.target.value)}
                                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-zinc-500"
                              />
                            </div>

                            <div>
                              <label className="mb-1 block text-xs font-medium text-zinc-600">
                                Teléfono
                              </label>
                              <input
                                type="text"
                                value={editTelefono}
                                onChange={(e) => setEditTelefono(e.target.value)}
                                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-zinc-500"
                              />
                            </div>

                            <p className="text-xs text-zinc-500">
                              ID: {cliente.id}
                            </p>
                          </div>
                        ) : (
                          <>
                            <h3 className="text-lg font-bold break-words">
                              {cliente.nombre}
                            </h3>
                            <p className="mt-1 text-xs text-zinc-500">
                              ID: {cliente.id}
                            </p>
                            <p className="mt-1 text-xs text-zinc-500">
                              Tel: {cliente.telefono || "—"}
                            </p>
                          </>
                        )}
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                          cliente.premioDisponible
                            ? "bg-green-100 text-green-700"
                            : "bg-zinc-100 text-zinc-600"
                        }`}
                      >
                        {cliente.premioDisponible
                          ? "Premio disponible"
                          : "Sin premio"}
                      </span>
                    </div>

                    {!enEdicion && (
                      <>
                        <div className="space-y-2 text-sm text-zinc-700">
                          <p>
                            <span className="font-semibold">Visitas:</span>{" "}
                            {cliente.visitas} / 5
                          </p>
                          <p>
                            <span className="font-semibold">Última visita:</span>{" "}
                            {formatFecha(cliente.ultimaVisita)}
                          </p>
                          <p>
                            <span className="font-semibold">Premio canjeado:</span>{" "}
                            {formatFecha(cliente.premioCanjeadoEn)}
                          </p>
                        </div>

                        <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs break-all text-zinc-600">
                          {linkCliente}
                        </div>
                      </>
                    )}

                    {enEdicion ? (
                      <div className="mt-5 grid grid-cols-2 gap-2">
                        <button
                          onClick={() => guardarEdicion(cliente.id)}
                          disabled={guardandoEdicion}
                          className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {guardandoEdicion ? "Guardando..." : "Guardar"}
                        </button>

                        <button
                          onClick={cancelarEdicion}
                          disabled={guardandoEdicion}
                          className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <div className="mt-5 grid grid-cols-2 gap-2">
                        <button
                          onClick={() => sumarVisita(cliente)}
                          disabled={ocupando}
                          className="rounded-xl bg-black px-3 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {ocupando ? "Procesando..." : "+ Visita"}
                        </button>

                        <button
                          onClick={() => canjearPremio(cliente)}
                          disabled={ocupando || !cliente.premioDisponible}
                          className="rounded-xl bg-amber-500 px-3 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Canjear
                        </button>

                        <button
                          onClick={() => copiarLink(cliente.id)}
                          className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium hover:bg-zinc-50"
                        >
                          Copiar link
                        </button>

                        <button
                          onClick={() => abrirWhatsApp(cliente)}
                          className="rounded-xl bg-green-600 px-3 py-2 text-sm font-medium text-white hover:opacity-90"
                        >
                          WhatsApp
                        </button>

                        <Link
                          href={`/cliente/${cliente.id}`}
                          className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-center text-sm font-medium hover:bg-zinc-50"
                        >
                          Ver tarjeta
                        </Link>

                        <button
                          onClick={() => iniciarEdicion(cliente)}
                          disabled={ocupando}
                          className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Editar
                        </button>

                        <button
                          onClick={() => eliminarCliente(cliente)}
                          disabled={ocupando}
                          className="col-span-2 rounded-xl bg-red-600 px-3 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Eliminar
                        </button>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Movimientos recientes</h2>
            <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-sm text-zinc-600 shadow-sm">
              {movimientos.length} registro{movimientos.length === 1 ? "" : "s"}
            </span>
          </div>

          {loadingMovimientos ? (
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-500 shadow-sm">
              Cargando movimientos...
            </div>
          ) : movimientos.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center text-zinc-500">
              Aún no hay movimientos registrados.
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-zinc-100 text-zinc-700">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Fecha</th>
                      <th className="px-4 py-3 text-left font-semibold">Cliente</th>
                      <th className="px-4 py-3 text-left font-semibold">Tipo</th>
                      <th className="px-4 py-3 text-left font-semibold">Antes</th>
                      <th className="px-4 py-3 text-left font-semibold">Después</th>
                      <th className="px-4 py-3 text-left font-semibold">Premio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movimientos.map((mov) => (
                      <tr key={mov.id} className="border-t border-zinc-200">
                        <td className="px-4 py-3">{formatFecha(mov.createdAt)}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-zinc-800">
                            {mov.clienteNombre || mov.clienteId}
                          </div>
                          <div className="text-xs text-zinc-500">
                            {mov.clienteId}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {mov.tipo === "visita" ? (
                            <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">
                              Visita
                            </span>
                          ) : (
                            <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">
                              Canje
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">{mov.visitasAntes}</td>
                        <td className="px-4 py-3">{mov.visitasDespues}</td>
                        <td className="px-4 py-3">
                          {mov.premioActivado ? (
                            <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
                              Activado
                            </span>
                          ) : (
                            <span className="text-zinc-500">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}