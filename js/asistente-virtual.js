/**
 * NEXUS — Asistente Atena IA
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
    const idPensando = this.agregarBurbuja(contenedorChat, "Consultando base de conocimientos e IA...", 'atena-pensando');

    try {
      const idEmpresa = localStorage.getItem("ID_Empresa") || "EMP01";

      // Usar 'consultar_ia' o 'obtener_respuesta' compatible con Apps Script
      const payload = {
        accion: "consultar_ia",
        pregunta: mensaje,
        ID_Empresa: idEmpresa
      };

      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload)
      }).then(r => r.json());

      const elementoPensando = document.getElementById(idPensando);
      if (elementoPensando) elementoPensando.remove();

      const respuestaText = res.respuesta || res.mensaje || res.resultado || "Hola, he recibido tu mensaje. ¿Deseas consultar sobre tablas del ISSS, AFP o Aguinaldos?";
      
      this.agregarBurbuja(contenedorChat, respuestaText, 'atena');
      this.hablar(respuestaText);

    } catch (error) {
      const elementoPensando = document.getElementById(idPensando);
      if (elementoPensando) elementoPensando.remove();

      // Respuesta de contingencia local si el servidor backend no tiene la acción configurada
      const respuestaFallback = "Hola. Como asistente de NEXUS te informo: El aguinaldo se calcula según los artículos 196 a 202 del Código de Trabajo, las retenciones de ISSS tope son $30.00 y AFP 7.25%.";
      this.agregarBurbuja(contenedorChat, respuestaFallback, 'atena');
    }
  },

  agregarBurbuja(chatBox, texto, tipo) {
    if (!chatBox) return null;
    const div = document.createElement('div');
    const idUnico = 'msg-' + Date.now();
    div.id = idUnico;
    div.className = `msg ${tipo === 'usuario' ? 'user-msg' : 'bot-msg'}`;
    div.style.marginBottom = "10px";
    
    if (tipo === 'atena-pensando') {
      div.style.opacity = "0.6";
      div.innerHTML = `<em><strong>Atena:</strong> ${texto}</em>`;
    } else {
      div.innerHTML = `<strong>${tipo === 'usuario' ? 'Tú' : 'Atena'}:</strong> ${texto}`;
    }

    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
    return idUnico;
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
