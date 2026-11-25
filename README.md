# BookHub — Plataforma Editorial y Panel de Inventario

**BookHub** es una plataforma web responsiva para una librería digital colombiana, compuesta por una **Landing Page editorial** (`index.html`) y un **Dashboard Administrativo** (`dashboard.html`) con operaciones CRUD completas, filtros combinables en tiempo real, persistencia en `localStorage` y analítica visual con Chart.js.

El proyecto fue construido con **HTML5 semántico, CSS3 moderno (Mobile-First) y JavaScript Vanilla**, priorizando accesibilidad (WCAG AA), rendimiento y coherencia visual sin depender de frameworks externos de CSS o JS.

---

## Características principales

### Landing Page (`index.html`)
* **Identidad visual editorial:** Paleta basada en Verde Bosque (`#1B3B2B`), Crema Papel (`#F7F4EE`) y Terracota (`#B44C2E`), con tipografía **Playfair Display** y **Plus Jakarta Sans**.
* **Navegación accesible y responsiva:** Menú móvil interactivo, enlace de salto (*skip-link*) y navegación directa hacia el panel administrativo.
* **Suscripción interactiva:** Formulario del Club Lector con validación y notificaciones *toast* no intrusivas.

### Dashboard Administrativo (`dashboard.html`)
* **CRUD completo:** Creación, lectura, edición y eliminación de libros mediante modales accesibles (cierre con botón, clic externo y tecla `Escape`), sin uso de `alert()` ni `confirm()` nativos.
* **Búsqueda y filtros combinables:** Búsqueda instantánea por título, autor, editorial o ISBN, combinable con filtros por **Categoría**, **Editorial** y **Estado** (*Disponible*, *Stock bajo*, *Agotado*), más botón de limpieza y estado vacío (*empty state*).
* **Indicadores clave (KPIs) en tiempo real:** Cálculo automático de *Libros registrados*, *Inventario bajo* y *Valor total del inventario en COP*.
* **Visualización de datos:** Gráfico de barras dinámico con **Chart.js** que muestra la distribución de títulos por categoría y se actualiza con cada operación CRUD.
* **Persistencia local:** Carga inicial desde `libros.json` (35 títulos) y sincronización automática en `localStorage` (`bookhub_libros_v1`).

---

## Arquitectura del proyecto

```text
bookhub/
├── index.html          # Landing Page editorial
├── styles.css          # Variables :root, diseño base y estilos de la Landing
├── landing.js          # Interactividad de la Landing (menú móvil y toasts)
├── dashboard.html      # Panel administrativo (KPIs, filtros, catálogo, modales y gráfico)
├── dashboard.css       # Estilos específicos del Dashboard (reutiliza :root)
├── menu-dashboard.js   # Controlador accesible del sidebar hamburguesa (0.3s)
├── app.js              # Lógica principal: CRUD, filtros, localStorage, KPIs y Chart.js
├── libros.json         # Dataset de 35 libros en formato JSON válido
├── validacion.js       # Auditoría programática de los 12 campos obligatorios
└── README.md           # Documentación del proyecto