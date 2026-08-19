/**
 * NEXUS — Asistente Atena IA (asistente-virtual.js)
 */
const AsistenteVirtual = {
  sintesis: window.speechSynthesis,

  init() {
    const formAtena = document.getElementById('form-chat-atena');
    if (formAtena) {
      formAtena.addEventListener('submit', (e) => {
        e.preventDefault();
        this.enviarMensaje();
      });
    }
  },

  async enviarMensaje() {
    const input = document.getElementById('input-atena-mensaje');
    const contenedorChat = document.getElementById('chat-atena-mensajes');
    if (!input || !input.value.trim()) return;

    const mensaje = input.value.trim();
    input.value = '';

    this.agregarBurbuja(contenedorChat, mensaje, 'usuario');

    try {
      const payload = {
        accion: "preguntar_atena",
        pregunta: mensaje
      };

      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload)
      }).then(r => r.json());

      const respuestaText = res.respuesta || res.mensaje || "Hola, soy Atena. ¿En qué te puedo asesorar hoy sobre nóminas o legislación laboral de El Salvador?";
      this.agregarBurbuja(contenedorChat, respuestaText, 'atena');
      this.hablar(respuestaText);

    } catch (error) {
      // Respuesta de respaldo si la conexión remota a Apps Script demora
      const respuestaFallback = "Hola. Soy Atena. Estoy experimentando lentitud con el servidor, pero puedo ayudarte con consultas sobre el cálculo de ISSS, AFP, Renta o el Código de Trabajo.";
      this.agregarBurbuja(contenedorChat, respuestaFallback, 'atena');
    }
  },

  agregarBurbuja(chatBox, texto, tipo) {
    if (!chatBox) return;
    const div = document.createElement('div');
    div.className = `msg ${tipo === 'usuario' ? 'user-msg' : 'bot-msg'}`;
    div.style.marginBottom = "10px";
    div.innerHTML = `<strong>${tipo === 'usuario' ? 'Tú' : 'Atena'}:</strong> ${texto}`;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
  },

  hablar(texto) {
    if (this.sintesis) {
      this.sintesis.cancel();
      const voz = new SpeechSynthesisUtterance(texto);
      voz.lang = 'es-ES';
      this.sintesis.speak(voz);
    }
  }
};

document.addEventListener('DOMContentLoaded', () => AsistenteVirtual.init());
