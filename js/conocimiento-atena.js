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
  ];

  function buscar(pregunta) {
    const texto = String(pregunta || '').toLowerCase();
    const tema = temas.find((item) => item.claves.some((clave) => texto.includes(clave)));
    return tema?.respuesta || null;
  }

  return { buscar, temas };
})();
