const header = document.querySelector("[data-header]");
const toggle = document.querySelector("[data-menu-toggle]");
const nav = document.querySelector("[data-nav]");
const year = document.querySelector("[data-year]");

if (year) {
  year.textContent = String(new Date().getFullYear());
}

const onScroll = () => {
  header?.classList.toggle("is-scrolled", window.scrollY > 8);
};

onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

toggle?.addEventListener("click", () => {
  const open = nav?.classList.toggle("is-open");
  toggle.setAttribute("aria-expanded", open ? "true" : "false");
});

nav?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    nav.classList.remove("is-open");
    toggle?.setAttribute("aria-expanded", "false");
  });
});

const motionOk = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (motionOk && "IntersectionObserver" in window) {
  const blocks = document.querySelectorAll("main section");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.16 }
  );

  blocks.forEach((block) => observer.observe(block));
}

document.querySelectorAll("[data-store]").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    const note = document.querySelector("[data-store-note]");
    if (!note) return;
    const label = link.getAttribute("data-store") === "ios" ? "App Store" : "Google Play";
    note.textContent = `${label} will open here once the listing is live.`;
  });
});
