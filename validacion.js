/**
 * BOOKHUB — Validador programático del dataset de libros
 * Audita los 12 campos obligatorios, tipos, rangos y unicidad de ID, código e ISBN.
 */

const CATEGORIAS_VALIDAS = [
  "Literatura",
  "Ciencia y tecnología",
  "Educación",
  "Historia",
  "Infantil y juvenil",
  "Desarrollo personal"
];

const REGEX_CODIGO = /^LIB\d{3}$/;
const REGEX_ISBN13 = /^\d{13}$/;
const ANIO_MINIMO = 1450;
const ANIO_MAXIMO = 2026;

/**
 * Valida un arreglo de libros y devuelve un reporte estructurado de errores.
 * @param {Array<Object>} lista - Arreglo de objetos libro.
 * @returns {Array<{indice: number, id: *, campo: string, problema: string}>}
 */
function validarLibros(lista) {
  const errores = [];

  if (!Array.isArray(lista)) {
    errores.push({
      indice: -1,
      id: "N/A",
      campo: "dataset",
      problema: "El dataset debe ser un arreglo JSON válido."
    });
    return errores;
  }

  const idsVistos = new Set();
  const codigosVistos = new Set();
  const isbnsVistos = new Set();

  const registrarError = (indice, id, campo, problema) => {
    errores.push({
      indice,
      id: id ?? "Sin ID",
      campo,
      problema
    });
  };

  lista.forEach((libro, indice) => {
    if (!libro || typeof libro !== "object" || Array.isArray(libro)) {
      registrarError(indice, "N/A", "registro", "El elemento no es un objeto válido.");
      return;
    }

    const idRef = libro.id;

    // 1. id: entero, mayor que 0 y único
    if (!Number.isInteger(libro.id) || libro.id <= 0) {
      registrarError(indice, idRef, "id", "Debe ser un número entero mayor que 0.");
    } else if (idsVistos.has(libro.id)) {
      registrarError(indice, idRef, "id", `ID duplicado: ${libro.id}.`);
    } else {
      idsVistos.add(libro.id);
    }

    // 2. codigo: texto con patrón LIB + 3 dígitos y único
    if (typeof libro.codigo !== "string" || !REGEX_CODIGO.test(libro.codigo)) {
      registrarError(
        indice,
        idRef,
        "codigo",
        `Formato inválido ("${libro.codigo}"). Debe seguir el patrón LIB seguido de 3 dígitos (ej. LIB001).`
      );
    } else if (codigosVistos.has(libro.codigo)) {
      registrarError(indice, idRef, "codigo", `Código duplicado: ${libro.codigo}.`);
    } else {
      codigosVistos.add(libro.codigo);
    }

    // 3. titulo: texto de 3 a 120 caracteres
    if (
      typeof libro.titulo !== "string" ||
      libro.titulo.trim().length < 3 ||
      libro.titulo.trim().length > 120
    ) {
      registrarError(
        indice,
        idRef,
        "titulo",
        "Debe ser un texto no vacío entre 3 y 120 caracteres."
      );
    }

    // 4. categoria: incluida en la lista oficial
    if (typeof libro.categoria !== "string" || !CATEGORIAS_VALIDAS.includes(libro.categoria)) {
      registrarError(
        indice,
        idRef,
        "categoria",
        `Categoría no permitida ("${libro.categoria}").`
      );
    }

    // 5. precio: entero positivo en COP
    if (!Number.isInteger(libro.precio) || libro.precio <= 0) {
      registrarError(
        indice,
        idRef,
        "precio",
        `Precio inválido (${libro.precio}). Debe ser un entero positivo en COP.`
      );
    }

    // 6. stock: entero mayor o igual a 0
    if (!Number.isInteger(libro.stock) || libro.stock < 0) {
      registrarError(
        indice,
        idRef,
        "stock",
        `Stock inválido (${libro.stock}). Debe ser un entero mayor o igual a 0.`
      );
    }

    // 7. stockMinimo: entero mayor o igual a 0
    if (!Number.isInteger(libro.stockMinimo) || libro.stockMinimo < 0) {
      registrarError(
        indice,
        idRef,
        "stockMinimo",
        `Stock mínimo inválido (${libro.stockMinimo}). Debe ser un entero mayor o igual a 0.`
      );
    }

    // 8. autor: texto de 3 a 80 caracteres
    if (
      typeof libro.autor !== "string" ||
      libro.autor.trim().length < 3 ||
      libro.autor.trim().length > 80
    ) {
      registrarError(
        indice,
        idRef,
        "autor",
        "Debe ser un texto no vacío entre 3 y 80 caracteres."
      );
    }

    // 9. editorial: texto de 3 a 80 caracteres
    if (
      typeof libro.editorial !== "string" ||
      libro.editorial.trim().length < 3 ||
      libro.editorial.trim().length > 80
    ) {
      registrarError(
        indice,
        idRef,
        "editorial",
        "Debe ser un texto no vacío entre 3 y 80 caracteres."
      );
    }

    // 10. isbn: cadena de 13 dígitos numéricos y única (valida formato/unicidad en datos reales o simulados)
    if (typeof libro.isbn !== "string" || !REGEX_ISBN13.test(libro.isbn)) {
      registrarError(
        indice,
        idRef,
        "isbn",
        `ISBN inválido ("${libro.isbn}"). Debe contener exactamente 13 dígitos numéricos.`
      );
    } else if (isbnsVistos.has(libro.isbn)) {
      registrarError(indice, idRef, "isbn", `ISBN duplicado: ${libro.isbn}.`);
    } else {
      isbnsVistos.add(libro.isbn);
    }

    // 11. anioPublicacion: entero entre 1450 y 2026
    if (
      !Number.isInteger(libro.anioPublicacion) ||
      libro.anioPublicacion < ANIO_MINIMO ||
      libro.anioPublicacion > ANIO_MAXIMO
    ) {
      registrarError(
        indice,
        idRef,
        "anioPublicacion",
        `Año fuera de rango (${libro.anioPublicacion}). Debe ser un entero entre ${ANIO_MINIMO} y ${ANIO_MAXIMO}.`
      );
    }

    // 12. activo: booleano estricto
    if (typeof libro.activo !== "boolean") {
      registrarError(
        indice,
        idRef,
        "activo",
        `Tipo inválido (${typeof libro.activo}). Debe ser booleano (true o false).`
      );
    }
  });

  return errores;
}

// Ejecución automática si se corre desde Node.js: `node validacion.js`
if (typeof module !== "undefined" && module.exports) {
  module.exports = { validarLibros, CATEGORIAS_VALIDAS };

  if (require.main === module) {
    const fs = require("fs");
    const path = require("path");
    const rutaDataset = path.join(__dirname, "libros.json");

    try {
      const contenido = fs.readFileSync(rutaDataset, "utf-8");
      const libros = JSON.parse(contenido);
      const reporte = validarLibros(libros);

      console.log(`=== AUDITORÍA BOOKHUB (${libros.length} registros) ===`);
      if (reporte.length === 0) {
        console.log("✅ Dataset aprobado: 0 errores encontrados.");
      } else {
        console.log(`❌ Se encontraron ${reporte.length} error(es):`);
        console.table(reporte);
      }
    } catch (error) {
      console.error("Error al leer o parsear libros.json:", error.message);
    }
  }
}