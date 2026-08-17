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

  // Tu Code.gs siempre responde { estado: "correcto" | "error", mensaje }.
  // Antes esta funcion buscaba campos "ok"/"success" que tu backend nunca
  // usa, asi que nunca detectaba un error real del servidor.
  function verificarExito(data, etiqueta) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) return data;
    if (data.estado === 'error') {
      throw new ApiError(data.mensaje || `El servidor rechazó la operación "${etiqueta}".`, 'ERROR_API', data);
    }
    return data;
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
    console.debug('[NEXUS API] GET', recurso, '->', data);
    verificarExito(data, recurso);

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
        // IMPORTANTE: tu Code.gs hace JSON.parse(e.postData.contents), asi
        // que el body debe ser JSON puro. Usamos "text/plain" (no
        // "application/json") a propósito: así el navegador NO manda una
        // solicitud de preflight OPTIONS, que Apps Script Web Apps no
        // maneja. Apps Script igual puede leer el contenido crudo.
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(cuerpo),
      });
    } catch (e) {
      throw new ApiError('No se pudo conectar con el servidor de NEXUS. Verifica tu conexión a internet.', 'ERROR_RED', e);
    }

    if (!res.ok) {
      throw new ApiError(`El servidor respondió con un error (${res.status}) al ejecutar "${accion}".`, 'ERROR_API');
    }

    let textoCrudo;
    try {
      textoCrudo = await res.text();
    } catch (e) {
      throw new ApiError('No se pudo leer la respuesta del servidor.', 'ERROR_API', e);
    }

    let data;
    try {
      data = JSON.parse(textoCrudo);
    } catch (e) {
      console.error(`[NEXUS API] Respuesta NO-JSON de "${accion}":`, textoCrudo.slice(0, 300));
      // Caso frecuente: el propio Code.gs esta devolviendo (haciendo eco de)
      // los mismos datos que le enviamos, en vez de un JSON de respuesta.
      // Eso pasa cuando doPost() todavia no arma una respuesta real, p.ej.
      // usa e.postData.contents para depurar y se le olvido reemplazarlo.
      const pareceEco = textoCrudo.trim().startsWith(`${NEXUS_CONFIG.PARAM_POST_ACTION}=`) || textoCrudo.includes(`${accion}`);
      const pista = pareceEco
        ? ' Parece que tu Code.gs esta devolviendo los mismos datos que le enviaste (un "eco") en vez de una respuesta real. Revisa que doPost() termine con algo como ContentService.createTextOutput(JSON.stringify(resultado)).setMimeType(ContentService.MimeType.JSON).'
        : ' Revisa que hayas hecho un "Nuevo despliegue" en Apps Script después de tu último cambio a Code.gs.';
      throw new ApiError(`La respuesta de "${accion}" no es JSON válido.${pista}`, 'ERROR_API', textoCrudo);
    }
    console.debug('[NEXUS API] POST', accion, '->', data);
    verificarExito(data, accion);

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
    // Pregunta abierta para Atena: el backend (Code.gs) reenvia esto a Gemini
    // usando una clave guardada en Propiedades del Script (nunca en el frontend).
    preguntarIA: (datos) => post(NEXUS_CONFIG.POST_ACTIONS.PREGUNTAR_IA, datos),

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
