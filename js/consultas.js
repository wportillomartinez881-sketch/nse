/**
 * NEXUS — Consultas, Base Legal e Historial
 */
const ModuloConsultas = {
  init() {
    this.renderizarBaseLegal();
    this.renderizarHistorial();
    this.renderizarAuditoria();

    const btnPlanilla = document.getElementById('btn-generar-planilla');
    if (btnPlanilla) {
      btnPlanilla.addEventListener('click', () => this.procesarPlanillaTab());
    }
  },

  renderizarBaseLegal() {
    const contenedor = document.getElementById('contenedor-fundamento-legal');
    if (!contenedor) return;

    const leyes = [
      { titulo: "Código de Trabajo - Art. 161 (Jornada Laboral)", detalle: "La jornada ordinaria de trabajo diurno no excederá de ocho horas diarias ni de cuarenta y cuatro semanales." },
      { titulo: "Código de Trabajo - Art. 177 (Vacaciones)", detalle: "Después de un año de trabajo continuo, el trabajador tendrá derecho a un período de vacaciones de 15 días con goce de salario más un 30% recargo." },
      { titulo: "Código de Trabajo - Art. 196 (Aguinaldos)", detalle: "Todo patrono está obligado a dar a sus trabajadores una prima de navidad o aguinaldo entre el 12 y el 20 de diciembre." },
      { titulo: "Ley del Seguro Social - Art. 29 (ISSS)", detalle: "Cotización del 3% a cargo del trabajador sobre salario topado a $1,000.00 (Máximo $30.00) y 7.5% aporte patronal." },
      { titulo: "Ley SAP - Art. 16 (AFP)", detalle: "Aporte del trabajador fijado en el 7.25% del salario computable y 8.75% a cargo del empleador." },
      { titulo: "Código Tributario - Art. 156 (Retención Renta)", detalle: "Obligación de efectuar la retención del Impuesto Sobre la Renta según la tabla mensual de tramos aprobada por el Ministerio de Hacienda." }
    ];

    contenedor.innerHTML = leyes.map(ley => `
      <div class="card-panel" style="margin-bottom: 10px; border-left: 4px solid #198754;">
        <h3 style="margin-bottom: 5px;">${ley.titulo}</h3>
        <p>${ley.detalle}</p>
      </div>
    `).join('');
  },

  procesarPlanillaTab() {
    const tbody = document.getElementById('tabla-planilla-body');
    const empleados = (typeof EstadoApp !== 'undefined' && EstadoApp.empleados) ? EstadoApp.empleados : [];

    if (!tbody) return;

    if (empleados.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:red;">Registre empleados en el módulo correspondiente antes de procesar.</td></tr>`;
      return;
    }

    tbody.innerHTML = empleados.map(emp => {
      const sal = parseFloat(emp.Salario_Base || emp.salario || 0);
      const isss = Math.min(sal * 0.03, 30.00);
      const afp = sal * 0.0725;
      const baseRenta = sal - isss - afp;
      
      let renta = 0;
      if (baseRenta > 472.00 && baseRenta <= 895.24) renta = (baseRenta - 472.00) * 0.10 + 17.67;
      else if (baseRenta > 895.24 && baseRenta <= 2038.10) renta = (baseRenta - 895.24) * 0.20 + 60.00;
      else if (baseRenta > 2038.10) renta = (baseRenta - 2038.10) * 0.30 + 288.57;

      const neto = baseRenta - renta;

      return `
        <tr>
          <td>${emp.Nombre_Completo || emp.nombre}</td>
          <td>$${sal.toFixed(2)}</td>
          <td>$${isss.toFixed(2)}</td>
          <td>$${afp.toFixed(2)}</td>
          <td>$${renta.toFixed(2)}</td>
          <td><strong>$${neto.toFixed(2)}</strong></td>
        </tr>
      `;
    }).join('');
  },

  renderizarHistorial() {
    const tbody = document.getElementById('tabla-historial-body');
    if (tbody) {
      tbody.innerHTML = `
        <tr><td>HIS-01</td><td>18/08/2026</td><td>Inicio de Sesión</td><td>Acceso al sistema NEXUS</td></tr>
        <tr><td>HIS-02</td><td>18/08/2026</td><td>Sincronización</td><td>Carga de datos desde Google Sheets</td></tr>
      `;
    }
  },

  renderizarAuditoria() {
    const tbody = document.getElementById('tabla-auditoria-body');
    if (tbody) {
      tbody.innerHTML = `
        <tr><td>AUD-01</td><td>18/08/2026 11:30</td><td>Consulta API</td><td>Admin</td><td>Base de Datos General</td><td>Éxito</td></tr>
      `;
    }
  }
};

document.addEventListener('DOMContentLoaded', () => ModuloConsultas.init());
