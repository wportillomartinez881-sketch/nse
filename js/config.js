/* Configuracion de NEXUS: reemplaza solo la URL por tu Web App de Apps Script. */
const NEXUS_CONFIG = {
  WEB_APP_URL: 'https://script.google.com/macros/s/AKfycbzuqC4RclUYdMhgTXA3iIVdp7WZuF5kwMZDcPv4NmAncVWAvZnNOPu0FajuBK1DkK95/exec',
  SESSION_KEY: 'nexus_sesion', PARAM_GET: 'recurso', PARAM_POST_ACTION: 'accion', CACHE_TTL_MS: 60000,
  GET_ENDPOINTS: { EMPRESAS: 'empresas', EMPLEADOS: 'empleados', NOVEDADES: 'novedades', PLANILLAS: 'planillas', DETALLE_PLANILLA: 'detalle_planilla', VALIDACIONES: 'validaciones', REPORTES: 'reportes', HISTORIAL: 'historial', PARAMETROS: 'parametros', AUDITORIA: 'auditoria', FUNDAMENTO_LEGAL: 'fundamento_legal' },
  // IMPORTANTE: estos valores deben ser IDENTICOS a los nombres de accion que
  // reconoce el Code.gs (doPost). Antes estaban mezclados camelCase/snake_case
  // y por eso varias pantallas se quedaban en blanco (la API no reconocia la
  // accion solicitada). Si tu Code.gs usa otros nombres, ajusta solo aqui.
  POST_ACTIONS: { REGISTRAR_EMPRESA: 'registrar_empresa', REGISTRAR_USUARIO: 'registrar_usuario', REGISTRAR_EMPRESA_USUARIO: 'registrar_empresa_usuario', INICIAR_SESION: 'iniciar_sesion', REGISTRAR_EMPLEADO: 'registrar_empleado', REGISTRAR_NOVEDAD: 'registrar_novedad', REGISTRAR_VALIDACION: 'registrar_validacion', REGISTRAR_AUDITORIA: 'registrar_auditoria' },
  PENDING_ACTIONS: { CALCULAR_PLANILLA: 'calcularPlanilla', PROCESAR_PLANILLA: 'procesarPlanilla', ACTUALIZAR_ESTADO_NOVEDAD: 'actualizarEstadoNovedad', ACTUALIZAR_ESTADO_EMPLEADO: 'actualizarEstadoEmpleado', GENERAR_REPORTE: 'generarReporte' },
};
