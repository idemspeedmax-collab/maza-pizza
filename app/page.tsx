"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const ADMIN_KEY = "adminAuth";
const DEFAULT_ADMIN_PASSWORD = "1234";

export default function AdminLoginPage() {
  const router = useRouter();
  const [clave, setClave] = useState("");
  const [cargando, setCargando] = useState(false);
  const [verificando, setVerificando] = useState(true);

  useEffect(() => {
    try {
      const auth = localStorage.getItem(ADMIN_KEY);
      if (auth === "ok") {
        router.replace("/admin/clientes");
        return;
      }
    } catch (error) {
      console.error("Error verificando sesión admin:", error);
    } finally {
      setVerificando(false);
    }
  }, [router]);

  async function obtenerClaveAdmin() {
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
      console.error("Error obteniendo clave admin:", error);
      return DEFAULT_ADMIN_PASSWORD;
    }
  }

  async function ingresar() {
    if (!clave.trim()) {
      alert("Ingresa la clave.");
      return;
    }

    try {
      setCargando(true);

      const claveReal = await obtenerClaveAdmin();

      if (clave.trim() === claveReal) {
        localStorage.setItem(ADMIN_KEY, "ok");
        router.push("/admin/clientes");
      } else {
        alert("Clave incorrecta");
      }
    } catch (error) {
      console.error("Error iniciando sesión admin:", error);
      alert("No se pudo validar la clave.");
    } finally {
      setCargando(false);
    }
  }

  if (verificando) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-200 to-orange-300 px-4">
        <div className="w-full max-w-md rounded-2xl bg-white shadow-xl p-6 text-center">
          <p className="text-zinc-600">Verificando acceso...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-200 to-orange-300 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl p-6 text-center">
        <h1 className="text-2xl font-bold text-red-600">
          Acceso Administrador 🔐
        </h1>

        <p className="text-gray-600 mt-2 mb-5">
          Ingresa la clave para acceder al panel
        </p>

        <input
          type="password"
          placeholder="Clave"
          value={clave}
          onChange={(e) => setClave(e.target.value)}
          className="w-full border px-4 py-3 rounded-xl mb-4"
          onKeyDown={(e) => {
            if (e.key === "Enter") ingresar();
          }}
        />

        <button
          onClick={ingresar}
          disabled={cargando}
          className="w-full bg-black text-white py-3 rounded-xl font-semibold"
        >
          {cargando ? "Ingresando..." : "Entrar"}
        </button>
      </div>
    </main>
  );
}