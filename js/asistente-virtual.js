// ==========================================
// MÓDULO ASISTENTE VIRTUAL - ATENA
// ==========================================

let synth = window.speechSynthesis;
let currentUtterance = null;

function hablarConAtena(texto) {
    if (!synth) {
        console.warn("La síntesis de voz no es soportada en este navegador.");
        return;
    }

    // Detener de inmediato cualquier lectura anterior (Interrupción)
    if (synth.speaking) {
        synth.cancel();
    }

    currentUtterance = new SpeechSynthesisUtterance(texto);
    currentUtterance.lang = 'es-ES';
    currentUtterance.rate = 1.0;

    // Intentar buscar una voz en español clara y neutral si está disponible
    let voices = synth.getVoices();
    let spanishVoice = voices.find(v => v.lang.startsWith('es') && (v.name.includes('Google') || v.name.includes('Lucia') || v.name.includes('Monica')));
    if (spanishVoice) {
        currentUtterance.voice = spanishVoice;
    }

    synth.speak(currentUtterance);
}

// Botón de emergencia / silencio para detener a Atena inmediatamente
function stopVoice() {
    if (synth) {
        synth.cancel();
    }
}

// Lógica de respuesta contextual (evitando respuestas genéricas vacías)
function procesarConsultaAtena(pregunta) {
    let respuesta = "Lo siento, consulta no reconocida dentro de los parámetros de Nexus.";
    
    let textoLower = pregunta.toLowerCase();
    if (textoLower.includes("planilla") || textoLower.includes("proceso")) {
        respuesta = "Para procesar la planilla, asegúrese de que todos los empleados estén activos y las novedades estén debidamente validadas.";
    } else if (textoLower.includes("novedad") || textoLower.includes("días") || textoLower.includes("horas")) {
        respuesta = "Recuerde registrar las novedades separando los días y las horas a aplicar según corresponda.";
    } else if (textoLower.includes("empresa")) {
        respuesta = "El módulo de empresa permite registrar la información legal y operativa que se enviará al servidor privado.";
    }

    hablarConAtena(respuesta);
    return respuesta;
}
