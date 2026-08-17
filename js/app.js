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
      // IMPORTANTE: nombres EXACTOS que exige Code.gs (datos.Nombre_Completo,
      // datos.DUI, datos.Salario_Base, datos.ID_Empresa). "nombre"/"dui"/
      // "salario"/"idEmpresa" nunca se convertian automaticamente en esos
      // nombres (api.js solo genera variantes de mayuscula inicial), por
      // eso antes el registro de empleados siempre fallaba.
      const datos = {
        Nombre_Completo: document.getElementById('empleado-nombre').value.trim(),
        DUI: document.getElementById('empleado-dui').value.trim(),
        Salario_Base: document.getElementById('empleado-salario').value,
        ID_Empresa: Auth.empresaActiva(),
      };
      try {
        await Api.registrarEmpleado(datos);
        mostrarMensajeForm('empleado-form-mensaje', 'Empleado agregado correctamente.', 'exito');
        formulario.reset();
        await cargadores.empleados();
        await poblarSelectsEmpleados();
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
      // IMPORTANTE: nombres EXACTOS que exige Code.gs (datos.ID_Empleado,
      // datos.Periodo, datos.Tipo_Novedad, datos.Observacion). Antes se
      // enviaba "idEmpleado"/"tipo"/"detalle", que nunca se traducian a
      // esos nombres, asi que el registro de novedades siempre fallaba
      // con "ID_Empleado es obligatorio".
      const datos = {
        ID_Empleado: document.getElementById('novedad-empleado').value,
        Periodo: document.getElementById('novedad-periodo').value.trim(),
        Tipo_Novedad: document.getElementById('novedad-tipo').value,
        Observacion: document.getElementById('novedad-detalle').value.trim(),
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

  // --- Listas desplegables de empleados (Novedades y Calculadora) --------
  // Guarda tambien el ultimo listado de empleados en memoria para que la
  // Calculadora pueda leer el salario base sin volver a pedirlo a la API.
  let empleadosCache = [];

  async function poblarSelectsEmpleados() {
    const selects = [document.getElementById('novedad-empleado'), document.getElementById('calc-empleado')].filter(Boolean);
    if (selects.length === 0) return;
    try {
      const respuesta = await Api.getEmpleados(filtroEmpresa());
      empleadosCache = extraerFilas(respuesta);
      selects.forEach((select) => {
        const valorPrevio = select.value;
        select.innerHTML = '<option value="" disabled selected>Selecciona un empleado</option>';
        empleadosCache.forEach((empleado) => {
          const id = empleado.ID_Empleado || empleado.Id_Empleado || empleado.ID || '';
          const nombre = empleado.Nombre_Completo || empleado.Nombre || id;
          if (!id) return;
          const opcion = document.createElement('option');
          opcion.value = id;
          opcion.textContent = `${id} — ${nombre}`;
          select.appendChild(opcion);
        });
        if (valorPrevio) select.value = valorPrevio;
      });
    } catch (e) {
      console.warn('NEXUS: no se pudo cargar la lista de empleados para los selectores.', e.message);
    }
  }

  // --- Calculadora de Novedades (independiente, alimenta a Novedades) ---
  function inicializarCalculadoraNovedades() {
    const formulario = document.getElementById('nexus-form-calculadora');
    if (!formulario) return;
    const btnRegistrar = document.getElementById('calc-btn-registrar');
    const contenedorResultado = document.getElementById('calc-resultado');
    let ultimoCalculo = null;

    function calcular() {
      const idEmpleado = document.getElementById('calc-empleado').value;
      const empleado = empleadosCache.find((e) => (e.ID_Empleado || e.Id_Empleado || e.ID) === idEmpleado);
      const salarioBase = Number(empleado?.Salario_Base || empleado?.Salario || 0);
      if (!idEmpleado || !salarioBase) {
        mostrarMensajeForm('calculadora-mensaje', 'Selecciona un empleado con salario base registrado.', 'error');
        return null;
      }
      const opciones = {
        horasExtraDiurnas: Number(document.getElementById('calc-he-diurnas').value) || 0,
        horasExtraNocturnas: Number(document.getElementById('calc-he-nocturnas').value) || 0,
        diasInasistencia: Number(document.getElementById('calc-ausencia').value) || 0,
        bonos: Number(document.getElementById('calc-bono').value) || 0,
        comisiones: Number(document.getElementById('calc-comision').value) || 0,
      };
      const resultado = FiscalEngine.calcularLiquidacionMensual(salarioBase, opciones);

      // Mismas formulas que usa FiscalEngine internamente, aqui solo para
      // desglosar cada concepto por separado (una novedad por concepto).
      const valorDia = salarioBase / 30;
      const valorHoraOrdinaria = valorDia / 8;
      const valorHeDiurnas = opciones.horasExtraDiurnas * (valorHoraOrdinaria * 2);
      const valorHeNocturnas = opciones.horasExtraNocturnas * (valorHoraOrdinaria * 1.25 * 2);
      const valorAusencia = opciones.diasInasistencia * valorDia;

      return { idEmpleado, salarioBase, opciones, resultado, valorHeDiurnas, valorHeNocturnas, valorAusencia };
    }

    document.getElementById('calc-btn-calcular').addEventListener('click', () => {
      mostrarMensajeForm('calculadora-mensaje', '', '');
      ultimoCalculo = calcular();
      if (!ultimoCalculo) { btnRegistrar.disabled = true; contenedorResultado.innerHTML = ''; return; }
      const { opciones, resultado, valorHeDiurnas, valorHeNocturnas, valorAusencia } = ultimoCalculo;
      const filas = [
        opciones.horasExtraDiurnas > 0 ? `<tr><td>Horas extra diurnas (${opciones.horasExtraDiurnas}h)</td><td>$${valorHeDiurnas.toFixed(2)}</td></tr>` : '',
        opciones.horasExtraNocturnas > 0 ? `<tr><td>Horas extra nocturnas (${opciones.horasExtraNocturnas}h)</td><td>$${valorHeNocturnas.toFixed(2)}</td></tr>` : '',
        opciones.diasInasistencia > 0 ? `<tr><td>Descuento por ausencia (${opciones.diasInasistencia} día/s)</td><td>-$${valorAusencia.toFixed(2)}</td></tr>` : '',
        opciones.bonos > 0 ? `<tr><td>Bono</td><td>$${opciones.bonos.toFixed(2)}</td></tr>` : '',
        opciones.comisiones > 0 ? `<tr><td>Comisión</td><td>$${opciones.comisiones.toFixed(2)}</td></tr>` : '',
      ].filter(Boolean).join('');
      contenedorResultado.innerHTML = `
        <table>
          <thead><tr><th>Concepto</th><th>Valor</th></tr></thead>
          <tbody>${filas || '<tr><td colspan="2">No hay conceptos con valor distinto de cero.</td></tr>'}</tbody>
        </table>
        <p style="margin-top:8px; font-size:0.85rem; color:#64748b;">Salario neto estimado del período con estos conceptos: <strong>$${resultado.totales.salarioNeto.toFixed(2)}</strong></p>`;
      btnRegistrar.disabled = filas === '';
    });

    formulario.addEventListener('submit', async (evento) => {
      evento.preventDefault();
      if (!ultimoCalculo) return;
      const periodo = document.getElementById('calc-periodo').value.trim();
      if (!periodo) { mostrarMensajeForm('calculadora-mensaje', 'Indica el período antes de registrar.', 'error'); return; }
      const { idEmpleado, opciones, valorHeDiurnas, valorHeNocturnas, valorAusencia } = ultimoCalculo;

      // Una novedad (fila) por cada concepto distinto de cero, tal como
      // espera la hoja NOVEDADES (una fila = un Tipo_Novedad con su Valor).
      const items = [];
      if (opciones.horasExtraDiurnas > 0) items.push({ Tipo_Novedad: 'Horas extra', Cantidad: opciones.horasExtraDiurnas, Valor: Number(valorHeDiurnas.toFixed(2)), Observacion: 'Horas extra diurnas (calculadora)' });
      if (opciones.horasExtraNocturnas > 0) items.push({ Tipo_Novedad: 'Horas extra', Cantidad: opciones.horasExtraNocturnas, Valor: Number(valorHeNocturnas.toFixed(2)), Observacion: 'Horas extra nocturnas (calculadora)' });
      if (opciones.diasInasistencia > 0) items.push({ Tipo_Novedad: 'Ausencia', Cantidad: opciones.diasInasistencia, Valor: Number(valorAusencia.toFixed(2)), Observacion: 'Descuento por ausencia (calculadora)' });
      if (opciones.bonos > 0) items.push({ Tipo_Novedad: 'Bono', Cantidad: 1, Valor: opciones.bonos, Observacion: 'Bono (calculadora)' });
      if (opciones.comisiones > 0) items.push({ Tipo_Novedad: 'Comision', Cantidad: 1, Valor: opciones.comisiones, Observacion: 'Comisión (calculadora)' });

      try {
        for (const item of items) {
          await Api.registrarNovedad({ ID_Empleado: idEmpleado, Periodo: periodo, ...item });
        }
        mostrarMensajeForm('calculadora-mensaje', `${items.length} novedad(es) registrada(s) correctamente.`, 'exito');
        btnRegistrar.disabled = true;
        cargadores.novedades();
      } catch (e) {
        mostrarMensajeForm('calculadora-mensaje', e.message || 'No se pudieron registrar las novedades.', 'error');
      }
    });
  }

  function init() {
    inicializarLogin();
    inicializarRegistro();
    inicializarFormularioEmpleado();
    inicializarFormularioNovedad();
    inicializarCalculadoraNovedades();
    if (Auth.estaAutenticado()) {
      mostrarOverlayLogin(false);
      actualizarBadgeUsuario();
      poblarSelectsEmpleados();
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
