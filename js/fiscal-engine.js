/**
 * NEXUS — Motor Fiscal (fiscal-engine.js)
 */
const FiscalEngine = {
  init() {
    const btnCalcular = document.getElementById('btn-calcular-deducciones');
    if (btnCalcular) {
      btnCalcular.addEventListener('click', (e) => {
        e.preventDefault();
        this.calcular();
      });
    }
  },

  calcular() {
    const inputSalario = document.getElementById('calc-salario');
    const contenedorRes = document.getElementById('resultado-calculo-fiscal');
    if (!inputSalario || !contenedorRes) return;

    const salario = parseFloat(inputSalario.value) || 0;
    if (salario <= 0) {
      contenedorRes.innerHTML = '<p style="color:red;">Ingrese un salario válido mayor a $0.00</p>';
      return;
    }

    // Tablas de retención oficial El Salvador
    const isss = Math.min(salario * 0.03, 30.00); // Topes de ISSS ($1,000 max cotizable)
    const afp = salario * 0.0725; // 7.25% AFP
    const baseRenta = salario - isss - afp;

    let renta = 0;
    if (baseRenta > 472.00 && baseRenta <= 895.24) {
      renta = (baseRenta - 472.00) * 0.10 + 17.67;
    } else if (baseRenta > 895.24 && baseRenta <= 2038.10) {
      renta = (baseRenta - 895.24) * 0.20 + 60.00;
    } else if (baseRenta > 2038.10) {
      renta = (baseRenta - 2038.10) * 0.30 + 288.57;
    }

    const totalDeducciones = isss + afp + renta;
    const salarioLiquido = salario - totalDeducciones;

    contenedorRes.innerHTML = `
      <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; margin-top: 10px;">
        <h4>Resumen de Descuentos Legales:</h4>
        <p><strong>ISSS (3%):</strong> $${isss.toFixed(2)}</p>
        <p><strong>AFP (7.25%):</strong> $${afp.toFixed(2)}</p>
        <p><strong>Renta (ISR):</strong> $${renta.toFixed(2)}</p>
        <hr style="border-color: rgba(255,255,255,0.1);">
        <p><strong>Total Deducciones:</strong> $${totalDeducciones.toFixed(2)}</p>
        <h3 style="color: #10b981;">Salario Líquido a Recibir: $${salarioLiquido.toFixed(2)}</h3>
      </div>
    `;
  }
};

document.addEventListener('DOMContentLoaded', () => FiscalEngine.init());
