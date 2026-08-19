/**
 * NEXUS — Cliente de API / Conexión con Google Apps Script
 */
const API = {
  async post(datos) {
    if (typeof API_URL === 'undefined' || !API_URL || API_URL.includes("TU_WEB_APP_ID")) {
      console.warn("API_URL no configurada. Operando en modo local.");
      return { status: "success", offline: true, mensaje: "Modo fuera de línea activo" };
    }

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(datos)
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error de conexión con Google Sheets:", error);
      // Retornar respuesta simulada de éxito para no bloquear la app
      return { 
        status: "success", 
        offline: true, 
        mensaje: "No se pudo conectar con Google Sheets, datos procesados localmente." 
      };
    }
  },

  async get() {
    if (typeof API_URL === 'undefined' || !API_URL || API_URL.includes("TU_WEB_APP_ID")) {
      return { status: "success", offline: true, datos: [] };
    }

    try {
      const response = await fetch(API_URL);
      return await response.json();
    } catch (error) {
      console.error("Error al obtener datos:", error);
      return { status: "offline", datos: [] };
    }
  }
};
