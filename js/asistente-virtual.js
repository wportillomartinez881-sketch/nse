/* NEXUS - Asistente Virtual: respuestas locales de demostracion. */
const AsistenteVirtual = (() => {
  const normalizar = (texto) => String(texto || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

  function extraerMonto(pregunta) {
    const coincidencia = pregunta.match(/\$?\s*(\d+(?:[.,]\d{1,2})?)/);
    return coincidencia ? Number(coincidencia[1].replace(',', '.')) : null;
  }

  function extraerAnos(pregunta) {
    const coincidencia = pregunta.match(/(\d+)\s*(?:año|anos|años)/);
    return coincidencia ? Number(coincidencia[1]) : null;
  }

  function respuestaLocal(texto) {
    const pregunta = normalizar(texto);
    const contexto = typeof Auth !== 'undefined' ? Auth.contextoAsistente() : { nombre: 'usuario' };

    // El saludo se responde localmente (instantaneo, usa el nombre del
    // usuario que Gemini no conoce). El resto de reglas locales de abajo
    // SOLO disparan cuando la pregunta trae un monto en dolares, es decir,
    // cuando se pide un calculo exacto (aguinaldo/vacaciones/indemnizacion/
    // planilla) donde una formula determinista es mas confiable que lo que
    // pueda "adivinar" un modelo de lenguaje. Para todo lo demas (saludos
    // con dudas, conceptos, "como se calcula X" sin monto, etc.) se
    // devuelve null para que generarRespuesta() consulte primero a Gemini.
    // ANTES: reglas como /planilla|calcul/ o /retencion|isss|afp/ atrapaban
    // cualquier pregunta que solo mencionara esas palabras (ej. "como
    // calculo las horas extra"), asi que Atena nunca llegaba a usar la IA
    // real ni la base de conocimiento correcta.
    if (/^\s*(hola|buenas|hey|hi)\b[\s.,!¡]*$/.test(pregunta) || /^\s*(necesito ayuda|me ayudas)\s*[?.!]*\s*$/.test(pregunta)) {
      return `Hola, ${contexto.nombre}. Puedo orientarte sobre planillas, empleados, retenciones, validaciones, aguinaldo, vacaciones e indemnizacion.`;
    }

    const salario = extraerMonto(pregunta);
    if (!salario) return null; // Sin monto: que responda Gemini.

    if (/aguinaldo/.test(pregunta)) {
      const anos = extraerAnos(pregunta);
      if (typeof FiscalEngine !== 'undefined') {
        const valor = FiscalEngine.calcularAguinaldo(salario, anos || 1);
        return `Con salario base $${salario.toFixed(2)} y ${anos || 1} año(s) de servicio, el aguinaldo estimado es $${valor.toFixed(2)}. La formula usa dias de salario segun antiguedad: 15 dias (1-3 años), 19 dias (3-10 años) o 21 dias (10+ años).`;
      }
    }
    if (/vacacion/.test(pregunta) && typeof FiscalEngine !== 'undefined') {
      const valor = FiscalEngine.calcularVacaciones(salario);
      return `Con salario base $${salario.toFixed(2)}, las vacaciones estimadas (incluyendo el 30% adicional de ley) son $${valor.toFixed(2)}.`;
    }
    if (/indemnizacion/.test(pregunta)) {
      const anos = extraerAnos(pregunta);
      if (anos && typeof FiscalEngine !== 'undefined') {
        const valor = FiscalEngine.calcularIndemnizacion(salario, anos);
        return `Con salario base $${salario.toFixed(2)} y ${anos} año(s) de servicio, la indemnizacion estimada es $${valor.toFixed(2)}.`;
      }
    }
    if (/planilla|calcul/.test(pregunta) && typeof FiscalEngine !== 'undefined') {
      const resultado = FiscalEngine.calcularLiquidacionMensual(salario);
      return `Ejemplo para salario base $${salario.toFixed(2)}: bruto $${resultado.totales.salarioBruto.toFixed(2)}, deducciones $${resultado.totales.totalDeducciones.toFixed(2)} y neto estimado $${resultado.totales.salarioNeto.toFixed(2)}. Puedes consultar una planilla con horas extra, bonos o ausencias desde el modulo de Planilla.`;
    }
    return null; // Habia un monto pero no coincidio con ningun calculo conocido: que responda Gemini.
  }

  const RESPUESTA_GENERICA = 'Puedo ayudarte con planillas, empleados, retenciones, validaciones, conceptos basicos de contabilidad y servicios de NEXUS. Recuerda que mis respuestas son orientativas; consulta a un profesional para decisiones legales o contables.';

  /**
   * Punto de entrada real usado por la UI. Orden de prioridad:
   *  1) Reglas locales SOLO para saludo y calculos exactos con monto
   *     (rapidas, deterministas, no dependen de la IA).
   *  2) Gemini (IA real, via Apps Script) para todo lo demas: conceptos,
   *     preguntas abiertas, "como se calcula X", etc.
   *  3) Si Gemini no esta disponible (sin clave, sin internet, endpoint
   *     no agregado aun), se usa la base de conocimiento local como
   *     respaldo, y si tampoco hay coincidencia, el mensaje generico.
   */
  async function generarRespuesta(texto) {
    const local = respuestaLocal(texto);
    if (local) return local;

    if (typeof Api !== 'undefined' && typeof Api.preguntarIA === 'function') {
      try {
        const respuestaIa = await Api.preguntarIA({ pregunta: texto });
        if (respuestaIa && respuestaIa.respuesta) return respuestaIa.respuesta;
      } catch (e) {
        console.warn('NEXUS Atena: la IA no respondió, usando respaldo local.', e.message);
      }
    }

    const respuestaConocimiento = typeof ConocimientoAtena !== 'undefined' ? ConocimientoAtena.buscar(texto) : null;
    if (respuestaConocimiento) return respuestaConocimiento;

    return RESPUESTA_GENERICA;
  }

  function agregarMensaje(contenedor, tipo, texto) {
    const item = document.createElement('div');
    item.className = `nexus-chat__mensaje nexus-chat__mensaje--${tipo}`;
    item.textContent = texto;
    contenedor.appendChild(item);
    contenedor.scrollTop = contenedor.scrollHeight;
    if (typeof State !== 'undefined') State.agregarMensajeAsistente({ tipo, texto });
    return item;
  }

  // BUG REAL DE LA VOZ: getVoices() suele devolver un arreglo VACIO la
  // primera vez que se llama, porque el navegador carga la lista de voces
  // de forma asincrona. Si esto pasa, "vocesEspanol" quedaba vacio y se
  // usaba la voz por defecto del navegador (con frecuencia masculina).
  // Aqui cacheamos la lista y la recargamos cuando el evento
  // 'voiceschanged' avisa que ya esta lista.
  let vocesDisponibles = [];
  function actualizarVoces() { vocesDisponibles = window.speechSynthesis.getVoices(); }
  if ('speechSynthesis' in window) {
    actualizarVoces();
    window.speechSynthesis.onvoiceschanged = actualizarVoces;
  }

  function elegirVozFemenina() {
    const vocesEspanol = vocesDisponibles.filter((voz) => voz.lang.toLowerCase().startsWith('es'));
    // Lista ampliada de nombres de voces en espanol que suelen sonar
    // femeninas segun el sistema operativo/navegador (Windows, macOS,
    // Android, Google Chrome). SUPUESTO A VERIFICAR: los nombres exactos
    // dependen de las voces instaladas en cada dispositivo; si tu equipo
    // trae otra voz femenina, agrega su nombre a esta lista.
    const nombresFemeninos = /female|mujer|femenin|mónica|monica|paulina|helena|elena|sabina|lucia|lucía|penelope|penélope|esperanza|soledad|catalina|maría|maria|carmen|isabel|zira|laura|conchita|marisol|camila/i;
    return vocesEspanol.find((voz) => nombresFemeninos.test(voz.name)) || vocesEspanol[0] || null;
  }

  function hablar(texto) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    if (vocesDisponibles.length === 0) actualizarVoces(); // reintento por si ya cargaron
    const mensaje = new SpeechSynthesisUtterance(texto);
    const voz = elegirVozFemenina();
    mensaje.voice = voz;
    mensaje.lang = voz?.lang || 'es-ES';
    mensaje.rate = 1;
    // Si no se encontro ninguna voz explicitamente femenina, subimos un
    // poco el tono (pitch) para acercar el timbre a uno femenino aunque
    // el navegador solo tenga una voz generica disponible.
    const esVozFemeninaConocida = voz && /female|mujer|femenin|mónica|monica|paulina|helena|elena|sabina|lucia|lucía|penelope|penélope/i.test(voz.name);
    mensaje.pitch = esVozFemeninaConocida ? 1 : 1.3;
    window.speechSynthesis.speak(mensaje);
  }

  function inicializar() {
    const boton = document.getElementById('nexus-chat-toggle');
    const panel = document.getElementById('nexus-chat-panel');
    const cerrar = document.getElementById('nexus-chat-close');
    const formulario = document.getElementById('nexus-chat-form');
    const entrada = document.getElementById('nexus-chat-input');
    const mensajes = document.getElementById('nexus-chat-messages');
    const microfono = document.getElementById('nexus-chat-mic');
    const detenerVoz = document.getElementById('nexus-chat-stop');
    if (!boton || !panel || !formulario || !entrada || !mensajes) {
      console.warn(
        'NEXUS Asistente Virtual: no se encontro el markup del widget en el HTML ' +
        '(#nexus-chat-toggle, #nexus-chat-panel, #nexus-chat-form, #nexus-chat-input, ' +
        '#nexus-chat-messages). El asistente no se mostrara hasta agregar ese HTML a index.html.'
      );
      return;
    }

    const alternar = (abierto) => {
      panel.hidden = !abierto;
      boton.setAttribute('aria-expanded', String(abierto));
      if (typeof State !== 'undefined') State.get('asistente').abierto = abierto;
      if (abierto) entrada.focus();
    };
    boton.addEventListener('click', () => alternar(panel.hidden));
    cerrar?.addEventListener('click', () => alternar(false));
    const responder = async (texto) => {
      agregarMensaje(mensajes, 'usuario', texto);
      const indicador = agregarMensaje(mensajes, 'bot', 'Atena está escribiendo…');
      indicador.classList.add('nexus-chat__mensaje--pensando');
      const contestacion = await generarRespuesta(texto);
      indicador.remove();
      agregarMensaje(mensajes, 'bot', contestacion);
      hablar(contestacion);
    };
    formulario.addEventListener('submit', (evento) => {
      evento.preventDefault();
      const texto = entrada.value.trim();
      if (!texto) return;
      entrada.value = '';
      responder(texto);
    });
    detenerVoz?.addEventListener('click', () => window.speechSynthesis?.cancel());
    const Reconocimiento = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Reconocimiento) {
      if (microfono) { microfono.disabled = true; microfono.title = 'Tu navegador no admite reconocimiento de voz.'; }
    } else if (microfono) {
      const reconocimiento = new Reconocimiento();
      reconocimiento.lang = 'es-SV';
      reconocimiento.interimResults = false;
      reconocimiento.maxAlternatives = 1;
      reconocimiento.onstart = () => { microfono.disabled = true; microfono.textContent = 'Escuchando…'; };
      reconocimiento.onend = () => { microfono.disabled = false; microfono.textContent = '🎙 Hablar'; };
      reconocimiento.onerror = () => { agregarMensaje(mensajes, 'bot', 'No pude escuchar. Revisa el permiso del micrófono e intenta de nuevo.'); };
      reconocimiento.onresult = (evento) => responder(evento.results[0][0].transcript);
      microfono.addEventListener('click', () => reconocimiento.start());
    }
  }

  function mostrar() { document.getElementById('nexus-chat')?.removeAttribute('hidden'); }
  function ocultar() { window.speechSynthesis?.cancel(); document.getElementById('nexus-chat')?.setAttribute('hidden', ''); }

  return { inicializar, responder: generarRespuesta, mostrar, ocultar };
})();

document.addEventListener('DOMContentLoaded', () => AsistenteVirtual.inicializar());
