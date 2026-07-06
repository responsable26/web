/* =====================================================================
   ResponSable — Interacciones globales
   ---------------------------------------------------------------------
   1. Menú móvil (toggle accesible)
   2. Acordeón de FAQ (aria-expanded + navegación por teclado)
   Sin dependencias. Se carga con "defer".
   ===================================================================== */
(function () {
  "use strict";

  /* ---------- 1. Menú móvil ---------- */
  function initMobileNav() {
    var toggle = document.querySelector("[data-nav-toggle]");
    var nav = document.querySelector("[data-nav]");
    if (!toggle || !nav) return;

    function closeNav() {
      toggle.setAttribute("aria-expanded", "false");
      nav.classList.remove("is-open");
    }

    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      nav.classList.toggle("is-open", !open);
    });

    // Cerrar al pulsar un enlace del menú (útil en móvil)
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) closeNav();
    });

    // Cerrar con Escape y devolver el foco al botón
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        closeNav();
        toggle.focus();
      }
    });

    // Si se vuelve a escritorio, reseteamos el estado
    var mq = window.matchMedia("(min-width: 861px)");
    mq.addEventListener("change", function (e) {
      if (e.matches) closeNav();
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

  /* ---------- Init ---------- */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      initMobileNav();
      initFaq();
    });
  } else {
    initMobileNav();
    initFaq();
  }
})();
