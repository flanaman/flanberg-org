import "./style.css";
import { initCidr } from "./cidr";
import { initRegex } from "./regex";
import { initCron, EXAMPLES as CRON_EXAMPLES } from "./cron";
const TOOLS = ["home", "cidr", "regex", "cron"];
function getHash() {
    const hash = window.location.hash.replace("#", "");
    return TOOLS.includes(hash) ? hash : "home";
}
function navigate(tool) {
    // Show/hide views
    for (const t of TOOLS) {
        const el = document.getElementById(`view-${t}`);
        if (el)
            el.classList.toggle("hidden", t !== tool);
    }
    // Update nav link active state
    document.querySelectorAll(".nav-links a[data-tool]").forEach((a) => {
        a.classList.toggle("active", a.dataset.tool === tool);
    });
    // Update document title
    const titles = {
        home: "Tools — flanberg.org",
        cidr: "CIDR Calculator — flanberg.org",
        regex: "Regex Tester — flanberg.org",
        cron: "Cron Explainer — flanberg.org",
    };
    document.title = titles[tool];
}
// Populate cron examples
const cronExamplesEl = document.getElementById("cron-examples");
if (cronExamplesEl) {
    cronExamplesEl.innerHTML = CRON_EXAMPLES.map((e) => `<button class="cron-example" data-expr="${e.expr}">${e.label}</button>`).join("");
}
// Init tools
initCidr();
initRegex();
initCron();
// Initial render
navigate(getHash());
// Hash change routing
window.addEventListener("hashchange", () => navigate(getHash()));
