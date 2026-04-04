import "./style.css";
import { initCidr } from "./cidr";
import { initRegex } from "./regex";

const TOOLS = ["home", "cidr", "regex"] as const;
type Tool = (typeof TOOLS)[number];

function getHash(): Tool {
  const hash = window.location.hash.replace("#", "") as Tool;
  return TOOLS.includes(hash) ? hash : "home";
}

function navigate(tool: Tool): void {
  // Show/hide views
  for (const t of TOOLS) {
    const el = document.getElementById(`view-${t}`);
    if (el) el.classList.toggle("hidden", t !== tool);
  }

  // Update nav link active state
  document.querySelectorAll<HTMLAnchorElement>(".nav-links a[data-tool]").forEach((a) => {
    a.classList.toggle("active", a.dataset.tool === tool);
  });

  // Update document title
  const titles: Record<Tool, string> = {
    home: "Tools — flanberg.org",
    cidr: "CIDR Calculator — flanberg.org",
    regex: "Regex Tester — flanberg.org",
  };
  document.title = titles[tool];
}

// Init tools
initCidr();
initRegex();

// Initial render
navigate(getHash());

// Hash change routing
window.addEventListener("hashchange", () => navigate(getHash()));
