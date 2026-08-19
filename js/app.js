/**
 * NEXUS — Controlador de Aplicación (app.js)
 */

// Utilidad para extraer el ID de la Empresa en sesión
function getIdEmpresaActiva() {
    const usr = Auth.usuarioActual();
    return usr ? (usr.idEmpresa || usr.ID_Empresa || usr.empresa || '') : '';
}

// Cambiar de pestaña / sección
function mostrarSeccion(idSeccion, elLink) {
    document.querySelectorAll('.tab-content, .app-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));

    const seccionObj = document.getElementById(idSeccion);
    if (seccionObj) seccionObj.classList.add('active');

    if (elLink) {
        elLink.classList.add('active');
    } else {
        const linkCoincidente = document.querySelector(`.sidebar-nav a[data-tab="${idSeccion}"]`);
        if (linkCoincidente) linkCoincidente.classList.add('active');
    }

    cargarDatosModulo(idSeccion);
}

// Cargar datos desde Google Sheets al hacer clic en un módulo
async function cargarDatosModulo(idSeccion) {
    const idEmpresa = getIdEmpresaActiva();
    if (!idEmpresa && idSeccion !== 'inicio') return;

    try {
        switch (idSeccion) {
            case 'empleados':
                await cargarListaEmpleados(idEmpresa);
                break;
            case 'historial-nexus':
                await cargarListaHistorial(idEmpresa);
                break;
            // Otros módulos se activan al estar configurados en el backend
        }
    } catch (err) {
        console.error(`Error al cargar la sección ${idSeccion}:`, err);
    }
}

// Renderizar tabla de Empleados
async function cargarListaEmpleados(idEmpresa) {
    const contenedor = document.getElementById('tabla-empleados-container');
    if (!contenedor) return;
    contenedor.innerHTML = '<p class="loading-text">Cargando registros de Google Sheets...</p>';

    try {
        const res = await Api.getEmpleados({ idEmpresa });
        const lista = Array.isArray(res) ? res : (res.datos || res.data || []);

        if (lista.length === 0) {
            contenedor.innerHTML = '<p class="empty-text">No hay empleados registrados en Google Sheets.</p>';
            return;
        }

        let html = `
            <table class="nexus-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>DUI</th>
                        <th>Cargo</th>
                        <th>Salario</th>
                    </tr>
                </thead>
                <tbody>`;
        
        lista.forEach(e => {
            html += `
                <tr>
                    <td>${e.ID_Empleado || e.id || '-'}</td>
                    <td>${e.Nombre || e.nombre || '-'}</td>
                    <td>${e.DUI || e.dui || '-'}</td>
                    <td>${e.Cargo || e.cargo || '-'}</td>
                    <td>$${parseFloat(e.Salario || e.salario || 0).toFixed(2)}</td>
                </tr>`;
        });
        html += '</tbody></table>';
        contenedor.innerHTML = html;
    } catch (error) {
        contenedor.innerHTML = `<p class="error-text">Error al cargar empleados: ${error.message}</p>`;
    }
}

// Cargar Historial
async function cargarListaHistorial(idEmpresa) {
    const contenedor = document.getElementById('tabla-historial-container');
    if (!contenedor) return;
    
    try {
        const res = await Api.getHistorial({ idEmpresa });
        const lista = Array.isArray(res) ? res : (res.datos || []);
        if (lista.length === 0) {
            contenedor.innerHTML = '<p>No hay eventos registrados en el Historial.</p>';
            return;
        }
        let html = `<table class="nexus-table"><thead><tr><th>Fecha</th><th>Acción</th><th>Detalle</th></tr></thead><tbody>`;
        lista.forEach(h => {
            html += `<tr><td>${h.Fecha || '-'}</td><td>${h.Accion || '-'}</td><td>${h.Detalle || '-'}</td></tr>`;
        });
        html += '</tbody></table>';
        contenedor.innerHTML = html;
    } catch (e) {
        contenedor.innerHTML = `<p class="error-text">No se pudo obtener el historial.</p>`;
    }
}

// Inicializar Aplicación
document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Manejo del Menú Navegación
    document.querySelectorAll('.sidebar-nav a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const tabTarget = link.getAttribute('data-tab');
            if (tabTarget) mostrarSeccion(tabTarget, link);
        });
    });

    // 2. Control Obligatorio de Inicio de Sesión
    const modalAuth = document.getElementById('modal-auth');
    const usuarioActivo = Auth.usuarioActual();

    if (!usuarioActivo) {
        if (modalAuth) modalAuth.style.display = 'flex'; // Bloquea la app hasta iniciar sesión
    } else {
        if (modalAuth) modalAuth.style.display = 'none';
        mostrarSeccion('inicio');
    }

    // Evento Formulario de Login
    const formLogin = document.getElementById('form-login');
    if (formLogin) {
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();
            const usuario = document.getElementById('login-usuario').value.trim();
            const pass = document.getElementById('login-pass').value.trim();
            const msg = document.getElementById('login-mensaje');

            if (msg) msg.textContent = 'Validando con Google Sheets...';

            try {
                const res = await Api.iniciarSesion({ usuario, pass });
                if (res && (res.estado === 'correcto' || res.exito)) {
                    Auth.guardarSesion(res.usuario || { idEmpresa: res.idEmpresa || 'EMP01', usuario });
                    
                    // Registrar inicio de sesión en Google Sheets (Historial)
                    Api.registrarAuditoria({
                        idEmpresa: getIdEmpresaActiva(),
                        accion: 'Inicio de Sesión',
                        detalle: `El usuario ${usuario} ha ingresado a la plataforma.`
                    }).catch(() => {});

                    if (modalAuth) modalAuth.style.display = 'none';
                    mostrarSeccion('inicio');
                } else {
                    if (msg) msg.textContent = res.mensaje || 'Credenciales incorrectas.';
                }
            } catch (err) {
                if (msg) msg.textContent = err.message || 'Error al iniciar sesión.';
            }
        });
    }

    // 3. Evento Formulario Crear Empleado
    const formEmpleado = document.getElementById('form-crear-empleado');
    if (formEmpleado) {
        formEmpleado.addEventListener('submit', async (e) => {
            e.preventDefault(); // Detiene recarga de página que provocaba el fallo
            
            const msgStatus = document.getElementById('empleado-form-mensaje');
            if (msgStatus) msgStatus.textContent = 'Enviando a Google Sheets...';

            const payload = {
                idEmpresa: getIdEmpresaActiva(),
                nombre: document.getElementById('emp-nombre').value,
                dui: document.getElementById('emp-dui').value,
                cargo: document.getElementById('emp-cargo').value,
                salario: parseFloat(document.getElementById('emp-salario').value)
            };

            try {
                await Api.registrarEmpleado(payload);
                if (msgStatus) {
                    msgStatus.textContent = '¡Empleado guardado exitosamente en Google Sheets!';
                    msgStatus.style.color = 'green';
                }
                formEmpleado.reset();
                cargarListaEmpleados(getIdEmpresaActiva()); // Recargar lista
            } catch (err) {
                if (msgStatus) {
                    msgStatus.textContent = `Error al guardar: ${err.message}`;
                    msgStatus.style.color = 'red';
                }
            }
        });
    }
});
