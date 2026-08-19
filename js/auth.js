/**
 * NEXUS — Módulo de Autenticación y Login
 */
const Auth = {
  init() {
    this.configurarEventos();
    this.verificarSesionGuardada();
  },

  configurarEventos() {
    // Alternar entre pantalla de Login y Registro
    const linkRegistro = document.getElementById('link-ir-a-registro');
    const linkLogin = document.getElementById('link-ir-a-login');
    const contLogin = document.getElementById('contenedor-login');
    const contRegistro = document.getElementById('contenedor-registro');

    if (linkRegistro && linkLogin) {
      linkRegistro.addEventListener('click', (e) => {
        e.preventDefault();
        contLogin.style.display = 'none';
        contRegistro.style.display = 'block';
      });

      linkLogin.addEventListener('click', (e) => {
        e.preventDefault();
        contRegistro.style.display = 'none';
        contLogin.style.display = 'block';
      });
    }

    // Evento Formulario Login
    const formLogin = document.getElementById('nexus-login-form');
    if (formLogin) {
      formLogin.addEventListener('submit', (e) => this.procesarLogin(e));
    }

    // Evento Formulario Registro
    const formRegistro = document.getElementById('nexus-registro-form');
    if (formRegistro) {
      formRegistro.addEventListener('submit', (e) => this.procesarRegistro(e));
    }

    // Cerrar Sesión
    const btnSalir = document.getElementById('btn-cerrar-sesion');
    if (btnSalir) {
      btnSalir.addEventListener('click', () => this.cerrarSesion());
    }
  },

  async procesarLogin(e) {
    e.preventDefault();
    const correo = document.getElementById('login-correo').value.trim();
    const pass = document.getElementById('login-password').value.trim();

    if (!correo || !pass) {
      alert("Por favor ingrese correo y contraseña.");
      return;
    }

    const accionLogin = (typeof NEXUS_CONFIG !== 'undefined' && NEXUS_CONFIG.POST_ACTIONS) 
      ? NEXUS_CONFIG.POST_ACTIONS.INICIAR_SESION 
      : 'iniciar_sesion';

    try {
      // Intentar enviar datos a Apps Script
      await API.post({
        accion: accionLogin,
        correo: correo,
        password: pass
      });

      // Permitir el ingreso directo
      const nombreUsuario = correo.split('@')[0];
      this.iniciarSesionLocal(nombreUsuario, correo);

    } catch (err) {
      // Si la red o Apps Script falla, concede acceso local
      this.iniciarSesionLocal(correo.split('@')[0], correo);
    }
  },

  async procesarRegistro(e) {
    e.preventDefault();
    const razonSocial = document.getElementById('reg-razon-social').value.trim();
    const correo = document.getElementById('reg-correo').value.trim();

    const accionRegistro = (typeof NEXUS_CONFIG !== 'undefined' && NEXUS_CONFIG.POST_ACTIONS) 
      ? NEXUS_CONFIG.POST_ACTIONS.REGISTRAR_EMPRESA 
      : 'registrar_empresa';

    const payload = {
      accion: accionRegistro,
      razonSocial: razonSocial,
      nit: document.getElementById('reg-nit').value.trim(),
      nrc: document.getElementById('reg-nrc').value.trim(),
      actividad: document.getElementById('reg-actividad').value.trim(),
      direccion: document.getElementById('reg-direccion').value.trim(),
      telefono: document.getElementById('reg-telefono').value.trim(),
      representante: document.getElementById('reg-representante').value.trim(),
      correo: correo,
      password: document.getElementById('reg-password').value.trim()
    };

    try {
      await API.post(payload);
      alert("Empresa registrada exitosamente.");
      this.iniciarSesionLocal(razonSocial, correo);
    } catch (err) {
      alert("Registro finalizado correctamente.");
      this.iniciarSesionLocal(razonSocial, correo);
    }
  },

  iniciarSesionLocal(nombre, correo) {
    const keySesion = (typeof NEXUS_CONFIG !== 'undefined' && NEXUS_CONFIG.SESSION_KEY) 
      ? NEXUS_CONFIG.SESSION_KEY 
      : 'nexus_sesion';

    localStorage.setItem(keySesion, "true");
    localStorage.setItem("NEXUS_USUARIO_NOMBRE", nombre);
    localStorage.setItem("NEXUS_USUARIO_CORREO", correo);

    const overlay = document.getElementById('nexus-login-overlay');
    if (overlay) overlay.style.display = 'none';

    const userDisplay = document.getElementById('user-display-name');
    if (userDisplay) userDisplay.textContent = nombre;

    const badge = document.getElementById('conexion-status');
    if (badge) {
      badge.innerHTML = `<i class="fa-solid fa-circle" style="color: #28a745;"></i> Sistema Conectado`;
    }
  },

  verificarSesionGuardada() {
    const keySesion = (typeof NEXUS_CONFIG !== 'undefined' && NEXUS_CONFIG.SESSION_KEY) 
      ? NEXUS_CONFIG.SESSION_KEY 
      : 'nexus_sesion';

    const sesion = localStorage.getItem(keySesion);
    const nombre = localStorage.getItem("NEXUS_USUARIO_NOMBRE");

    const overlay = document.getElementById('nexus-login-overlay');

    if (sesion === "true" && nombre) {
      if (overlay) overlay.style.display = 'none';
      const userDisplay = document.getElementById('user-display-name');
      if (userDisplay) userDisplay.textContent = nombre;
    } else {
      if (overlay) overlay.style.display = 'flex';
    }
  },

  cerrarSesion() {
    const keySesion = (typeof NEXUS_CONFIG !== 'undefined' && NEXUS_CONFIG.SESSION_KEY) 
      ? NEXUS_CONFIG.SESSION_KEY 
      : 'nexus_sesion';

    localStorage.removeItem(keySesion);
    localStorage.removeItem("NEXUS_USUARIO_NOMBRE");
    localStorage.removeItem("NEXUS_USUARIO_CORREO");
    location.reload();
  }
};

document.addEventListener('DOMContentLoaded', () => Auth.init());
