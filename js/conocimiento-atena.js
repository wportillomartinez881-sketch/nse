/* Base de conocimiento editable de Atena.
 * Agrega nuevos temas siguiendo el mismo formato { claves, respuesta }.
 * Las respuestas son informativas; no sustituyen asesoria contable o legal.
 */
const ConocimientoAtena = (() => {
  const temas = [
    {
      claves: ['empresa', 'nexus', 'servicio', 'quienes son', 'contacto', 'horario'],
      respuesta: 'NEXUS ayuda a las empresas a organizar empleados, novedades, planillas y controles. Para una consulta comercial o de servicio, usa los canales de contacto y horarios configurados por tu empresa en el modulo de soporte.',
    },
    {
      claves: ['activo', 'activos'],
      respuesta: 'Un activo es un recurso que posee la empresa y del que espera obtener beneficios: efectivo, cuentas por cobrar, inventario o equipos, por ejemplo.',
    },
    {
      claves: ['pasivo', 'pasivos', 'deuda', 'deudas'],
      respuesta: 'Un pasivo es una obligacion de la empresa, como proveedores pendientes, prestamos o impuestos por pagar.',
    },
    {
      claves: ['balance general', 'situacion financiera'],
      respuesta: 'El balance general muestra, en una fecha especifica, los activos, pasivos y patrimonio de la empresa. La relacion basica es: activos = pasivos + patrimonio.',
    },
    {
      claves: ['estado de resultados', 'ganancia', 'perdida', 'utilidad'],
      respuesta: 'El estado de resultados resume ingresos, costos y gastos de un periodo para determinar si hubo utilidad o perdida.',
    },
    {
      claves: ['flujo de caja', 'efectivo', 'caja'],
      respuesta: 'El flujo de caja controla las entradas y salidas reales de dinero. Una empresa puede tener utilidad contable y aun asi necesitar planificar efectivo para pagar nomina y proveedores.',
    },
    {
      claves: ['iva'],
      respuesta: 'El IVA es un impuesto relacionado con ventas y compras gravadas. Su declaracion y tratamiento dependen de la normativa vigente y de las operaciones de tu empresa; confirma el detalle con tu contador.',
    },
    {
      claves: ['recomienda', 'sugerencia', 'consejo', 'mejorar'],
      respuesta: 'Como buena practica, manten actualizados los datos de empleados, registra novedades antes de cerrar el periodo, revisa las alertas de validacion y conserva respaldos de reportes y comprobantes.',
    },
    {
      claves: ['patrimonio', 'capital contable'],
      respuesta: 'El patrimonio (o capital contable) es la diferencia entre los activos y los pasivos de la empresa: representa lo que realmente le pertenece a los dueños o accionistas.',
    },
    {
      claves: ['cuentas por cobrar'],
      respuesta: 'Las cuentas por cobrar son montos que clientes u otros terceros le deben a la empresa por ventas o servicios ya entregados pero aun no pagados.',
    },
    {
      claves: ['cuentas por pagar', 'proveedor'],
      respuesta: 'Las cuentas por pagar son las obligaciones que la empresa tiene con proveedores u otros terceros por bienes o servicios ya recibidos pero aun no pagados.',
    },
    {
      claves: ['depreciacion'],
      respuesta: 'La depreciacion distribuye el costo de un activo fijo (como equipo o mobiliario) a lo largo de su vida util, reflejando el desgaste del bien en la contabilidad de cada periodo.',
    },
    {
      claves: ['presupuesto'],
      respuesta: 'Un presupuesto es una proyeccion de ingresos y gastos futuros que ayuda a la empresa a planificar su operacion y comparar lo proyectado contra lo real.',
    },
    {
      claves: ['nit'],
      respuesta: 'El NIT (Numero de Identificacion Tributaria) identifica a la empresa ante la administracion tributaria. En NEXUS se registra al crear la empresa y se usa como referencia en varios modulos.',
    },
    {
      claves: ['contrato de trabajo', 'contrato individual'],
      respuesta: 'El contrato individual de trabajo es el acuerdo entre empleador y trabajador que establece condiciones como salario, jornada y funciones; es la base para calcular planilla, novedades y prestaciones.',
    },
    {
      claves: ['prestacion', 'prestaciones laborales'],
      respuesta: 'Las prestaciones laborales (aguinaldo, vacaciones, indemnizacion, entre otras) son beneficios que la ley reconoce al trabajador ademas del salario ordinario. Puedes preguntarme por cada una, por ejemplo "aguinaldo de 500 con 4 años".',
    },
    {
      claves: ['isss', 'seguro social'],
      respuesta: 'El ISSS es la institucion de seguridad social a la que se cotiza una parte del salario (aporte laboral y patronal) para cubrir salud y otras prestaciones del trabajador.',
    },
    {
      claves: ['afp', 'pension'],
      respuesta: 'La AFP administra el fondo de pensiones del trabajador. Tanto el empleado como el empleador aportan un porcentaje del salario, que luego se refleja como ahorro para la pension.',
    },
    {
      claves: ['isr', 'renta'],
      respuesta: 'El ISR (Impuesto Sobre la Renta) se calcula por tramos sobre la base imponible del salario (despues de restar ISSS y AFP). Puedes preguntarme "retenciones" para ver los tramos que usa esta demostracion.',
    },
    {
      claves: ['dia de pago', 'periodo de planilla', 'quincena', 'periodo'],
      respuesta: 'El periodo de planilla es el rango de tiempo (semanal, quincenal o mensual) que se liquida en cada corrida. Las novedades (horas extra, ausencias, bonos) deben registrarse dentro del periodo correspondiente antes de calcular la planilla.',
    },
    {
      claves: ['auditoria'],
      respuesta: 'El modulo de Auditoria deja un registro (bitacora) de las acciones importantes del sistema: quien hizo que y cuando, para dar trazabilidad al proceso de planilla.',
    },
  ];

  function buscar(pregunta) {
    const texto = String(pregunta || '').toLowerCase();
    const tema = temas.find((item) => item.claves.some((clave) => texto.includes(clave)));
    return tema?.respuesta || null;
  }

  return { buscar, temas };
})();
