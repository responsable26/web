/* =====================================================================
   ResponSable — Interacciones globales
   ---------------------------------------------------------------------
   1. Menú global (toggle hamburguesa, panel de navegación del sitio)
   2. Acordeón de FAQ (aria-expanded + navegación por teclado)
   Sin dependencias. Se carga con "defer".
   ===================================================================== */
(function () {
  "use strict";

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

    function toggleItem(btn) {
      var expanded = btn.getAttribute("aria-expanded") === "true";
      var panel = document.getElementById(btn.getAttribute("aria-controls"));
      btn.setAttribute("aria-expanded", String(!expanded));
      if (panel) panel.hidden = expanded; // oculta cuando pasaba a cerrado
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
      var ok = true;
      form.querySelectorAll("input, textarea").forEach(function (input) {
        if (!validateField(input)) ok = false;
      });
      if (!ok) {
        var firstInvalid = form.querySelector(".field.is-invalid input, .field.is-invalid textarea");
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      // ===================================================================
      // TODO: CONEXIÓN REAL AL BACKEND
      // Aquí irá el envío real al endpoint de ResponSable (por definir).
      // Sustituir el bloque simulado por algo como:
      //
      //   var data = Object.fromEntries(new FormData(form).entries());
      //   fetch("<ENDPOINT>", {
      //     method: "POST",
      //     headers: { "Content-Type": "application/json" },
      //     body: JSON.stringify(data)
      //   })
      //     .then(function (r) { if (!r.ok) throw new Error(); showSuccess(); })
      //     .catch(function () { /* mostrar error de envío */ });
      //
      // Por ahora simulamos el éxito directamente:
      // ===================================================================
      showSuccess();
    });

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

  /* ---------- Init ---------- */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      initGlobalMenu();
      initFaq();
      initContactModal();
    });
  } else {
    initGlobalMenu();
    initFaq();
    initContactModal();
  }
})();
