<!-- VENTANA MODAL DE INICIO DE SESIÓN Y REGISTRO -->
<div id="nexus-login-overlay" class="modal-overlay">
  <div class="modal-container">
    
    <!-- 1. FORMULARIO DE INICIO DE SESIÓN -->
    <div id="contenedor-login" class="auth-box">
      <h2>Iniciar Sesión - NEXUS</h2>
      <form id="nexus-login-form">
        <div class="form-group">
          <label for="login-correo">Correo Electrónico:</label>
          <input type="email" id="login-correo" required placeholder="ejemplo@empresa.com">
        </div>
        
        <div class="form-group">
          <label for="login-password">Contraseña:</label>
          <input type="password" id="login-password" required placeholder="••••••••">
        </div>

        <button type="submit" class="btn-primary">Ingresar</button>
      </form>
      <p class="auth-switch">
        ¿No tienes cuenta de empresa? 
        <a href="#" id="link-ir-a-registro">Regístrala aquí</a>
      </p>
    </div>

    <!-- 2. FORMULARIO DE REGISTRO DE EMPRESA Y USUARIO -->
    <div id="contenedor-registro" class="auth-box" style="display: none;">
      <h2>Registrar Empresa</h2>
      <form id="nexus-registro-form">
        
        <div class="form-group">
          <label for="reg-razon-social">Razón Social / Nombre Empresa *</label>
          <input type="text" id="reg-razon-social" required placeholder="NEXUS S.A. de C.V.">
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="reg-nit">NIT *</label>
            <input type="text" id="reg-nit" required placeholder="0614-000000-000-0">
          </div>
          <div class="form-group">
            <label for="reg-nrc">NRC *</label>
            <input type="text" id="reg-nrc" required placeholder="123456-7">
          </div>
        </div>

        <div class="form-group">
          <label for="reg-actividad">Actividad Económica *</label>
          <input type="text" id="reg-actividad" required placeholder="Servicios Contables y Administrativos">
        </div>

        <div class="form-group">
          <label for="reg-direccion">Dirección Completa *</label>
          <input type="text" id="reg-direccion" required placeholder="San Salvador, El Salvador">
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="reg-telefono">Teléfono *</label>
            <input type="tel" id="reg-telefono" required placeholder="2222-0000">
          </div>
          <div class="form-group">
            <label for="reg-representante">Representante Legal *</label>
            <input type="text" id="reg-representante" required placeholder="Nombre del Representante">
          </div>
        </div>

        <hr class="form-divider">

        <div class="form-group">
          <label for="reg-correo">Correo Electrónico Administrador *</label>
          <input type="email" id="reg-correo" required placeholder="admin@empresa.com">
        </div>

        <div class="form-group">
          <label for="reg-password">Contraseña *</label>
          <input type="password" id="reg-password" required placeholder="••••••••">
        </div>

        <button type="submit" class="btn-primary">Registrar e Ingresar</button>
      </form>
      <p class="auth-switch">
        ¿Ya tienes cuenta? 
        <a href="#" id="link-ir-a-login">Inicia sesión aquí</a>
      </p>
    </div>

  </div>
</div>
