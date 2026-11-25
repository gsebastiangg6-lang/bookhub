document.addEventListener("DOMContentLoaded", () => {
  const menuToggle = document.getElementById("landing-menu-toggle");
  const mainNav = document.getElementById("landing-nav");
  const toggleIcon = menuToggle?.querySelector(".menu-toggle-icon");
  const formSuscripcion = document.getElementById("form-suscripcion");
  const toastContainer = document.getElementById("toast-container");

  function mostrarToast(mensaje, tipo = "success") {
    if (!toastContainer) return;
    const toast = document.createElement("div");
    toast.className = `toast toast--${tipo}`;
    toast.textContent = mensaje;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3600);
  }

  function cerrarMenu() {
    if (!mainNav || !menuToggle || !toggleIcon) return;
    mainNav.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Abrir menú de navegación");
    toggleIcon.textContent = "=";
  }

  if (menuToggle && mainNav && toggleIcon) {
    menuToggle.addEventListener("click", () => {
      const estaAbierto = mainNav.classList.toggle("is-open");
      menuToggle.setAttribute("aria-expanded", String(estaAbierto));
      menuToggle.setAttribute(
        "aria-label",
        estaAbierto ? "Cerrar menú de navegación" : "Abrir menú de navegación"
      );
      toggleIcon.textContent = estaAbierto ? "x" : "=";
    });

    mainNav.querySelectorAll("a").forEach((enlace) => {
      enlace.addEventListener("click", cerrarMenu);
    });

    document.addEventListener("click", (evento) => {
      const clicDentro =
        mainNav.contains(evento.target) || menuToggle.contains(evento.target);
      if (!clicDentro && mainNav.classList.contains("is-open")) {
        cerrarMenu();
      }
    });
  }

  if (formSuscripcion) {
    const inputNombre = document.getElementById("suscriptor-nombre");
    const inputCorreo = document.getElementById("suscriptor-correo");
    const errorNombre = document.getElementById("error-nombre");
    const errorCorreo = document.getElementById("error-correo");
    const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    function validarCampo(input, spanError, condicion, mensajeError) {
      if (!condicion) {
        input.classList.add("is-invalid");
        input.classList.remove("is-valid");
        spanError.textContent = mensajeError;
        return false;
      }
      input.classList.remove("is-invalid");
      input.classList.add("is-valid");
      spanError.textContent = "";
      return true;
    }

    formSuscripcion.addEventListener("submit", (evento) => {
      evento.preventDefault();

      const nombreValido = validarCampo(
        inputNombre,
        errorNombre,
        inputNombre.value.trim().length >= 3,
        "Ingresa tu nombre completo (mínimo 3 caracteres)."
      );

      const correoValido = validarCampo(
        inputCorreo,
        errorCorreo,
        regexCorreo.test(inputCorreo.value.trim()),
        "Ingresa un correo electrónico válido."
      );

      if (!nombreValido || !correoValido) {
        mostrarToast("Revisa los campos marcados antes de suscribirte.", "error");
        return;
      }

      mostrarToast(
        `¡Bienvenido/a al Club BookHub, ${inputNombre.value.trim()}!`,
        "success"
      );
      formSuscripcion.reset();
      inputNombre.classList.remove("is-valid");
      inputCorreo.classList.remove("is-valid");
    });
  }
});