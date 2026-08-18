// ----------------------------------------------------
// CARGAR AUDITORÍA DESDE LA PESTAÑA AUDITORIA
// ----------------------------------------------------
async function cargarAuditoria() {
  try {
    const datos = await fetch(`${API_URL}?accion=auditoria`).then(res => res.json());
    const tabla = document.getElementById("tabla-auditoria-body");
    if (!tabla || !Array.isArray(datos)) return;

    tabla.innerHTML = "";
    datos.forEach(item => {
      const fila = document.createElement("tr");
      fila.innerHTML = `
        <td>${item.ID_Auditoria || ''}</td>
        <td>${item.Fecha ? new Date(item.Fecha).toLocaleString() : ''}</td>
        <td>${item.Accion || ''}</td>
        <td>${item.Usuario || ''}</td>
        <td>${item.Registro_Afectado || ''}</td>
        <td>${item.Resultado || ''}</td>
      `;
      tabla.appendChild(fila);
    });
  } catch (error) {
    console.error("Error al cargar auditoría:", error);
  }
}

// ----------------------------------------------------
// CARGAR HISTORIAL DESDE LA PESTAÑA HISTORIAL_NEXUS
// ----------------------------------------------------
async function cargarHistorial() {
  try {
    const datos = await fetch(`${API_URL}?accion=historial`).then(res => res.json());
    const tabla = document.getElementById("tabla-historial-body");
    if (!tabla || !Array.isArray(datos)) return;

    tabla.innerHTML = "";
    datos.forEach(item => {
      const fila = document.createElement("tr");
      fila.innerHTML = `
        <td>${item.ID_Historial || ''}</td>
        <td>${item.Fecha ? new Date(item.Fecha).toLocaleDateString() : ''}</td>
        <td>${item.Descripcion || ''}</td>
        <td>${item.Detalle || ''}</td>
      `;
      tabla.appendChild(fila);
    });
  } catch (error) {
    console.error("Error al cargar historial:", error);
  }
}

// ----------------------------------------------------
// CARGAR FUNDAMENTO LEGAL SIN LIMITACIONES
// ----------------------------------------------------
async function cargarFundamentoLegal() {
  try {
    const datos = await fetch(`${API_URL}?accion=fundamento_legal`).then(res => res.json());
    const contenedor = document.getElementById("contenedor-fundamento-legal");
    if (!contenedor || !Array.isArray(datos)) return;

    contenedor.innerHTML = "";
    datos.forEach(item => {
      const card = document.createElement("div");
      card.className = "card-fundamento";
      card.innerHTML = `
        <h3>${item.Codigo_Articulo || 'Artículo'} - ${item.Titulo || ''}</h3>
        <p><strong>Categoría:</strong> ${item.Categoria || 'General'}</p>
        <p>${item.Descripcion_Texto || item.Contenido || ''}</p>
      `;
      contenedor.appendChild(card);
    });
  } catch (error) {
    console.error("Error al cargar fundamento legal:", error);
  }
}

// Cargar consultas automáticamente al cargar el script
document.addEventListener("DOMContentLoaded", function() {
  cargarAuditoria();
  cargarHistorial();
  cargarFundamentoLegal();
});
