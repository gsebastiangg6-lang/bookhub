/**
 * BOOKHUB — Aplicación Administrativa Completa (Fase 5)
 * Funciones clave:
 * - cargarLibros(), guardarLibros(), renderizarLibros(lista), filtrarLibros()
 * - abrirModal(id), guardarLibro(evento), eliminarLibro(id)
 * - actualizarKPIs(), actualizarGrafico()
 */

const STORAGE_KEY = "bookhub_libros_v1";

const CATEGORIAS_OFICIALES = [
  "Literatura",
  "Ciencia y tecnología",
  "Educación",
  "Historia",
  "Infantil y juvenil",
  "Desarrollo personal"
];

let libros = [];
let libroIdAEliminar = null;
let graficoCategorias = null;

// Referencias del DOM
const catalogoGrid = document.getElementById("catalogo-grid");
const estadoVacio = document.getElementById("estado-vacio");
const contadorResultados = document.getElementById("contador-resultados");

const kpiTotalLibros = document.getElementById("kpi-total-libros");
const kpiInventarioBajo = document.getElementById("kpi-inventario-bajo");
const kpiValorInventario = document.getElementById("kpi-valor-inventario");

const filtroBusqueda = document.getElementById("filtro-busqueda");
const filtroCategoria = document.getElementById("filtro-categoria");
const filtroEditorial = document.getElementById("filtro-editorial");
const filtroEstado = document.getElementById("filtro-estado");
const btnLimpiarFiltros = document.getElementById("btn-limpiar-filtros");
const btnEmptyLimpiar = document.getElementById("btn-empty-limpiar");
const enlaceAlertasStock = document.getElementById("enlace-alertas-stock");

const btnAgregarLibro = document.getElementById("btn-agregar-libro");
const modalLibro = document.getElementById("modal-libro");
const modalLibroTitulo = document.getElementById("modal-libro-titulo");
const btnCerrarModal = document.getElementById("btn-cerrar-modal");
const btnCancelarModal = document.getElementById("btn-cancelar-modal");
const formLibro = document.getElementById("form-libro");

const modalConfirmar = document.getElementById("modal-confirmar");
const confirmarMensaje = document.getElementById("confirmar-mensaje");
const btnCerrarConfirmar = document.getElementById("btn-cerrar-confirmar");
const btnCancelarEliminar = document.getElementById("btn-cancelar-eliminar");
const btnConfirmarEliminar = document.getElementById("btn-confirmar-eliminar");

// =========================================================
// UTILIDADES DE NEGOCIO Y UI
// =========================================================

function calcularEstado(libro) {
  if (libro.stock === 0) return "Agotado";
  if (libro.stock <= libro.stockMinimo) return "Stock bajo";
  return "Disponible";
}

function obtenerClaseBadge(estado) {
  if (estado === "Agotado") return "status-agotado";
  if (estado === "Stock bajo") return "status-bajo";
  return "status-disponible";
}

function formatearCOP(valor) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
  }).format(valor);
}

function escaparHTML(texto) {
  return String(texto)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function mostrarToast(mensaje, tipo = "success") {
  const contenedor = document.getElementById("toast-container");
  if (!contenedor) return;

  const toast = document.createElement("div");
  toast.className = `toast toast--${tipo}`;
  toast.textContent = mensaje;
  contenedor.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3500);
}

function generarSiguienteCodigo() {
  const numeros = libros
    .map((l) => Number.parseInt(String(l.codigo).replace("LIB", ""), 10))
    .filter((n) => Number.isInteger(n));
  const maxNum = numeros.length > 0 ? Math.max(...numeros) : 0;
  return `LIB${String(maxNum + 1).padStart(3, "0")}`;
}

function poblarSelectEditoriales() {
  if (!filtroEditorial) return;
  const seleccionActual = filtroEditorial.value;
  const editoriales = [...new Set(libros.map((l) => l.editorial))].sort((a, b) =>
    a.localeCompare(b, "es")
  );

  filtroEditorial.innerHTML = '<option value="">Todas las editoriales</option>';
  editoriales.forEach((editorial) => {
    const opcion = document.createElement("option");
    opcion.value = editorial;
    opcion.textContent = editorial;
    filtroEditorial.appendChild(opcion);
  });

  if (editoriales.includes(seleccionActual)) {
    filtroEditorial.value = seleccionActual;
  }
}

// =========================================================
// 1. PERSISTENCIA: cargarLibros() y guardarLibros()
// =========================================================

function guardarLibros() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(libros));
}

async function cargarLibros() {
  try {
    const datosGuardados = localStorage.getItem(STORAGE_KEY);

    if (datosGuardados) {
      const parsed = JSON.parse(datosGuardados);
      if (Array.isArray(parsed)) {
        libros = parsed;
      }
    }

    if (!datosGuardados) {
      const respuesta = await fetch("libros.json");
      if (!respuesta.ok) {
        throw new Error(`No se pudo cargar libros.json (HTTP ${respuesta.status})`);
      }
      const dataset = await respuesta.json();

      if (typeof validarLibros === "function") {
        const errores = validarLibros(dataset);
        if (errores.length > 0) {
          console.warn("Advertencias en dataset inicial:", errores);
        }
      }

      libros = dataset;
      guardarLibros();
    }

    poblarSelectEditoriales();
    filtrarLibros();
    actualizarKPIs();
    actualizarGrafico();
  } catch (error) {
    console.error("Error al cargar el catálogo:", error);
    mostrarToast(
      "No se pudo cargar libros.json. Asegúrate de ejecutar con Live Server.",
      "error"
    );
  }
}

// =========================================================
// 2. RENDERIZADO DINÁMICO: renderizarLibros(lista)
// =========================================================

function renderizarLibros(lista) {
  if (!catalogoGrid || !estadoVacio || !contadorResultados) return;

  contadorResultados.textContent = `Mostrando ${lista.length} de ${libros.length} títulos`;

  if (lista.length === 0) {
    catalogoGrid.innerHTML = "";
    estadoVacio.hidden = false;
    return;
  }

  estadoVacio.hidden = true;

  catalogoGrid.innerHTML = lista
    .map((libro) => {
      const estado = calcularEstado(libro);
      const claseBadge = obtenerClaseBadge(estado);

      return `
        <article class="catalog-card" data-id="${libro.id}">
          <div class="catalog-card-top">
            <span class="catalog-code">${escaparHTML(libro.codigo)}</span>
            <span class="status-badge ${claseBadge}">${estado}</span>
          </div>

          <div>
            <h3 class="catalog-card-title">${escaparHTML(libro.titulo)}</h3>
            <p class="catalog-card-subtitle">
              ${escaparHTML(libro.categoria)} &bull; ${libro.anioPublicacion}
            </p>
          </div>

          <dl class="catalog-details">
            <div class="catalog-detail-row">
              <dt>Autor</dt>
              <dd>${escaparHTML(libro.autor)}</dd>
            </div>
            <div class="catalog-detail-row">
              <dt>Editorial</dt>
              <dd>${escaparHTML(libro.editorial)}</dd>
            </div>
            <div class="catalog-detail-row">
              <dt>ISBN</dt>
              <dd>${escaparHTML(libro.isbn)}</dd>
            </div>
            <div class="catalog-detail-row">
              <dt>Stock</dt>
              <dd>${libro.stock} uds. (mín. ${libro.stockMinimo})</dd>
            </div>
          </dl>

          <div class="catalog-card-footer">
            <span class="catalog-price">
              ${formatearCOP(libro.precio)} <small>COP</small>
            </span>
            <div class="catalog-actions">
              <button
                type="button"
                class="action-btn action-edit"
                data-action="editar"
                data-id="${libro.id}"
                aria-label="Editar ${escaparHTML(libro.titulo)}"
              >
                Editar
              </button>
              <button
                type="button"
                class="action-btn action-delete"
                data-action="eliminar"
                data-id="${libro.id}"
                aria-label="Eliminar ${escaparHTML(libro.titulo)}"
              >
                Eliminar
              </button>
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

// =========================================================
// 3. BÚSQUEDA Y FILTROS COMBINABLES: filtrarLibros()
// =========================================================

function filtrarLibros() {
  const termino = (filtroBusqueda?.value || "").trim().toLowerCase();
  const categoria = filtroCategoria?.value || "";
  const editorial = filtroEditorial?.value || "";
  const estado = filtroEstado?.value || "";

  const filtrados = libros.filter((libro) => {
    const coincideTexto =
      !termino ||
      libro.titulo.toLowerCase().includes(termino) ||
      libro.autor.toLowerCase().includes(termino) ||
      libro.editorial.toLowerCase().includes(termino) ||
      libro.isbn.toLowerCase().includes(termino);

    const coincideCategoria = !categoria || libro.categoria === categoria;
    const coincideEditorial = !editorial || libro.editorial === editorial;
    const coincideEstado = !estado || calcularEstado(libro) === estado;

    return coincideTexto && coincideCategoria && coincideEditorial && coincideEstado;
  });

  renderizarLibros(filtrados);
}

function limpiarFiltros() {
  if (filtroBusqueda) filtroBusqueda.value = "";
  if (filtroCategoria) filtroCategoria.value = "";
  if (filtroEditorial) filtroEditorial.value = "";
  if (filtroEstado) filtroEstado.value = "";
  filtrarLibros();
}

// =========================================================
// 4. CRUD: abrirModal(), guardarLibro(), eliminarLibro()
// =========================================================

function limpiarErroresFormulario() {
  formLibro?.querySelectorAll(".form-error").forEach((el) => {
    el.textContent = "";
  });
  formLibro?.querySelectorAll(".form-input").forEach((el) => {
    el.classList.remove("is-invalid");
  });
}

function marcarErrorCampo(inputId, errorId, mensaje) {
  const input = document.getElementById(inputId);
  const span = document.getElementById(errorId);
  if (input) input.classList.add("is-invalid");
  if (span) span.textContent = mensaje;
}

function abrirModal(id = null) {
  if (!modalLibro || !formLibro) return;

  limpiarErroresFormulario();
  formLibro.reset();

  if (id !== null) {
    const libro = libros.find((item) => item.id === id);
    if (!libro) return;

    modalLibroTitulo.textContent = "Editar libro";
    document.getElementById("libro-id").value = libro.id;
    document.getElementById("libro-codigo").value = libro.codigo;
    document.getElementById("libro-titulo").value = libro.titulo;
    document.getElementById("libro-categoria").value = libro.categoria;
    document.getElementById("libro-autor").value = libro.autor;
    document.getElementById("libro-editorial").value = libro.editorial;
    document.getElementById("libro-isbn").value = libro.isbn;
    document.getElementById("libro-anio").value = libro.anioPublicacion;
    document.getElementById("libro-precio").value = libro.precio;
    document.getElementById("libro-stock").value = libro.stock;
    document.getElementById("libro-stock-minimo").value = libro.stockMinimo;
    document.getElementById("libro-activo").checked = Boolean(libro.activo);
  } else {
    modalLibroTitulo.textContent = "Agregar nuevo libro";
    document.getElementById("libro-id").value = "";
    document.getElementById("libro-codigo").value = generarSiguienteCodigo();
    document.getElementById("libro-activo").checked = true;
  }

  modalLibro.hidden = false;
  document.body.style.overflow = "hidden";
  document.getElementById("libro-titulo")?.focus();
}

function cerrarModalLibro() {
  if (!modalLibro) return;
  modalLibro.hidden = true;
  document.body.style.overflow = "";
}

function abrirModalConfirmar(id) {
  const libro = libros.find((item) => item.id === id);
  if (!libro || !modalConfirmar) return;

  libroIdAEliminar = id;
  confirmarMensaje.textContent = `¿Seguro que deseas eliminar "${libro.titulo}" (${libro.codigo}) del catálogo? Esta acción actualizará el inventario y las estadísticas.`;
  modalConfirmar.hidden = false;
  document.body.style.overflow = "hidden";
}

function cerrarModalConfirmar() {
  if (!modalConfirmar) return;
  modalConfirmar.hidden = true;
  libroIdAEliminar = null;
  document.body.style.overflow = "";
}

function guardarLibro(evento) {
  evento.preventDefault();
  limpiarErroresFormulario();

  const idTexto = document.getElementById("libro-id").value;
  const idEditando = idTexto ? Number.parseInt(idTexto, 10) : null;

  const codigo = document.getElementById("libro-codigo").value.trim().toUpperCase();
  const titulo = document.getElementById("libro-titulo").value.trim();
  const categoria = document.getElementById("libro-categoria").value;
  const autor = document.getElementById("libro-autor").value.trim();
  const editorial = document.getElementById("libro-editorial").value.trim();
  const isbn = document.getElementById("libro-isbn").value.trim();
  const anioPublicacion = Number(document.getElementById("libro-anio").value);
  const precio = Number(document.getElementById("libro-precio").value);
  const stock = Number(document.getElementById("libro-stock").value);
  const stockMinimo = Number(document.getElementById("libro-stock-minimo").value);
  const activo = document.getElementById("libro-activo").checked;

  let esValido = true;

  if (!/^LIB\d{3}$/.test(codigo)) {
    marcarErrorCampo("libro-codigo", "err-codigo", "Usa el formato LIB seguido de 3 dígitos (ej. LIB036).");
    esValido = false;
  } else if (libros.some((l) => l.codigo === codigo && l.id !== idEditando)) {
    marcarErrorCampo("libro-codigo", "err-codigo", "Este código ya está registrado.");
    esValido = false;
  }

  if (titulo.length < 3 || titulo.length > 120) {
    marcarErrorCampo("libro-titulo", "err-titulo", "Debe tener entre 3 y 120 caracteres.");
    esValido = false;
  }

  if (!CATEGORIAS_OFICIALES.includes(categoria)) {
    marcarErrorCampo("libro-categoria", "err-categoria", "Selecciona una categoría válida.");
    esValido = false;
  }

  if (autor.length < 3 || autor.length > 80) {
    marcarErrorCampo("libro-autor", "err-autor", "Debe tener entre 3 y 80 caracteres.");
    esValido = false;
  }

  if (editorial.length < 3 || editorial.length > 80) {
    marcarErrorCampo("libro-editorial", "err-editorial", "Debe tener entre 3 y 80 caracteres.");
    esValido = false;
  }

  if (!/^\d{13}$/.test(isbn)) {
    marcarErrorCampo("libro-isbn", "err-isbn", "El ISBN debe tener exactamente 13 dígitos numéricos.");
    esValido = false;
  } else if (libros.some((l) => l.isbn === isbn && l.id !== idEditando)) {
    marcarErrorCampo("libro-isbn", "err-isbn", "Este ISBN ya existe en el catálogo.");
    esValido = false;
  }

  if (!Number.isInteger(anioPublicacion) || anioPublicacion < 1450 || anioPublicacion > 2026) {
    marcarErrorCampo("libro-anio", "err-anio", "Ingresa un año entero entre 1450 y 2026.");
    esValido = false;
  }

  if (!Number.isInteger(precio) || precio <= 0) {
    marcarErrorCampo("libro-precio", "err-precio", "Ingresa un precio entero positivo en COP.");
    esValido = false;
  }

  if (!Number.isInteger(stock) || stock < 0) {
    marcarErrorCampo("libro-stock", "err-stock", "El stock debe ser un entero mayor o igual a 0.");
    esValido = false;
  }

  if (!Number.isInteger(stockMinimo) || stockMinimo < 0) {
    marcarErrorCampo("libro-stock-minimo", "err-stockMinimo", "Debe ser un entero mayor o igual a 0.");
    esValido = false;
  }

  if (!esValido) {
    mostrarToast("Revisa los campos marcados antes de guardar.", "error");
    return;
  }

  if (idEditando !== null) {
    libros = libros.map((libro) =>
      libro.id === idEditando
        ? {
            id: idEditando,
            codigo,
            titulo,
            categoria,
            precio,
            stock,
            stockMinimo,
            autor,
            editorial,
            isbn,
            anioPublicacion,
            activo
          }
        : libro
    );
    mostrarToast(`"${titulo}" se actualizó correctamente.`, "success");
  } else {
    const nuevoId = libros.length > 0 ? Math.max(...libros.map((l) => l.id)) + 1 : 1;
    libros.unshift({
      id: nuevoId,
      codigo,
      titulo,
      categoria,
      precio,
      stock,
      stockMinimo,
      autor,
      editorial,
      isbn,
      anioPublicacion,
      activo
    });
    mostrarToast(`"${titulo}" se agregó al catálogo.`, "success");
  }

  guardarLibros();
  poblarSelectEditoriales();
  filtrarLibros();
  actualizarKPIs();
  actualizarGrafico();
  cerrarModalLibro();
}

function eliminarLibro(id) {
  const libro = libros.find((item) => item.id === id);
  if (!libro) return;

  libros = libros.filter((item) => item.id !== id);
  guardarLibros();
  poblarSelectEditoriales();
  filtrarLibros();
  actualizarKPIs();
  actualizarGrafico();
  cerrarModalConfirmar();
  mostrarToast(`"${libro.titulo}" fue eliminado del catálogo.`, "success");
}

// =========================================================
// 5. KPIs Y GRÁFICO ESTADÍSTICO (CHART.JS)
// =========================================================

function actualizarKPIs() {
  const totalActivos = libros.filter((libro) => libro.activo).length;
  const inventarioBajo = libros.filter((libro) => libro.stock <= libro.stockMinimo).length;
  const valorTotal = libros.reduce((acum, libro) => acum + libro.precio * libro.stock, 0);

  if (kpiTotalLibros) kpiTotalLibros.textContent = String(totalActivos);
  if (kpiInventarioBajo) kpiInventarioBajo.textContent = String(inventarioBajo);
  if (kpiValorInventario) {
    kpiValorInventario.innerHTML = `${formatearCOP(valorTotal)} <small>COP</small>`;
  }
}

function actualizarGrafico() {
  const canvas = document.getElementById("grafico-categorias");
  if (!canvas || typeof Chart === "undefined") return;

  const conteos = CATEGORIAS_OFICIALES.map(
    (categoria) => libros.filter((libro) => libro.categoria === categoria).length
  );

  if (graficoCategorias) {
    graficoCategorias.data.datasets[0].data = conteos;
    graficoCategorias.update();
    return;
  }

  graficoCategorias = new Chart(canvas, {
    type: "bar",
    data: {
      labels: CATEGORIAS_OFICIALES,
      datasets: [
        {
          label: "Cantidad de libros",
          data: conteos,
          backgroundColor: [
            "#1B3B2B",
            "#2E5A44",
            "#B44C2E",
            "#C87D55",
            "#4C7360",
            "#8C3B24"
          ],
          borderRadius: 6,
          maxBarThickness: 56
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#1B3B2B",
          titleFont: { family: "Plus Jakarta Sans" },
          bodyFont: { family: "Plus Jakarta Sans" }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1, precision: 0, color: "#525C57" },
          grid: { color: "#E2DCD0" }
        },
        x: {
          ticks: { color: "#1E2421", font: { size: 12, weight: "600" } },
          grid: { display: false }
        }
      }
    }
  });
}

// =========================================================
// EVENTOS E INICIALIZACIÓN
// =========================================================

document.addEventListener("DOMContentLoaded", () => {
  // Filtros en tiempo real
  filtroBusqueda?.addEventListener("input", filtrarLibros);
  filtroCategoria?.addEventListener("change", filtrarLibros);
  filtroEditorial?.addEventListener("change", filtrarLibros);
  filtroEstado?.addEventListener("change", filtrarLibros);
  btnLimpiarFiltros?.addEventListener("click", limpiarFiltros);
  btnEmptyLimpiar?.addEventListener("click", limpiarFiltros);

  // Acceso rápido del sidebar a alertas de stock
  enlaceAlertasStock?.addEventListener("click", () => {
    if (filtroEstado) {
      filtroEstado.value = "Stock bajo";
      filtrarLibros();
    }
  });

  // Botón agregar y delegación de eventos en las cards (Editar / Eliminar)
  btnAgregarLibro?.addEventListener("click", () => abrirModal(null));

  catalogoGrid?.addEventListener("click", (evento) => {
    const boton = evento.target.closest("[data-action]");
    if (!boton) return;

    const id = Number.parseInt(boton.dataset.id, 10);
    if (boton.dataset.action === "editar") {
      abrirModal(id);
    } else if (boton.dataset.action === "eliminar") {
      abrirModalConfirmar(id);
    }
  });

  // Envío del formulario CRUD
  formLibro?.addEventListener("submit", guardarLibro);

  // Cierre de modales (botón, clic fuera y tecla Escape)
  btnCerrarModal?.addEventListener("click", cerrarModalLibro);
  btnCancelarModal?.addEventListener("click", cerrarModalLibro);
  modalLibro?.addEventListener("click", (evento) => {
    if (evento.target === modalLibro) cerrarModalLibro();
  });

  btnCerrarConfirmar?.addEventListener("click", cerrarModalConfirmar);
  btnCancelarEliminar?.addEventListener("click", cerrarModalConfirmar);
  btnConfirmarEliminar?.addEventListener("click", () => {
    if (libroIdAEliminar !== null) {
      eliminarLibro(libroIdAEliminar);
    }
  });
  modalConfirmar?.addEventListener("click", (evento) => {
    if (evento.target === modalConfirmar) cerrarModalConfirmar();
  });

  document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape") {
      if (modalLibro && !modalLibro.hidden) cerrarModalLibro();
      if (modalConfirmar && !modalConfirmar.hidden) cerrarModalConfirmar();
    }
  });

  // Carga inicial del catálogo
  cargarLibros();
});