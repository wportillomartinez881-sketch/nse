// ----------------------------------------------------
// REGISTRAR EMPLEADO EN GOOGLE SHEETS
// ----------------------------------------------------
async function guardarEmpleado(datosEmpleado) {
  const idEmpresa = localStorage.getItem("ID_Empresa");

  if (!idEmpresa) {
    alert("No se encontró una empresa activa. Por favor inicia sesión primero.");
    return;
  }

  try {
    const payload = {
      accion: "registrar_empleado",
      ID_Empresa: idEmpresa, // Obligatorio para el backend
      Nombre_Completo: datosEmpleado.nombreCompleto,
      DUI: datosEmpleado.dui,
      Cargo: datosEmpleado.cargo,
      Fecha_Ingreso: datosEmpleado.fechaIngreso,
      Salario_Base: parseFloat(datosEmpleado.salarioBase) || 0,
      Estado: "Activo"
    };

    const respuesta = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    }).then(res => res.json());

    if (respuesta.estado === "correcto") {
      alert("Empleado guardado correctamente en Google Sheets.");
      cargarEmpleados(); // Recargar la tabla con la lista actualizada
    } else {
      alert("Error al registrar empleado: " + respuesta.mensaje);
    }
  } catch (error) {
    console.error("Error en guardarEmpleado:", error);
    alert("Error de comunicación al guardar el empleado.");
  }
}

// ----------------------------------------------------
// CARGAR LISTA DE EMPLEADOS
// ----------------------------------------------------
async function cargarEmpleados() {
  const idEmpresa = localStorage.getItem("ID_Empresa");
  if (!idEmpresa) return;

  try {
    const empleados = await fetch(`${API_URL}?accion=empleados`).then(res => res.json());
    
    // Filtrar sólo los empleados que pertenezcan a la empresa en sesión
    const misEmpleados = Array.isArray(empleados) 
      ? empleados.filter(emp => String(emp.ID_Empresa) === String(idEmpresa))
      : [];

    mostrarEmpleadosEnTabla(misEmpleados);
  } catch (error) {
    console.error("Error al cargar empleados:", error);
  }
}

function mostrarEmpleadosEnTabla(lista) {
  const tablaBody = document.getElementById("tabla-empleados-body");
  if (!tablaBody) return;

  tablaBody.innerHTML = "";

  lista.forEach(emp => {
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td>${emp.ID_Empleado || ''}</td>
      <td>${emp.Nombre_Completo || ''}</td>
      <td>${emp.DUI || ''}</td>
      <td>${emp.Cargo || ''}</td>
      <td>$${parseFloat(emp.Salario_Base || 0).toFixed(2)}</td>
      <td>${emp.Estado || 'Activo'}</td>
    `;
    tablaBody.appendChild(fila);
  });
}

// Escuchar formulario de empleados al cargar el archivo
document.addEventListener("DOMContentLoaded", function() {
  const formEmpleado = document.getElementById("form-empleado");
  if (formEmpleado) {
    formEmpleado.addEventListener("submit", function(e) {
      e.preventDefault();

      const datosEmpleado = {
        nombreCompleto: document.getElementById("emp-nombre").value,
        dui: document.getElementById("emp-dui").value,
        cargo: document.getElementById("emp-cargo").value,
        fechaIngreso: document.getElementById("emp-fecha-ingreso").value,
        salarioBase: document.getElementById("emp-salario").value
      };

      guardarEmpleado(datosEmpleado);
    });
  }

  // Cargar lista de empleados si existe la tabla
  cargarEmpleados();
});
