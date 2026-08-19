/**
 * NEXUS — Asistente Virtual Atena (asistente-virtual.js)
 */
const AsistenteVirtual = {
  sintesis: window.speechSynthesis,

  init() {
    const formAtena = document.getElementById('form-chat-atena');
    const inputTexto = document.getElementById('input-atena-mensaje');

    // Evitar que el formulario recargue la página o cambie de pestaña
    if (formAtena) {
      formAtena.addEventListener('submit', (e) => {
        e.preventDefault();
        this.enviarMensaje();
      });
    }

    if (inputTexto) {
      inputTexto.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.enviarMensaje();
        }
      });
    }
  },

  async enviarMensaje() {
    const input = document.getElementById('input-atena-mensaje');
    const contenedorChat = document.getElementById('chat-atena-mensajes');
    if (!input || !input.value.trim()) return;

    const mensaje = input.value.trim();
    input.value = '';

    // Agregar mensaje del usuario al chat
    this.agregarBurbuja(contenedorChat, mensaje, 'usuario');

    try {
      const idEmpresa = localStorage.getItem("ID_Empresa") || '';
      
      // Consultar a la IA
      const res = await Api.preguntarIA({
        pregunta: mensaje,
        idEmpresa: idEmpresa
      });

      const respuestaAtena = res.respuesta || res.data || "He procesado tu consulta.";
      this.agregarBurbuja(contenedorChat, respuestaAtena, 'atena');
      this.hablar(respuestaAtena);

    } catch (error) {
      this.agregarBurbuja(contenedorChat, "Error al comunicar con Atena. Revisa la conexión.", 'atena');
    }
  },

  agregarBurbuja(chatBox, texto, tipo) {
    if (!chatBox) return;
    const div = document.createElement('div');
    div.className = `msg ${tipo === 'usuario' ? 'user-msg' : 'bot-msg'}`;
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
