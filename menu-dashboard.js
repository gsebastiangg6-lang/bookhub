/**
 * Controlador reutilizable del menú hamburguesa para el Dashboard de BookHub.
 * - Transición CSS de 0.3s
 * - Alternancia de iconos '=' y 'x'
 * - Cierre al clic fuera, al elegir opción o al presionar Escape
 * - Accesibilidad completa con aria-expanded y aria-controls
 */
function inicializarMenuDashboard({
  botonId = "hamburger-btn",
  sidebarId = "dashboard-sidebar",
  backdropId = "sidebar-backdrop"
} = {}) {
  const boton = document.getElementById(botonId);
  const sidebar = document.getElementById(sidebarId);
  const backdrop = document.getElementById(backdropId);
  const icono = boton?.querySelector(".hamburger-icon");

  if (!boton || !sidebar || !icono) return;

  function esPantallaPequena() {
    return window.innerWidth < 1024;
  }

  function actualizarEstado(abrir) {
    sidebar.classList.toggle("is-open", abrir);
    backdrop?.classList.toggle("is-visible", abrir);
    boton.setAttribute("aria-expanded", String(abrir));
    boton.setAttribute(
      "aria-label",
      abrir ? "Cerrar menú lateral" : "Abrir menú lateral"
    );
    icono.textContent = abrir ? "x" : "=";
  }

  function cerrarSidebar() {
    if (sidebar.classList.contains("is-open")) {
      actualizarEstado(false);
    }
  }

  // 1 y 2. Alternar visibilidad e icono '=' / 'x'
  boton.addEventListener("click", (evento) => {
    evento.stopPropagation();
    const debeAbrir = !sidebar.classList.contains("is-open");
    actualizarEstado(debeAbrir);
  });

  // 3. Cerrar al hacer clic fuera del sidebar en pantallas pequeñas
  backdrop?.addEventListener("click", cerrarSidebar);

  document.addEventListener("click", (evento) => {
    if (!esPantallaPequena() || !sidebar.classList.contains("is-open")) return;
    const clicEnSidebar = sidebar.contains(evento.target);
    const clicEnBoton = boton.contains(evento.target);
    if (!clicEnSidebar && !clicEnBoton) {
      cerrarSidebar();
    }
  });

  // 4. Cerrar al seleccionar una opción del menú en pantallas pequeñas
  sidebar.querySelectorAll(".sidebar-link").forEach((enlace) => {
    enlace.addEventListener("click", () => {
      if (esPantallaPequena()) {
        cerrarSidebar();
      }
    });
  });

  // Accesibilidad: cerrar con tecla Escape
  document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape") {
      cerrarSidebar();
    }
  });

  // Sincronizar estado si el usuario redimensiona a escritorio
  window.addEventListener("resize", () => {
    if (!esPantallaPequena()) {
      cerrarSidebar();
    }
  });
}

// Notificación toast reutilizable (reemplaza alert() nativos)
function mostrarToastDashboard(mensaje, tipo = "success") {
  const contenedor = document.getElementById("toast-container");
  if (!contenedor) return;

  const toast = document.createElement("div");
  toast.className = `toast toast--${tipo}`;
  toast.textContent = mensaje;
  contenedor.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3200);
}

document.addEventListener("DOMContentLoaded", () => {
  inicializarMenuDashboard();
});

 