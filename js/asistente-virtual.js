/**
 * NEXUS — Asistente Atena IA (asistente-virtual.js)
 * Conexión directa a la IA para respuestas dinámicas y sin límites estáticos.
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

    // 1. Renderizar mensaje del usuario en pantalla
    this.agregarBurbuja(contenedorChat, mensaje, 'usuario');

    // Indicador visual de que la IA está pensando
    const idPensando = this.agregarBurbuja(contenedorChat, "Atena está pensando...", 'atena-pensando');

    try {
      const idEmpresa = localStorage.getItem("ID_Empresa") || "EMP01";

      // 2. Enviar la consulta directo al endpoint/servidor de Gemini IA
      const payload = {
        accion: "preguntar_atena",
        pregunta: mensaje,
        ID_Empresa: idEmpresa
      };

      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload)
      }).then(r => r.json());

      // Remover el mensaje de "pensando..."
      const elementoPensando = document.getElementById(idPensando);
      if (elementoPensando) elementoPensando.remove();

      // 3. Mostrar la respuesta generada dinámicamente por la IA
      const respuestaText = res.respuesta || res.mensaje || res.data || "No pude procesar la respuesta en este momento.";
      this.agregarBurbuja(contenedorChat, respuestaText, 'atena');
      this.hablar(respuestaText);

    } catch (error) {
      const elementoPensando = document.getElementById(idPensando);
      if (elementoPensando) elementoPensando.remove();

      this.agregarBurbuja(contenedorChat, "Error de conexión al consultar con la IA. Verifica tu enlace a Google Apps Script / Gemini.", 'atena');
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
