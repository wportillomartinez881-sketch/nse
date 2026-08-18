// URL de tu implementación de Google Apps Script NEXUS V5
const API_URL = "https://script.google.com/macros/s/AKfycbzuqC4RclUYdMhgTXA3iIVdp7WZuF5kwMZDcPv4NmAncVWAvZnNOPu0FajuBK1DkK95/exec";

// ----------------------------------------------------
// REGISTRO DE EMPRESA Y USUARIO
// ----------------------------------------------------
async function registrarEmpresaYUsuario(datosFormulario) {
  try {
    const payload = {
      accion: "registrar_empresa_usuario",
      Razon_Social: datosFormulario.razonSocial,
      NIT: datosFormulario.nit,
      NRC: datosFormulario.nrc,
      Actividad_Economica: datosFormulario.actividad,
      Direccion: datosFormulario.direccion,
      Telefono: datosFormulario.telefono,
      Correo: datosFormulario.correo,
      Representante: datosFormulario.representante,
      Password: datosFormulario.password
    };

    const respuesta = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    }).then(res => res.json());

    if (respuesta.estado === "correcto") {
      // Guardar identificadores en la memoria del navegador
      localStorage.setItem("ID_Empresa", respuesta.ID_Empresa);
      localStorage.setItem("ID_Usuario", respuesta.ID_Usuario);
      alert("Empresa y usuario guardados con éxito en Google Sheets.");
      
      // Ocultar modal y recargar aplicación
      const modal = document.getElementById("nexus-login-overlay");
      if (modal) modal.style.display = "none";
      location.reload();
    } else {
      alert("Error en el registro: " + respuesta.mensaje);
    }
  } catch (error) {
    console.error("Error al registrar:", error);
    alert("Ocurrió un error al conectar con Google Sheets.");
  }
}

// ----------------------------------------------------
// INICIO DE SESIÓN
// ----------------------------------------------------
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
      localStorage.setItem("ID_Empresa", respuesta.usuario.ID_Empresa);
      localStorage.setItem("ID_Usuario", respuesta.usuario.ID_Usuario);
      localStorage.setItem("Usuario_Nombre", respuesta.usuario.Nombre);
      alert("Bienvenido, " + respuesta.usuario.Nombre);
      
      const modal = document.getElementById("nexus-login-overlay");
      if (modal) modal.style.display = "none";
      location.reload();
    } else {
      alert("Error: " + respuesta.mensaje);
    }
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    alert("Error de conexión con el servidor.");
  }
}

// ----------------------------------------------------
// EVENTOS DEL DOM
// ----------------------------------------------------
document.addEventListener("DOMContentLoaded", function () {
  const linkIrARegistro = document.getElementById("link-ir-a-registro");
  const linkIrALogin = document.getElementById("link-ir-a-login");
  const contenedorLogin = document.getElementById("contenedor-login");
  const contenedorRegistro = document.getElementById("contenedor-registro");

  // Verificar si hay sesión activa para mostrar u ocultar la ventana modal
  const idEmpresaActiva = localStorage.getItem("ID_Empresa");
  const overlayModal = document.getElementById("nexus-login-overlay");
  
  if (idEmpresaActiva && overlayModal) {
    overlayModal.style.display = "none";
  }

  // Alternar entre Formularios
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

  // Escuchar envío del formulario de Login
  const formLogin = document.getElementById("nexus-login-form");
  if (formLogin) {
    formLogin.addEventListener("submit", function (e) {
      e.preventDefault();
      const correo = document.getElementById("login-correo").value;
      const pass = document.getElementById("login-password").value;
      iniciarSesion(correo, pass);
    });
  }

  // Escuchar envío del formulario de Registro
  const formRegistro = document.getElementById("nexus-registro-form");
  if (formRegistro) {
    formRegistro.addEventListener("submit", function (e) {
      e.preventDefault();

      const datosFormulario = {
        razonSocial: document.getElementById("reg-razon-social").value,
        nit: document.getElementById("reg-nit").value,
        nrc: document.getElementById("reg-nrc").value,
        actividad: document.getElementById("reg-actividad").value,
        direccion: document.getElementById("reg-direccion").value,
        telefono: document.getElementById("reg-telefono").value,
        representante: document.getElementById("reg-representante").value,
        correo: document.getElementById("reg-correo").value,
        password: document.getElementById("reg-password").value
      };

      registrarEmpresaYUsuario(datosFormulario);
    });
  }
});
