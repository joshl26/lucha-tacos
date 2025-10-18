// hamburger-menu.js - Enhanced mobile hamburger menu

let menuOpen = false;

export function initHamburgerMenu() {
  createMenuElements();
  attachEventHandlers();
  applyResponsiveStyles();
}

function applyResponsiveStyles() {
  const hamburger = document.getElementById("hamburger-btn");
  const desktopNav = document.querySelector("header nav");

  function handleResize() {
    if (window.innerWidth <= 768) {
      // Mobile: show hamburger, hide desktop nav
      // Adjust hamburger position based on actual header height
      const header = document.querySelector("header");
      if (header && hamburger) {
        const headerHeight = header.offsetHeight;
        hamburger.style.top = `${headerHeight / 2}px`;
      }

      if (hamburger) hamburger.style.display = "flex";
      if (desktopNav) desktopNav.style.display = "none";
    } else {
      // Desktop: hide hamburger, show desktop nav, close menu
      if (hamburger) {
        hamburger.style.display = "none";
        closeMenu();
      }
      if (desktopNav) desktopNav.style.display = "flex";
      const mobileMenu = document.getElementById("mobile-nav-menu");
      const backdrop = document.getElementById("mobile-nav-backdrop");
      if (mobileMenu) mobileMenu.style.left = "-100%";
      if (backdrop) backdrop.style.display = "none";
      document.body.style.overflow = "";
    }
  }

  handleResize();
  window.addEventListener("resize", handleResize);
}

function createMenuElements() {
  if (document.getElementById("hamburger-btn")) return;

  // Enhanced hamburger button
  const hamburger = document.createElement("button");
  hamburger.id = "hamburger-btn";
  hamburger.className = "hamburger-btn";
  hamburger.setAttribute("aria-label", "Toggle navigation menu");
  hamburger.setAttribute("aria-expanded", "false");
  hamburger.setAttribute("aria-controls", "mobile-nav-menu");

  Object.assign(hamburger.style, {
    display: "flex",
    position: "fixed",
    top: "30px", // Vertically center in 60px header
    left: "1rem",
    zIndex: "1100",
    width: "48px",
    height: "48px",
    background: "rgba(0, 0, 0, 0.85)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    cursor: "pointer",
    padding: "0",
    borderRadius: "8px",
    alignItems: "center",
    justifyContent: "center",
    backdropFilter: "blur(10px)",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
    transition: "all 0.3s ease",
    transform: "translateY(-50%)",
  });

  hamburger.innerHTML = `
    <span class="hamburger-line" style="position: absolute; width: 24px; height: 2px; background: white; border-radius: 2px; top: 14px; left: 50%; transform: translateX(-50%); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);"></span>
    <span class="hamburger-line" style="position: absolute; width: 24px; height: 2px; background: white; border-radius: 2px; top: 23px; left: 50%; transform: translateX(-50%); opacity: 1; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);"></span>
    <span class="hamburger-line" style="position: absolute; width: 24px; height: 2px; background: white; border-radius: 2px; top: 32px; left: 50%; transform: translateX(-50%); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);"></span>
  `;

  document.body.appendChild(hamburger);

  // Enhanced backdrop
  const backdrop = document.createElement("div");
  backdrop.id = "mobile-nav-backdrop";
  backdrop.className = "mobile-nav-backdrop";
  Object.assign(backdrop.style, {
    display: "none",
    position: "fixed",
    top: "0",
    left: "0",
    right: "0",
    bottom: "0",
    background: "rgba(0, 0, 0, 0.7)",
    backdropFilter: "blur(4px)",
    zIndex: "1080",
    transition: "opacity 0.3s ease",
  });
  document.body.appendChild(backdrop);

  // Enhanced mobile menu
  const mobileMenu = document.createElement("nav");
  mobileMenu.id = "mobile-nav-menu";
  mobileMenu.className = "mobile-nav-menu";
  mobileMenu.setAttribute("aria-label", "Mobile navigation");

  Object.assign(mobileMenu.style, {
    position: "fixed",
    top: "0",
    left: "-100%",
    width: "300px",
    maxWidth: "85vw",
    height: "100vh",
    background:
      "linear-gradient(180deg, rgba(0, 0, 0, 0.98) 0%, rgba(20, 20, 20, 0.98) 100%)",
    borderRight: "1px solid rgba(255, 255, 255, 0.1)",
    boxShadow: "4px 0 20px rgba(0, 0, 0, 0.5)",
    zIndex: "1090",
    overflowY: "auto",
    paddingTop: "5rem",
    paddingBottom: "2rem",
    transition: "left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  });

  // Clone and enhance desktop nav
  const desktopNav = document.querySelector("header nav");
  if (desktopNav) {
    const navClone = desktopNav.cloneNode(true);
    const navList = navClone.querySelector(".nav");

    if (navList) {
      navList.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        padding: 1.5rem;
        background: transparent;
        border: none;
      `;

      const navItems = navList.querySelectorAll(".nav-item");
      navItems.forEach((item) => {
        const link = item.querySelector(".nav-link");
        if (link) {
          link.style.cssText = `
            display: block;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            color: white;
            text-decoration: none;
            transition: all 0.3s ease;
            border: 1px solid rgba(255, 255, 255, 0.05);
            font-size: 1.05rem;
            letter-spacing: 0.02em;
          `;

          link.addEventListener("mouseenter", () => {
            link.style.background = "rgba(255, 255, 255, 0.1)";
            link.style.borderColor = "rgba(183, 28, 28, 0.4)";
            link.style.transform = "translateX(8px)";
          });

          link.addEventListener("mouseleave", () => {
            if (!link.classList.contains("active")) {
              link.style.background = "transparent";
              link.style.borderColor = "rgba(255, 255, 255, 0.05)";
              link.style.transform = "translateX(0)";
            }
          });

          if (link.classList.contains("active")) {
            link.style.background =
              "linear-gradient(135deg, rgba(183, 28, 28, 0.3) 0%, rgba(161, 23, 23, 0.2) 100%)";
            link.style.borderColor = "rgba(183, 28, 28, 0.4)";
            link.style.boxShadow = "0 2px 8px rgba(183, 28, 28, 0.2)";
          }
        }
      });
    }

    mobileMenu.appendChild(navClone);
  }

  document.body.appendChild(mobileMenu);
}

function attachEventHandlers() {
  const hamburger = document.getElementById("hamburger-btn");
  const backdrop = document.getElementById("mobile-nav-backdrop");
  const mobileMenu = document.getElementById("mobile-nav-menu");

  if (!hamburger || !mobileMenu) return;

  hamburger.addEventListener("click", toggleMenu);

  hamburger.addEventListener("mouseenter", () => {
    if (!menuOpen) {
      hamburger.style.background = "rgba(183, 28, 28, 0.3)";
      hamburger.style.borderColor = "rgba(183, 28, 28, 0.4)";
      hamburger.style.transform = "scale(1.05)";
    }
  });

  hamburger.addEventListener("mouseleave", () => {
    if (!menuOpen) {
      hamburger.style.background = "rgba(0, 0, 0, 0.85)";
      hamburger.style.borderColor = "rgba(255, 255, 255, 0.1)";
      hamburger.style.transform = "scale(1)";
    }
  });

  if (backdrop) {
    backdrop.addEventListener("click", closeMenu);
  }

  mobileMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && menuOpen) {
      closeMenu();
    }
  });
}

function toggleMenu() {
  if (menuOpen) {
    closeMenu();
  } else {
    openMenu();
  }
}

function openMenu() {
  const hamburger = document.getElementById("hamburger-btn");
  const backdrop = document.getElementById("mobile-nav-backdrop");
  const mobileMenu = document.getElementById("mobile-nav-menu");

  if (!hamburger || !mobileMenu) return;

  menuOpen = true;

  // Animate hamburger to X with enhanced styling
  const lines = hamburger.querySelectorAll(".hamburger-line");
  lines[0].style.top = "23px";
  lines[0].style.transform = "translateX(-50%) rotate(45deg)";
  lines[1].style.opacity = "0";
  lines[2].style.top = "23px";
  lines[2].style.transform = "translateX(-50%) rotate(-45deg)";

  hamburger.style.background = "rgba(183, 28, 28, 0.5)";
  hamburger.style.borderColor = "rgba(183, 28, 28, 0.6)";
  hamburger.setAttribute("aria-expanded", "true");

  mobileMenu.style.left = "0";
  if (backdrop) {
    backdrop.style.display = "block";
    setTimeout(() => {
      backdrop.style.opacity = "1";
    }, 10);
  }

  document.body.style.overflow = "hidden";

  const firstLink = mobileMenu.querySelector("a");
  if (firstLink) setTimeout(() => firstLink.focus(), 100);
}

function closeMenu() {
  const hamburger = document.getElementById("hamburger-btn");
  const backdrop = document.getElementById("mobile-nav-backdrop");
  const mobileMenu = document.getElementById("mobile-nav-menu");

  if (!hamburger || !mobileMenu) return;

  menuOpen = false;

  // Animate hamburger back to lines
  const lines = hamburger.querySelectorAll(".hamburger-line");
  lines[0].style.top = "14px";
  lines[0].style.transform = "translateX(-50%) rotate(0deg)";
  lines[1].style.opacity = "1";
  lines[2].style.top = "32px";
  lines[2].style.transform = "translateX(-50%) rotate(0deg)";

  hamburger.style.background = "rgba(0, 0, 0, 0.85)";
  hamburger.style.borderColor = "rgba(255, 255, 255, 0.1)";
  hamburger.setAttribute("aria-expanded", "false");

  mobileMenu.style.left = "-100%";
  if (backdrop) {
    backdrop.style.opacity = "0";
    setTimeout(() => {
      backdrop.style.display = "none";
    }, 300);
  }

  document.body.style.overflow = "";
  hamburger.focus();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initHamburgerMenu);
} else {
  initHamburgerMenu();
}
