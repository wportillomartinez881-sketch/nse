/**
 * NEXUS — Atena conectada a IA real (Gemini)
 * =========================================================================
 * INSTRUCCIONES DE INSTALACION:
 *
 * 1) Consigue una clave gratuita de Gemini:
 *    - Ve a https://aistudio.google.com/apikey
 *    - Inicia sesion con tu cuenta de Google (puede ser la misma que usas
 *      para Apps Script / Sheets).
 *    - Clic en "Create API key". Cópiala.
 *
 * 2) Guarda la clave en tu proyecto de Apps Script (NUNCA la pegues
 *    directamente en el codigo ni en el frontend):
 *    - Abre tu proyecto de Apps Script (el mismo de tu Code.gs actual).
 *    - Ve a Configuración del proyecto (el ícono de engranaje ⚙️ a la
 *      izquierda) > Propiedades de secuencia de comandos.
 *    - Agrega una propiedad: nombre = GEMINI_API_KEY, valor = tu clave.
 *    - Guarda.
 *
 * 3) Copia la funcion manejarPreguntarIA() de este archivo a tu Code.gs
 *    real (puedes pegarla al final, no necesitas tocar nada mas de esa
 *    funcion).
 *
 * 4) Busca tu funcion doPost(e) actual. Ahi debes tener algo que lee
 *    e.parameter.accion (o similar) y decide que hacer segun el valor.
 *    Agrega un caso nuevo para "preguntar_ia". Ejemplo de como se vería
 *    (ADAPTA los nombres a como esté tu doPost real, esto es solo
 *    referencia de la idea, no reemplaces tu doPost completo con esto):
 *
 *      function doPost(e) {
 *        var accion = e.parameter.accion;
 *        ...
 *        if (accion === 'preguntar_ia') {
 *          var resultado = manejarPreguntarIA(e.parameter);
 *          return ContentService.createTextOutput(JSON.stringify(resultado))
 *            .setMimeType(ContentService.MimeType.JSON);
 *        }
 *        ...
 *      }
 *
 * 5) Guarda y haz un "Nuevo despliegue" en Apps Script (Implementar >
 *    Administrar despliegues > el lápiz de editar > Nueva versión).
 *    OJO: este paso se te olvida seguido — si no lo haces, Apps Script
 *    sigue usando el codigo viejo aunque hayas guardado.
 *
 * 6) Prueba en la app: abre el chat de Atena y pregunta algo que no esté
 *    en su lista de temas fijos (ej. "¿qué es una boleta de pago?").
 *    Si todo esta bien conectado, la respuesta vendra de Gemini.
 * =========================================================================
 */

function manejarPreguntarIA(parametros) {
  var clave = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  if (!clave) {
    return { ok: false, error: 'Falta configurar GEMINI_API_KEY en Propiedades del Script.' };
  }

  var pregunta = (parametros.pregunta || '').toString().trim();
  if (!pregunta) {
    return { ok: false, error: 'No se recibió ninguna pregunta.' };
  }

  // Instrucciones que le dan a Gemini el "rol" de Atena y lo mantienen
  // enfocado en el tema del proyecto (gestión de planilla única).
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
      return { ok: false, error: 'Gemini respondió con error: ' + mensajeError };
    }

    var texto = cuerpo.candidates &&
      cuerpo.candidates[0] &&
      cuerpo.candidates[0].content &&
      cuerpo.candidates[0].content.parts &&
      cuerpo.candidates[0].content.parts[0] &&
      cuerpo.candidates[0].content.parts[0].text;

    if (!texto) {
      return { ok: false, error: 'Gemini no devolvió una respuesta utilizable.' };
    }

    return { ok: true, respuesta: texto.trim() };
  } catch (e) {
    return { ok: false, error: 'Error llamando a Gemini: ' + e.message };
  }
}
