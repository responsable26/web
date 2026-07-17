/* =====================================================================
   ResponSable — Interacciones de la HOME (inicio/index.html)
   ---------------------------------------------------------------------
   Autónomo: esta página NO carga main.js (no tiene modal de contacto),
   así que aquí vive todo lo que necesita el home:
     1. Menú global (toggle hamburguesa)  — mismo comportamiento que main.js
     2. Tabs de Servicios (patrón ARIA tablist)
     3. Acordeón dentro de cada panel      — mismo patrón exclusivo que el FAQ
     4. Carrusel de Casos de Éxito
   Sin dependencias. Se carga con "defer".
   ===================================================================== */
(function () {
  "use strict";

  /* ---------- 1. Menú global (hamburguesa) ---------- */
  /* Réplica del comportamiento de main.js para reutilizar el header exacto. */
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

    toggle.addEventListener("click", function (e) {
      e.stopPropagation();
      if (toggle.getAttribute("aria-expanded") === "true") closePanel();
      else openPanel();
    });

    panel.addEventListener("click", function (e) {
      if (e.target.closest("a")) closePanel();
    });

    document.addEventListener("click", function (e) {
      if (
        toggle.getAttribute("aria-expanded") === "true" &&
        !panel.contains(e.target) &&
        !toggle.contains(e.target)
      ) {
        closePanel();
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        closePanel();
        toggle.focus();
      }
    });
  }

  /* ---------- 2. Tabs de Servicios (ARIA tablist) ---------- */
  function initTabs() {
    var tablist = document.querySelector("[data-tablist]");
    if (!tablist) return;

    var tabs = Array.prototype.slice.call(tablist.querySelectorAll("[role='tab']"));
    if (!tabs.length) return;

    function selectTab(tab, focus) {
      tabs.forEach(function (t) {
        var selected = t === tab;
        t.setAttribute("aria-selected", String(selected));
        t.tabIndex = selected ? 0 : -1;
        var panel = document.getElementById(t.getAttribute("aria-controls"));
        if (panel) panel.hidden = !selected;
      });
      if (focus) tab.focus();
    }

    tabs.forEach(function (tab, index) {
      tab.addEventListener("click", function () {
        selectTab(tab, false);
      });

      // Navegación por teclado entre pestañas (flechas, Home, End)
      tab.addEventListener("keydown", function (e) {
        var i = index;
        switch (e.key) {
          case "ArrowRight":
          case "ArrowDown":
            e.preventDefault();
            selectTab(tabs[(i + 1) % tabs.length], true);
            break;
          case "ArrowLeft":
          case "ArrowUp":
            e.preventDefault();
            selectTab(tabs[(i - 1 + tabs.length) % tabs.length], true);
            break;
          case "Home":
            e.preventDefault();
            selectTab(tabs[0], true);
            break;
          case "End":
            e.preventDefault();
            selectTab(tabs[tabs.length - 1], true);
            break;
        }
      });
    });
  }

  /* ---------- 3. Acordeón (mismo patrón exclusivo que el FAQ) ---------- */
  /* Uno abierto cierra los demás. Reutiliza las clases .faq__* del sistema. */
  function initAccordion() {
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
      buttons.forEach(function (other) {
        setOpen(other, other === btn && willOpen);
      });
    }

    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        toggleItem(btn);
      });
    });
  }

  /* ---------- 4. Carrusel de Casos de Éxito ---------- */
  function initCarousel() {
    var root = document.querySelector("[data-carousel]");
    if (!root) return;

    var track = root.querySelector("[data-carousel-track]");
    var slides = track ? Array.prototype.slice.call(track.children) : [];
    // Los controles pueden vivir fuera de [data-carousel] (p. ej. en el encabezado),
    // así que se buscan a nivel de documento (hay un único carrusel en la página).
    var prev = document.querySelector("[data-carousel-prev]");
    var next = document.querySelector("[data-carousel-next]");
    if (!track || slides.length < 2) return;

    var index = 0;

    function go(i) {
      // Envolvente: del último vuelve al primero y viceversa
      index = (i + slides.length) % slides.length;
      track.style.transform = "translateX(" + (-index * 100) + "%)";
      slides.forEach(function (s, n) {
        s.setAttribute("aria-hidden", String(n !== index));
      });
    }

    if (prev) prev.addEventListener("click", function () { go(index - 1); });
    if (next) next.addEventListener("click", function () { go(index + 1); });

    go(0);
  }

  /* ---------- Arranque ---------- */
  function init() {
    initGlobalMenu();
    initTabs();
    initAccordion();
    initCarousel();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
