/**
 * js/asistente-virtual.js
 * Asistente Virtual "Atena" impulsado por IA Gemini
 */

(function () {
  'use strict';

  function initAtena() {
    const toggleBtn = document.getElementById('nexus-chat-toggle');
    const panel = document.getElementById('nexus-chat-panel');
    const closeBtn = document.getElementById('nexus-chat-close');
    const form = document.getElementById('nexus-chat-form');
    const input = document.getElementById('nexus-chat-input');
    const messages = document.getElementById('nexus-chat-messages');

    if (!toggleBtn || !panel || !form || !input || !messages) return;

    toggleBtn.addEventListener('click', () => {
      const hidden = panel.hasAttribute('hidden');
      if (hidden) {
        panel.removeAttribute('hidden');
        toggleBtn.setAttribute('aria-expanded', 'true');
        input.focus();
        if (messages.children.length === 0) {
          agregarMensajeBot('¡Hola! Soy Atena, tu asistente virtual de NEXUS. ¿En qué te puedo ayudar hoy?');
        }
      } else {
        panel.setAttribute('hidden', '');
        toggleBtn.setAttribute('aria-expanded', 'false');
      }
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        panel.setAttribute('hidden', '');
        toggleBtn.setAttribute('aria-expanded', 'false');
      });
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const texto = input.value.trim();
      if (!texto) return;

      agregarMensajeUsuario(texto);
      input.value = '';

      const indicandoPensando = agregarMensajePensando();

      try {
        // Petición directa a Gemini a través de la API
        const res = await Api.preguntarIA({ pregunta: texto });
        indicandoPensando.remove();

        if (res && res.respuesta) {
          agregarMensajeBot(res.respuesta);
        } else if (res && res.mensaje) {
          agregarMensajeBot(res.mensaje);
        } else {
          throw new Error('Respuesta vacía del servidor.');
        }
      } catch (err) {
        indicandoPensando.remove();
        // Fallback local en caso de error de red
        if (typeof ConocimientoAtena !== 'undefined' && ConocimientoAtena.buscar) {
          const respLocal = ConocimientoAtena.buscar(texto);
          agregarMensajeBot(respLocal || 'Lo siento, no pude conectarme con el servicio de IA de Gemini.');
        } else {
          agregarMensajeBot('Ocurrió un error al procesar tu solicitud con la IA.');
        }
      }
    });
  }

  function agregarMensajeUsuario(texto) {
    const msg = document.createElement('div');
    msg.className = 'nexus-chat__mensaje nexus-chat__mensaje--usuario';
    msg.textContent = texto;
    document.getElementById('nexus-chat-messages').appendChild(msg);
    hacerScrollAbajo();
  }

  function agregarMensajeBot(texto) {
    const msg = document.createElement('div');
    msg.className = 'nexus-chat__mensaje nexus-chat__mensaje--bot';
    msg.textContent = texto;
    document.getElementById('nexus-chat-messages').appendChild(msg);
    hacerScrollAbajo();
  }

  function agregarMensajePensando() {
    const msg = document.createElement('div');
    msg.className = 'nexus-chat__mensaje nexus-chat__mensaje--bot nexus-chat__mensaje--pensando';
    msg.textContent = 'Atena está pensando...';
    document.getElementById('nexus-chat-messages').appendChild(msg);
    hacerScrollAbajo();
    return msg;
  }

  function hacerScrollAbajo() {
    const msgs = document.getElementById('nexus-chat-messages');
    if (msgs) msgs.scrollTop = msgs.scrollHeight;
  }

  document.addEventListener('DOMContentLoaded', initAtena);
})();
