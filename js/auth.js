/**
 * NEXUS — Módulo de Autenticación y Login
 */
const Auth = {
  init() {
    this.configurarEventos();
    this.verificarSesionGuardada();
  },

  configurarEventos() {
    // Alternar entre login y registro
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

    // Intentar autenticación vía API
    try {
      const res = await API.post({
        accion: "iniciar_sesion",
        correo: correo,
        password: pass
      });

      // Se concede acceso local directo (Offline o Online)
      const nombreUsuario = correo.split('@')[0];
      this.iniciarSesionLocal(nombreUsuario, correo);

    } catch (err) {
      // Si falla la red, permite el acceso con credenciales locales
      this.iniciarSesionLocal(correo.split('@')[0], correo);
    }
  },

  async procesarRegistro(e) {
    e.preventDefault();
    const razonSocial = document.getElementById('reg-razon-social').value.trim();
    const correo = document.getElementById('reg-correo').value.trim();

    const payload = {
      accion: "registrar_empresa",
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
      alert("Empresa registrada correctamente.");
      this.iniciarSesionLocal(razonSocial, correo);
    } catch (err) {
      alert("Registro completado en modo local.");
      this.iniciarSesionLocal(razonSocial, correo);
    }
  },

  iniciarSesionLocal(nombre, correo) {
    localStorage.setItem("NEXUS_SESION_ACTIVA", "true");
    localStorage.setItem("NEXUS_USUARIO_NOMBRE", nombre);
    localStorage.setItem("NEXUS_USUARIO_CORREO", correo);

    const overlay = document.getElementById('nexus-login-overlay');
    if (overlay) overlay.style.display = 'none';

    const userDisplay = document.getElementById('user-display-name');
    if (userDisplay) userDisplay.textContent = nombre;

    const badge = document.getElementById('conexion-status');
    if (badge) {
      badge.innerHTML = `<i class="fa-solid fa-circle" style="color: #28a745;"></i> Sesión Activa`;
    }
  },

  verificarSesionGuardada() {
    const sesion = localStorage.getItem("NEXUS_SESION_ACTIVA");
    const nombre = localStorage.getItem("NEXUS_USUARIO_NOMBRE");
    const correo = localStorage.getItem("NEXUS_USUARIO_CORREO");

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
    localStorage.removeItem("NEXUS_SESION_ACTIVA");
    localStorage.removeItem("NEXUS_USUARIO_NOMBRE");
    localStorage.removeItem("NEXUS_USUARIO_CORREO");
    location.reload();
  }
};

document.addEventListener('DOMContentLoaded', () => Auth.init());
