/**
 * NEXUS — Asistente Virtual Atena (asistente-virtual.js)
 */
const AsistenteVirtual = {
  reconocimiento: null,
  sintesis: window.speechSynthesis,

  init() {
    const btnEnviar = document.getElementById('atena-btn-send') || document.querySelector('.atena-send-btn');
    const inputTexto = document.getElementById('atena-input') || document.querySelector('.atena-input');
    const btnMic = document.getElementById('atena-btn-mic') || document.querySelector('.atena-mic-btn');
    const formAtena = document.getElementById('atena-form') || document.querySelector('.atena-form');

    // 1. Evitar que el formulario recargue o cambie de pestaña
    if (formAtena) {
      formAtena.addEventListener('submit', (e) => {
        e.preventDefault();
        this.enviarMensaje();
      });
    }

    if (btnEnviar) {
      btnEnviar.addEventListener('click', (e) => {
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

    // 2. Configurar Reconocimiento de Voz (Micrófono)
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.reconocimiento = new SpeechRecognition();
      this.reconocimiento.lang = 'es-SV';
      this.reconocimiento.continuous = false;

      this.reconocimiento.onresult = (e) => {
        const textoDetectado = e.results[0][0].transcript;
        if (inputTexto) inputTexto.value = textoDetectado;
        if (btnMic) btnMic.classList.remove('escuchando');
        this.enviarMensaje();
      };

      this.reconocimiento.onerror = () => {
        if (btnMic) btnMic.classList.remove('escuchando');
      };

      if (btnMic) {
        btnMic.addEventListener('click', (e) => {
          e.preventDefault();
          btnMic.classList.add('escuchando');
          this.reconocimiento.start();
        });
      }
    }
  },

  async enviarMensaje() {
    const input = document.getElementById('atena-input') || document.querySelector('.atena-input');
    const contenedorChat = document.getElementById('atena-chat-box') || document.querySelector('.atena-chat-messages');
    if (!input || !input.value.trim()) return;

    const mensaje = input.value.trim();
    input.value = '';

    this.agregarBurbuja(contenedorChat, mensaje, 'usuario');

    try {
      // Petición al backend vía api.js
      const res = await Api.preguntarIA({
        pregunta: mensaje,
        idEmpresa: typeof State !== 'undefined' ? State.getIdEmpresa() : ''
      });

      const respuestaAtena = res.respuesta || res.data || "Solicitud procesada correctamente.";
      this.agregarBurbuja(contenedorChat, respuestaAtena, 'atena');
      this.hablar(respuestaAtena);

    } catch (error) {
      this.agregarBurbuja(contenedorChat, "Error al conectar con Atena. Revisa tu conexión.", 'atena');
    }
  },

  agregarBurbuja(chatBox, texto, tipo) {
    if (!chatBox) return;
    const div = document.createElement('div');
    div.className = `atena-bubble ${tipo}`;
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
