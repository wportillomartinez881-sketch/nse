// URL de la API de Google Apps Script V5.1 (Modo Escritura Unidireccional)
const API_URL = "https://script.google.com/macros/s/AKfycbzuqC4RclUYdMhgTXA3iIVdp7WZuF5kwMZDcPv4NmAncVWAvZnNOPu0FajuBK1DkK95/exec";

// Estado local de la sesión y arreglos vacíos para ingreso manual
let usuarioSesion = null;
let empleadosLocales = [];
let novedadesLocales = [];

// ==========================================
// INICIALIZACIÓN Y NAVEGACIÓN
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  // Forzar inicio en pantalla de login limpia
  cerrarSesion();
});

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

  const moduloActual = document.getElementById(moduloId);
  if (moduloActual) moduloActual.classList.remove('hidden');
  
  const titulos = {
    'modulo-dashboard': 'Panel Principal',
    'modulo-empleados': 'Gestión de Empleados',
    'modulo-novedades': 'Registro de Novedades',
    'modulo-planillas': 'Procesamiento de Planilla',
    'modulo-auditoria': 'Bitácora de Auditoría'
  };
  const tituloEl = document.getElementById('page-title');
  if (tituloEl) tituloEl.innerText = titulos[moduloId] || 'Panel';

  // Renderizar vistas locales vacías para ingreso manual
  if (moduloId === 'modulo-empleados') renderizarEmpleadosLocales();
  if (moduloId === 'modulo-novedades') renderizarNovedadesLocales();
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
  const razonSocial = document.getElementById('reg-razon').value;
  const nit = document.getElementById('reg-nit').value;
  const nombre = document.getElementById('reg-nombre').value;
  const correo = document.getElementById('reg-email').value;
  const password = document.getElementById('reg-pass').value;

  mostrarMensajeAuth("Registrando empresa y usuario...", "normal");

  try {
    const respuesta = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        accion: "registrar_empresa_usuario",
        Razon_Social: razonSocial,
        NIT: nit,
        Nombre: nombre,
        Correo: correo,
        Password: password
      })
    });

    const data = await respuesta.json();

    if (data.estado === "correcto") {
      mostrarMensajeAuth("¡Empresa registrada con éxito! Por favor inicia sesión.", "exito");
      setTimeout(() => mostrarTab('login'), 2000);
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
  empleadosLocales = [];
  novedadesLocales = [];
  const appContainer = document.getElementById('app-container');
  const authContainer = document.getElementById('auth-container');
  if (appContainer) appContainer.classList.add('hidden');
  if (authContainer) authContainer.classList.remove('hidden');
  mostrarTab('login');
}

function mostrarMensajeAuth(msg, tipo) {
  const box = document.getElementById('auth-mensaje');
  if (!box) return;
  box.innerText = msg;
  box.className = `mensaje-status ${tipo}`;
  box.classList.remove('hidden');
}

function ocultarMensajeAuth() {
  const box = document.getElementById('auth-mensaje');
  if (box) box.classList.add('hidden');
}

// ==========================================
// MÓDULO EMPLEADOS (Ingreso Manual Local)
// ==========================================

function renderizarEmpleadosLocales() {
  const tbody = document.getElementById('tabla-empleados-body');
  if (!tbody) return;

  const kpi = document.getElementById('kpi-empleados');
  if (kpi) kpi.innerText = empleadosLocales.length;

  if (empleadosLocales.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">No hay empleados registrados manualmente. Ingrese los datos.</td></tr>';
    return;
  }

  tbody.innerHTML = empleadosLocales.map(emp => `
    <tr>
      <td>${emp.ID_Empleado}</td>
      <td>${emp.Nombre_Completo}</td>
      <td>${emp.DUI}</td>
      <td>${emp.Cargo}</td>
      <td>$${parseFloat(emp.Salario_Base || 0).toFixed(2)}</td>
      <td><span class="badge">Activo</span></td>
    </tr>
  `).join('');
}

function abrirModalEmpleado() {
  const modal = document.getElementById('modal-empleado');
  if (modal) modal.classList.remove('hidden');
}

function cerrarModalEmpleado() {
  const modal = document.getElementById('modal-empleado');
  if (modal) modal.classList.add('hidden');
}

function guardarEmpleado(e) {
  e.preventDefault();
  
  const nuevoEmp = {
    ID_Empleado: "EMP-" + Math.floor(1000 + Math.random() * 9000),
    ID_Empresa: usuarioSesion.ID_Empresa,
    Nombre_Completo: document.getElementById('emp-nombre').value,
    DUI: document.getElementById('emp-dui').value,
    Cargo: document.getElementById('emp-cargo').value,
    Salario_Base: parseFloat(document.getElementById('emp-salario').value) || 0
  };

  empleadosLocales.push(nuevoEmp);
  cerrarModalEmpleado();
  renderizarEmpleadosLocales();

  // Envío unidireccional al backend para que Google Sheets lo guarde
  fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({ accion: "registrar_empleado", ...nuevoEmp })
  }).catch(err => console.error("Error al sincronizar con hoja:", err));
}

// ==========================================
// MÓDULO NOVEDADES (Campos Separados)
// ==========================================

function renderizarNovedadesLocales() {
  const tbody = document.getElementById('tabla-novedades-body');
  if (!tbody) return;

  const kpi = document.getElementById('kpi-novedades');
  if (kpi) kpi.innerText = novedadesLocales.length;

  if (novedadesLocales.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center">No hay novedades registradas.</td></tr>';
    return;
  }

  tbody.innerHTML = novedadesLocales.map(nov => `
    <tr>
      <td>${nov.ID_Novedad}</td>
      <td>${nov.ID_Empleado}</td>
      <td>${nov.Periodo || '-'}</td>
      <td>${nov.Tipo_Novedad}</td>
      <td>${nov.Dias_Aplicar} días / ${nov.Horas_Aplicar} hrs</td>
      <td>$${parseFloat(nov.Valor || 0).toFixed(2)}</td>
      <td>Registrado</td>
    </tr>
  `).join('');
}

// ==========================================
// WIDGET ATENA (ASISTENTE VIRTUAL CON VOZ E INTERRUPCIÓN)
// ==========================================

let synth = window.speechSynthesis;

function toggleAtena() {
  const box = document.getElementById('atena-box');
  if (box) box.classList.toggle('hidden');
}

function evaluarAtenaTecla(e) {
  if (e.key === 'Enter') enviarMensajeAtena();
}

function hablarAtena(texto) {
  if (!synth) return;
  if (synth.speaking) {
    synth.cancel(); // Interrumpe de inmediato cualquier lectura anterior
  }
  let utterance = new SpeechSynthesisUtterance(texto);
  utterance.lang = 'es-ES';
  synth.speak(utterance);
}

function stopVoice() {
  if (synth) synth.cancel(); // Botón para silenciar la voz
}

function enviarMensajeAtena() {
  const input = document.getElementById('atena-input');
  if (!input) return;
  const texto = input.value.trim();
  if (!texto) return;

  const box = document.getElementById('atena-messages');
  if (!box) return;
  
  box.innerHTML += `<div class="msg user-msg">${texto}</div>`;
  input.value = '';

  setTimeout(() => {
    let resp = "Con gusto puedo apoyarte en el sistema Nexus.";
    let textoLower = texto.toLowerCase();
    
    if (textoLower.includes('isss')) {
      resp = "La cuota laboral del ISSS en El Salvador es del 3% sobre el salario tope de $1,000.00.";
    } else if (textoLower.includes('afp')) {
      resp = "La cotización laboral de AFP es del 7.25% sobre el salario nominal.";
    } else if (textoLower.includes('planilla')) {
      resp = "Asegúrese de registrar a sus empleados manualmente antes de procesar el cálculo de planilla.";
    }

    box.innerHTML += `<div class="msg atena-msg">${resp}</div>`;
    box.scrollTop = box.scrollHeight;
    
    // Activar voz de Atena con soporte de interrupción
    hablarAtena(resp);
  }, 400);
}
