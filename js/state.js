/**
 * NEXUS — Estado global ligero
 * -------------------------------------------------------------------------
 * Caché en memoria de lo que varios módulos necesitan leer (empleados,
 * parámetros, novedades del período activo). No sustituye a la API: solo
 * evita pedir lo mismo dos veces mientras el usuario navega entre módulos
 * en la misma sesión. Se limpia al cambiar de empresa o cerrar sesión.
 */
const State = (() => {
  let datos = {
    empresaActual: null,
    empleados: null,
    novedades: null,
    parametros: null,
    planillaEnCurso: null, // planilla que se está armando en el módulo de planilla
    asistente: { abierto: false, historial: [] },
  };

  function reset() {
    datos = { empresaActual: null, empleados: null, novedades: null, parametros: null, planillaEnCurso: null, asistente: { abierto: false, historial: [] } };
  }

  function get(clave) { return datos[clave]; }
  function set(clave, valor) { datos[clave] = valor; return valor; }

  function agregarMensajeAsistente(mensaje) {
    datos.asistente.historial.push({ ...mensaje, fecha: new Date().toISOString() });
    return datos.asistente.historial;
  }

  return { get, set, reset, agregarMensajeAsistente };
})();
