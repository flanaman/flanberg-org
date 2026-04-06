const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];
const DOW_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SPECIALS = {
    "@yearly": "Once a year, at midnight on January 1st",
    "@annually": "Once a year, at midnight on January 1st",
    "@monthly": "Once a month, at midnight on the 1st",
    "@weekly": "Once a week, at midnight on Sunday",
    "@daily": "Once a day, at midnight",
    "@midnight": "Once a day, at midnight",
    "@hourly": "Once an hour, at the start of the hour",
    "@reboot": "At system startup",
};
const SPECIAL_EXPANSIONS = {
    "@yearly": "0 0 1 1 *",
    "@annually": "0 0 1 1 *",
    "@monthly": "0 0 1 * *",
    "@weekly": "0 0 * * 0",
    "@daily": "0 0 * * *",
    "@midnight": "0 0 * * *",
    "@hourly": "0 * * * *",
};
// ── Field parser ────────────────────────────────────────────────────────────
function parseField(raw, min, max, names) {
    const all = [];
    for (let i = min; i <= max; i++)
        all.push(i);
    if (raw === "*")
        return all;
    const result = new Set();
    for (const part of raw.split(",")) {
        const stepMatch = part.match(/^(.+)\/(\d+)$/);
        let range = part;
        let step = 1;
        if (stepMatch) {
            range = stepMatch[1];
            step = parseInt(stepMatch[2], 10);
            if (step < 1)
                throw new Error(`Invalid step value: ${stepMatch[2]}`);
        }
        let lo;
        let hi;
        if (range === "*") {
            lo = min;
            hi = max;
        }
        else if (range.includes("-")) {
            const [a, b] = range.split("-");
            lo = resolveValue(a, min, max, names);
            hi = resolveValue(b, min, max, names);
            if (lo > hi)
                throw new Error(`Invalid range: ${range}`);
        }
        else {
            lo = hi = resolveValue(range, min, max, names);
        }
        for (let v = lo; v <= hi; v += step) {
            result.add(v);
        }
    }
    return Array.from(result).sort((a, b) => a - b);
}
function resolveValue(s, min, max, names) {
    if (names) {
        const idx = names.findIndex((n) => n.toLowerCase() === s.toLowerCase());
        if (idx !== -1)
            return idx;
    }
    const n = parseInt(s, 10);
    if (isNaN(n) || n < min || n > max) {
        throw new Error(`Value ${s} out of range (${min}–${max})`);
    }
    return n;
}
// ── Human-readable descriptions ─────────────────────────────────────────────
function describeMinute(values, raw) {
    if (raw === "*")
        return "every minute";
    const stepMatch = raw.match(/^\*\/(\d+)$/);
    if (stepMatch)
        return `every ${stepMatch[1]} minutes`;
    if (values.length === 1)
        return `at minute ${values[0]}`;
    if (values.length <= 4)
        return `at minutes ${listJoin(values.map(String))}`;
    return `at ${values.length} specific minutes`;
}
function describeHour(values, raw) {
    if (raw === "*")
        return "every hour";
    const stepMatch = raw.match(/^\*\/(\d+)$/);
    if (stepMatch)
        return `every ${stepMatch[1]} hours`;
    if (values.length === 1)
        return `at ${formatHour(values[0])}`;
    if (values.length <= 4)
        return `at ${listJoin(values.map(formatHour))}`;
    return `at ${values.length} specific hours`;
}
function formatHour(h) {
    if (h === 0)
        return "midnight";
    if (h === 12)
        return "noon";
    return h < 12 ? `${h}:00 AM` : `${h - 12}:00 PM`;
}
function describeDom(values, raw) {
    if (raw === "*")
        return "";
    const stepMatch = raw.match(/^\*\/(\d+)$/);
    if (stepMatch)
        return `every ${stepMatch[1]} days`;
    if (values.length === 1)
        return `on the ${ordinal(values[0])}`;
    return `on days ${listJoin(values.map((v) => ordinal(v)))}`;
}
function describeMonth(values, raw) {
    if (raw === "*")
        return "";
    const stepMatch = raw.match(/^\*\/(\d+)$/);
    if (stepMatch)
        return `every ${stepMatch[1]} months`;
    if (values.length === 1)
        return `in ${MONTH_NAMES[values[0] - 1]}`;
    if (values.length <= 4)
        return `in ${listJoin(values.map((v) => MONTH_NAMES[v - 1]))}`;
    return `in ${values.length} months`;
}
function describeDow(values, raw) {
    if (raw === "*")
        return "";
    // Normalise 7 → 0 (both are Sunday)
    const normalised = [...new Set(values.map((v) => v % 7))].sort((a, b) => a - b);
    const stepMatch = raw.match(/^\*\/(\d+)$/);
    if (stepMatch)
        return `every ${stepMatch[1]} days of the week`;
    if (normalised.length === 7)
        return "";
    if (normalised.length === 1)
        return `on ${DOW_NAMES[normalised[0]]}`;
    if (normalised.length <= 4)
        return `on ${listJoin(normalised.map((v) => DOW_NAMES[v]))}`;
    return `on ${normalised.length} days of the week`;
}
function ordinal(n) {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}
function listJoin(items) {
    if (items.length === 1)
        return items[0];
    return items.slice(0, -1).join(", ") + " and " + items[items.length - 1];
}
// ── Summary sentence ────────────────────────────────────────────────────────
function buildSummary(minuteRaw, hourRaw, domRaw, monthRaw, dowRaw, minuteVals, hourVals, domVals, monthVals, dowVals) {
    const everyMinute = minuteRaw === "*";
    const everyHour = hourRaw === "*";
    const everyDom = domRaw === "*";
    const everyMonth = monthRaw === "*";
    const everyDow = dowRaw === "*";
    // Simple cases
    if (everyMinute && everyHour && everyDom && everyMonth && everyDow)
        return "Every minute";
    const minuteStepMatch = minuteRaw.match(/^\*\/(\d+)$/);
    if (minuteStepMatch && everyHour && everyDom && everyMonth && everyDow) {
        return `Every ${minuteStepMatch[1]} minutes`;
    }
    const hourStepMatch = hourRaw.match(/^\*\/(\d+)$/);
    if (hourStepMatch && minuteVals.length === 1 && everyDom && everyMonth && everyDow) {
        return `At minute ${minuteVals[0]} past every ${hourStepMatch[1]} hours`;
    }
    // Time part
    let timePart = "";
    if (!everyMinute || !everyHour) {
        if (everyMinute) {
            timePart = describeHour(hourVals, hourRaw) + ", " + describeMinute(minuteVals, minuteRaw);
        }
        else if (everyHour) {
            timePart = describeMinute(minuteVals, minuteRaw);
        }
        else if (minuteVals.length === 1 && hourVals.length === 1) {
            const h = hourVals[0], m = minuteVals[0];
            const period = h < 12 ? "AM" : "PM";
            const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
            const displayM = String(m).padStart(2, "0");
            timePart = `At ${displayH}:${displayM} ${period}`;
        }
        else {
            timePart = `${describeHour(hourVals, hourRaw)}, ${describeMinute(minuteVals, minuteRaw)}`;
        }
    }
    const domPart = !everyDom ? describeDom(domVals, domRaw) : "";
    const monthPart = !everyMonth ? describeMonth(monthVals, monthRaw) : "";
    const dowPart = !everyDow ? describeDow(dowVals, dowRaw) : "";
    const parts = [timePart, domPart, monthPart, dowPart].filter(Boolean);
    return parts.join(", ") || "Every minute";
}
// ── Next run calculator ─────────────────────────────────────────────────────
function nextRuns(minuteVals, hourVals, domVals, monthVals, dowVals, count = 5) {
    const dowSet = new Set(dowVals.map((d) => d % 7));
    const results = [];
    const now = new Date();
    // Start from next minute
    const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes() + 1, 0, 0);
    const limit = 366 * 24 * 60; // max 1 year of minutes
    for (let i = 0; i < limit && results.length < count; i++) {
        const mo = cursor.getMonth() + 1; // 1-12
        const dom = cursor.getDate();
        const dow = cursor.getDay(); // 0=Sun
        const h = cursor.getHours();
        const m = cursor.getMinutes();
        if (monthVals.includes(mo) &&
            domVals.includes(dom) &&
            dowSet.has(dow) &&
            hourVals.includes(h) &&
            minuteVals.includes(m)) {
            results.push(new Date(cursor));
        }
        cursor.setMinutes(cursor.getMinutes() + 1);
    }
    return results;
}
// ── Public API ──────────────────────────────────────────────────────────────
export function parseCron(raw) {
    const trimmed = raw.trim();
    if (SPECIALS[trimmed.toLowerCase()]) {
        const expansion = SPECIAL_EXPANSIONS[trimmed.toLowerCase()];
        const base = expansion ? parseCron(expansion) : { summary: "", fieldDescriptions: [], nextRuns: [], error: undefined };
        return { ...base, summary: SPECIALS[trimmed.toLowerCase()] };
    }
    const parts = trimmed.split(/\s+/);
    if (parts.length !== 5)
        throw new Error(`Expected 5 fields, got ${parts.length}`);
    const [minRaw, hrRaw, domRaw, moRaw, dowRaw] = parts;
    const minVals = parseField(minRaw, 0, 59);
    const hrVals = parseField(hrRaw, 0, 23);
    const domVals = parseField(domRaw, 1, 31);
    const moVals = parseField(moRaw, 1, 12, MONTH_NAMES);
    const dowVals = parseField(dowRaw, 0, 7, DOW_NAMES);
    const summary = buildSummary(minRaw, hrRaw, domRaw, moRaw, dowRaw, minVals, hrVals, domVals, moVals, dowVals);
    const fieldDescriptions = [
        `Minute: ${describeMinute(minVals, minRaw)}`,
        `Hour: ${describeHour(hrVals, hrRaw)}`,
        `Day of month: ${domRaw === "*" ? "every day" : describeDom(domVals, domRaw)}`,
        `Month: ${moRaw === "*" ? "every month" : describeMonth(moVals, moRaw)}`,
        `Day of week: ${dowRaw === "*" ? "every day" : describeDow(dowVals, dowRaw)}`,
    ];
    const runs = nextRuns(minVals, hrVals, domVals, moVals, dowVals);
    return { summary, fieldDescriptions, nextRuns: runs };
}
// ── DOM ─────────────────────────────────────────────────────────────────────
const EXAMPLES = [
    { label: "Every minute", expr: "* * * * *" },
    { label: "Every 5 minutes", expr: "*/5 * * * *" },
    { label: "Every day at midnight", expr: "0 0 * * *" },
    { label: "Every weekday at 9 AM", expr: "0 9 * * 1-5" },
    { label: "Every Sunday at noon", expr: "0 12 * * 0" },
    { label: "1st of every month", expr: "0 0 1 * *" },
];
export function initCron() {
    const input = document.getElementById("cron-input");
    const errorEl = document.getElementById("cron-error");
    const resultEl = document.getElementById("cron-result");
    const examples = document.querySelectorAll(".cron-example");
    examples.forEach((btn) => {
        btn.addEventListener("click", () => {
            input.value = btn.dataset.expr ?? "";
            run();
        });
    });
    function run() {
        const val = input.value.trim();
        errorEl.textContent = "";
        errorEl.classList.add("hidden");
        resultEl.classList.add("hidden");
        resultEl.innerHTML = "";
        if (!val)
            return;
        let result;
        try {
            result = parseCron(val);
        }
        catch (e) {
            errorEl.textContent = e.message;
            errorEl.classList.remove("hidden");
            return;
        }
        const runsHtml = result.nextRuns.length
            ? result.nextRuns.map((d) => `<li class="mono">${formatDate(d)}</li>`).join("")
            : "<li>No upcoming runs found within the next year.</li>";
        resultEl.innerHTML = `
      <div class="cron-summary">${result.summary}</div>
      <table class="result-table">
        <tbody>
          ${result.fieldDescriptions.map((d) => {
            const [label, ...rest] = d.split(": ");
            return `<tr><th>${label}</th><td>${rest.join(": ")}</td></tr>`;
        }).join("")}
        </tbody>
      </table>
      <div class="cron-next">
        <p class="match-count">Next 5 runs</p>
        <ul class="cron-runs">${runsHtml}</ul>
      </div>
    `;
        resultEl.classList.remove("hidden");
    }
    input.addEventListener("input", run);
}
function formatDate(d) {
    return d.toLocaleString(undefined, {
        weekday: "short", year: "numeric", month: "short",
        day: "numeric", hour: "2-digit", minute: "2-digit",
    });
}
export { EXAMPLES };
