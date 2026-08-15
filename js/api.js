/**
 * NEXUS — Capa API centralizada
 * -------------------------------------------------------------------------
 * Todo el frontend habla con Apps Script SOLAMENTE a través de este
 * archivo. Ningún módulo hace fetch() por su cuenta (sección 26 del
 * brief: nada de lógica de comunicación duplicada).
 *
 * Maneja:
 *  - Armado de URLs GET y bodies POST según NEXUS_CONFIG.
 *  - Errores de red / API caída (sección 23).
 *  - Endpoints que todavía no existen en el backend: en vez de intentar
 *    llamarlos y fallar de forma confusa, api.js los detecta ANTES de
 *    salir a la red y devuelve un error claro y tipado.
 *  - Un caché muy simple en memoria para los catálogos GET más consultados,
 *    para no golpear la API repetidamente al cambiar de módulo.
 */
const Api = (() => {
  const cache = new Map();

  class ApiError extends Error {
    constructor(message, tipo = 'ERROR_API', detalle = null) {
      super(message);
      this.tipo = tipo; // 'ERROR_RED' | 'ERROR_API' | 'ENDPOINT_PENDIENTE'
      this.detalle = detalle;
    }
  }

  function construirUrlGet(recurso, params = {}) {
    const url = new URL(NEXUS_CONFIG.WEB_APP_URL);
    url.searchParams.set(NEXUS_CONFIG.PARAM_GET, recurso);
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
    });
    return url.toString();
  }

  // Apps Script puede leer campos desde e.parameter con nombres heredados.
  // Conservamos el dato original y agregamos alias sin exponer credenciales.
  function datosCompatibles(datos = {}) {
    const salida = {};
    Object.entries(datos).forEach(([clave, valor]) => {
      if (valor === undefined || valor === null) return;
      salida[clave] = valor;
      salida[clave.charAt(0).toLowerCase() + clave.slice(1)] = valor;
      salida[clave.charAt(0).toUpperCase() + clave.slice(1)] = valor;
    });

    const asignarAlias = (nombres) => {
      const valor = nombres.map((nombre) => salida[nombre]).find((item) => item !== undefined);
      if (valor !== undefined) nombres.forEach((nombre) => { salida[nombre] = valor; });
    };
    asignarAlias(['contrasena', 'Contrasena', 'password', 'Password']);
    asignarAlias(['nombre', 'Nombre']);
    asignarAlias(['correo', 'Correo', 'email', 'Email']);
    asignarAlias(['empresa', 'Empresa', 'nombreEmpresa', 'NombreEmpresa']);
    asignarAlias(['idEmpresa', 'IDEmpresa', 'ID_Empresa']);
    return salida;
  }

  function serializarFormulario(datos) {
    const formulario = new URLSearchParams();
    Object.entries(datos).forEach(([clave, valor]) => {
      formulario.set(clave, typeof valor === 'object' ? JSON.stringify(valor) : String(valor));
    });
    return formulario;
  }

  async function get(recurso, params = {}, { useCache = true } = {}) {
    const cacheKey = recurso + JSON.stringify(params);
    if (useCache && cache.has(cacheKey)) {
      const { ts, data } = cache.get(cacheKey);
      if (Date.now() - ts < NEXUS_CONFIG.CACHE_TTL_MS) return data;
    }

    let res;
    try {
      res = await fetch(construirUrlGet(recurso, params), { method: 'GET' });
    } catch (e) {
      throw new ApiError('No se pudo conectar con el servidor de NEXUS. Verifica tu conexión a internet.', 'ERROR_RED', e);
    }

    if (!res.ok) {
      throw new ApiError(`El servidor respondió con un error (${res.status}) al consultar "${recurso}".`, 'ERROR_API');
    }

    let data;
    try {
      data = await res.json();
    } catch (e) {
      throw new ApiError(`La respuesta de "${recurso}" no tiene un formato JSON válido.`, 'ERROR_API', e);
    }

    if (useCache) cache.set(cacheKey, { ts: Date.now(), data });
    return data;
  }

  async function post(accion, datos = {}) {
    // Si la acción está en la lista de pendientes conocidos, no se dispara
    // la llamada: se informa de inmediato que falta el endpoint, tal como
    // pide el brief ("Este proceso requiere un nuevo endpoint en Apps Script").
    const pendientes = Object.values(NEXUS_CONFIG.PENDING_ACTIONS);
    if (pendientes.includes(accion)) {
      throw new ApiError(
        `La acción "${accion}" todavía no existe en el backend de Apps Script. ` +
        `Este proceso requiere un nuevo endpoint en Apps Script antes de poder completarse contra datos reales.`,
        'ENDPOINT_PENDIENTE'
      );
    }

    const cuerpo = datosCompatibles({
      [NEXUS_CONFIG.PARAM_POST_ACTION]: accion,
      accion,
      Accion: accion,
      action: accion,
      ...datos,
    });

    let res;
    try {
      res = await fetch(NEXUS_CONFIG.WEB_APP_URL, {
        method: 'POST',
        // application/x-www-form-urlencoded es una solicitud CORS simple y
        // permite a Google Apps Script poblar e.parameter correctamente.
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        body: serializarFormulario(cuerpo),
      });
    } catch (e) {
      throw new ApiError('No se pudo conectar con el servidor de NEXUS. Verifica tu conexión a internet.', 'ERROR_RED', e);
    }

    if (!res.ok) {
      throw new ApiError(`El servidor respondió con un error (${res.status}) al ejecutar "${accion}".`, 'ERROR_API');
    }

    let data;
    try {
      data = await res.json();
    } catch (e) {
      throw new ApiError(`La respuesta de "${accion}" no tiene un formato JSON válido.`, 'ERROR_API', e);
    }

    // Invalida caché de lectura relacionada, ya que los datos cambiaron.
    cache.clear();
    return data;
  }

  function invalidarCache() { cache.clear(); }

  return {
    ApiError,
    // --- Lecturas (GET), siempre filtradas por empresa cuando aplica ---
    getEmpresas: (params) => get(NEXUS_CONFIG.GET_ENDPOINTS.EMPRESAS, params),
    getEmpleados: (params) => get(NEXUS_CONFIG.GET_ENDPOINTS.EMPLEADOS, params),
    getNovedades: (params) => get(NEXUS_CONFIG.GET_ENDPOINTS.NOVEDADES, params),
    getPlanillas: (params) => get(NEXUS_CONFIG.GET_ENDPOINTS.PLANILLAS, params),
    getDetallePlanilla: (params) => get(NEXUS_CONFIG.GET_ENDPOINTS.DETALLE_PLANILLA, params),
    getValidaciones: (params) => get(NEXUS_CONFIG.GET_ENDPOINTS.VALIDACIONES, params),
    getReportes: (params) => get(NEXUS_CONFIG.GET_ENDPOINTS.REPORTES, params),
    getHistorial: (params) => get(NEXUS_CONFIG.GET_ENDPOINTS.HISTORIAL, params),
    getParametros: (params) => get(NEXUS_CONFIG.GET_ENDPOINTS.PARAMETROS, params),
    getAuditoria: (params) => get(NEXUS_CONFIG.GET_ENDPOINTS.AUDITORIA, params),
    getFundamentoLegal: (params) => get(NEXUS_CONFIG.GET_ENDPOINTS.FUNDAMENTO_LEGAL, params),

    // --- Escrituras (POST) confirmadas ---
    registrarEmpresa: (datos) => post(NEXUS_CONFIG.POST_ACTIONS.REGISTRAR_EMPRESA, datos),
    registrarUsuario: (datos) => post(NEXUS_CONFIG.POST_ACTIONS.REGISTRAR_USUARIO, datos),
    registrarEmpresaUsuario: (datos) => post(NEXUS_CONFIG.POST_ACTIONS.REGISTRAR_EMPRESA_USUARIO, datos),
    iniciarSesion: (datos) => post(NEXUS_CONFIG.POST_ACTIONS.INICIAR_SESION, datos),
    registrarEmpleado: (datos) => post(NEXUS_CONFIG.POST_ACTIONS.REGISTRAR_EMPLEADO, datos),
    registrarNovedad: (datos) => post(NEXUS_CONFIG.POST_ACTIONS.REGISTRAR_NOVEDAD, datos),
    registrarValidacion: (datos) => post(NEXUS_CONFIG.POST_ACTIONS.REGISTRAR_VALIDACION, datos),
    registrarAuditoria: (datos) => post(NEXUS_CONFIG.POST_ACTIONS.REGISTRAR_AUDITORIA, datos),

    // --- Escrituras pendientes de backend (lanzan ENDPOINT_PENDIENTE) ---
    calcularPlanilla: (datos) => post(NEXUS_CONFIG.PENDING_ACTIONS.CALCULAR_PLANILLA, datos),
    procesarPlanilla: (datos) => post(NEXUS_CONFIG.PENDING_ACTIONS.PROCESAR_PLANILLA, datos),
    actualizarEstadoNovedad: (datos) => post(NEXUS_CONFIG.PENDING_ACTIONS.ACTUALIZAR_ESTADO_NOVEDAD, datos),
    actualizarEstadoEmpleado: (datos) => post(NEXUS_CONFIG.PENDING_ACTIONS.ACTUALIZAR_ESTADO_EMPLEADO, datos),
    generarReporte: (datos) => post(NEXUS_CONFIG.PENDING_ACTIONS.GENERAR_REPORTE, datos),

    invalidarCache,
    datosCompatibles,
  };
})();
