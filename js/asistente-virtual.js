let synth = window.speechSynthesis;
let currentUtterance = null;

function speak(text) {
    if (synth.speaking) {
        synth.cancel(); // Detiene cualquier lectura en curso inmediatamente
    }
    
    currentUtterance = new SpeechSynthesisUtterance(text);
    // Configuración para voz clara
    currentUtterance.lang = 'es-ES';
    currentUtterance.rate = 1;
    
    synth.speak(currentUtterance);
}

function stopVoice() {
    synth.cancel(); // Botón de emergencia para callar a Atena
}

// Asegúrate de que este mensaje se llame solo cuando el sistema esté listo y sea necesario
