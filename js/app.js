/**
 * js/app.js
 * Controlador Principal de Interfaz y Lógica del Sistema NEXUS
 */

function idEmpresaActiva() {
    const usuario = typeof Auth !== 'undefined' ? Auth.usuarioActual() : null;
    return usuario ? (usuario.ID_Empresa || usuario.id_empresa || '') : '';
}

function filtroEmpresa() {
    return { ID_Empresa: idEmpresaActiva() };
}

function mostrarSeccion(idSeccion, elementoNav) {
    document.querySelectorAll('.tab-content, .app-section').forEach(sec => sec.classList.remove('active'));
    document.querySelectorAll('.sidebar-nav a, .nav-link').forEach(link => link.classList.remove('active'));

    const objetivo = document.getElementById(idSeccion);
    if (objetivo) objetivo.classList.add('active');
    if (elementoNav) elementoNav.classList.add('active');

    // Actualizar título superior
    const pageTitle = document.getElementById('page-title');
    if (pageTitle && elementoNav) {
        pageTitle.textContent = elementoNav.textContent.trim();
    }

    cargarDatosSeccion(idSeccion);
}

async function cargarDatosSeccion(idSeccion) {
    const empId = idEmpresaActiva();
    if (!empId && idSeccion !== 'inicio') return;

    switch (idSeccion) {
        case 'inicio':
        case 'tab-dashboard':
            const user = Auth.usuarioActual();
            const dashNombre = document.getElementById('dash-empresa-nombre');
            if (dashNombre && user) dashNombre.textContent = user.Nombre_Empresa || user.empresa || 'NEXUS';
            break;

        case 'empresa':
            await cargarSeccionEmpresa();
            break;

        case 'empleados':
            await cargarSeccionEmpleados();
            break;

        case 'novedades':
            await cargarSeccionNovedades();
            break;

        case 'calculadora':
            await cargarSelectoresCalculadora();
            break;

        case 'planillas':
            await cargarSeccionPlanillas();
            break;

        case 'detalle-planilla':
            await cargarSeccionDetallePlanilla();
            break;

        case 'reportes':
            await cargarSeccionReportes();
            break;

        case 'historial-nexus':
            await cargarSeccionHistorial();
            break;

        case 'auditoria':
            await cargarSeccionAuditoria();
            break;
    }
}

// 1. Empresa
async function cargarSeccionEmpresa() {
    const contenedor = document.getElementById('empresa-view');
    if (!contenedor) return;
    contenedor.innerHTML = '<p>Cargando datos de la empresa...</p>';
    try {
        const usuario = Auth.usuarioActual();
        contenedor.innerHTML = `
            <div style="line-height:1.8;">
                <p><strong>Nombre de Empresa:</strong> ${usuario.Nombre_Empresa || usuario.empresa || 'N/A'}</p>
                <p><strong>NIT:</strong> ${usuario.NIT || usuario.nit || 'N/A'}</p>
                <p><strong>NRC:</strong> ${usuario.NRC || usuario.nrc || 'N/A'}</p>
                <p><strong>Actividad Económica:</strong> ${usuario.Actividad || usuario.actividad || 'N/A'}</p>
                <p><strong>Dirección:</strong> ${usuario.Direccion || usuario.direccion || 'N/A'}</p>
                <p><strong>Teléfono:</strong> ${usuario.Telefono || usuario.telefono || 'N/A'}</p>
                <p><strong>Representante Legal:</strong> ${usuario.Representante || usuario.representante || 'N/A'}</p>
                <p><strong>Correo Electrónico:</strong> ${usuario.Correo || usuario.correo || 'N/A'}</p>
            </div>
        `;
    } catch (e) {
        contenedor.innerHTML = '<p style="color:red;">Error al cargar datos de empresa.</p>';
    }
}

// 2. Empleados
async function cargarSeccionEmpleados() {
    const contenedor = document.getElementById('empleados-view');
    if (!contenedor) return;
    contenedor.innerHTML = '<p>Cargando lista de empleados...</p>';
    try {
        const respuesta = await Api.getEmpleados(filtroEmpresa());
        const lista = Array.isArray(respuesta) ? respuesta : (respuesta.datos || []);
        
        if (lista.length === 0) {
            contenedor.innerHTML = '<p>No hay empleados registrados para esta empresa.</p>';
            return;
        }

        let html = `
            <table class="nexus-table">
                <thead>
                    <tr>
                        <th>ID Empleado</th>
                        <th>Nombre</th>
                        <th>DUI</th>
                        <th>Salario Base</th>
                    </tr>
                </thead>
                <tbody>
        `;
        lista.forEach(emp => {
            html += `
                <tr>
                    <td>${emp.ID_Empleado || emp.id_empleado || '-'}</td>
                    <td>${emp.Nombre || emp.nombre || '-'}</td>
                    <td>${emp.DUI || emp.dui || '-'}</td>
                    <td>$${parseFloat(emp.Salario_Base || emp.salario || 0).toFixed(2)}</td>
                </tr>
            `;
        });
        html += '</tbody></table>';
        contenedor.innerHTML = html;
    } catch (e) {
        contenedor.innerHTML = '<p style="color:red;">Error al cargar lista de empleados.</p>';
    }
}

// 3. Novedades
async function cargarSeccionNovedades() {
    await actualizarSelectEmpleados('novedad-empleado');
    const contenedor = document.getElementById('novedades-view');
    if (!contenedor) return;
    contenedor.innerHTML = '<p>Cargando novedades...</p>';
    
    try {
        const respuesta = await Api.getNovedades(filtroEmpresa());
        const lista = Array.isArray(respuesta) ? respuesta : (respuesta.datos || []);

        if (lista.length === 0) {
            contenedor.innerHTML = '<p>No hay novedades registradas para este período.</p>';
            return;
        }

        let html = `
            <table class="nexus-table">
                <thead>
                    <tr>
                        <th>ID Novedad</th>
                        <th>ID Empleado</th>
                        <th>Tipo</th>
                        <th>Detalle</th>
                    </tr>
                </thead>
                <tbody>
        `;
        lista.forEach(nov => {
            html += `
                <tr>
                    <td>${nov.ID_Novedad || nov.id_novedad || '-'}</td>
                    <td>${nov.ID_Empleado || nov.id_empleado || '-'}</td>
                    <td>${nov.Tipo || nov.tipo || '-'}</td>
                    <td>${nov.Detalle || nov.detalle || '-'}</td>
                </tr>
            `;
        });
        html += '</tbody></table>';
        contenedor.innerHTML = html;
    } catch (e) {
        contenedor.innerHTML = '<p style="color:red;">Error al obtener novedades.</p>';
    }
}

// Auxiliar para llenar combos con empleados de la empresa
async function actualizarSelectEmpleados(elementId) {
    const select = document.getElementById(elementId);
    if (!select) return;

    select.innerHTML = '<option value="" disabled selected>Cargando empleados...</option>';
    try {
        const respuesta = await Api.getEmpleados(filtroEmpresa());
        const lista = Array.isArray(respuesta) ? respuesta : (respuesta.datos || []);
        
        select.innerHTML = '<option value="" disabled selected>Seleccione Colaborador</option>';
        lista.forEach(emp => {
            const id = emp.ID_Empleado || emp.id_empleado;
            const nom = emp.Nombre || emp.nombre;
            select.innerHTML += `<option value="${id}">${id} - ${nom}</option>`;
        });
    } catch (e) {
        select.innerHTML = '<option value="" disabled>Error al cargar colaboradores</option>';
    }
}

// 4. Calculadora
async function cargarSelectoresCalculadora() {
    await actualizarSelectEmpleados('calc-empleado');
}

// 5. Planillas
async function cargarSeccionPlanillas() {
    const contenedor = document.getElementById('planillas-view');
    if (!contenedor) return;
    contenedor.innerHTML = '<p>Cargando planillas...</p>';

    try {
        const respuesta = await Api.getPlanillas(filtroEmpresa());
        const lista = Array.isArray(respuesta) ? respuesta : (respuesta.datos || []);

        if (lista.length === 0) {
            contenedor.innerHTML = '<p>No existen planillas registradas para su empresa.</p>';
            return;
        }

        let html = `
            <table class="nexus-table">
                <thead>
                    <tr>
                        <th>ID Planilla</th>
                        <th>Período</th>
                        <th>Fecha Proceso</th>
                        <th>Estado</th>
                        <th>Total Bruto</th>
                        <th>Total Deducciones</th>
                        <th>Total Líquido</th>
                        <th>Aportes Patronales</th>
                    </tr>
                </thead>
                <tbody>
        `;
        lista.forEach(p => {
            html += `
                <tr>
                    <td><strong>${p.ID_Planilla || p.id_planilla}</strong></td>
                    <td>${p.Periodo || '-'}</td>
                    <td>${p.Fecha_Proceso || '-'}</td>
                    <td>${p.Estado || 'Procesada'}</td>
                    <td>$${parseFloat(p.Total_Bruto || 0).toFixed(2)}</td>
                    <td>$${parseFloat(p.Total_Deducciones || 0).toFixed(2)}</td>
                    <td>$${parseFloat(p.Total_Liquido || 0).toFixed(2)}</td>
                    <td>$${parseFloat(p.Total_Aportes_Patronales || 0).toFixed(2)}</td>
                </tr>
            `;
        });
        html += '</tbody></table>';
        contenedor.innerHTML = html;
    } catch (e) {
        contenedor.innerHTML = '<p style="color:red;">Error al consultar las planillas.</p>';
    }
}

// 6. Detalle de Planilla
async function cargarSeccionDetallePlanilla() {
    const select = document.getElementById('select-planilla-detalle');
    if (!select) return;

    try {
        const respuesta = await Api.getPlanillas(filtroEmpresa());
        const lista = Array.isArray(respuesta) ? respuesta : (respuesta.datos || []);

        select.innerHTML = '<option value="">Seleccione una planilla registrada</option>';
        lista.forEach(p => {
            const id = p.ID_Planilla || p.id_planilla;
            select.innerHTML += `<option value="${id}">Planilla ${id} - Período: ${p.Periodo}</option>`;
        });
    } catch (e) {
        console.error("Error al poblar selector de planillas", e);
    }
}

async function renderizarDetallePlanilla(idPlanilla) {
    const contenedor = document.getElementById('detalle-view');
    if (!contenedor) return;
    if (!idPlanilla) {
        contenedor.innerHTML = '<p>Seleccione una planilla para ver el detalle.</p>';
        return;
    }
    contenedor.innerHTML = '<p>Cargando desglose de la planilla...</p>';

    try {
        const respuesta = await Api.getDetallePlanilla({ ID_Planilla: idPlanilla, ID_Empresa: idEmpresaActiva() });
        const lista = Array.isArray(respuesta) ? respuesta : (respuesta.datos || []);

        if (lista.length === 0) {
            contenedor.innerHTML = '<p>No se encontraron detalles para la planilla seleccionada.</p>';
            return;
        }

        let html = `
            <table class="nexus-table">
                <thead>
                    <tr>
                        <th>ID Detalle</th>
                        <th>ID Empleado</th>
                        <th>Salario Base</th>
                        <th>Días Trab.</th>
                        <th>Ingresos Adic.</th>
                        <th>Salario Bruto</th>
                        <th>Deducciones</th>
                        <th>Salario Líquido</th>
                        <th>Aportes Patronales</th>
                    </tr>
                </thead>
                <tbody>
        `;
        lista.forEach(d => {
            html += `
                <tr>
                    <td>${d.ID_Detalle || '-'}</td>
                    <td>${d.ID_Empleado || '-'}</td>
                    <td>$${parseFloat(d.Salario_Base || 0).toFixed(2)}</td>
                    <td>${d.Dias_Trabajados || 30}</td>
                    <td>$${parseFloat(d.Ingresos_Adicionales || 0).toFixed(2)}</td>
                    <td>$${parseFloat(d.Salario_Bruto || 0).toFixed(2)}</td>
                    <td>$${parseFloat(d.Total_Deducciones || d.Deducciones || 0).toFixed(2)}</td>
                    <td>$${parseFloat(d.Salario_Liquido || 0).toFixed(2)}</td>
                    <td>$${parseFloat(d.Aportes_Patronales || 0).toFixed(2)}</td>
                </tr>
            `;
        });
        html += '</tbody></table>';
        contenedor.innerHTML = html;
    } catch (e) {
        contenedor.innerHTML = '<p style="color:red;">Error al cargar el detalle de la planilla.</p>';
    }
}

// 7. Reportes
async function cargarSeccionReportes() {
    const contenedor = document.getElementById('reportes-view');
    if (!contenedor) return;
    contenedor.innerHTML = '<p>Cargando reportes contables...</p>';
    try {
        const respuesta = await Api.getReportes(filtroEmpresa());
        const lista = Array.isArray(respuesta) ? respuesta : (respuesta.datos || []);

        if (lista.length === 0) {
            contenedor.innerHTML = '<p>No hay reportes generados para esta empresa.</p>';
            return;
        }

        let html = `
            <table class="nexus-table">
                <thead>
                    <tr>
                        <th>ID Reporte</th>
                        <th>ID Planilla</th>
                        <th>Período</th>
                        <th>Fecha Generación</th>
                        <th>Tipo</th>
                        <th>Estado</th>
                    </tr>
                </thead>
                <tbody>
        `;
        lista.forEach(r => {
            html += `
                <tr>
                    <td>${r.ID_Reporte || '-'}</td>
                    <td>${r.ID_Planilla || '-'}</td>
                    <td>${r.Periodo || '-'}</td>
                    <td>${r.Fecha_Generacion || '-'}</td>
                    <td>${r.Tipo_Reporte || 'General'}</td>
                    <td>${r.Estado || 'Completado'}</td>
                </tr>
            `;
        });
        html += '</tbody></table>';
        contenedor.innerHTML = html;
    } catch (e) {
        contenedor.innerHTML = '<p style="color:red;">Error al cargar reportes.</p>';
    }
}

// 8. Historial
async function cargarSeccionHistorial() {
    const contenedor = document.getElementById('historial-view');
    if (!contenedor) return;
    contenedor.innerHTML = '<p>Cargando historial...</p>';
    try {
        const respuesta = await Api.getHistorial(filtroEmpresa());
        const lista = Array.isArray(respuesta) ? respuesta : (respuesta.datos || []);

        if (lista.length === 0) {
            contenedor.innerHTML = '<p>Sin registros en el historial de esta empresa.</p>';
            return;
        }

        let html = `
            <table class="nexus-table">
                <thead>
                    <tr>
                        <th>ID Historial</th>
                        <th>ID Planilla</th>
                        <th>Período</th>
                        <th>Fecha Proceso</th>
                        <th>Estado</th>
                        <th>Observaciones</th>
                    </tr>
                </thead>
                <tbody>
        `;
        lista.forEach(h => {
            html += `
                <tr>
                    <td>${h.ID_Historial || '-'}</td>
                    <td>${h.ID_Planilla || '-'}</td>
                    <td>${h.Periodo || '-'}</td>
                    <td>${h.Fecha_Proceso || '-'}</td>
                    <td>${h.Estado || '-'}</td>
                    <td>${h.Observaciones || '-'}</td>
                </tr>
            `;
        });
        html += '</tbody></table>';
        contenedor.innerHTML = html;
    } catch (e) {
        contenedor.innerHTML = '<p style="color:red;">Error al cargar historial.</p>';
    }
}

// 9. Auditoría
async function cargarSeccionAuditoria() {
    const contenedor = document.getElementById('auditoria-view');
    if (!contenedor) return;
    contenedor.innerHTML = '<p>Cargando bitácora de auditoría...</p>';
    try {
        const respuesta = await Api.getAuditoria(filtroEmpresa());
        const lista = Array.isArray(respuesta) ? respuesta : (respuesta.datos || []);

        if (lista.length === 0) {
            contenedor.innerHTML = '<p>No hay eventos registrados en la auditoría.</p>';
            return;
        }

        let html = `
            <table class="nexus-table">
                <thead>
                    <tr>
                        <th>ID Auditoría</th>
                        <th>Fecha / Hora</th>
                        <th>Acción</th>
                        <th>Usuario</th>
                        <th>Registro Afectado</th>
                        <th>Resultado</th>
                    </tr>
                </thead>
                <tbody>
        `;
        lista.forEach(a => {
            html += `
                <tr>
                    <td>${a.ID_Auditoria || '-'}</td>
                    <td>${a.Fecha_Hora || '-'}</td>
                    <td>${a.Acción || a.Accion || '-'}</td>
                    <td>${a.Usuario || '-'}</td>
                    <td>${a.Registro_Afectado || '-'}</td>
                    <td>${a.Resultado || 'Éxito'}</td>
                </tr>
            `;
        });
        html += '</tbody></table>';
        contenedor.innerHTML = html;
    } catch (e) {
        contenedor.innerHTML = '<p style="color:red;">Error al cargar bitácora de auditoría.</p>';
    }
}

// INICIALIZACIÓN Y EVENT LISTENERS
document.addEventListener('DOMContentLoaded', () => {

    // NAVEGACIÓN COMPATIBLE CON MENÚ LATERAL Y BARRAS VIEJAS
    const todosLosEnlaces = document.querySelectorAll('.sidebar-nav a, .nav-link');
    todosLosEnlaces.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = link.getAttribute('data-tab') || link.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
            if (target) {
                mostrarSeccion(target, link);
            }
        });
    });

    // CONTROL DE MODAL DE LOGIN Y REGISTRO
    const linkIrARegistro = document.getElementById('link-ir-a-registro');
    const linkIrALogin = document.getElementById('link-ir-a-login');
    const contenedorLogin = document.getElementById('contenedor-login');
    const contenedorRegistro = document.getElementById('contenedor-registro');

    if (linkIrARegistro) {
        linkIrARegistro.addEventListener('click', (e) => {
            e.preventDefault();
            if (contenedorLogin) contenedorLogin.style.display = 'none';
            if (contenedorRegistro) contenedorRegistro.style.display = 'block';
        });
    }

    if (linkIrALogin) {
        linkIrALogin.addEventListener('click', (e) => {
            e.preventDefault();
            if (contenedorRegistro) contenedorRegistro.style.display = 'none';
            if (contenedorLogin) contenedorLogin.style.display = 'block';
        });
    }

    // Comprobar Sesión
    if (typeof Auth !== 'undefined') {
        Auth.init();
        const usr = Auth.usuarioActual();
        if (usr) {
            const badge = document.getElementById('nexus-usuario-badge');
            if (badge) badge.innerHTML = `<i class="fas fa-user-circle"></i> ${usr.Nombre_Empresa || usr.empresa || 'Empresa'}`;
        }
    }

    // Cerrar sesión
    const btnSalir = document.getElementById('btn-cerrar-sesion');
    if (btnSalir) {
        btnSalir.addEventListener('click', () => {
            if (typeof Auth !== 'undefined') {
                Auth.cerrarSesion();
            }
            location.reload();
        });
    }

    // Agregar Empleado
    const formEmp = document.getElementById('nexus-form-empleado');
    if (formEmp) {
        formEmp.addEventListener('submit', async (e) => {
            e.preventDefault();
            const msg = document.getElementById('empleado-form-mensaje');
            if (msg) {
                msg.textContent = 'Guardando empleado...';
                msg.className = 'nexus-form-mensaje';
            }

            const nuevo = {
                ID_Empresa: idEmpresaActiva(),
                nombre: document.getElementById('empleado-nombre').value,
                dui: document.getElementById('empleado-dui').value,
                salario: parseFloat(document.getElementById('empleado-salario').value)
            };

            try {
                const res = await Api.registrarEmpleado(nuevo);
                if (res && res.exito !== false) {
                    if (msg) {
                        msg.textContent = 'Empleado registrado exitosamente.';
                        msg.className = 'nexus-form-mensaje exito';
                    }
                    formEmp.reset();
                    cargarSeccionEmpleados();
                } else {
                    if (msg) {
                        msg.textContent = res.mensaje || 'No se pudo guardar el empleado.';
                        msg.className = 'nexus-form-mensaje error';
                    }
                }
            } catch (err) {
                if (msg) {
                    msg.textContent = 'Error de red al guardar el empleado.';
                    msg.className = 'nexus-form-mensaje error';
                }
            }
        });
    }

    // Agregar Novedad Individual
    const formNov = document.getElementById('nexus-form-novedad');
    if (formNov) {
        formNov.addEventListener('submit', async (e) => {
            e.preventDefault();
            const msg = document.getElementById('novedad-form-mensaje');
            if (msg) msg.textContent = 'Registrando novedad...';

            const novedad = {
                ID_Empresa: idEmpresaActiva(),
                ID_Empleado: document.getElementById('novedad-empleado').value,
                tipo: document.getElementById('novedad-tipo').value,
                detalle: document.getElementById('novedad-detalle').value
            };

            try {
                const res = await Api.registrarNovedad(novedad);
                if (res && res.exito !== false) {
                    if (msg) {
                        msg.textContent = 'Novedad agregada correctamente.';
                        msg.className = 'nexus-form-mensaje exito';
                    }
                    formNov.reset();
                    cargarSeccionNovedades();
                } else {
                    if (msg) {
                        msg.textContent = res.mensaje || 'Error al guardar novedad.';
                        msg.className = 'nexus-form-mensaje error';
                    }
                }
            } catch (err) {
                if (msg) {
                    msg.textContent = 'Error de red al registrar la novedad.';
                    msg.className = 'nexus-form-mensaje error';
                }
            }
        });
    }

    // Formulario de Calculadora Novedades Múltiples
    const btnCalc = document.getElementById('btn-procesar-calc');
    if (btnCalc) {
        btnCalc.addEventListener('click', async () => {
            const empId = document.getElementById('calc-empleado').value;
            const msg = document.getElementById('calc-form-mensaje');

            if (!empId) {
                if (msg) {
                    msg.textContent = 'Por favor seleccione un colaborador.';
                    msg.className = 'nexus-form-mensaje error';
                }
                return;
            }

            const hExtra = parseFloat(document.getElementById('calc-horas-extra').value) || 0;
            const ausencias = parseFloat(document.getElementById('calc-ausencias').value) || 0;
            const bonos = parseFloat(document.getElementById('calc-bonos').value) || 0;
            const comisiones = parseFloat(document.getElementById('calc-comisiones').value) || 0;

            if (msg) {
                msg.textContent = 'Procesando registro de novedades múltiples...';
                msg.className = 'nexus-form-mensaje';
            }

            const peticiones = [];
            const empEmpresa = idEmpresaActiva();

            if (hExtra > 0) peticiones.push(Api.registrarNovedad({ ID_Empresa: empEmpresa, ID_Empleado: empId, tipo: 'Horas Extra', detalle: `$${hExtra.toFixed(2)}` }));
            if (ausencias > 0) peticiones.push(Api.registrarNovedad({ ID_Empresa: empEmpresa, ID_Empleado: empId, tipo: 'Ausencia', detalle: `-$${ausencias.toFixed(2)}` }));
            if (bonos > 0) peticiones.push(Api.registrarNovedad({ ID_Empresa: empEmpresa, ID_Empleado: empId, tipo: 'Bono', detalle: `$${bonos.toFixed(2)}` }));
            if (comisiones > 0) peticiones.push(Api.registrarNovedad({ ID_Empresa: empEmpresa, ID_Empleado: empId, tipo: 'Comisión', detalle: `$${comisiones.toFixed(2)}` }));

            if (peticiones.length === 0) {
                if (msg) {
                    msg.textContent = 'Ingrese al menos un monto en los campos.';
                    msg.className = 'nexus-form-mensaje error';
                }
                return;
            }

            try {
                await Promise.all(peticiones);
                if (msg) {
                    msg.textContent = 'Novedades registradas con éxito.';
                    msg.className = 'nexus-form-mensaje exito';
                }
                document.getElementById('nexus-form-calculadora').reset();
            } catch (e) {
                if (msg) {
                    msg.textContent = 'Ocurrió un error al registrar las novedades.';
                    msg.className = 'nexus-form-mensaje error';
                }
            }
        });
    }

    // Generar Planilla
    const btnGenPlanilla = document.getElementById('btn-generar-planilla');
    if (btnGenPlanilla) {
        btnGenPlanilla.addEventListener('click', async () => {
            if (!confirm('¿Desea generar la planilla para la empresa actual con el período presente?')) return;
            
            const cont = document.getElementById('planillas-view');
            if (cont) cont.innerHTML = '<p>Generando planilla y calculando aportes legales...</p>';

            try {
                const res = await Api.generarPlanilla({ ID_Empresa: idEmpresaActiva(), Periodo: new Date().toISOString().slice(0, 7) });
                if (res && res.exito !== false) {
                    alert('Planilla generada con éxito.');
                    cargarSeccionPlanillas();
                } else {
                    alert('No se pudo generar la planilla: ' + (res.mensaje || 'Error del servidor'));
                    cargarSeccionPlanillas();
                }
            } catch (e) {
                alert('Error de conexión al procesar la planilla.');
                cargarSeccionPlanillas();
            }
        });
    }

    // Selector Detalle Planilla
    const selectDetalle = document.getElementById('select-planilla-detalle');
    if (selectDetalle) {
        selectDetalle.addEventListener('change', (e) => {
            renderizarDetallePlanilla(e.target.value);
        });
    }

    // Carga inicial
    const primerEnlace = document.querySelector('.sidebar-nav a.active') || document.querySelector('.sidebar-nav a');
    const inicioTab = primerEnlace ? primerEnlace.getAttribute('data-tab') : 'tab-dashboard';
    mostrarSeccion(inicioTab, primerEnlace);
});
