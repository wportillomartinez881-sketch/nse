// =====================================================
// NEXUS API - VERSION 5
// =====================================================

const HOJAS = {
  EMPRESA: "EMPRESA",
  USUARIOS: "USUARIOS",
  EMPLEADOS: "EMPLEADOS",
  NOVEDADES: "NOVEDADES",
  PLANILLA: "PLANILLA",
  DETALLE_PLANILLA: "DETALLE_PLANILLA",
  VALIDACION: "VALIDACION",
  REPORTE: "REPORTE",
  HISTORIAL: "HISTORIAL_NEXUS",
  PARAMETROS: "PARAMETROS",
  AUDITORIA: "AUDITORIA",
  FUNDAMENTO: "FUNDAMENTO_LEGAL"
};


// =====================================================
// GET
// =====================================================

function doGet(e) {

  try {

    const accion = e && e.parameter
      ? e.parameter.accion
      : "";

    // NUEVO: filtro multiempresa. El frontend (api.js/app.js) manda este
    // parametro en cada GET cuando hay una sesion activa. Antes doGet lo
    // ignoraba por completo y devolvia TODAS las filas de TODAS las
    // empresas a cualquiera que tuviera sesion (fuga de datos entre
    // empresas). Ahora se usa para filtrar.
    const idEmpresa = e && e.parameter ? e.parameter.ID_Empresa : "";

    const acciones = {

      empresas: () =>
        obtenerDatosHoja(HOJAS.EMPRESA, "ID_Empresa", idEmpresa),

      empleados: () =>
        obtenerDatosHoja(HOJAS.EMPLEADOS, "ID_Empresa", idEmpresa),

      novedades: () =>
        obtenerNovedadesDeEmpresa(idEmpresa),

      planillas: () =>
        obtenerDatosHoja(HOJAS.PLANILLA, "ID_Empresa", idEmpresa),

      detalle_planilla: () =>
        obtenerDatosHoja(HOJAS.DETALLE_PLANILLA, "ID_Planilla", e.parameter.ID_Planilla),

      validaciones: () =>
        obtenerDatosHoja(HOJAS.VALIDACION, "ID_Empresa", idEmpresa),

      reportes: () =>
        obtenerDatosHoja(HOJAS.REPORTE, "ID_Empresa", idEmpresa),

      historial: () =>
        obtenerDatosHoja(HOJAS.HISTORIAL, "ID_Empresa", idEmpresa),

      parametros: () =>
        obtenerDatosHoja(HOJAS.PARAMETROS),

      auditoria: () =>
        obtenerDatosHoja(HOJAS.AUDITORIA, "ID_Empresa", idEmpresa),

      fundamento_legal: () =>
        obtenerDatosHoja(HOJAS.FUNDAMENTO)

    };

    if (accion && acciones[accion]) {
      return acciones[accion]();
    }

    return respuestaJSON({
      estado: "correcto",
      mensaje: "NEXUS API funcionando correctamente",
      version: "5.0"
    });

  } catch (error) {

    return respuestaJSON({
      estado: "error",
      mensaje: error.message
    });

  }

}


// =====================================================
// POST
// =====================================================

function doPost(e) {

  try {

    if (!e || !e.postData || !e.postData.contents) {

      return respuestaJSON({
        estado: "error",
        mensaje: "No se recibieron datos."
      });

    }

    const datos = JSON.parse(e.postData.contents);

    const accion = datos.accion;

    switch (accion) {

      case "registrar_empresa":
        return registrarEmpresa(datos);

      case "registrar_usuario":
        return registrarUsuario(datos);

      case "registrar_empresa_usuario":
        return registrarEmpresaYUsuario(datos);

      case "iniciar_sesion":
        return iniciarSesion(datos);

      case "registrar_empleado":
        return registrarEmpleado(datos);

      case "registrar_novedad":
        return registrarNovedad(datos);

      case "registrar_validacion":
        return registrarValidacion(datos);

      case "registrar_auditoria":
        return registrarAuditoria(datos);

      case "preguntar_ia":
        return respuestaJSON(manejarPreguntarIA(datos));

      default:

        return respuestaJSON({
          estado: "error",
          mensaje: "Acción POST no reconocida."
        });

    }

  } catch (error) {

    return respuestaJSON({
      estado: "error",
      mensaje: error.message
    });

  }

}


// =====================================================
// OBTENER DATOS DE UNA HOJA (CORREGIDA + FILTRO OPCIONAL)
// =====================================================

/**
 * @param {string} nombreHoja       Nombre de la pestaña en el Sheet.
 * @param {string} [columnaFiltro]  Nombre EXACTO del encabezado por el que
 *                                  filtrar (p. ej. "ID_Empresa"). Opcional.
 * @param {string} [valorFiltro]    Valor que debe tener esa columna. Si no
 *                                  se pasa, o la hoja no tiene esa columna,
 *                                  NO se filtra (se devuelve todo, igual
 *                                  que antes) para no romper hojas que aun
 *                                  no tengan esa columna agregada.
 */
function obtenerDatosHoja(nombreHoja, columnaFiltro, valorFiltro) {

  const hoja = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName(nombreHoja);

  if (!hoja) {

    return respuestaJSON({
      estado: "error",
      mensaje: "No se encontró la hoja: " + nombreHoja
    });

  }

  const rango = hoja.getDataRange().getValues();

  // Si la hoja solo tiene encabezados (o está vacía), devolver arreglo vacío
  if (rango.length <= 1) {
    return respuestaJSON([]);
  }

  const encabezados = rango[0];
  const filas = rango.slice(1);

  let objetos = filas.map(function(fila) {

    const objeto = {};

    encabezados.forEach(function(encabezado, indice) {
      objeto[encabezado] = fila[indice];
    });

    return objeto;

  });

  // Filtro multiempresa (u otro) opcional: solo se aplica si se pidio un
  // valor Y la hoja realmente tiene esa columna en sus encabezados.
  if (columnaFiltro && valorFiltro && encabezados.indexOf(columnaFiltro) !== -1) {
    objetos = objetos.filter(function(objeto) {
      return String(objeto[columnaFiltro]) === String(valorFiltro);
    });
  }

  return respuestaJSON(objetos);

}

// Devuelve la respuesta ya envuelta en JSON (para uso interno, sin volver
// a pasar por respuestaJSON). Version "cruda" de obtenerDatosHoja que
// regresa el arreglo de objetos en vez de la respuesta HTTP, para poder
// reutilizarla desde otras funciones (como el join de novedades).
function obtenerObjetosHoja(nombreHoja) {
  const hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(nombreHoja);
  if (!hoja) return [];
  const rango = hoja.getDataRange().getValues();
  if (rango.length <= 1) return [];
  const encabezados = rango[0];
  const filas = rango.slice(1);
  return filas.map(function(fila) {
    const objeto = {};
    encabezados.forEach(function(encabezado, indice) { objeto[encabezado] = fila[indice]; });
    return objeto;
  });
}

// =====================================================
// NOVEDADES FILTRADAS POR EMPRESA (join via EMPLEADOS)
// =====================================================
// La hoja NOVEDADES no tiene columna ID_Empresa (solo ID_Empleado), asi
// que para filtrar por empresa primero hay que saber que empleados
// pertenecen a esa empresa y luego quedarnos solo con sus novedades.
function obtenerNovedadesDeEmpresa(idEmpresa) {

  const novedades = obtenerObjetosHoja(HOJAS.NOVEDADES);

  if (!idEmpresa) {
    return respuestaJSON(novedades);
  }

  const empleados = obtenerObjetosHoja(HOJAS.EMPLEADOS);
  const idsEmpleadosDeLaEmpresa = new Set(
    empleados
      .filter(function(emp) { return String(emp.ID_Empresa) === String(idEmpresa); })
      .map(function(emp) { return String(emp.ID_Empleado); })
  );

  const filtradas = novedades.filter(function(nov) {
    return idsEmpleadosDeLaEmpresa.has(String(nov.ID_Empleado));
  });

  return respuestaJSON(filtradas);
}


// =====================================================
// REGISTRAR EMPRESA
// =====================================================

function registrarEmpresa(datos) {

  const hoja = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName(HOJAS.EMPRESA);

  if (!hoja) {
    return respuestaJSON({
      estado: "error",
      mensaje: "No existe la hoja EMPRESA."
    });
  }

  if (!datos.Razon_Social) {
    return respuestaJSON({
      estado: "error",
      mensaje: "La razón social es obligatoria."
    });
  }

  const idEmpresa = generarID(
    hoja,
    "EMP",
    3
  );

  hoja.appendRow([
    idEmpresa,
    datos.Razon_Social || "",
    datos.NIT || "",
    datos.NRC || "",
    datos.Actividad_Economica || "",
    datos.Direccion || "",
    datos.Telefono || "",
    datos.Correo || "",
    datos.Representante || "",
    new Date(),
    "Activo"
  ]);

  registrarAuditoriaInterna(
    "Registro de empresa",
    "Sistema",
    idEmpresa,
    "Correcto"
  );

  return respuestaJSON({
    estado: "correcto",
    mensaje: "Empresa registrada correctamente.",
    ID_Empresa: idEmpresa
  });

}


// =====================================================
// REGISTRAR USUARIO
// =====================================================

function registrarUsuario(datos) {

  const hoja = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName(HOJAS.USUARIOS);

  if (!hoja) {
    return respuestaJSON({
      estado: "error",
      mensaje: "No existe la hoja USUARIOS."
    });
  }

  if (!datos.ID_Empresa) {
    return respuestaJSON({
      estado: "error",
      mensaje: "ID_Empresa es obligatorio."
    });
  }

  if (!datos.Nombre) {
    return respuestaJSON({
      estado: "error",
      mensaje: "El nombre es obligatorio."
    });
  }

  if (!datos.Correo) {
    return respuestaJSON({
      estado: "error",
      mensaje: "El correo es obligatorio."
    });
  }

  if (!datos.Password) {
    return respuestaJSON({
      estado: "error",
      mensaje: "La contraseña es obligatoria."
    });
  }

  if (correoExiste(hoja, datos.Correo)) {

    return respuestaJSON({
      estado: "error",
      mensaje: "El correo ya está registrado."
    });

  }

  const idUsuario = generarID(
    hoja,
    "USR",
    3
  );

  const salt = generarSalt();

  const passwordHash = generarHash(
    datos.Password,
    salt
  );

  hoja.appendRow([
    idUsuario,
    datos.ID_Empresa,
    datos.Nombre,
    datos.Correo,
    datos.Rol || "Administrador",
    "Activo",
    new Date(),
    passwordHash,
    salt
  ]);

  registrarAuditoriaInterna(
    "Registro de usuario",
    idUsuario,
    idUsuario,
    "Correcto"
  );

  return respuestaJSON({
    estado: "correcto",
    mensaje: "Usuario registrado correctamente.",
    ID_Usuario: idUsuario,
    ID_Empresa: datos.ID_Empresa
  });

}


// =====================================================
// REGISTRAR EMPRESA + USUARIO
// =====================================================

function registrarEmpresaYUsuario(datos) {

  if (!datos.Razon_Social) {
    return respuestaJSON({
      estado: "error",
      mensaje: "La razón social es obligatoria."
    });
  }

  if (!datos.Correo) {
    return respuestaJSON({
      estado: "error",
      mensaje: "El correo es obligatorio."
    });
  }

  if (!datos.Password) {
    return respuestaJSON({
      estado: "error",
      mensaje: "La contraseña es obligatoria."
    });
  }

  const libro = SpreadsheetApp.getActiveSpreadsheet();

  const hojaEmpresa =
    libro.getSheetByName(HOJAS.EMPRESA);

  const hojaUsuarios =
    libro.getSheetByName(HOJAS.USUARIOS);

  if (!hojaEmpresa || !hojaUsuarios) {

    return respuestaJSON({
      estado: "error",
      mensaje: "No se encontraron las hojas necesarias."
    });

  }

  if (correoExiste(hojaUsuarios, datos.Correo)) {

    return respuestaJSON({
      estado: "error",
      mensaje: "El correo ya está registrado."
    });

  }

  const idEmpresa = generarID(
    hojaEmpresa,
    "EMP",
    3
  );

  hojaEmpresa.appendRow([
    idEmpresa,
    datos.Razon_Social || "",
    datos.NIT || "",
    datos.NRC || "",
    datos.Actividad_Economica || "",
    datos.Direccion || "",
    datos.Telefono || "",
    datos.Correo || "",
    datos.Representante || "",
    new Date(),
    "Activo"
  ]);


  const idUsuario = generarID(
    hojaUsuarios,
    "USR",
    3
  );

  const salt = generarSalt();

  const passwordHash = generarHash(
    datos.Password,
    salt
  );

  hojaUsuarios.appendRow([
    idUsuario,
    idEmpresa,
    datos.Nombre ||
      datos.Representante ||
      "",
    datos.Correo,
    "Administrador",
    "Activo",
    new Date(),
    passwordHash,
    salt
  ]);


  registrarAuditoriaInterna(
    "Registro de empresa y usuario",
    idUsuario,
    idEmpresa,
    "Correcto"
  );


  return respuestaJSON({
    estado: "correcto",
    mensaje:
      "Empresa y usuario registrados correctamente.",
    ID_Empresa: idEmpresa,
    ID_Usuario: idUsuario
  });

}


// =====================================================
// INICIO DE SESIÓN
// =====================================================

function iniciarSesion(datos) {

  const hoja = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName(HOJAS.USUARIOS);

  if (!hoja) {
    return respuestaJSON({
      estado: "error",
      mensaje: "No existe la hoja USUARIOS."
    });
  }

  if (!datos.Correo || !datos.Password) {

    return respuestaJSON({
      estado: "error",
      mensaje: "Correo y contraseña son obligatorios."
    });

  }

  const ultimaFila = hoja.getLastRow();

  if (ultimaFila <= 1) {

    return respuestaJSON({
      estado: "error",
      mensaje: "No existen usuarios registrados."
    });

  }

  const datosUsuarios = hoja
    .getRange(
      2,
      1,
      ultimaFila - 1,
      9
    )
    .getValues();

  const correoBuscado =
    String(datos.Correo)
      .trim()
      .toLowerCase();


  for (let i = 0; i < datosUsuarios.length; i++) {

    const fila = datosUsuarios[i];

    const idUsuario = fila[0];
    const idEmpresa = fila[1];
    const nombre = fila[2];
    const correo = String(fila[3])
      .trim()
      .toLowerCase();
    const rol = fila[4];
    const estado = fila[5];
    const passwordHash = fila[7];
    const salt = fila[8];


    if (correo === correoBuscado) {

      if (estado !== "Activo") {

        return respuestaJSON({
          estado: "error",
          mensaje: "El usuario está inactivo."
        });

      }


      const hashIngresado =
        generarHash(
          datos.Password,
          salt
        );


      if (hashIngresado !== passwordHash) {

        return respuestaJSON({
          estado: "error",
          mensaje: "Correo o contraseña incorrectos."
        });

      }


      registrarAuditoriaInterna(
        "Inicio de sesión",
        idUsuario,
        idUsuario,
        "Correcto"
      );


      return respuestaJSON({

        estado: "correcto",

        mensaje:
          "Inicio de sesión correcto.",

        usuario: {
          ID_Usuario: idUsuario,
          ID_Empresa: idEmpresa,
          Nombre: nombre,
          Correo: fila[3],
          Rol: rol
        }

      });

    }

  }


  return respuestaJSON({
    estado: "error",
    mensaje: "Correo o contraseña incorrectos."
  });

}


// =====================================================
// REGISTRAR EMPLEADO
// =====================================================

function registrarEmpleado(datos) {

  const hoja = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName(HOJAS.EMPLEADOS);

  if (!hoja) {
    return respuestaJSON({
      estado: "error",
      mensaje: "No existe la hoja EMPLEADOS."
    });
  }

  if (!datos.ID_Empresa) {
    return respuestaJSON({
      estado: "error",
      mensaje: "ID_Empresa es obligatorio."
    });
  }

  if (!datos.Nombre_Completo) {
    return respuestaJSON({
      estado: "error",
      mensaje: "Nombre_Completo es obligatorio."
    });
  }

  const idEmpleado = generarIDEmpleado(
    hoja,
    datos.ID_Empresa
  );

  hoja.appendRow([
    idEmpleado,
    datos.ID_Empresa,
    datos.Nombre_Completo || "",
    datos.DUI || "",
    datos.Cargo || "",
    datos.Fecha_Ingreso
      ? new Date(datos.Fecha_Ingreso)
      : new Date(),
    datos.Fecha_Salida || "",
    datos.Salario_Base || 0,
    datos.Estado || "Activo"
  ]);

  registrarAuditoriaInterna(
    "Registro de empleado",
    "Sistema",
    idEmpleado,
    "Correcto"
  );

  return respuestaJSON({
    estado: "correcto",
    mensaje: "Empleado registrado correctamente.",
    ID_Empleado: idEmpleado
  });

}


// =====================================================
// GENERAR ID DE EMPLEADO
// =====================================================

function generarIDEmpleado(
  hoja,
  idEmpresa
) {

  const ultimaFila = hoja.getLastRow();

  if (ultimaFila <= 1) {
    return idEmpresa + "-001";
  }

  const datos = hoja
    .getRange(
      2,
      1,
      ultimaFila - 1,
      2
    )
    .getValues();

  let mayor = 0;

  datos.forEach(function(fila) {

    const idEmpleado = String(fila[0]);
    const empresa = String(fila[1]);

    if (
      empresa === idEmpresa &&
      idEmpleado.indexOf(idEmpresa + "-") === 0
    ) {

      const numero = parseInt(
        idEmpleado.substring(
          (idEmpresa + "-").length
        ),
        10
      );

      if (
        !isNaN(numero) &&
        numero > mayor
      ) {
        mayor = numero;
      }

    }

  });

  return idEmpresa +
    "-" +
    String(mayor + 1).padStart(3, "0");

}


// =====================================================
// REGISTRAR NOVEDAD
// =====================================================

function registrarNovedad(datos) {

  const hoja = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName(HOJAS.NOVEDADES);

  if (!hoja) {
    return respuestaJSON({
      estado: "error",
      mensaje: "No existe la hoja NOVEDADES."
    });
  }

  if (!datos.ID_Empleado) {
    return respuestaJSON({
      estado: "error",
      mensaje: "ID_Empleado es obligatorio."
    });
  }

  const idNovedad = generarID(
    hoja,
    "NOV",
    3
  );

  hoja.appendRow([
    idNovedad,
    datos.ID_Empleado || "",
    datos.Periodo || "",
    datos.Tipo_Novedad || "",
    datos.Cantidad || 0,
    datos.Valor || 0,
    datos.Fecha
      ? new Date(datos.Fecha)
      : new Date(),
    datos.Observacion || "",
    datos.Documento_Respaldo || "",
    datos.Estado || "Pendiente"
  ]);

  registrarAuditoriaInterna(
    "Registro de novedad",
    "Sistema",
    idNovedad,
    "Correcto"
  );

  return respuestaJSON({
    estado: "correcto",
    mensaje: "Novedad registrada correctamente.",
    ID_Novedad: idNovedad
  });

}


// =====================================================
// REGISTRAR VALIDACIÓN
// =====================================================

function registrarValidacion(datos) {

  const hoja = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName(HOJAS.VALIDACION);

  if (!hoja) {
    return respuestaJSON({
      estado: "error",
      mensaje: "No existe la hoja VALIDACION."
    });
  }

  const idValidacion = generarID(
    hoja,
    "VAL",
    3
  );

  hoja.appendRow([
    idValidacion,
    datos.ID_Planilla || "",
    datos.Tipo_Validacion || "",
    datos.Registro_Afectado || "",
    datos.Resultado || "Correcto",
    datos.Mensaje || "",
    new Date()
  ]);

  return respuestaJSON({
    estado: "correcto",
    mensaje: "Validación registrada correctamente.",
    ID_Validacion: idValidacion
  });

}


// =====================================================
// AUDITORÍA
// =====================================================

function registrarAuditoria(datos) {

  return registrarAuditoriaInterna(
    datos.Accion || "",
    datos.Usuario || "Sistema",
    datos.Registro_Afectado || "",
    datos.Resultado || "Correcto"
  );

}


function registrarAuditoriaInterna(
  accion,
  usuario,
  registroAfectado,
  resultado
) {

  const hoja = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName(HOJAS.AUDITORIA);

  if (!hoja) {
    return respuestaJSON({
      estado: "error",
      mensaje: "No existe la hoja AUDITORIA."
    });
  }

  const idAuditoria = generarID(
    hoja,
    "AUD",
    3
  );

  hoja.appendRow([
    idAuditoria,
    new Date(),
    accion,
    usuario,
    registroAfectado,
    resultado
  ]);

  return respuestaJSON({
    estado: "correcto",
    mensaje: "Auditoría registrada correctamente.",
    ID_Auditoria: idAuditoria
  });

}


// =====================================================
// GENERADOR GENERAL DE IDs
// =====================================================

function generarID(
  hoja,
  prefijo,
  digitos
) {

  const ultimaFila = hoja.getLastRow();

  if (ultimaFila <= 1) {
    return prefijo + "001";
  }

  const datos = hoja
    .getRange(
      2,
      1,
      ultimaFila - 1,
      1
    )
    .getValues();

  let mayor = 0;

  datos.forEach(function(fila) {

    const valor = String(fila[0]);

    if (valor.indexOf(prefijo) === 0) {

      const numero = parseInt(
        valor.substring(prefijo.length),
        10
      );

      if (
        !isNaN(numero) &&
        numero > mayor
      ) {
        mayor = numero;
      }

    }

  });

  return prefijo +
    String(mayor + 1).padStart(digitos, "0");

}


// =====================================================
// COMPROBAR CORREO
// =====================================================

function correoExiste(
  hoja,
  correo
) {

  const ultimaFila = hoja.getLastRow();

  if (ultimaFila <= 1) {
    return false;
  }

  const correos = hoja
    .getRange(
      2,
      4,
      ultimaFila - 1,
      1
    )
    .getValues();

  const correoBuscado =
    String(correo)
      .trim()
      .toLowerCase();

  return correos.some(function(fila) {

    return String(fila[0])
      .trim()
      .toLowerCase() === correoBuscado;

  });

}


// =====================================================
// SALT
// =====================================================

function generarSalt() {

  return Utilities
    .getUuid()
    .replace(/-/g, "");

}


// =====================================================
// HASH
// =====================================================

function generarHash(
  password,
  salt
) {

  const texto =
    String(salt) +
    ":" +
    String(password);

  const bytes =
    Utilities.computeDigest(
      Utilities.DigestAlgorithm.SHA_256,
      texto,
      Utilities.Charset.UTF_8
    );

  return bytes
    .map(function(byte) {

      const valor =
        byte < 0
          ? byte + 256
          : byte;

      return (
        "0" +
        valor.toString(16)
      ).slice(-2);

    })
    .join("");

}


// =====================================================
// RESPUESTA JSON
// =====================================================

function respuestaJSON(datos) {

  return ContentService
    .createTextOutput(
      JSON.stringify(datos)
    )
    .setMimeType(
      ContentService.MimeType.JSON
    );

}


// =====================================================
// ATENA — PREGUNTAR IA (Gemini)
// =====================================================
// Pegado directo de Code_gs_atena_ia.gs para que doPost() ya tenga el
// caso "preguntar_ia" funcionando sin pasos manuales adicionales.
// Requiere la propiedad de script GEMINI_API_KEY (Configuracion del
// proyecto > Propiedades de secuencia de comandos).

function manejarPreguntarIA(parametros) {
  var clave = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  if (!clave) {
    return { estado: 'error', mensaje: 'Falta configurar GEMINI_API_KEY en Propiedades del Script.' };
  }

  var pregunta = (parametros.pregunta || '').toString().trim();
  if (!pregunta) {
    return { estado: 'error', mensaje: 'No se recibió ninguna pregunta.' };
  }

  var promptSistema =
    'Eres Atena, la asistente virtual de NEXUS, un sistema de gestión de ' +
    'planilla única para empresas en El Salvador (proyecto escolar de ' +
    'Bachillerato Técnico Administrativo Contable). Responde en español, ' +
    'de forma breve, clara y amable (maximo 120 palabras), enfocándote en ' +
    'temas de planillas, empleados, novedades, ISSS, AFP, ISR, aguinaldo, ' +
    'vacaciones, indemnización, contabilidad básica y el Código de Trabajo ' +
    'de El Salvador. Si te preguntan algo totalmente ajeno a esos temas, ' +
    'respóndelo brevemente si lo sabes, pero recuerda con amabilidad que tu ' +
    'especialidad es la gestión de planillas. Aclara que tus respuestas son ' +
    'orientativas y no sustituyen la asesoría de un contador o abogado.';

  var url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + clave;
  var payload = {
    contents: [{ parts: [{ text: pregunta }] }],
    systemInstruction: { parts: [{ text: promptSistema }] },
    generationConfig: { temperature: 0.4, maxOutputTokens: 300 },
  };
  var opciones = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  };

  try {
    var respuestaHttp = UrlFetchApp.fetch(url, opciones);
    var codigo = respuestaHttp.getResponseCode();
    var cuerpo = JSON.parse(respuestaHttp.getContentText());

    if (codigo !== 200) {
      var mensajeError = (cuerpo.error && cuerpo.error.message) || ('Error HTTP ' + codigo);
      return { estado: 'error', mensaje: 'Gemini respondió con error: ' + mensajeError };
    }

    var texto = cuerpo.candidates &&
      cuerpo.candidates[0] &&
      cuerpo.candidates[0].content &&
      cuerpo.candidates[0].content.parts &&
      cuerpo.candidates[0].content.parts[0] &&
      cuerpo.candidates[0].content.parts[0].text;

    if (!texto) {
      return { estado: 'error', mensaje: 'Gemini no devolvió una respuesta utilizable.' };
    }

    return { estado: 'correcto', respuesta: texto.trim() };
  } catch (e) {
    return { estado: 'error', mensaje: 'Error llamando a Gemini: ' + e.message };
  }
}
