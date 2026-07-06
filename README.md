# ResponSable — Templates de páginas de servicio

Sitio de páginas de servicio en **HTML puro** (sin frameworks) para ResponSable.
Cada servicio es una página estática que se sube por FTP a GoDaddy y **convive con el sitio de WordPress** en `https://responsable.net`.

> ⚠️ Importante: aquí **no hay página de inicio**. La home real vive en WordPress.
> Este proyecto solo contiene las páginas de servicio que reemplazan/espejan URLs concretas de producción.

---

## 1. Estructura del proyecto

```
web/
├── README.md                         ← este archivo
├── css/
│   └── styles.css                    ← estilos globales de marca (se reutiliza en todos los servicios)
├── js/
│   └── main.js                       ← interacciones: menú móvil + acordeón de FAQ
├── assets/
│   └── img/
│       └── intro-doble-materialidad.svg   ← imágenes (una por servicio, o compartidas)
└── servicio/
    └── estudio-doble-materialidad/
        └── index.html                ← el template de servicio (página completa)
```

**Regla de oro de las carpetas:** cada servicio vive en su propia subcarpeta dentro de `servicio/`
y el archivo **siempre se llama `index.html`**. Así la URL queda limpia, sin `.html`:

```
servicio/estudio-doble-materialidad/index.html   →   /servicio/estudio-doble-materialidad/
```

| Carpeta        | Qué contiene                                                        |
| -------------- | ------------------------------------------------------------------- |
| `servicio/`    | Una subcarpeta por cada página de servicio. Es lo único que crece.  |
| `css/`         | Un solo archivo de estilos, compartido por todos los servicios.     |
| `js/`          | Un solo archivo de JavaScript, compartido por todos los servicios.  |
| `assets/img/`  | Imágenes e ilustraciones.                                           |

---

## 2. Cómo agregar un servicio nuevo (paso a paso)

### Paso 1 — Crear la carpeta del servicio

Crea una carpeta dentro de `servicio/` con el **slug** del nuevo servicio:

```
servicio/<slug-del-servicio>/
```

Ejemplo: para "Distintivo ESR" cuya URL en producción es
`https://responsable.net/servicio/distintivo-esr/`, el slug es `distintivo-esr`:

```
servicio/distintivo-esr/
```

### Paso 2 — Copiar el template existente

Copia el archivo `servicio/estudio-doble-materialidad/index.html` dentro de la carpeta nueva,
manteniendo el nombre **`index.html`**:

```
servicio/distintivo-esr/index.html
```

### Paso 3 — Actualizar los campos OBLIGATORIOS

Abre el nuevo `index.html` y actualiza estos campos. Todos están marcados en el archivo
con comentarios `ZONA EDITABLE` y `<!-- EDITABLE: ... -->` para encontrarlos rápido.

**En el `<head>` (SEO / redes sociales):**

| Campo                | Dónde está                          | Qué poner                                                        |
| -------------------- | ----------------------------------- | ---------------------------------------------------------------- |
| **meta title**       | `<title>`                           | Título del servicio + `| ResponSable`                            |
| **meta description** | `<meta name="description">`         | Resumen del servicio (1–2 frases)                                |
| **canonical**        | `<link rel="canonical">`            | La URL EXACTA de producción (ver ⚠️ abajo)                        |
| **og:url**           | `<meta property="og:url">`          | La misma URL exacta de producción                                |
| **og:title**         | `<meta property="og:title">`        | Igual que el meta title                                          |
| **og:description**   | `<meta property="og:description">`  | Igual que la meta description                                    |

**Los 3 bloques de datos estructurados (JSON-LD), más abajo en el `<head>`:**

1. **Service** → actualiza `name`, `serviceType`, `description` y `url` (URL exacta de producción).
2. **BreadcrumbList** → actualiza el `name` y el `item` de la **posición 3** (URL exacta de producción).
3. **FAQPage** → actualiza cada pregunta y respuesta.
   👉 **Deben coincidir palabra por palabra con las preguntas visibles del acordeón** en el cuerpo de la página.

**En el cuerpo (copy):** actualiza el texto de hero, intro, temas materiales, proceso, FAQ,
CTA y servicios relacionados. Están marcados con comentarios `<!-- EDITABLE: ... -->`.

### Paso 4 — No tocar las rutas a recursos

Las rutas a CSS, JS e imágenes **suben dos niveles** (`../../`) porque el archivo está dentro de
`servicio/<slug>/`. Si copiaste el template tal cual, ya están bien. Verifica que sigan así:

```html
<link rel="stylesheet" href="../../css/styles.css" />
<script src="../../js/main.js" defer></script>
<img src="../../assets/img/mi-imagen.svg" ... />
```

### Paso 5 — Verificar el slug contra WordPress

El nombre de la carpeta (el slug) **debe coincidir EXACTAMENTE con la URL ya publicada en WordPress**:

- ✅ carpeta singular: `servicio/` (no `servicios/`)
- ✅ sin `.html` (el archivo se llama `index.html`, no `<slug>.html`)
- ✅ con diagonal final en la URL: `/servicio/<slug>/`

```
Carpeta:  servicio/estudio-doble-materialidad/index.html
URL real: https://responsable.net/servicio/estudio-doble-materialidad/
```

---

## 3. ⚠️ Advertencia de SEO — leer antes de publicar

**La URL final de cada página DEBE ser espejo exacto de la URL real de producción en WordPress.**

Si el slug, el singular/plural, el `.html` o la diagonal final no coinciden con la URL indexada
en Google, ocurren dos problemas graves:

1. **Se pierde el posicionamiento SEO** que esa página ya tiene ganado.
2. **Se genera contenido duplicado** (dos URLs con el mismo contenido), lo que penaliza en Google.

Antes de subir cualquier página:

- Confirma la URL real en Google o en WordPress.
- Asegúrate de que **canonical** y **og:url** apunten a esa URL exacta.
- Asegúrate de que la ruta de carpetas produzca esa misma URL.

Regla simple: **la URL que genera esta carpeta = la URL que ya está en Google.** Sin excepciones.

---

## 4. Levantar el sitio en local (preview)

Desde la raíz del proyecto (`web/`), ejecuta:

```bash
python3 -m http.server 8000
```

Luego abre en el navegador la URL del servicio que quieras revisar. Por ejemplo:

```
http://localhost:8000/servicio/estudio-doble-materialidad/
```

> La URL local reproduce la misma ruta limpia que producción (sin `.html`),
> porque el archivo se llama `index.html`. Para detener el servidor: `Ctrl + C`.

---

## 5. Pruebas del modal de contacto (Playwright)

En `tests/` hay una **prueba de humo** automatizada que valida el modal de contacto de una
página de servicio: apertura desde los 4 botones, validación de campos (obligatorios, email,
envío correcto → éxito), los 3 métodos de cierre (X, overlay, Escape), bloqueo de scroll del
fondo, layout responsive a 640px y retorno del foco. Además genera dos capturas
(`modal-desktop.png` y `modal-mobile.png`) para revisar el diseño.

### Cómo correrla

Necesita **dos terminales** (una sirve el sitio, otra corre la prueba):

```bash
# Terminal 1 — servir el sitio desde la raíz del proyecto
python3 -m http.server 8000

# Terminal 2 — instalar y ejecutar la prueba
cd tests
npm install        # instala Playwright + Chromium (solo la primera vez)
npm test
```

Al terminar imprime un resumen `X/Y comprobaciones PASARON` y deja las capturas en `tests/`.

### Probar otro servicio

El script está parametrizado. Para validar el modal de otra página de servicio, pásale su ruta:

```bash
SERVICE_PATH=/servicio/otro-servicio/ npm test
```

También puedes cambiar el servidor con `BASE` (por defecto `http://localhost:8000`).

### Cuando conectemos el backend real

El envío del formulario está **simulado** por ahora (ver el bloque marcado
`// TODO: CONEXIÓN REAL AL BACKEND` en `js/main.js`). Cuando se conecte el endpoint real,
esta misma prueba sirve para re-validar que el flujo sigue funcionando; puede que haya que
ajustar la parte del envío para contemplar la petición de red (por ejemplo, interceptándola).

> `node_modules/` y las capturas `.png` de `tests/` están en `.gitignore`, no se versionan.
