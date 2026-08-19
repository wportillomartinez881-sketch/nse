/**
 * NEXUS — Controlador Global (app.js)
 */
const app = {
  init() {
    this.configurarNavegacion();
  },

  configurarNavegacion() {
    const links = document.querySelectorAll('.sidebar-nav a');
    links.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const tabTarget = link.getAttribute('data-tab');
        if (tabTarget) this.mostrarSeccion(tabTarget, link);
      });
    });
  },

  mostrarSeccion(idSeccion, elLink) {
    document.querySelectorAll('.tab-content').forEach(sec => sec.classList.remove('active'));
    document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));

    const seccionTarget = document.getElementById(idSeccion);
    if (seccionTarget) seccionTarget.classList.add('active');

    if (elLink) {
      elLink.classList.add('active');
    } else {
      const linkMatch = document.querySelector(`.sidebar-nav a[data-tab="${idSeccion}"]`);
      if (linkMatch) linkMatch.classList.add('active');
    }
  }
};

document.addEventListener('DOMContentLoaded', () => app.init());
