// URL de la API de Google Apps Script (Actualizada con tu implementación actual)
const API_URL = "https://script.google.com/macros/s/AKfycbzoCo98Z-eYWrQfNZOGzUByhF9Y1Bcb1QqMh0akVPgwYUdWC8xIg5ZqmWGCzaD0T5SB/exec";

// Estado local de la sesión
let usuarioSesion = null;

// ==========================================
// INICIALIZACIÓN Y NAVEGACIÓN
// ==========================================

function mostrarTab(tab) {
  document.getElementById('form-login').classList.toggle('hidden', tab !== 'login');
  document.getElementById('form-register').classList.toggle('hidden', tab !== 'register');
  document.getElementById('tab-login').classList.toggle('active', tab === 'login');
  document.getElementById('tab-register').classList.toggle('active', tab === 'register');
  ocultarMensajeAuth();
}

function navegarA(moduloId) {
  const modulos = document.querySelectorAll('.modulo-content');
  modulos.forEach(m => m.classList.add('hidden'));
  
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(n => n.classList.remove('active'));

  document.getElementById(moduloId).classList.remove('hidden');
  
  // Actualizar título
  const titulos = {
    'modulo-dashboard': 'Panel Principal',
    'modulo-empleados': 'Gestión de Empleados',
    'modulo-novedades': 'Registro de Novedades',
    'modulo-planillas': 'Procesamiento de Planilla',
    'modulo-auditoria': 'Bitácora de Auditoría'
  };
  document.getElementById('page-title').innerText = titulos[moduloId] || 'Panel';

  // Cargar datos según el módulo activo
  if (moduloId === 'modulo-empleados') cargarEmpleados();
  if (moduloId === 'modulo-novedades') cargarNovedades();
  if (moduloId === 'modulo-auditoria') cargarAuditoria();
}

// ==========================================
// AUTENTICACIÓN & REGISTRO
// ==========================================

async function ejecutarLogin(e) {
  e.preventDefault();
  const correo = document.getElementById('login-email').value;
  const password = document.getElementById('login-pass').value;

  mostrarMensajeAuth("Verificando credenciales...", "normal");

  try {
    const respuesta = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        accion: "iniciar_sesion",
        Correo: correo,
        Password: password
      })
    });

    const data = await respuesta.json();

    if (data.estado === "correcto") {
      usuarioSesion = data.usuario;
      iniciarPantallaPrincipal();
    } else {
      mostrarMensajeAuth(data.mensaje || "Error al iniciar sesión", "error");
    }
  } catch (err) {
    mostrarMensajeAuth("Error de conexión con la API.", "error");
  }
}

async function ejecutarRegistro(e) {
  e.preventDefault();
  
  // Payload completo con todos los campos solicitados por tu estructura de Google Sheets
  const payload = {
    accion: "registrar_empresa_usuario",
    Razon_Social: document.getElementById('reg-razon').value,
    NIT: document.getElementById('reg-nit').value,
    NRC: document.getElementById('reg-nrc').value,
    Actividad_Economica: document.getElementById('reg-actividad').value,
    Direccion: document.getElementById('reg-direccion').value,
    Telefono: document.getElementById('reg-telefono').value,
    Representante: document.getElementById('reg-representante').value,
    Nombre: document.getElementById('reg-nombre').value,
    Correo: document.getElementById('reg-email').value,
    Password: document.getElementById('reg-pass').value
  };

  mostrarMensajeAuth("Registrando empresa y usuario...", "normal");

  try {
    const respuesta = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify(payload)
    });

    const data = await respuesta.json();

    if (data.estado === "correcto") {
      mostrarMensajeAuth("¡Empresa registrada con éxito! Por favor inicia sesión.", "exito");
      setTimeout(() => {
        mostrarTab('login');
        document.getElementById('form-register').reset();
      }, 2000);
    } else {
      mostrarMensajeAuth(data.mensaje || "Error al registrar", "error");
    }
  } catch (err) {
    mostrarMensajeAuth("Error al enviar solicitud.", "error");
  }
}

function iniciarPantallaPrincipal() {
  document.getElementById('auth-container').classList.add('hidden');
  document.getElementById('app-container').classList.remove('hidden');

  document.getElementById('display-user-name').innerText = usuarioSesion.Nombre;
  document.getElementById('display-user-role').innerText = usuarioSesion.Rol;
  document.getElementById('display-empresa-id').innerText = usuarioSesion.ID_Empresa;

  navegarA('modulo-dashboard');
}

function cerrarSesion() {
  usuarioSesion = null;
  document.getElementById('app-container').classList.add('hidden');
  document.getElementById('auth-container').classList.remove('hidden');
  mostrarTab('login');
}

function mostrarMensajeAuth(msg, tipo) {
  const box = document.getElementById('auth-mensaje');
  box.innerText = msg;
  box.className = `mensaje-status ${tipo}`;
  box.classList.remove('hidden');
}

function ocultarMensajeAuth() {
  document.getElementById('auth-mensaje').classList.add('hidden');
}

// ==========================================
// MÓDULO EMPLEADOS
// ==========================================

async function cargarEmpleados() {
  const tbody = document.getElementById('tabla-empleados-body');
  tbody.innerHTML = '<tr><td colspan="6" class="text-center">Cargando...</td></tr>';

  try {
    const res = await fetch(`${API_URL}?accion=empleados&ID_Empresa=${usuarioSesion.ID_Empresa}`);
    const lista = await res.json();

    if (Array.isArray(lista)) {
      const misEmpleados = lista.filter(emp => emp.ID_Empresa === usuarioSesion.ID_Empresa);
      
      document.getElementById('kpi-empleados').innerText = misEmpleados.length;

      if (misEmpleados.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No hay empleados registrados.</td></tr>';
        return;
      }

      tbody.innerHTML = misEmpleados.map(emp => `
        <tr>
          <td>${emp.ID_Empleado}</td>
          <td>${emp.Nombre_Completo}</td>
          <td>${emp.DUI}</td>
          <td>${emp.Cargo}</td>
          <td>$${parseFloat(emp.Salario_Base || 0).toFixed(2)}</td>
          <td><span class="badge">${emp.Estado}</span></td>
        </tr>
      `).join('');
    }
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">Error al cargar datos.</td></tr>';
  }
}

function abrirModalEmpleado() {
  document.getElementById('modal-empleado').classList.remove('hidden');
}

function cerrarModalEmpleado() {
  document.getElementById('modal-empleado').classList.add('hidden');
}

async function guardarEmpleado(e) {
  e.preventDefault();
  
  const payload = {
    accion: "registrar_empleado",
    ID_Empresa: usuarioSesion.ID_Empresa,
    Nombre_Completo: document.getElementById('emp-nombre').value,
    DUI: document.getElementById('emp-dui').value,
    Cargo: document.getElementById('emp-cargo').value,
    Salario_Base: parseFloat(document.getElementById('emp-salario').value)
  };

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (data.estado === "correcto") {
      cerrarModalEmpleado();
      cargarEmpleados();
    } else {
      alert(data.mensaje);
    }
  } catch (err) {
    alert("Error al registrar empleado");
  }
}

// ==========================================
// MÓDULO NOVEDADES
// ==========================================

async function cargarNovedades() {
  const tbody = document.getElementById('tabla-novedades-body');
  tbody.innerHTML = '<tr><td colspan="7" class="text-center">Cargando...</td></tr>';

  try {
    const res = await fetch(`${API_URL}?accion=novedades&ID_Empresa=${usuarioSesion.ID_Empresa}`);
    const lista = await res.json();

    if (Array.isArray(lista)) {
      document.getElementById('kpi-novedades').innerText = lista.length;

      if (lista.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No hay novedades registradas.</td></tr>';
        return;
      }

      tbody.innerHTML = lista.map(nov => `
        <tr>
          <td>${nov.ID_Novedad}</td>
          <td>${nov.ID_Empleado}</td>
          <td>${nov.Periodo || '-'}</td>
          <td>${nov.Tipo_Novedad}</td>
          <td>${nov.Cantidad}</td>
          <td>$${parseFloat(nov.Valor || 0).toFixed(2)}</td>
          <td>${nov.Estado}</td>
        </tr>
      `).join('');
    }
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center">Error al cargar novedades.</td></tr>';
  }
}

// ==========================================
// MÓDULO AUDITORÍA
// ==========================================

async function cargarAuditoria() {
  const tbody = document.getElementById('tabla-auditoria-body');
  tbody.innerHTML = '<tr><td colspan="6" class="text-center">Cargando...</td></tr>';

  try {
    const res = await fetch(`${API_URL}?accion=auditoria&ID_Empresa=${usuarioSesion.ID_Empresa}`);
    const lista = await res.json();

    if (Array.isArray(lista)) {
      tbody.innerHTML = lista.map(aud => `
        <tr>
          <td>${aud.ID_Auditoria}</td>
          <td>${new Date(aud.Fecha_Hora).toLocaleString()}</td>
          <td>${aud.Accion}</td>
          <td>${aud.Usuario}</td>
          <td>${aud.Registro_Afectado}</td>
          <td>${aud.Resultado}</td>
        </tr>
      `).join('');
    }
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">Error al cargar auditoría.</td></tr>';
  }
}

// ==========================================
// WIDGET ATENA (ASISTENTE VIRTUAL) CON IA REAL
// ==========================================

function toggleAtena() {
  document.getElementById('atena-box').classList.toggle('hidden');
}

function evaluarAtenaTecla(e) {
  if (e.key === 'Enter') enviarMensajeAtena();
}

async function enviarMensajeAtena() {
  const input = document.getElementById('atena-input');
  const texto = input.value.trim();
  if (!texto) return;

  const box = document.getElementById('atena-messages');
  
  // Mensaje usuario
  box.innerHTML += `<div class="msg user-msg">${texto}</div>`;
  input.value = '';
  box.scrollTop = box.scrollHeight;

  // Mensaje temporal de carga de Atena
  const idCarga = "atena-carga-" + Date.now();
  box.innerHTML += `<div id="${idCarga}" class="msg atena-msg">Atena está pensando...</div>`;
  box.scrollTop = box.scrollHeight;

  try {
    const respuesta = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        accion: "preguntar_ia",
        pregunta: texto
      })
    });

    const data = await respuesta.json();
    const elemCarga = document.getElementById(idCarga);
    if (elemCarga) elemCarga.remove();

    if (data.estado === "correcto" && data.respuesta) {
      box.innerHTML += `<div class="msg atena-msg">${data.respuesta}</div>`;
    } else {
      box.innerHTML += `<div class="msg atena-msg">Lo siento, tuve un problema al procesar tu consulta: ${data.mensaje || "Error desconocido"}</div>`;
    }
  } catch (err) {
    const elemCarga = document.getElementById(idCarga);
    if (elemCarga) elemCarga.remove();
    box.innerHTML += `<div class="msg atena-msg">Error de conexión con la asistente virtual.</div>`;
  }
  
  box.scrollTop = box.scrollHeight;
}
