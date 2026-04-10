"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const ADMIN_KEY = "adminAuth";
const ADMIN_PASSWORD = "1234"; // 🔥 CAMBIA ESTO

export default function AdminLoginPage() {
  const router = useRouter();
  const [clave, setClave] = useState("");
  const [cargando, setCargando] = useState(false);

  function ingresar() {
    if (!clave) {
      alert("Ingresa la clave.");
      return;
    }

    setCargando(true);

    if (clave === ADMIN_PASSWORD) {
      localStorage.setItem(ADMIN_KEY, "ok");
      router.push("/admin/clientes");
    } else {
      alert("Clave incorrecta");
    }

    setCargando(false);
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