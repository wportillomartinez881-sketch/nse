/**
 * NEXUS — Controlador de la aplicacion (pega esto como js/app.js)
 * -------------------------------------------------------------------------
 * Este archivo faltaba en tu proyecto: es el que conecta los clics del
 * menu lateral con Api/Auth y pinta los resultados dentro de cada
 * <div class="dynamic-container">. Sin este archivo, los botones cambian
 * de seccion pero el contenido nunca se reemplaza (por eso quedaba en
 * blanco / con el texto de "Cargando...").
 *
 * SUPUESTO A VERIFICAR: se asume que cada respuesta GET del backend viene
 * como un arreglo directo, o envuelta en { ok, datos:[...] } / { data:[...] }.
 * extraerFilas() intenta las formas mas comunes; ajusta esa funcion si tu
 * Code.gs devuelve otra forma.
 */
const App = (() => {
  function extraerFilas(respuesta) {
    if (Array.isArray(respuesta)) return respuesta;
    if (!respuesta || typeof respuesta !== 'object') return [];
    if (Array.isArray(respuesta.datos)) return respuesta.datos;
    if (Array.isArray(respuesta.data)) return respuesta.data;
    if (Array.isArray(respuesta.resultado)) return respuesta.resultado;
    if (Array.isArray(respuesta.registros)) return respuesta.registros;
    return [];
  }

  function filtroEmpresa(extra = {}) {
    const idEmpresa = Auth.empresaActiva();
    const params = { ...extra };
    if (idEmpresa) params[NEXUS_CONFIG.PARAM_ID_EMPRESA] = idEmpresa;
    return params;
  }

  function escapar(valor) {
    return String(valor ?? '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  function renderizarTabla(contenedor, filas, opciones = {}) {
    if (!filas || filas.length === 0) {
      contenedor.innerHTML = `<p>${escapar(opciones.vacio || 'No hay registros para mostrar.')}</p>`;
      return;
    }
    const columnas = Object.keys(filas[0]);
    const encabezado = columnas.map((c) => `<th>${escapar(c)}</th>`).join('');
    const filasHtml = filas.map((fila) => {
      const celdas = columnas.map((c) => `<td>${escapar(fila[c])}</td>`).join('');
      return `<tr>${celdas}</tr>`;
    }).join('');
    contenedor.innerHTML = `
      <div style="overflow-x:auto;">
        <table style="width:100%; border-collapse:collapse; font-size:0.85rem;">
          <thead><tr style="background:#f1f5f9; text-align:left;">${encabezado}</tr></thead>
          <tbody>${filasHtml}</tbody>
        </table>
      </div>`;
    // Estilo minimo para celdas, sin tocar tu hoja de estilos principal.
    contenedor.querySelectorAll('th, td').forEach((celda) => {
      celda.style.padding = '8px 10px';
      celda.style.borderBottom = '1px solid #e2e8f0';
    });
  }

  function renderizarError(contenedor, error) {
    const mensaje = error?.message || 'Ocurrio un error al cargar los datos.';
    contenedor.innerHTML = `<p style="color:#dc2626;"><i class="fas fa-triangle-exclamation"></i> ${escapar(mensaje)}</p>`;
  }

  async function cargarEnContenedor(idContenedor, promesa, opciones = {}) {
    const contenedor = document.getElementById(idContenedor);
    if (!contenedor) return;
    contenedor.innerHTML = '<p>Cargando...</p>';
    try {
      const respuesta = await promesa;
      const filas = extraerFilas(respuesta);
      renderizarTabla(contenedor, filas, opciones);
    } catch (error) {
      renderizarError(contenedor, error);
    }
  }

  // Mapa: id de seccion -> funcion que carga esa seccion.
  const cargadores = {
    empresa: () => cargarEnContenedor('empresa-view', Api.getEmpresas(filtroEmpresa()), { vacio: 'No se encontraron datos de la empresa.' }),
    empleados: () => cargarEnContenedor('empleados-view', Api.getEmpleados(filtroEmpresa()), { vacio: 'No hay empleados registrados todavia.' }),
    novedades: () => cargarEnContenedor('novedades-view', Api.getNovedades(filtroEmpresa()), { vacio: 'No hay novedades registradas.' }),
    planillas: () => cargarEnContenedor('planillas-view', Api.getPlanillas(filtroEmpresa()), { vacio: 'No hay planillas registradas.' }),
    validaciones: () => cargarEnContenedor('validaciones-view', Api.getValidaciones(filtroEmpresa()), { vacio: 'Sin resultados de validacion todavia.' }),
    reportes: () => cargarEnContenedor('reportes-view', Api.getReportes(filtroEmpresa()), { vacio: 'No hay reportes generados.' }),
    'historial-nexus': () => cargarEnContenedor('historial-view', Api.getHistorial(filtroEmpresa()), { vacio: 'Sin historial registrado.' }),
    // Parametros y Fundamento Legal son catalogos generales, no dependen de la empresa activa.
    parametros: () => cargarEnContenedor('parametros-view', Api.getParametros(), { vacio: 'No hay parametros configurados.' }),
    auditoria: () => cargarEnContenedor('auditoria-view', Api.getAuditoria(filtroEmpresa()), { vacio: 'Sin registros de auditoria.' }),
    'fundamento-legal': () => cargarEnContenedor('fundamento-view', Api.getFundamentoLegal(), { vacio: 'No hay fundamento legal cargado.' }),
    // Detalle de planilla necesita un ID_Planilla especifico; se carga desde
    // el listado de Planillas (ver enlazarFilasPlanilla), no al entrar aqui.
  };

  // Vuelve a las filas de la tabla de Planillas "clicables": al hacer clic en
  // una fila, abre el Detalle de esa planilla. Se ejecuta despues de pintar
  // la tabla de planillas.
  function enlazarFilasPlanilla() {
    const contenedor = document.getElementById('planillas-view');
    if (!contenedor) return;
    contenedor.querySelectorAll('tbody tr').forEach((fila) => {
      fila.style.cursor = 'pointer';
      fila.title = 'Ver detalle de esta planilla';
      fila.addEventListener('click', () => {
        const celdas = fila.querySelectorAll('td');
        // SUPUESTO A VERIFICAR: se asume que la primera columna es el ID de
        // la planilla (p. ej. PL001). Ajusta el indice si tu hoja PLANILLA
        // trae el ID en otra columna.
        const idPlanilla = celdas[0]?.textContent;
        const linkDetalle = document.querySelector('[href="#detalle-planilla"]');
        navegar('detalle-planilla', linkDetalle);
        if (idPlanilla) {
          cargarEnContenedor(
            'detalle-view',
            Api.getDetallePlanilla({ ...filtroEmpresa(), ID_Planilla: idPlanilla }),
            { vacio: 'No se encontro detalle para esta planilla.' }
          );
        }
      });
    });
  }

  async function navegar(idSeccion, elementoLink) {
    document.querySelectorAll('.app-section').forEach((sec) => sec.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach((link) => link.classList.remove('active'));

    const seccionActiva = document.getElementById(idSeccion);
    if (seccionActiva) seccionActiva.classList.add('active');
    if (elementoLink) elementoLink.classList.add('active');

    const cargar = cargadores[idSeccion];
    if (cargar) {
      await cargar();
      if (idSeccion === 'planillas') enlazarFilasPlanilla();
    }
  }

  // --- Sesion / login -------------------------------------------------
  function mostrarOverlayLogin(mostrar) {
    const overlay = document.getElementById('nexus-login-overlay');
    if (overlay) overlay.style.display = mostrar ? 'flex' : 'none';
  }

  function actualizarBadgeUsuario() {
    const badge = document.getElementById('nexus-usuario-badge');
    if (!badge) return;
    const usuario = Auth.usuarioActivo();
    const nombre = usuario?.nombre || usuario?.Nombre || usuario?.correo || 'Usuario';
    badge.innerHTML = `<i class="fas fa-user-circle"></i> ${escapar(nombre)} &nbsp;
      <a href="#" id="nexus-cerrar-sesion" style="color:#dc2626; text-decoration:underline; font-size:0.8rem;">Cerrar sesion</a>`;
    document.getElementById('nexus-cerrar-sesion')?.addEventListener('click', (e) => {
      e.preventDefault();
      Auth.cerrarSesion();
      location.reload();
    });
  }

  function inicializarLogin() {
    const formulario = document.getElementById('nexus-login-form');
    const error = document.getElementById('nexus-login-error');
    if (!formulario) return;
    formulario.addEventListener('submit', async (evento) => {
      evento.preventDefault();
      const correo = document.getElementById('nexus-login-correo').value.trim();
      const contrasena = document.getElementById('nexus-login-contrasena').value;
      error.textContent = '';
      try {
        await Auth.login(correo, contrasena);
        location.reload();
      } catch (e) {
        error.textContent = e.message || 'No se pudo iniciar sesion.';
      }
    });

    // Alternar entre el formulario de login y el de registro de empresa.
    const formularioRegistro = document.getElementById('nexus-registro-form');
    document.getElementById('nexus-ir-a-registro')?.addEventListener('click', (e) => {
      e.preventDefault();
      formulario.hidden = true;
      formularioRegistro.hidden = false;
    });
    document.getElementById('nexus-ir-a-login')?.addEventListener('click', (e) => {
      e.preventDefault();
      formularioRegistro.hidden = true;
      formulario.hidden = false;
    });
  }

  /**
   * Registro de empresa nueva: tu Code.gs ya trae un endpoint que crea la
   * empresa Y el usuario administrador en un solo paso (registrarEmpresaYUsuario,
   * accion "registrar_empresa_usuario"), asi que basta con UNA llamada.
   * IMPORTANTE: los nombres de campo de abajo son EXACTOS, tal como los lee
   * tu Code.gs (datos.Razon_Social, datos.NIT, datos.NRC, etc.). No son
   * "alias" que api.js pueda adivinar por si solo, por eso antes el
   * registro siempre fallaba con "La razón social es obligatoria.".
   */
  async function registrarEmpresaCompleta(datos) {
    const respuesta = await Api.registrarEmpresaUsuario({
      Razon_Social: datos.empresa,
      NIT: datos.nit,
      NRC: datos.nrc,
      Actividad_Economica: datos.actividad,
      Direccion: datos.direccion,
      Telefono: datos.telefono,
      Representante: datos.representante,
      Correo: datos.correo,
      Password: datos.contrasena,
    });
    const idEmpresa = respuesta?.ID_Empresa;
    const idUsuario = respuesta?.ID_Usuario;
    if (!idEmpresa) {
      throw new Api.ApiError('La empresa se registró pero el servidor no devolvió un ID_Empresa. Revisa la respuesta de "registrar_empresa_usuario" en tu Code.gs.', 'ERROR_API');
    }
    return { idEmpresa, idUsuario };
  }

  function inicializarRegistro() {
    const formulario = document.getElementById('nexus-registro-form');
    const error = document.getElementById('nexus-registro-error');
    if (!formulario) return;
    formulario.addEventListener('submit', async (evento) => {
      evento.preventDefault();
      error.textContent = '';
      const datos = {
        empresa: document.getElementById('registro-empresa').value.trim(),
        nit: document.getElementById('registro-nit').value.trim(),
        nrc: document.getElementById('registro-nrc').value.trim(),
        actividad: document.getElementById('registro-actividad').value.trim(),
        direccion: document.getElementById('registro-direccion').value.trim(),
        telefono: document.getElementById('registro-telefono').value.trim(),
        representante: document.getElementById('registro-representante').value.trim(),
        correo: document.getElementById('registro-correo').value.trim(),
        contrasena: document.getElementById('registro-contrasena').value,
      };
      try {
        await registrarEmpresaCompleta(datos);
        await Auth.login(datos.correo, datos.contrasena);
        location.reload();
      } catch (e) {
        error.textContent = e.message || 'No se pudo registrar la empresa.';
      }
    });
  }

  // --- Formularios de captura dentro de la app (Empleados / Novedades) ---
  function mostrarMensajeForm(idParrafo, texto, tipo) {
    const p = document.getElementById(idParrafo);
    if (!p) return;
    p.textContent = texto;
    p.className = `nexus-form-mensaje ${tipo}`;
  }

  function inicializarFormularioEmpleado() {
    const formulario = document.getElementById('nexus-form-empleado');
    if (!formulario) return;
    formulario.addEventListener('submit', async (evento) => {
      evento.preventDefault();
      const datos = {
        nombre: document.getElementById('empleado-nombre').value.trim(),
        dui: document.getElementById('empleado-dui').value.trim(),
        salario: document.getElementById('empleado-salario').value,
        idEmpresa: Auth.empresaActiva(),
      };
      try {
        await Api.registrarEmpleado(datos);
        mostrarMensajeForm('empleado-form-mensaje', 'Empleado agregado correctamente.', 'exito');
        formulario.reset();
        cargadores.empleados();
      } catch (e) {
        mostrarMensajeForm('empleado-form-mensaje', e.message || 'No se pudo agregar el empleado.', 'error');
      }
    });
  }

  function inicializarFormularioNovedad() {
    const formulario = document.getElementById('nexus-form-novedad');
    if (!formulario) return;
    formulario.addEventListener('submit', async (evento) => {
      evento.preventDefault();
      const datos = {
        idEmpleado: document.getElementById('novedad-empleado').value.trim(),
        tipo: document.getElementById('novedad-tipo').value,
        detalle: document.getElementById('novedad-detalle').value.trim(),
        idEmpresa: Auth.empresaActiva(),
      };
      try {
        await Api.registrarNovedad(datos);
        mostrarMensajeForm('novedad-form-mensaje', 'Novedad agregada correctamente.', 'exito');
        formulario.reset();
        cargadores.novedades();
      } catch (e) {
        mostrarMensajeForm('novedad-form-mensaje', e.message || 'No se pudo agregar la novedad.', 'error');
      }
    });
  }

  function init() {
    inicializarLogin();
    inicializarRegistro();
    inicializarFormularioEmpleado();
    inicializarFormularioNovedad();
    if (Auth.estaAutenticado()) {
      mostrarOverlayLogin(false);
      actualizarBadgeUsuario();
      navegar('inicio', document.querySelector('[href="#inicio"]'));
    } else {
      mostrarOverlayLogin(true);
    }
  }

  return { navegar, init };
})();

// Reemplaza a la funcion mostrarSeccion() que tenias inline en el HTML:
// ahora sí carga datos, no solo cambia de seccion visible.
function mostrarSeccion(idSeccion, elementoLink) {
  App.navegar(idSeccion, elementoLink);
}

document.addEventListener('DOMContentLoaded', () => App.init());
