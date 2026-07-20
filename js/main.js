/* =====================================================================
   ResponSable — Interacciones globales
   ---------------------------------------------------------------------
   1. Menú global (toggle hamburguesa, panel de navegación del sitio)
   2. Acordeón de FAQ (aria-expanded + navegación por teclado)
   Sin dependencias. Se carga con "defer".
   ===================================================================== */
(function () {
  "use strict";

  /* =====================================================================
     CONFIGURACIÓN — Endpoint del formulario de contacto
     ---------------------------------------------------------------------
     El formulario se envía a nuestra función serverless en Vercel
     (api/contacto.js), que reenvía la solicitud por correo con Resend.
     La API key de Resend vive SOLO en el servidor (variable de entorno
     RESEND_API_KEY); los destinatarios están fijos en api/contacto.js.

     Si cambia el proyecto/dominio de Vercel, actualiza esta URL.
     ===================================================================== */
  var CONTACT_ENDPOINT = "https://web-three-ivory-qn6j5dod52.vercel.app/api/contacto";

  /* ---------- 1. Menú global (hamburguesa) ---------- */
  function initGlobalMenu() {
    var toggle = document.querySelector("[data-menu-toggle]");
    var panel = document.querySelector("[data-global-nav]");
    if (!toggle || !panel) return;

    function openPanel() {
      toggle.setAttribute("aria-expanded", "true");
      panel.hidden = false;
    }
    function closePanel() {
      toggle.setAttribute("aria-expanded", "false");
      panel.hidden = true;
    }

    // Abrir/cerrar con clic en el botón
    toggle.addEventListener("click", function (e) {
      e.stopPropagation();
      if (toggle.getAttribute("aria-expanded") === "true") closePanel();
      else openPanel();
    });

    // Cerrar al pulsar un enlace del panel
    panel.addEventListener("click", function (e) {
      if (e.target.closest("a")) closePanel();
    });

    // Cerrar al hacer clic fuera del panel y del botón
    document.addEventListener("click", function (e) {
      if (
        toggle.getAttribute("aria-expanded") === "true" &&
        !panel.contains(e.target) &&
        !toggle.contains(e.target)
      ) {
        closePanel();
      }
    });

    // Cerrar con Escape y devolver el foco al botón
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        closePanel();
        toggle.focus();
      }
    });
  }

  /* ---------- 2. Acordeón de FAQ ---------- */
  function initFaq() {
    var buttons = Array.prototype.slice.call(
      document.querySelectorAll(".faq__question")
    );
    if (!buttons.length) return;

    function setOpen(btn, open) {
      var panel = document.getElementById(btn.getAttribute("aria-controls"));
      btn.setAttribute("aria-expanded", String(open));
      if (panel) panel.hidden = !open;
    }

    function toggleItem(btn) {
      var willOpen = btn.getAttribute("aria-expanded") !== "true";
      // Acordeón exclusivo: cierra todas y abre solo la clicada (si iba a abrirse).
      buttons.forEach(function (other) {
        setOpen(other, other === btn && willOpen);
      });
    }

    buttons.forEach(function (btn, index) {
      btn.addEventListener("click", function () {
        toggleItem(btn);
      });

      // Navegación por teclado entre preguntas (flechas, Home, End)
      btn.addEventListener("keydown", function (e) {
        var i = index;
        switch (e.key) {
          case "ArrowDown":
            e.preventDefault();
            buttons[(i + 1) % buttons.length].focus();
            break;
          case "ArrowUp":
            e.preventDefault();
            buttons[(i - 1 + buttons.length) % buttons.length].focus();
            break;
          case "Home":
            e.preventDefault();
            buttons[0].focus();
            break;
          case "End":
            e.preventDefault();
            buttons[buttons.length - 1].focus();
            break;
        }
      });
    });
  }

  /* ---------- 3. Modal de contacto ---------- */
  function initContactModal() {
    var modal = document.querySelector("[data-modal]");
    if (!modal) return;

    var dialog = modal.querySelector('[role="dialog"]');
    var overlay = modal.querySelector("[data-modal-overlay]");
    var form = modal.querySelector("[data-contact-form]");
    var formWrap = modal.querySelector("[data-modal-form-wrap]");
    var success = modal.querySelector("[data-modal-success]");
    var submitBtn = form.querySelector(".modal__submit, [type='submit']");
    var formError = form.querySelector("[data-form-error]");
    var openers = document.querySelectorAll("[data-open-modal]");
    var lastFocused = null;

    var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    var FOCUSABLE =
      'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    function focusable() {
      return Array.prototype.slice
        .call(dialog.querySelectorAll(FOCUSABLE))
        .filter(function (el) { return el.offsetParent !== null; });
    }

    function openModal(opener) {
      lastFocused = opener || document.activeElement;
      modal.hidden = false;
      document.body.style.overflow = "hidden"; // bloquea scroll de fondo
      var first = form.querySelector("input, textarea");
      if (first) first.focus();
    }

    function clearValidation() {
      form.querySelectorAll(".field.is-invalid").forEach(function (f) {
        f.classList.remove("is-invalid");
      });
      form.querySelectorAll(".field__error").forEach(function (e) {
        e.textContent = "";
      });
      hideFormError();
      setSubmitting(false);
    }

    function hideFormError() {
      if (formError) {
        formError.hidden = true;
        formError.textContent = "";
      }
    }

    // Deshabilita/rehabilita el botón y alterna el texto "Enviando...".
    function setSubmitting(state) {
      if (!submitBtn) return;
      submitBtn.disabled = state;
      if (state) {
        if (!submitBtn.dataset.label) submitBtn.dataset.label = submitBtn.textContent;
        submitBtn.textContent = "Enviando…";
      } else if (submitBtn.dataset.label) {
        submitBtn.textContent = submitBtn.dataset.label;
      }
    }

    function resetToForm() {
      success.hidden = true;
      formWrap.hidden = false;
      form.reset();
      clearValidation();
      dialog.setAttribute("aria-labelledby", "contact-modal-title");
    }

    function closeModal() {
      modal.hidden = true;
      document.body.style.overflow = "";
      if (!success.hidden) resetToForm(); // venía de éxito: deja el formulario listo
      else clearValidation(); // limpia errores pero conserva lo ya escrito
      if (lastFocused && typeof lastFocused.focus === "function") lastFocused.focus();
    }

    // Abrir desde cualquier botón con data-open-modal
    openers.forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        openModal(btn);
      });
    });

    // Cerrar: X, botones de cierre y clic en el overlay
    modal.querySelectorAll("[data-modal-close]").forEach(function (btn) {
      btn.addEventListener("click", closeModal);
    });
    if (overlay) overlay.addEventListener("click", closeModal);

    // Escape + focus trap
    document.addEventListener("keydown", function (e) {
      if (modal.hidden) return;
      if (e.key === "Escape") {
        closeModal();
      } else if (e.key === "Tab") {
        var f = focusable();
        if (!f.length) return;
        var firstEl = f[0];
        var lastEl = f[f.length - 1];
        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    });

    // Validación de un campo; devuelve true si es válido
    function validateField(input) {
      var field = input.closest(".field");
      var errEl = field ? field.querySelector(".field__error") : null;
      var msg = "";
      var value = (input.value || "").trim();

      if (input.type === "checkbox") {
        if (input.required && !input.checked) msg = "Debe aceptar el aviso de privacidad.";
      } else if (input.required && !value) {
        msg = "Este campo es obligatorio.";
      } else if (input.type === "email" && value && !EMAIL_RE.test(value)) {
        msg = "Escriba un correo electrónico válido.";
      }

      if (field) field.classList.toggle("is-invalid", !!msg);
      if (errEl) errEl.textContent = msg;
      return !msg;
    }

    // Validación en vivo
    form.querySelectorAll("input, textarea").forEach(function (input) {
      var evt = input.type === "checkbox" ? "change" : "blur";
      input.addEventListener(evt, function () { validateField(input); });
      input.addEventListener("input", function () {
        var field = input.closest(".field");
        if (field && field.classList.contains("is-invalid")) validateField(input);
      });
    });

    // Envío
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      hideFormError();

      var ok = true;
      form.querySelectorAll("input, textarea").forEach(function (input) {
        if (!validateField(input)) ok = false;
      });
      if (!ok) {
        var firstInvalid = form.querySelector(".field.is-invalid input, .field.is-invalid textarea");
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      // Recolecta los campos (incluye el honeypot "website", vacío en humanos).
      var data = {};
      new FormData(form).forEach(function (value, key) {
        data[key] = value;
      });

      setSubmitting(true);

      fetch(CONTACT_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })
        .then(function (r) {
          return r
            .json()
            .catch(function () { return {}; })
            .then(function (payload) {
              // Éxito = respuesta HTTP ok y { ok: true } de api/contacto.js.
              if (!r.ok || !payload.ok) throw new Error(payload.error || "envío fallido");
              return payload;
            });
        })
        .then(function () {
          setSubmitting(false);
          showSuccess();
        })
        .catch(function () {
          setSubmitting(false);
          showError();
        });
    });

    function showError() {
      if (!formError) return;
      formError.innerHTML =
        "No pudimos enviar su solicitud. Intente de nuevo o escríbanos a " +
        '<a href="mailto:hola@responsable.net">hola@responsable.net</a>';
      formError.hidden = false;
      formError.focus && formError.setAttribute("tabindex", "-1");
      if (formError.focus) formError.focus();
    }

    function showSuccess() {
      formWrap.hidden = true;
      success.hidden = false;
      dialog.setAttribute("aria-labelledby", "contact-modal-success-title");
      dialog.scrollTop = 0;
      var title = success.querySelector(".modal__title");
      if (title) {
        title.setAttribute("tabindex", "-1");
        title.focus();
      }
    }
  }

  /* ---------- 4. Carrusel de beneficios ---------- */
  function initCarousels() {
    var carousels = Array.prototype.slice.call(
      document.querySelectorAll("[data-carousel]")
    );
    if (!carousels.length) return;

    carousels.forEach(function (root) {
      var viewport = root.querySelector("[data-carousel-viewport]");
      var track = root.querySelector("[data-carousel-track]");
      var prev = root.querySelector("[data-carousel-prev]");
      var next = root.querySelector("[data-carousel-next]");
      if (!viewport || !track) return;

      var slides = Array.prototype.slice.call(track.children);
      if (!slides.length) return;

      var AUTOPLAY_MS = 4000;
      var index = 0;
      var timer = null;

      // Mide el ancho real de una tarjeta + el gap para calcular el paso y el
      // índice máximo (cuántas tarjetas quedan visibles según el ancho actual).
      function metrics() {
        var slideW = slides[0].getBoundingClientRect().width;
        var cs = getComputedStyle(track);
        var gap = parseFloat(cs.columnGap || cs.gap || "0") || 0;
        var step = slideW + gap;
        var viewW = viewport.getBoundingClientRect().width;
        var visible = step > 0 ? Math.max(1, Math.round((viewW + gap) / step)) : 1;
        var maxIndex = Math.max(0, slides.length - visible);
        return { step: step, maxIndex: maxIndex };
      }

      function update() {
        var m = metrics();
        if (index > m.maxIndex) index = m.maxIndex;
        if (index < 0) index = 0;
        track.style.transform = "translateX(" + (-index * m.step) + "px)";
        if (prev) prev.disabled = index <= 0;
        if (next) next.disabled = index >= m.maxIndex;
      }

      // Avanza una tarjeta; al llegar al final vuelve al inicio (loop).
      function advance() {
        var maxIndex = metrics().maxIndex;
        index = index >= maxIndex ? 0 : index + 1;
        update();
      }

      function startAutoplay() {
        if (timer || metrics().maxIndex === 0) return; // nada que recorrer
        timer = window.setInterval(advance, AUTOPLAY_MS);
      }
      function stopAutoplay() {
        if (timer) {
          window.clearInterval(timer);
          timer = null;
        }
      }
      // Reinicia el temporizador tras una acción manual (si el autoplay está activo).
      function restartAutoplay() {
        if (timer) {
          stopAutoplay();
          startAutoplay();
        }
      }

      if (prev) {
        prev.addEventListener("click", function () {
          index -= 1;
          update();
          restartAutoplay();
        });
      }
      if (next) {
        next.addEventListener("click", function () {
          index += 1;
          update();
          restartAutoplay();
        });
      }

      // Pausa el autoplay mientras el mouse está sobre el carrusel.
      root.addEventListener("mouseenter", stopAutoplay);
      root.addEventListener("mouseleave", startAutoplay);
      // Pausa también con foco de teclado (accesibilidad).
      root.addEventListener("focusin", stopAutoplay);
      root.addEventListener("focusout", startAutoplay);

      window.addEventListener("resize", update);
      window.addEventListener("load", update); // reajusta cuando cargan las fuentes
      update();
      startAutoplay();
    });
  }

  /* ---------- 5. Alto del header como variable CSS (--header-h) ---------- */
  // El hero usa esta medida para abarcar la pantalla sin sobrepasarse.
  // El header no es sticky y en móvil ocupa dos filas, por eso se mide en vivo.
  function initHeaderHeightVar() {
    var header = document.querySelector(".site-header");
    if (!header) return;
    function setVar() {
      document.documentElement.style.setProperty("--header-h", header.offsetHeight + "px");
    }
    setVar();
    window.addEventListener("resize", setVar);
    window.addEventListener("load", setVar); // reajusta cuando cargan las fuentes
    if (window.ResizeObserver) new ResizeObserver(setVar).observe(header);
  }

  /* ---------- Init ---------- */
  function init() {
    initHeaderHeightVar();
    initGlobalMenu();
    initFaq();
    initContactModal();
    initCarousels();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
