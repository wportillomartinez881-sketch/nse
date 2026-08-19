/**
 * NEXUS — Empleados (empleados.js)
 */
const Empleados = {
  init() {
    const formEmp = document.getElementById('form-empleado');
    if (formEmp) {
      formEmp.addEventListener('submit', async (e) => {
        e.preventDefault();

        const idEmpresa = localStorage.getItem("ID_Empresa") || "EMP01";

        // Parámetros EXACTOS que exige tu backend de Google Apps Script
        const datosEmpleado = {
          accion: "registrar_empleado",
          ID_Empresa: idEmpresa,
          Nombre_Completo: document.getElementById('emp-nombre').value,
          DUI: document.getElementById('emp-dui').value,
          Cargo: document.getElementById('emp-cargo').value,
          Fecha_Ingreso: document.getElementById('emp-fecha-ingreso').value,
          Salario_Base: parseFloat(document.getElementById('emp-salario').value)
        };

        try {
          const res = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify(datosEmpleado)
          }).then(r => r.json());

          if (res.estado === "correcto" || res.exito) {
            alert('¡Empleado guardado exitosamente!');
            formEmp.reset();
            this.cargarTabla();
          } else {
            alert('Error al guardar el empleado: ' + (res.mensaje || 'Error desconocido'));
          }
        } catch (err) {
          alert('Error de conexión al registrar empleado.');
        }
      });
    }

    this.cargarTabla();
  },

  async cargarTabla() {
    const tbody = document.getElementById('tabla-empleados-body');
    if (!tbody) return;

    const idEmpresa = localStorage.getItem("ID_Empresa") || "EMP01";

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ accion: "obtener_empleados", ID_Empresa: idEmpresa })
      }).then(r => r.json());

      const lista = Array.isArray(res) ? res : (res.datos || []);

      if (lista.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No hay empleados registrados.</td></tr>';
        return;
      }

      let html = '';
      lista.forEach((emp, index) => {
        html += `<tr>
          <td>${emp.ID_Empleado || (index + 1)}</td>
          <td>${emp.Nombre_Completo || emp.Nombre || '-'}</td>
          <td>${emp.DUI || '-'}</td>
          <td>${emp.Cargo || '-'}</td>
          <td>$${parseFloat(emp.Salario_Base || emp.Salario || 0).toFixed(2)}</td>
          <td><span class="badge active">Activo</span></td>
        </tr>`;
      });
      tbody.innerHTML = html;
    } catch (e) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Error al conectar con Google Sheets.</td></tr>';
    }
  }
};

document.addEventListener('DOMContentLoaded', () => Empleados.init());
