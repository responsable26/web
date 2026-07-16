/* =====================================================================
   ResponSable — Prueba de humo del modal de contacto (Playwright)
   ---------------------------------------------------------------------
   Valida el modal de conversión de una página de servicio:
     1. Abre desde los 3 botones con data-open-modal
     2. Validación (obligatorios vacíos, email inválido, envío correcto -> éxito)
        El envío real llama a la función serverless de Vercel; aquí se intercepta.
     3. Cierra por X y Escape (+ reabrir sin errores viejos)
     4. Bloquea/restablece el scroll del fondo
     5. Responsive a 640px (grid a 1 columna, sin desbordamiento)
     6. El foco vuelve al botón que abrió el modal

   Genera dos capturas: modal-desktop.png y modal-mobile.png

   Cómo correrlo:
     1) Sirve el sitio desde la RAÍZ del proyecto:  python3 -m http.server 8000
     2) En otra terminal:  cd tests && npm install && npm test

   Variables de entorno:
     BASE          URL base del servidor (por defecto http://localhost:8000)
     SERVICE_PATH  ruta de la página a probar (por defecto la de doble materialidad)
                   -> para probar otro servicio:
                      SERVICE_PATH=/servicio/otro-servicio/ npm test
   ===================================================================== */
const { chromium } = require("playwright");

const BASE = process.env.BASE || "http://localhost:8000";
const SERVICE_PATH = process.env.SERVICE_PATH || "/servicio/estudio-doble-materialidad/";
const URL = BASE + SERVICE_PATH;
const SHOT_DIR = __dirname;

const results = [];
function rec(point, name, pass, detail) {
  results.push({ point, name, pass, detail: detail || "" });
  console.log(`  [${pass ? "PASS" : "FAIL"}] (${point}) ${name}${detail ? " — " + detail : ""}`);
}

const modalHidden = (page) => page.locator("#contact-modal").evaluate((el) => el.hidden);
async function openWith(page, index) {
  await page.locator("[data-open-modal]").nth(index).click();
  await page.waitForTimeout(120);
}
async function isOpen(page) {
  return !(await modalHidden(page));
}

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });

  // El envío del formulario hace fetch a un endpoint externo. En la prueba lo
  // interceptamos y respondemos ok, para validar el flujo hasta el éxito sin
  // enviar correos reales.
  //   - TEMPORAL (Web3Forms): api.web3forms.com/submit → { success: true }
  //   - Al revertir a Vercel: api/contacto.js → { ok: true } (añade esa ruta)
  await context.route("**/api.web3forms.com/submit", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true }) })
  );
  await context.route("**/api/contacto", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, success: true }) })
  );

  const page = await context.newPage();

  try {
    await page.goto(URL, { waitUntil: "networkidle" });
  } catch (e) {
    console.error(`\nNo se pudo cargar ${URL}\n¿Está el servidor arriba? (python3 -m http.server 8000 desde la raíz)\n`);
    await browser.close();
    process.exit(2);
  }

  // ---------- 1. Abre desde los 3 botones ----------
  console.log("\n== 1. Apertura desde los botones data-open-modal ==");
  const openerCount = await page.locator("[data-open-modal]").count();
  rec(1, "Hay 3 botones data-open-modal", openerCount === 3, `encontrados: ${openerCount}`);
  for (let i = 0; i < openerCount; i++) {
    const label = (await page.locator("[data-open-modal]").nth(i).innerText()).trim();
    await openWith(page, i);
    rec(1, `Botón #${i + 1} "${label}" abre el modal`, await isOpen(page));
    await page.keyboard.press("Escape");
    await page.waitForTimeout(100);
  }

  // ---------- 4. Bloqueo de scroll ----------
  console.log("\n== 4. Bloqueo de scroll del fondo ==");
  await openWith(page, 0);
  const ovOpen = await page.evaluate(() => document.body.style.overflow);
  rec(4, "body overflow = 'hidden' al abrir", ovOpen === "hidden", `valor: '${ovOpen}'`);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(100);
  const ovClosed = await page.evaluate(() => document.body.style.overflow);
  rec(4, "body overflow restablecido al cerrar", ovClosed === "", `valor: '${ovClosed}'`);

  // ---------- 6. Foco vuelve al botón ----------
  console.log("\n== 6. El foco regresa al botón que abrió ==");
  await page.locator("[data-open-modal]").nth(0).focus();
  await page.locator("[data-open-modal]").nth(0).click();
  await page.waitForTimeout(120);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(120);
  const focusReturned = await page.evaluate(
    () => document.activeElement === document.querySelectorAll("[data-open-modal]")[0]
  );
  rec(6, "activeElement es el botón que abrió tras cerrar", focusReturned);

  // ---------- 2. Validación ----------
  console.log("\n== 2. Validación del formulario ==");
  await openWith(page, 0);
  await page.locator("[data-contact-form] button[type=submit]").click();
  await page.waitForTimeout(120);
  const requiredIds = ["cf-nombre", "cf-apellido", "cf-email", "cf-telefono", "cf-compania", "cf-privacy"];
  let invalidCount = 0;
  for (const id of requiredIds) {
    const invalid = await page.evaluate((id) => {
      const f = document.getElementById(id).closest(".field");
      return f && f.classList.contains("is-invalid");
    }, id);
    if (invalid) invalidCount++;
  }
  rec(2, "Submit vacío marca los 5 obligatorios + checkbox (6)", invalidCount === 6, `marcados: ${invalidCount}/6`);
  rec(2, "Submit vacío NO muestra éxito", !(await page.locator("[data-modal-success]").evaluate((el) => !el.hidden)));

  await page.fill("#cf-nombre", "Ana");
  await page.fill("#cf-apellido", "Ramírez");
  await page.fill("#cf-telefono", "5512345678");
  await page.fill("#cf-compania", "Acme S.A.");
  await page.fill("#cf-email", "correo@");
  await page.check("#cf-privacy");
  await page.locator("[data-contact-form] button[type=submit]").click();
  await page.waitForTimeout(120);
  const emailInvalid = await page.evaluate(() => {
    const f = document.getElementById("cf-email").closest(".field");
    return { invalid: f.classList.contains("is-invalid"), err: f.querySelector(".field__error").textContent.trim() };
  });
  const successBad = await page.locator("[data-modal-success]").evaluate((el) => !el.hidden);
  rec(2, 'Email inválido "correo@" se rechaza', emailInvalid.invalid && !successBad, `mensaje: "${emailInvalid.err}"`);

  await page.fill("#cf-email", "ana.ramirez@acme.com");
  await page.locator("[data-contact-form] button[type=submit]").click();
  await page.locator("[data-modal-success]").waitFor({ state: "visible", timeout: 3000 }).catch(() => {});
  const successShown = await page.locator("[data-modal-success]").evaluate((el) => !el.hidden);
  const formHidden = await page.locator("[data-modal-form-wrap]").evaluate((el) => el.hidden);
  rec(2, "Formulario correcto muestra estado de éxito", successShown && formHidden);
  await page.locator("[data-modal-success] [data-modal-close]").click();
  await page.waitForTimeout(120);
  await openWith(page, 0);
  rec(2, "Reabrir tras éxito vuelve a mostrar el formulario",
    await page.locator("[data-modal-form-wrap]").evaluate((el) => !el.hidden));
  await page.keyboard.press("Escape");
  await page.waitForTimeout(100);

  // ---------- 3. Métodos de cierre ----------
  console.log("\n== 3. Métodos de cierre ==");
  await openWith(page, 0);
  await page.locator(".modal__close").click();
  await page.waitForTimeout(120);
  rec(3, "Cierra con la X", await modalHidden(page));

  await openWith(page, 0);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(120);
  rec(3, "Cierra con Escape", await modalHidden(page));

  // El modal es a pantalla completa: NO se cierra con clic en la ilustración.
  await openWith(page, 0);
  await page.mouse.click(8, 8);
  await page.waitForTimeout(120);
  rec(3, "Clic en la ilustración NO cierra (solo X y Escape)", await isOpen(page));
  await page.keyboard.press("Escape");
  await page.waitForTimeout(100);

  // 3b. Reabrir tras cerrar queda sin errores viejos
  await openWith(page, 0);
  await page.locator("#cf-apellido").focus(); // desenfoca Nombre -> validaría
  await page.waitForTimeout(60);
  await page.locator(".modal__close").click();
  await page.waitForTimeout(100);
  await openWith(page, 0);
  const clean = await page.evaluate(() => ({
    invalid: document.querySelectorAll("[data-contact-form] .field.is-invalid").length,
    err: Array.prototype.some.call(
      document.querySelectorAll("[data-contact-form] .field__error"),
      (e) => e.textContent.trim() !== ""
    ),
  }));
  rec(3, "Reabrir tras cerrar no muestra errores viejos", clean.invalid === 0 && !clean.err, `inválidos: ${clean.invalid}`);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(100);

  // ---------- Captura desktop (limpia) ----------
  await page.reload({ waitUntil: "networkidle" });
  await openWith(page, 0);
  await page.screenshot({ path: `${SHOT_DIR}/modal-desktop.png` });
  await page.keyboard.press("Escape");
  await page.waitForTimeout(100);

  // ---------- 5. Responsive a 640px ----------
  console.log("\n== 5. Responsive (1 columna, sin desbordamiento) ==");
  await page.setViewportSize({ width: 640, height: 900 });
  await openWith(page, 0);
  const gridCols = await page.locator(".form-grid").evaluate((el) => getComputedStyle(el).gridTemplateColumns);
  rec(5, "form-grid pasa a 1 columna a 640px", gridCols.trim().split(/\s+/).length === 1, `columns: "${gridCols}"`);
  const ov = await page.evaluate(() => ({ s: document.documentElement.scrollWidth, w: window.innerWidth }));
  rec(5, "Sin desbordamiento horizontal a 640px", ov.s <= ov.w + 1, `scrollWidth ${ov.s} vs innerWidth ${ov.w}`);
  await page.keyboard.press("Escape");

  // ---------- Captura móvil (limpia) ----------
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: "networkidle" });
  await openWith(page, 0);
  await page.screenshot({ path: `${SHOT_DIR}/modal-mobile.png` });

  await browser.close();

  // ---------- Resumen ----------
  const passed = results.filter((r) => r.pass).length;
  console.log(`\n================= RESUMEN =================`);
  console.log(`  ${passed}/${results.length} comprobaciones PASARON`);
  console.log(`  Capturas: tests/modal-desktop.png · tests/modal-mobile.png`);
  const fails = results.filter((r) => !r.pass);
  if (fails.length) {
    console.log(`  FALLOS:`);
    fails.forEach((f) => console.log(`   - (${f.point}) ${f.name} — ${f.detail}`));
  } else {
    console.log(`  ✅ Todas las comprobaciones pasaron.`);
  }
  process.exit(fails.length ? 1 : 0);
})().catch((e) => {
  console.error("ERROR EN LA PRUEBA:", e);
  process.exit(2);
});
