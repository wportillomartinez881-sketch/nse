/**
 * NEXUS — Módulo de Empleados (empleados.js)
 */
const Empleados = {
  init() {
    const formEmp = document.getElementById('form-empleado');
    if (formEmp) {
      formEmp.addEventListener('submit', async (e) => {
        e.preventDefault(); // Detiene recargas de la app

        const idEmpresa = localStorage.getItem("ID_Empresa") || '';

        const datosEmpleado = {
          idEmpresa: idEmpresa,
          nombre: (document.getElementById('emp-nombre') || {}).value || '',
          dui: (document.getElementById('emp-dui') || {}).value || '',
          cargo: (document.getElementById('emp-cargo') || {}).value || '',
          fechaIngreso: (document.getElementById('emp-fecha-ingreso') || {}).value || '',
          salario: parseFloat((document.getElementById('emp-salario') || {}).value || 0)
        };

        try {
          await Api.registrarEmpleado(datosEmpleado);
          alert('¡Empleado guardado exitosamente en Google Sheets!');
          formEmp.reset();
          this.cargarTabla();
        } catch (err) {
          alert('Error al guardar el empleado: ' + err.message);
        }
      });
    }

    // Cargar la lista al iniciar
    this.cargarTabla();
  },

  async cargarTabla() {
    const tbody = document.getElementById('tabla-empleados-body');
    if (!tbody) return;

    const idEmpresa = localStorage.getItem("ID_Empresa") || '';

    try {
      const res = await Api.getEmpleados({ idEmpresa });
      const lista = Array.isArray(res) ? res : (res.datos || res.data || []);

      if (lista.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No hay empleados registrados.</td></tr>';
        return;
      }

      let html = '';
      lista.forEach((emp, index) => {
        html += `<tr>
          <td>${emp.ID_Empleado || (index + 1)}</td>
          <td>${emp.Nombre || emp.nombre || '-'}</td>
          <td>${emp.DUI || emp.dui || '-'}</td>
          <td>${emp.Cargo || emp.cargo || '-'}</td>
          <td>$${parseFloat(emp.Salario || emp.salario || 0).toFixed(2)}</td>
          <td><span class="badge active">Activo</span></td>
        </tr>`;
      });
      tbody.innerHTML = html;
    } catch (e) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:red;">Error al cargar la tabla de Google Sheets.</td></tr>';
    }
  }
};

document.addEventListener('DOMContentLoaded', () => Empleados.init());
