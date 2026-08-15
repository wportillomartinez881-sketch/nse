/* NEXUS - Asistente Virtual: respuestas locales de demostracion. */
const AsistenteVirtual = (() => {
  const normalizar = (texto) => String(texto || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

  function respuesta(texto) {
    const pregunta = normalizar(texto);
    const contexto = typeof Auth !== 'undefined' ? Auth.contextoAsistente() : { nombre: 'usuario' };

    if (/hola|buenas|ayuda/.test(pregunta)) {
      return `Hola, ${contexto.nombre}. Puedo orientarte sobre planillas, empleados, retenciones y validaciones.`;
    }
    if (/registr.*emplead|agreg.*emplead|nuevo empleado/.test(pregunta)) {
      return 'Ve a Empleados > Nuevo empleado, completa nombre, DUI, salario y los datos obligatorios; después guarda el registro. Antes de incluirlo en planilla, revisa que tenga salario y DUI.';
    }
    if (/retencion|isss|afp|isr/.test(pregunta)) {
      const p = FiscalEngine.obtenerParametrosPublicos();
      return `Para esta demostracion, el motor aplica ISSS laboral ${(p.isssLaboral * 100).toFixed(2)}% (techo $${p.techoIsss.toFixed(2)}), AFP laboral ${(p.afpLaboral * 100).toFixed(2)}% e ISR por tramos sobre la base despues de ISSS y AFP. Verifica los parametros vigentes antes de usarlo en produccion.`;
    }
    if (/valid|error|dui|regla/.test(pregunta)) {
      return typeof Validaciones !== 'undefined' ? Validaciones.explicarReglas() : 'Verifica datos obligatorios, DUI y resultados de la planilla antes de procesarla.';
    }
    if (/planilla|calcul/.test(pregunta)) {
      const coincidencia = pregunta.match(/\$?\s*(\d+(?:[.,]\d{1,2})?)/);
      if (coincidencia && typeof FiscalEngine !== 'undefined') {
        const salario = Number(coincidencia[1].replace(',', '.'));
        const resultado = FiscalEngine.calcularLiquidacionMensual(salario);
        return `Ejemplo para salario base $${salario.toFixed(2)}: bruto $${resultado.totales.salarioBruto.toFixed(2)}, deducciones $${resultado.totales.totalDeducciones.toFixed(2)} y neto estimado $${resultado.totales.salarioNeto.toFixed(2)}. Puedes consultar una planilla con horas extra, bonos o ausencias desde el modulo de Planilla.`;
      }
      return 'Para calcular una planilla, selecciona el periodo y empleados, registra horas extra, ausencias, bonos o comisiones y ejecuta el calculo. Si escribes "calcula planilla 500", te muestro una estimacion de prueba.';
    }
    const respuestaConocimiento = typeof ConocimientoAtena !== 'undefined' ? ConocimientoAtena.buscar(pregunta) : null;
    if (respuestaConocimiento) return respuestaConocimiento;
    return 'Puedo ayudarte con planillas, empleados, retenciones, validaciones, conceptos basicos de contabilidad y servicios de NEXUS. Recuerda que mis respuestas son orientativas; consulta a un profesional para decisiones legales o contables.';
  }

  function agregarMensaje(contenedor, tipo, texto) {
    const item = document.createElement('div');
    item.className = `nexus-chat__mensaje nexus-chat__mensaje--${tipo}`;
    item.textContent = texto;
    contenedor.appendChild(item);
    contenedor.scrollTop = contenedor.scrollHeight;
    if (typeof State !== 'undefined') State.agregarMensajeAsistente({ tipo, texto });
  }

  function hablar(texto) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const mensaje = new SpeechSynthesisUtterance(texto);
    const voces = window.speechSynthesis.getVoices();
    const vocesEspanol = voces.filter((voz) => voz.lang.toLowerCase().startsWith('es'));
    mensaje.voice = vocesEspanol.find((voz) => /female|mujer|monica|paulina|helena|elena/i.test(voz.name)) || vocesEspanol[0] || null;
    mensaje.lang = mensaje.voice?.lang || 'es-ES';
    mensaje.rate = 1;
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
    if (!boton || !panel || !formulario || !entrada || !mensajes) return;

    const alternar = (abierto) => {
      panel.hidden = !abierto;
      boton.setAttribute('aria-expanded', String(abierto));
      if (typeof State !== 'undefined') State.get('asistente').abierto = abierto;
      if (abierto) entrada.focus();
    };
    boton.addEventListener('click', () => alternar(panel.hidden));
    cerrar?.addEventListener('click', () => alternar(false));
    const responder = (texto) => {
      agregarMensaje(mensajes, 'usuario', texto);
      const contestacion = respuesta(texto);
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

  return { inicializar, responder: respuesta, mostrar, ocultar };
})();

document.addEventListener('DOMContentLoaded', () => AsistenteVirtual.inicializar());
