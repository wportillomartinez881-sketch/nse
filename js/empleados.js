/**
 * NEXUS — Módulo de Empleados (empleados.js)
 */
const Empleados = {
  init() {
    const formEmp = document.getElementById('form-crear-empleado') || document.querySelector('.form-empleado');
    if (formEmp) {
      formEmp.addEventListener('submit', async (e) => {
        e.preventDefault(); // Evita que la página se recargue o regrese al inicio

        const msgStatus = document.getElementById('empleado-form-mensaje');
        if (msgStatus) {
          msgStatus.textContent = 'Guardando en Google Sheets...';
          msgStatus.style.color = '#3b82f6';
        }

        // Recupera el ID_Empresa que tu auth.js guardó en localStorage
        const idEmpresa = localStorage.getItem("ID_Empresa") || '';

        const datosEmpleado = {
          idEmpresa: idEmpresa,
          nombre: (document.getElementById('emp-nombre') || {}).value || '',
          dui: (document.getElementById('emp-dui') || {}).value || '',
          cargo: (document.getElementById('emp-cargo') || {}).value || '',
          salario: parseFloat((document.getElementById('emp-salario') || {}).value || 0)
        };

        try {
          await Api.registrarEmpleado(datosEmpleado);
          if (msgStatus) {
            msgStatus.textContent = '¡Empleado guardado exitosamente en Google Sheets!';
            msgStatus.style.color = '#10b981';
          }
          formEmp.reset();
          this.cargarTabla(); // Refresca la tabla
        } catch (err) {
          if (msgStatus) {
            msgStatus.textContent = `Error al guardar: ${err.message}`;
            msgStatus.style.color = '#ef4444';
          }
        }
      });
    }
  },

  async cargarTabla() {
    const contenedor = document.getElementById('tabla-empleados-container');
    if (!contenedor) return;

    contenedor.innerHTML = '<p>Cargando lista desde Google Sheets...</p>';
    const idEmpresa = localStorage.getItem("ID_Empresa") || '';

    try {
      const res = await Api.getEmpleados({ idEmpresa });
      const lista = Array.isArray(res) ? res : (res.datos || res.data || []);

      if (lista.length === 0) {
        contenedor.innerHTML = '<p>No hay empleados registrados en Google Sheets.</p>';
        return;
      }

      let html = `<table class="nexus-table"><thead><tr><th>ID</th><th>Nombre</th><th>DUI</th><th>Cargo</th><th>Salario</th></tr></thead><tbody>`;
      lista.forEach(emp => {
        html += `<tr>
          <td>${emp.ID_Empleado || emp.id || '-'}</td>
          <td>${emp.Nombre || emp.nombre || '-'}</td>
          <td>${emp.DUI || emp.dui || '-'}</td>
          <td>${emp.Cargo || emp.cargo || '-'}</td>
          <td>$${parseFloat(emp.Salario || emp.salario || 0).toFixed(2)}</td>
        </tr>`;
      });
      html += '</tbody></table>';
      contenedor.innerHTML = html;
    } catch (e) {
      contenedor.innerHTML = `<p style="color:#ef4444;">Error al obtener empleados de Google Sheets.</p>`;
    }
  }
};

document.addEventListener('DOMContentLoaded', () => Empleados.init());
