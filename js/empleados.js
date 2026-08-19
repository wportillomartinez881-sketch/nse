// ==========================================
// MÓDULO DE NOVEDADES (Campos Separados)
// ==========================================

function renderFormularioNovedades() {
    return `
        <div class="novedades-container">
            <h3>Registro de Novedades</h3>
            <form id="novedades-form">
                <div class="form-group">
                    <label for="id_novedad">ID Novedad:</label>
                    <input type="text" id="id_novedad" readonly>
                </div>
                <div class="form-group">
                    <label for="id_empleado">ID Empleado:</label>
                    <input type="text" id="id_empleado" required>
                </div>
                <div class="form-group">
                    <label for="periodo">Período (AAAA-MM):</label>
                    <input type="text" id="periodo" placeholder="2026-08" required>
                </div>
                <div class="form-group">
                    <label for="tipo_novedad">Tipo de Novedad:</label>
                    <input type="text" id="tipo_novedad" required>
                </div>
                
                <!-- CAMPOS SEPARADOS SOLICITADOS -->
                <div class="form-group">
                    <label for="dias_aplicar">Días a aplicar:</label>
                    <input type="number" id="dias_aplicar" value="0" min="0">
                </div>
                <div class="form-group">
                    <label for="horas_aplicar">Horas a aplicar:</label>
                    <input type="number" id="horas_aplicar" value="0" min="0">
                </div>
                <!-- FIN CAMPOS SEPARADOS -->

                <div class="form-group">
                    <label for="valor">Valor ($):</label>
                    <input type="number" step="0.01" id="valor" value="0.00">
                </div>
                <div class="form-group">
                    <label for="observacion">Observación:</label>
                    <textarea id="observacion"></textarea>
                </div>
            </form>
        </div>
    `;
}
