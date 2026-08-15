/**
 * NEXUS — Sesión y autenticación
 * -------------------------------------------------------------------------
 * Único lugar que sabe quién es el usuario activo y a qué empresa
 * (ID_Empresa) pertenece. El resto de módulos consulta Auth.empresaActiva()
 * en vez de leer sessionStorage directamente, así la separación
 * multiempresa (sección 22) se cumple desde un solo punto.
 */
const Auth = (() => {
  let sesion = null;

  function cargar() {
    try {
      const raw = sessionStorage.getItem(NEXUS_CONFIG.SESSION_KEY);
      sesion = raw ? JSON.parse(raw) : null;
    } catch (e) {
      sesion = null;
    }
    return sesion;
  }

  function guardar(datosSesion) {
    sesion = datosSesion;
    sessionStorage.setItem(NEXUS_CONFIG.SESSION_KEY, JSON.stringify(datosSesion));
  }

  function cerrarSesion() {
    sesion = null;
    sessionStorage.removeItem(NEXUS_CONFIG.SESSION_KEY);
    Api.invalidarCache();
  }

  function estaAutenticado() {
    return !!(sesion || cargar());
  }

  function usuarioActivo() {
    return (sesion || cargar())?.usuario ?? null;
  }

  function empresaActiva() {
    return (sesion || cargar())?.ID_Empresa ?? null;
  }

  function contextoAsistente() {
    const usuario = usuarioActivo();
    return {
      nombre: usuario?.nombre || usuario?.Nombre || usuario?.correo || 'usuario',
      empresa: empresaActiva(),
      autenticado: estaAutenticado(),
    };
  }

  /**
   * Intenta iniciar sesión contra el endpoint confirmado `iniciar_sesion`.
   * SUPUESTO A VERIFICAR: se asume que la API responde algo del tipo
   *   { ok: true, usuario: {...}, ID_Empresa: '...' }
   * o similar. Si el Code.gs real responde con otra forma, ajustar solo
   * el mapeo dentro de esta función.
   */
  async function login(correo, contrasena) {
    const respuesta = await Api.iniciarSesion({ correo, contrasena });

    if (!respuesta || respuesta.ok === false || respuesta.success === false || respuesta.error) {
      throw new Api.ApiError(respuesta?.error || respuesta?.mensaje || respuesta?.message || 'Correo o contraseña incorrectos.', 'ERROR_API');
    }

    const datosSesion = {
      usuario: respuesta.usuario || respuesta.Usuario || { correo },
      ID_Empresa: respuesta.ID_Empresa || respuesta.usuario?.ID_Empresa || respuesta.Usuario?.ID_Empresa || null,
      rol: respuesta.rol || respuesta.usuario?.rol || 'usuario',
      inicioSesion: new Date().toISOString(),
    };
    guardar(datosSesion);
    return datosSesion;
  }

  return { login, cerrarSesion, estaAutenticado, usuarioActivo, empresaActiva, contextoAsistente, cargar };
})();
