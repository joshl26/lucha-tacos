// hamburger-menu.js - Mobile hamburger menu functionality

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

  // Create hamburger button with proper inline positioning
  const hamburger = document.createElement("button");
  hamburger.id = "hamburger-btn";
  hamburger.className = "hamburger-btn";
  hamburger.setAttribute("aria-label", "Toggle navigation menu");
  hamburger.setAttribute("aria-expanded", "false");
  hamburger.setAttribute("aria-controls", "mobile-nav-menu");
  hamburger.style.display = "flex";
  hamburger.style.position = "fixed";
  hamburger.style.top = "1rem";
  hamburger.style.left = "1rem";
  hamburger.style.zIndex = "1100";
  hamburger.style.width = "44px";
  hamburger.style.height = "44px";
  hamburger.style.background = "none";
  hamburger.style.border = "none";
  hamburger.style.cursor = "pointer";
  hamburger.style.padding = "8px";
  hamburger.style.borderRadius = "6px";
  hamburger.style.alignItems = "center";
  hamburger.style.justifyContent = "center";

  hamburger.innerHTML = `
    <span class="hamburger-line" style="position: absolute; width: 24px; height: 2px; background: white; border-radius: 2px; top: 6px; left: 50%; transform: translateX(-50%); transition: all 0.3s ease;"></span>
    <span class="hamburger-line" style="position: absolute; width: 24px; height: 2px; background: white; border-radius: 2px; top: 13px; left: 50%; transform: translateX(-50%); opacity: 1; transition: all 0.3s ease;"></span>
    <span class="hamburger-line" style="position: absolute; width: 24px; height: 2px; background: white; border-radius: 2px; top: 20px; left: 50%; transform: translateX(-50%); transition: all 0.3s ease;"></span>
  `;

  document.body.appendChild(hamburger);

  // Create backdrop
  const backdrop = document.createElement("div");
  backdrop.id = "mobile-nav-backdrop";
  backdrop.className = "mobile-nav-backdrop";
  backdrop.style.display = "none";
  backdrop.style.position = "fixed";
  backdrop.style.top = "0";
  backdrop.style.left = "0";
  backdrop.style.right = "0";
  backdrop.style.bottom = "0";
  backdrop.style.background = "rgba(0, 0, 0, 0.5)";
  backdrop.style.zIndex = "1080";
  document.body.appendChild(backdrop);

  // Create mobile menu
  const mobileMenu = document.createElement("nav");
  mobileMenu.id = "mobile-nav-menu";
  mobileMenu.className = "mobile-nav-menu";
  mobileMenu.style.position = "fixed";
  mobileMenu.style.top = "0";
  mobileMenu.style.left = "-100%";
  mobileMenu.style.width = "280px";
  mobileMenu.style.height = "100vh";
  mobileMenu.style.background = "#000";
  mobileMenu.style.borderRight = "1px solid #333";
  mobileMenu.style.zIndex = "1090";
  mobileMenu.style.overflowY = "auto";
  mobileMenu.style.paddingTop = "5rem";
  mobileMenu.style.paddingBottom = "2rem";
  mobileMenu.style.transition = "left 0.3s cubic-bezier(0.4, 0, 0.2, 1)";

  // Get desktop nav and clone its structure
  const desktopNav = document.querySelector("header nav");
  if (desktopNav) {
    const navHTML = desktopNav.innerHTML;
    mobileMenu.innerHTML = navHTML;
  }

  document.body.appendChild(mobileMenu);
}

function attachEventHandlers() {
  const hamburger = document.getElementById("hamburger-btn");
  const backdrop = document.getElementById("mobile-nav-backdrop");
  const mobileMenu = document.getElementById("mobile-nav-menu");

  if (!hamburger || !mobileMenu) return;

  hamburger.addEventListener("click", toggleMenu);

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

  // Animate hamburger to X
  const lines = hamburger.querySelectorAll(".hamburger-line");
  lines[0].style.top = "13px";
  lines[0].style.transform = "translateX(-50%) rotate(45deg)";
  lines[1].style.opacity = "0";
  lines[2].style.top = "13px";
  lines[2].style.transform = "translateX(-50%) rotate(-45deg)";

  hamburger.setAttribute("aria-expanded", "true");

  mobileMenu.style.left = "0";
  if (backdrop) backdrop.style.display = "block";

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
  lines[0].style.top = "6px";
  lines[0].style.transform = "translateX(-50%) rotate(0deg)";
  lines[1].style.opacity = "1";
  lines[2].style.top = "20px";
  lines[2].style.transform = "translateX(-50%) rotate(0deg)";

  hamburger.setAttribute("aria-expanded", "false");

  mobileMenu.style.left = "-100%";
  if (backdrop) backdrop.style.display = "none";

  document.body.style.overflow = "";
  hamburger.focus();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initHamburgerMenu);
} else {
  initHamburgerMenu();
}
