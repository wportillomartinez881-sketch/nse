/**
 * NEXUS — Consultas, Auditoría y Base Legal (consultas.js)
 */
const Consultas = {
  init() {
    this.cargarBaseLegal();
    this.cargarHistorial();
    this.cargarAuditoria();
  },

  cargarBaseLegal() {
    const contenedor = document.getElementById('contenedor-fundamento-legal');
    if (!contenedor) return;

    const articulos = [
      { titulo: "Código de Trabajo - Art. 119", desc: "Define el salario como la retribución en dinero que el patrono está obligado a pagar al trabajador por los servicios prestados." },
      { titulo: "Ley del Seguro Social - Art. 29", desc: "Establece la obligatoriedad de la cotización del patrono y trabajador para la cobertura de salud e invalidez." },
      { titulo: "Ley SAP (AFP) - Art. 16", desc: "Regula las aportaciones obligatorias a las Administradoras de Fondos de Pensiones para la cuenta individual." },
      { titulo: "Código Tributario - Art. 156", desc: "Obliga a los patronos a retener el Impuesto sobre la Renta (ISR) de los salarios pagados." }
    ];

    let html = '';
    articulos.forEach(art => {
      html += `
        <div class="card-panel" style="margin-bottom: 10px;">
          <h4 style="color: #60a5fa;"><i class="fa-solid fa-scale-balanced"></i> ${art.titulo}</h4>
          <p style="font-size: 0.9em; opacity: 0.85;">${art.desc}</p>
        </div>
      `;
    });
    contenedor.innerHTML = html;
  },

  async cargarHistorial() {
    const tbody = document.getElementById('tabla-historial-body');
    if (!tbody) return;

    tbody.innerHTML = `
      <tr><td>1</td><td>${new Date().toLocaleDateString()}</td><td>Acceso al Sistema</td><td>Sesión iniciada por el usuario administrador.</td></tr>
      <tr><td>2</td><td>${new Date().toLocaleDateString()}</td><td>Cálculo de Planilla</td><td>Consulta en Motor Fiscal realizada correctamente.</td></tr>
    `;
  },

  async cargarAuditoria() {
    const tbody = document.getElementById('tabla-auditoria-body');
    if (!tbody) return;

    tbody.innerHTML = `
      <tr><td>AUD-01</td><td>${new Date().toLocaleString()}</td><td>LOGIN</td><td>Administrador</td><td>Sistema Central</td><td><span style="color:#10b981;">Éxito</span></td></tr>
    `;
  }
};

document.addEventListener('DOMContentLoaded', () => Consultas.init());
