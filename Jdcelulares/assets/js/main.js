/* JD Celulares RJ — main.js
   - Mobile menu toggle
   - Header style on scroll
   - Reveal-on-scroll animation
   - Year auto-fill
   - Active link highlight
*/

(function () {
  "use strict";

  const header = document.querySelector(".site-header");
  const navToggle = document.querySelector(".nav-toggle");
  const navLinks = document.querySelector(".nav-links");

  function setHeaderState() {
    if (!header) return;
    if (window.scrollY > 24) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  }

  function toggleMenu() {
    if (!navLinks || !navToggle) return;
    const open = navLinks.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(open));
    const icon = navToggle.querySelector("i");
    if (icon) {
      icon.classList.toggle("fa-bars", !open);
      icon.classList.toggle("fa-xmark", open);
    }
    document.body.style.overflow = open ? "hidden" : "";
  }

  function closeMenu() {
    if (!navLinks) return;
    navLinks.classList.remove("open");
    if (navToggle) navToggle.setAttribute("aria-expanded", "false");
    const icon = navToggle ? navToggle.querySelector("i") : null;
    if (icon) {
      icon.classList.add("fa-bars");
      icon.classList.remove("fa-xmark");
    }
    document.body.style.overflow = "";
  }

  if (navToggle) navToggle.addEventListener("click", toggleMenu);

  if (navLinks) {
    navLinks.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        if (navLinks.classList.contains("open")) closeMenu();
      });
    });
  }

  window.addEventListener("scroll", setHeaderState, { passive: true });
  setHeaderState();

  // Reveal-on-scroll
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    const io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach(function (el) {
      io.observe(el);
    });
  } else {
    revealEls.forEach(function (el) {
      el.classList.add("visible");
    });
  }

  // Year
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  // Smooth highlight active section in homepage nav
  const sections = document.querySelectorAll("section[id]");
  const linkMap = new Map();
  document.querySelectorAll(".nav-links a[href*='#']").forEach(function (a) {
    const href = a.getAttribute("href");
    if (href) {
      const hash = href.includes("#") ? "#" + href.split("#")[1] : "";
      if (hash) linkMap.set(hash, a);
    }
  });

  if (sections.length && linkMap.size && "IntersectionObserver" in window) {
    const io2 = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          const id = "#" + entry.target.id;
          const link = linkMap.get(id);
          if (!link) return;
          if (entry.isIntersecting) {
            linkMap.forEach(function (l) {
              l.classList.remove("active");
            });
            link.classList.add("active");
          }
        });
      },
      { rootMargin: "-50% 0px -45% 0px", threshold: 0 }
    );
    sections.forEach(function (s) {
      io2.observe(s);
    });
  }
})();
