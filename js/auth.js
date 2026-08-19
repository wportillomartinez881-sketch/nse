/**
 * NEXUS — Autenticación (auth.js)
 */
const API_URL = "https://script.google.com/macros/s/AKfycbzuqC4RclUYdMhgTXA3iIVdp7WZuF5kwMZDcPv4NmAncVWAvZnNOPu0FajuBK1DkK95/exec";

// Forzar la apertura del modal siempre que se cargue la página
document.addEventListener("DOMContentLoaded", function () {
  const overlayModal = document.getElementById("nexus-login-overlay");
  
  // Limpiamos sesión para obligar el login en cada ingreso si así lo requieres
  localStorage.removeItem("ID_Empresa");
  localStorage.removeItem("ID_Usuario");

  if (overlayModal) {
    overlayModal.style.display = "flex"; // Mostrar siempre modal al entrar
  }

  // Alternar entre Formularios Login / Registro
  const linkIrARegistro = document.getElementById("link-ir-a-registro");
  const linkIrALogin = document.getElementById("link-ir-a-login");
  const contenedorLogin = document.getElementById("contenedor-login");
  const contenedorRegistro = document.getElementById("contenedor-registro");

  if (linkIrARegistro) {
    linkIrARegistro.addEventListener("click", function (e) {
      e.preventDefault();
      contenedorLogin.style.display = "none";
      contenedorRegistro.style.display = "block";
    });
  }

  if (linkIrALogin) {
    linkIrALogin.addEventListener("click", function (e) {
      e.preventDefault();
      contenedorRegistro.style.display = "none";
      contenedorLogin.style.display = "block";
    });
  }

  // Login
  const formLogin = document.getElementById("nexus-login-form");
  if (formLogin) {
    formLogin.addEventListener("submit", function (e) {
      e.preventDefault();
      const correo = document.getElementById("login-correo").value;
      const pass = document.getElementById("login-password").value;
      iniciarSesion(correo, pass);
    });
  }

  // Cerrar Sesión
  const btnLogout = document.getElementById("btn-cerrar-sesion");
  if (btnLogout) {
    btnLogout.addEventListener("click", function () {
      localStorage.clear();
      location.reload();
    });
  }
});

async function iniciarSesion(correo, password) {
  try {
    const payload = {
      accion: "iniciar_sesion",
      Correo: correo,
      Password: password
    };

    const respuesta = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    }).then(res => res.json());

    if (respuesta.estado === "correcto") {
      localStorage.setItem("ID_Empresa", respuesta.usuario.ID_Empresa || "EMP01");
      localStorage.setItem("ID_Usuario", respuesta.usuario.ID_Usuario || "USR01");
      
      const userDisplay = document.getElementById("user-display-name");
      if (userDisplay) userDisplay.textContent = respuesta.usuario.Nombre || correo;

      const modal = document.getElementById("nexus-login-overlay");
      if (modal) modal.style.display = "none";
      
      // Cargar datos de la aplicación completa
      if (typeof app !== 'undefined' && app.init) app.init();
    } else {
      alert("Error de acceso: " + (respuesta.mensaje || "Credenciales inválidas"));
    }
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    alert("Error de conexión con Google Sheets.");
  }
}
