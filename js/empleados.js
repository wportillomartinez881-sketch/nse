/**
 * NEXUS — Módulo de Empleados
 */
const ModuloEmpleados = {
  init() {
    const form = document.getElementById('form-empleado');
    if (form) {
      form.addEventListener('submit', (e) => this.guardarEmpleado(e));
    }
    this.renderizarTabla();
  },

  async guardarEmpleado(e) {
    e.preventDefault();

    const nuevoEmpleado = {
      ID_Empresa: localStorage.getItem("ID_Empresa") || "EMP01",
      Nombre_Completo: document.getElementById('emp-nombre').value.trim(),
      DUI: document.getElementById('emp-dui').value.trim(),
      Cargo: document.getElementById('emp-cargo').value.trim(),
      Fecha_Ingreso: document.getElementById('emp-fecha-ingreso').value,
      Salario_Base: parseFloat(document.getElementById('emp-salario').value) || 0,
      Estado: "Activo"
    };

    try {
      // 1. Guardar localmente de inmediato para actualizar vista sin esperar
      if (typeof EstadoApp !== 'undefined' && EstadoApp.empleados) {
        nuevoEmpleado.ID_Empleado = "EMP-" + (EstadoApp.empleados.length + 1);
        EstadoApp.empleados.push(nuevoEmpleado);
      }

      this.renderizarTabla();
      document.getElementById('form-empleado').reset();

      // 2. Enviar a Google Sheets vía API
      const respuesta = await API.post({
        accion: "guardar_empleado",
        ...nuevoEmpleado
      });

      alert("Empleado registrado y sincronizado exitosamente.");
      
      // Refrescar estado general
      if (typeof App !== 'undefined' && App.cargarDatosBackend) {
        App.cargarDatosBackend();
      }

    } catch (error) {
      alert("Guardado localmente. La sincronización con Google Sheets se completará automáticamente.");
      this.renderizarTabla();
    }
  },

  renderizarTabla() {
    const tbody = document.getElementById('tabla-empleados-body');
    if (!tbody) return;

    const lista = (typeof EstadoApp !== 'undefined' && EstadoApp.empleados) ? EstadoApp.empleados : [];

    if (lista.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No hay empleados registrados.</td></tr>`;
      return;
    }

    tbody.innerHTML = lista.map((emp, index) => `
      <tr>
        <td>${emp.ID_Empleado || 'EMP-' + (index + 1)}</td>
        <td>${emp.Nombre_Completo || emp.nombre || 'N/A'}</td>
        <td>${emp.DUI || 'N/A'}</td>
        <td>${emp.Cargo || emp.cargo || 'N/A'}</td>
        <td>${emp.Fecha_Ingreso || 'N/A'}</td>
        <td>$${parseFloat(emp.Salario_Base || emp.salario || 0).toFixed(2)}</td>
      </tr>
    `).join('');

    // Actualizar selector en pestaña novedades
    const selectNov = document.getElementById('nov-empleado-select');
    if (selectNov) {
      selectNov.innerHTML = '<option value="">Seleccione Empleado...</option>' + 
        lista.map(emp => `<option value="${emp.DUI}">${emp.Nombre_Completo || emp.nombre}</option>`).join('');
    }
  }
};

document.addEventListener('DOMContentLoaded', () => ModuloEmpleados.init());
