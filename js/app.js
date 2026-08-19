/**
 * NEXUS — Lógica Principal y Navegación
 */
const App = {
  init() {
    this.configurarNavegacion();
    this.inicializarGraficas();
  },

  configurarNavegacion() {
    const links = document.querySelectorAll('.nav-link[data-tab]');
    links.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const tabTarget = link.getAttribute('data-tab');

        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));

        link.classList.add('active');
        const targetElement = document.getElementById(tabTarget);
        if (targetElement) targetElement.classList.add('active');

        // Renderizar gráficas si vuelve al inicio
        if (tabTarget === 'tab-dashboard') {
          this.inicializarGraficas();
        }
      });
    });
  },

  inicializarGraficas() {
    const ctx1 = document.getElementById('chartGraficaPlanilla');
    const ctx2 = document.getElementById('chartGraficaEmpleados');

    if (ctx1 && typeof Chart !== 'undefined') {
      if (window.miGrafico1) window.miGrafico1.destroy();
      window.miGrafico1 = new Chart(ctx1, {
        type: 'doughnut',
        data: {
          labels: ['Salarios Netos', 'Aportes ISSS', 'Aportes AFP', 'Retención ISR'],
          datasets: [{
            data: [65, 10, 15, 10],
            backgroundColor: ['#0d6efd', '#198754', '#ffc107', '#dc3545']
          }]
        }
      });
    }

    if (ctx2 && typeof Chart !== 'undefined') {
      if (window.miGrafico2) window.miGrafico2.destroy();
      window.miGrafico2 = new Chart(ctx2, {
        type: 'bar',
        data: {
          labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
          datasets: [{
            label: 'Empleados Activos',
            data: [5, 8, 12, 15, 18, 22],
            backgroundColor: '#0d6efd'
          }]
        }
      });
    }
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
