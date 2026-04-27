// DSR Web Panel - Main Application
import { resolveRoute } from "./router.js";

const app = document.getElementById("app");
const pageTitle = document.getElementById("page-title");

// Mock data for demo (replace with real API calls)
const mockData = {
  tokens: {
    total: 156,
    collections: 4,
    lastSync: "2026-04-27T14:30:00Z"
  },
  validation: {
    errors: 3,
    warnings: 12,
    passed: 141
  },
  health: {
    status: "healthy",
    uptime: "99.9%",
    latency: "45ms"
  }
};

const render = () => {
  if (!app) return;
  
  const route = window.location.hash.slice(1) || "dashboard";
  const view = resolveRoute(route);
  
  // Update page title
  if (pageTitle) {
    pageTitle.textContent = view.title;
  }
  
  // Update active nav
  document.querySelectorAll(".nav-item").forEach((link) => {
    const href = link.getAttribute("href");
    if (href === `#${route}` || (route === "dashboard" && href === "#dashboard")) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });
  
  // Render content
  app.innerHTML = view.render(mockData);
};

// Event handlers
window.addEventListener("hashchange", render);
window.addEventListener("load", render);

// Refresh button
const refreshBtn = document.getElementById("refresh-btn");
if (refreshBtn) {
  refreshBtn.addEventListener("click", () => {
    // Reload data from API
    render();
    console.log("Data refreshed");
  });
}

// Export button  
const exportBtn = document.getElementById("export-btn");
if (exportBtn) {
  exportBtn.addEventListener("click", () => {
    const dataStr = JSON.stringify(mockData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dsr-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });
}
