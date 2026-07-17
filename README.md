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
├── vercel.json                       ← config de la función serverless (solo para Vercel)
├── .env.example                      ← documenta las variables de entorno (sin valores reales)
├── api/
│   └── contacto.js                   ← función serverless: envía el formulario por Resend
├── css/
│   └── styles.css                    ← estilos globales de marca (se reutiliza en todos los servicios)
├── js/
│   └── main.js                       ← interacciones: menú móvil + acordeón de FAQ + envío del modal
├── assets/
│   └── img/
│       └── intro-doble-materialidad.svg   ← imágenes (una por servicio, o compartidas)
└── servicio/
    └── estudio-doble-materialidad/
        └── index.html                ← el template de servicio (página completa)
```

> ℹ️ El sitio estático (HTML/CSS/JS) se sube a **GoDaddy** por FTP como hasta ahora.
> La carpeta `api/` **no** va a GoDaddy: se despliega aparte en **Vercel** (ver sección 6),
> porque GoDaddy Managed WordPress no ejecuta funciones serverless.

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
página de servicio: apertura desde los 3 botones, validación de campos (obligatorios, email,
envío correcto → éxito, con el endpoint de Vercel interceptado), los métodos de cierre
(X y Escape), bloqueo de scroll del fondo, layout responsive a 640px y retorno del foco.
Además genera dos capturas
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

> `node_modules/` y las capturas `.png` de `tests/` están en `.gitignore`, no se versionan.

---

## 6. Formulario de contacto → Resend (función serverless en Vercel)

> ⚠️ **ESTADO ACTUAL (TEMPORAL): el modal envía por Web3Forms, no por Vercel.**
> Mientras no exista la cuenta de Vercel, `js/main.js` apunta a
> `https://api.web3forms.com/submit` y el formulario lleva 3 inputs hidden
> (`access_key`, `subject`, `from_name`). Todo lo de Vercel/Resend de abajo
> (`api/contacto.js`, `vercel.json`, `.env.example`) queda **intacto y listo**.
> Cómo revertir a Vercel: ver el comentario grande al inicio de `js/main.js`.
>
> Nota: Web3Forms (plan free) solo funciona **desde el navegador del visitante**;
> rechaza llamadas desde IPs de servidor. Por eso la prueba de entrega real se
> hace abriendo la página en un navegador normal (local o ya publicada), no por curl.

El plan definitivo: el modal de contacto envía las solicitudes por correo usando **Resend**.
Como GoDaddy Managed WordPress no ejecuta código de servidor, el envío pasa por una
**función serverless en Vercel** (`api/contacto.js`). Así la **API key de Resend nunca queda
en el cliente**.

**Flujo:** el visitante llena el modal en `responsable.net` → el JS hace `fetch` a la función
de Vercel → la función valida, revisa el honeypot anti-spam y llama a Resend → llega el correo
a la dirección configurada.

### 6.1 Piezas del sistema

| Archivo            | Rol                                                                          |
| ------------------ | ---------------------------------------------------------------------------- |
| `api/contacto.js`  | Función serverless. Valida, aplica CORS + honeypot y envía vía Resend.        |
| `vercel.json`      | Config mínima de la función (timeout).                                        |
| `.env.example`     | Documenta las variables necesarias. **No** contiene valores reales.          |
| `js/main.js`       | Constante `CONTACT_ENDPOINT` (arriba del archivo) + `fetch` al enviar.        |

### 6.2 Variables de entorno (se configuran en Vercel, no en el repo)

| Variable          | Qué es                                                              |
| ----------------- | ------------------------------------------------------------------ |
| `RESEND_API_KEY`  | Clave de API de Resend (`re_…`). Se genera en resend.com/api-keys.  |

> Los destinatarios (`to`) están **hardcodeados** en `api/contacto.js` (constante
> `TO`), no en una variable de entorno. Para cambiarlos, edita ese array.
>
> El remitente (`from`) está fijo en `api/contacto.js` como
> `contacto@mail.responsable.net` (dominio verificado en Resend). Si cambia el dominio
> verificado, actualiza la constante `FROM` en ese archivo.

### 6.3 Desplegar en Vercel (paso a paso)

1. **Sube el proyecto a un repositorio** (GitHub/GitLab/Bitbucket) o instala la CLI de Vercel
   (`npm i -g vercel`). Basta con la raíz del proyecto; Vercel detecta la carpeta `api/`.
2. En **vercel.com → Add New → Project**, importa el repositorio (o corre `vercel` en la raíz).
   - Framework preset: **Other** (es un sitio estático + funciones, sin build).
   - No hace falta comando de build ni carpeta de salida.
3. Ve a **Project → Settings → Environment Variables** y agrega, para el entorno
   **Production** (y Preview si quieres probar):
   - `RESEND_API_KEY` = tu clave real de Resend.
   - Los destinatarios ya están fijos en `api/contacto.js` (constante `TO`); no hay que configurarlos aquí.
4. **Deploy.** Al terminar tendrás una URL como
   `https://responsable-contacto.vercel.app`. Tu endpoint será esa URL + `/api/contacto`.
5. **Conecta el frontend:** abre `js/main.js`, y arriba del archivo cambia la constante:
   ```js
   var CONTACT_ENDPOINT = "https://TU-PROYECTO.vercel.app/api/contacto";
   ```
   por la URL real de tu deploy. Vuelve a subir `js/main.js` a GoDaddy por FTP.
6. **Prueba** desde `https://responsable.net/soluciones/estudio-doble-materialidad/`:
   llena el modal y confirma que llega el correo. Si algo falla, revisa los **Logs** de la
   función en el panel de Vercel.

> El CORS de la función ya autoriza `https://responsable.net`. Si algún día la página se
> sirve desde otro dominio, actualiza `ALLOWED_ORIGIN` en `api/contacto.js`.

### 6.4 Anti-spam (honeypot)

El formulario incluye un campo oculto `website` (clase `.hp`, fuera de pantalla). Un humano
nunca lo ve ni lo llena; un bot sí. Si llega con contenido, la función responde `200` pero
**no envía** ningún correo. No borres ese campo del HTML.

### 6.5 Variables locales (opcional, para probar la función en tu máquina)

Copia `.env.example` a `.env` y pon tus valores reales. `.env` está en `.gitignore`, así que
**no se sube al repo**. Con la CLI de Vercel puedes correr la función localmente con
`vercel dev`.
