/**
 * NEXUS — Motor Fiscal-Laboral (FASE 3: automatización de procesos contables)
 * -------------------------------------------------------------------------
 * Rescatado y centralizado desde el prototipo anterior de NEXUS. Esta es
 * la ÚNICA fuente de fórmulas de planilla en toda la aplicación (sección 12
 * del brief: "No quiero fórmulas duplicadas en diferentes partes del
 * código"). Todo módulo que necesite calcular un valor de planilla llama
 * a FiscalEngine, nunca reimplementa una fórmula por su cuenta.
 *
 * IMPORTANTE (fundamento legal, sección 19 del brief): estas tasas y tramos
 * son un fundamento académico registrado en el proyecto para fines de
 * demostración escolar, NO asesoría legal ni tributaria oficial. Si la
 * hoja FUNDAMENTO_LEGAL del backend define valores distintos, esos deben
 * prevalecer — ver `FiscalEngine.actualizarParametros()`.
 */
const FiscalEngine = (() => {
  // Valores por defecto (idénticos al prototipo anterior). Se pueden
  // sobreescribir con lo que devuelva la hoja PARAMETROS, sin tocar el
  // resto del motor.
  let cfg = {
    ISSS_TASA_LABORAL: 0.03,
    ISSS_TASA_PATRONAL: 0.075,
    ISSS_TECHO: 1000.00,
    AFP_TASA_LABORAL: 0.0725,
    AFP_TASA_PATRONAL: 0.0875,
    TRAMOS_ISR: [
      { hasta: 472.00, porcentaje: 0, exceso: 0, cuota: 0 },
      { hasta: 895.24, porcentaje: 0.10, exceso: 472.00, cuota: 17.67 },
      { hasta: 2038.10, porcentaje: 0.20, exceso: 895.24, cuota: 60.00 },
      { hasta: Infinity, porcentaje: 0.30, exceso: 2038.10, cuota: 288.57 },
    ],
  };

  /**
   * Permite que el módulo de Parámetros sobreescriba las tasas si la hoja
   * PARAMETROS trae valores explícitos (p. ej. Techo_ISSS, Tasa_AFP_Laboral).
   * No inventa nada: si el parámetro no viene, se conserva el valor actual.
   */
  function actualizarParametros(parametros = {}) {
    if (parametros.ISSS_TASA_LABORAL) cfg.ISSS_TASA_LABORAL = Number(parametros.ISSS_TASA_LABORAL);
    if (parametros.ISSS_TASA_PATRONAL) cfg.ISSS_TASA_PATRONAL = Number(parametros.ISSS_TASA_PATRONAL);
    if (parametros.ISSS_TECHO) cfg.ISSS_TECHO = Number(parametros.ISSS_TECHO);
    if (parametros.AFP_TASA_LABORAL) cfg.AFP_TASA_LABORAL = Number(parametros.AFP_TASA_LABORAL);
    if (parametros.AFP_TASA_PATRONAL) cfg.AFP_TASA_PATRONAL = Number(parametros.AFP_TASA_PATRONAL);
  }

  /**
   * Calcula la liquidación mensual de un empleado a partir de su salario
   * base y las novedades del período (horas extra, ausencias, bonos).
   */
  function calcularLiquidacionMensual(salarioBase, opciones = {}) {
    const {
      horasExtraDiurnas = 0,
      horasExtraNocturnas = 0,
      diasInasistencia = 0,
      bonos = 0,
      comisiones = 0,
      otrasDeducciones = 0,
    } = opciones;

    const valorDia = salarioBase / 30;
    const valorHoraOrdinaria = valorDia / 8;

    const descuentoInasistencia = valorDia * diasInasistencia;
    const salarioDevengadoAjustado = Math.max(0, salarioBase - descuentoInasistencia);

    const totalHorasExtra =
      (horasExtraDiurnas * (valorHoraOrdinaria * 2)) +
      (horasExtraNocturnas * (valorHoraOrdinaria * 1.25 * 2));

    const salarioBruto = salarioDevengadoAjustado + totalHorasExtra + bonos + comisiones;

    const baseISSS = Math.min(salarioBruto, cfg.ISSS_TECHO);
    const isssLaboral = redondear(baseISSS * cfg.ISSS_TASA_LABORAL);
    const isssPatronal = redondear(baseISSS * cfg.ISSS_TASA_PATRONAL);
    const afpLaboral = redondear(salarioBruto * cfg.AFP_TASA_LABORAL);
    const afpPatronal = redondear(salarioBruto * cfg.AFP_TASA_PATRONAL);

    const baseISR = salarioBruto - isssLaboral - afpLaboral;
    let isr = 0;
    for (const tramo of cfg.TRAMOS_ISR) {
      if (baseISR <= tramo.hasta) {
        isr = ((baseISR - tramo.exceso) * tramo.porcentaje) + tramo.cuota;
        break;
      }
    }
    isr = redondear(Math.max(0, isr));

    const totalDeducciones = redondear(isssLaboral + afpLaboral + isr + otrasDeducciones);
    const salarioNeto = redondear(salarioBruto - totalDeducciones);

    return {
      totales: {
        salarioBruto: redondear(salarioBruto),
        descuentoInasistencia: redondear(descuentoInasistencia),
        totalHorasExtra: redondear(totalHorasExtra),
        totalDeducciones,
        salarioNeto,
        costoTotalPatronal: redondear(salarioBruto + isssPatronal + afpPatronal),
      },
      desglose: { isssLaboral, isssPatronal, afpLaboral, afpPatronal, isr, otrasDeducciones },
    };
  }

  function calcularAguinaldo(salarioBase, anosServicio) {
    const dia = salarioBase / 30;
    if (anosServicio >= 1 && anosServicio < 3) return redondear(dia * 15);
    if (anosServicio >= 3 && anosServicio < 10) return redondear(dia * 19);
    if (anosServicio >= 10) return redondear(dia * 21);
    return redondear(dia * 15 * anosServicio);
  }

  function calcularVacaciones(salarioBase) {
    return redondear((salarioBase / 2) * 1.30);
  }

  function calcularIndemnizacion(salarioBase, anosServicio) {
    return redondear(salarioBase * anosServicio);
  }

  function redondear(n) { return Number((n || 0).toFixed(2)); }

  function obtenerParametrosPublicos() {
    return {
      isssLaboral: cfg.ISSS_TASA_LABORAL,
      afpLaboral: cfg.AFP_TASA_LABORAL,
      techoIsss: cfg.ISSS_TECHO,
      tramosIsr: cfg.TRAMOS_ISR.map((tramo) => ({ ...tramo })),
    };
  }

  return {
    actualizarParametros,
    calcularLiquidacionMensual,
    calcularAguinaldo,
    calcularVacaciones,
    calcularIndemnizacion,
    obtenerParametrosPublicos,
  };
})();
