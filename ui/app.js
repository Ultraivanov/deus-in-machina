import { resolveRoute } from "./router.js";

const app = document.getElementById("app");

const render = () => {
  if (!app) return;
  const view = resolveRoute();
  app.innerHTML = `
    <section class="card">
      <h2>${view().title}</h2>
      ${view().body}
    </section>
  `;

  document.querySelectorAll(".nav a").forEach((link) => {
    if (link.getAttribute("href") === window.location.hash) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });
};

window.addEventListener("hashchange", render);
window.addEventListener("load", render);
