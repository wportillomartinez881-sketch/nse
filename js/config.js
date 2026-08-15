/* Configuracion de NEXUS: reemplaza solo la URL por tu Web App de Apps Script. */
const NEXUS_CONFIG = {
  WEB_APP_URL: 'https://script.google.com/macros/s/AKfycbzuqC4RclUYdMhgTXA3iIVdp7WZuF5kwMZDcPv4NmAncVWAvZnNOPu0FajuBK1DkK95/exec',
  SESSION_KEY: 'nexus_sesion', PARAM_GET: 'recurso', PARAM_POST_ACTION: 'accion', CACHE_TTL_MS: 60000,
  GET_ENDPOINTS: { EMPRESAS: 'empresas', EMPLEADOS: 'empleados', NOVEDADES: 'novedades', PLANILLAS: 'planillas', DETALLE_PLANILLA: 'detallePlanilla', VALIDACIONES: 'validaciones', REPORTES: 'reportes', HISTORIAL: 'historial', PARAMETROS: 'parametros', AUDITORIA: 'auditoria', FUNDAMENTO_LEGAL: 'fundamentoLegal' },
  POST_ACTIONS: { REGISTRAR_EMPRESA: 'registrarEmpresa', REGISTRAR_USUARIO: 'registrar_usuario', REGISTRAR_EMPRESA_USUARIO: 'registrarEmpresaUsuario', INICIAR_SESION: 'iniciar_sesion', REGISTRAR_EMPLEADO: 'registrarEmpleado', REGISTRAR_NOVEDAD: 'registrarNovedad', REGISTRAR_VALIDACION: 'registrarValidacion', REGISTRAR_AUDITORIA: 'registrarAuditoria' },
  PENDING_ACTIONS: { CALCULAR_PLANILLA: 'calcularPlanilla', PROCESAR_PLANILLA: 'procesarPlanilla', ACTUALIZAR_ESTADO_NOVEDAD: 'actualizarEstadoNovedad', ACTUALIZAR_ESTADO_EMPLEADO: 'actualizarEstadoEmpleado', GENERAR_REPORTE: 'generarReporte' },
};
