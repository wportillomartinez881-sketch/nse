/**
 * NEXUS — Motor Fiscal y Calculadora de Prestaciones
 */
const MotorFiscal = {
  init() {
    const btn = document.getElementById('btn-calcular-deducciones');
    if (btn) {
      btn.addEventListener('click', () => this.calcularTodo());
    }
  },

  calcularTodo() {
    const salario = parseFloat(document.getElementById('calc-salario').value) || 0;
    const antiguedad = parseInt(document.getElementById('calc-antiguedad').value) || 0;
    const contenedorRes = document.getElementById('resultado-calculo-fiscal');

    if (salario <= 0) {
      contenedorRes.innerHTML = `<p style="color:red;">Ingrese un salario válido mayor a $0.00</p>`;
      return;
    }

    // 1. DEDUCCIONES DE LEY
    const isss = Math.min(salario * 0.03, 30.00); // Tope de $30.00 en El Salvador
    const afp = salario * 0.0725;
    const baseRenta = salario - isss - afp;
    
    let renta = 0;
    if (baseRenta > 472.00 && baseRenta <= 895.24) {
      renta = (baseRenta - 472.00) * 0.10 + 17.67;
    } else if (baseRenta > 895.24 && baseRenta <= 2038.10) {
      renta = (baseRenta - 895.24) * 0.20 + 60.00;
    } else if (baseRenta > 2038.10) {
      renta = (baseRenta - 2038.10) * 0.30 + 288.57;
    }

    const salarioNeto = baseRenta - renta;

    // 2. CÁLCULO DE VACACIONES (15 días + 30% recargo ley)
    const salarioDiario = salario / 30;
    const pago15Dias = salarioDiario * 15;
    const recargoVacacion = pago15Dias * 0.30;
    const totalVacaciones = pago15Dias + recargoVacacion;

    // 3. CÁLCULO DE AGUINALDO (Según Código de Trabajo El Salvador)
    let diasAguinaldo = 0;
    if (antiguedad >= 1 && antiguedad < 3) {
      diasAguinaldo = 15;
    } else if (antiguedad >= 3 && antiguedad < 10) {
      diasAguinaldo = 19;
    } else if (antiguedad >= 10) {
      diasAguinaldo = 21;
    } else {
      diasAguinaldo = (antiguedad > 0) ? 15 : 0; // Proporcional si tiene menos del año
    }

    const totalAguinaldo = salarioDiario * diasAguinaldo;

    // RENDERIZADO DE RESULTADOS
    contenedorRes.innerHTML = `
      <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #0d6efd;">
        <h4>Resumen Mensual de Retenciones</h4>
        <ul>
          <li><strong>ISSS (3%):</strong> $${isss.toFixed(2)}</li>
          <li><strong>AFP (7.25%):</strong> $${afp.toFixed(2)}</li>
          <li><strong>Renta (ISR):</strong> $${renta.toFixed(2)}</li>
          <li><strong>Salario Neto Líquido:</strong> <span style="color:green; font-weight:bold;">$${salarioNeto.toFixed(2)}</span></li>
        </ul>
        <hr>
        <h4>Cálculo de Prestaciones Anuales</h4>
        <ul>
          <li><strong>Vacaciones Remuneradas (15 días + 30% recargo):</strong> $${totalVacaciones.toFixed(2)}</li>
          <li><strong>Aguinaldo (${diasAguinaldo} días según ${antiguedad} año(s) de antigüedad):</strong> $${totalAguinaldo.toFixed(2)}</li>
        </ul>
      </div>
    `;
  }
};

document.addEventListener('DOMContentLoaded', () => MotorFiscal.init());
