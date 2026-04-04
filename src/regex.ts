export function initRegex(): void {
  const patternInput = document.getElementById("regex-pattern") as HTMLInputElement;
  const flagsInput = document.getElementById("regex-flags") as HTMLInputElement;
  const testInput = document.getElementById("regex-input") as HTMLTextAreaElement;
  const errorEl = document.getElementById("regex-error") as HTMLParagraphElement;
  const highlightedEl = document.getElementById("regex-highlighted") as HTMLDivElement;
  const matchesEl = document.getElementById("regex-matches") as HTMLDivElement;

  function escapeHtml(s: string): string {
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function run(): void {
    const pattern = patternInput.value;
    const flags = flagsInput.value.replace(/[^gimsuy]/g, "");
    const text = testInput.value;

    errorEl.textContent = "";
    errorEl.classList.add("hidden");
    highlightedEl.innerHTML = "";
    matchesEl.innerHTML = "";

    if (!pattern) {
      highlightedEl.innerHTML = `<pre>${escapeHtml(text)}</pre>`;
      return;
    }

    let re: RegExp;
    try {
      // Always include 'd' flag for indices if supported, plus user flags
      // Ensure 'g' is present so we can iterate all matches
      const effectiveFlags = flags.includes("g") ? flags : flags + "g";
      re = new RegExp(pattern, effectiveFlags);
    } catch (e) {
      errorEl.textContent = (e as Error).message;
      errorEl.classList.remove("hidden");
      highlightedEl.innerHTML = `<pre>${escapeHtml(text)}</pre>`;
      return;
    }

    const matches: RegExpExecArray[] = [];
    let m: RegExpExecArray | null;
    // Guard against zero-length matches causing infinite loops
    let lastIndex = -1;
    while ((m = re.exec(text)) !== null) {
      matches.push(m);
      if (re.lastIndex === lastIndex) {
        re.lastIndex++;
      }
      lastIndex = re.lastIndex;
    }

    // Build highlighted output
    let html = "";
    let cursor = 0;
    for (const match of matches) {
      const start = match.index;
      const end = start + match[0].length;
      if (start > cursor) {
        html += escapeHtml(text.slice(cursor, start));
      }
      html += `<mark class="match">${escapeHtml(match[0])}</mark>`;
      cursor = end;
    }
    if (cursor < text.length) {
      html += escapeHtml(text.slice(cursor));
    }
    highlightedEl.innerHTML = `<pre>${html}</pre>`;

    // Build match list
    if (matches.length === 0) {
      matchesEl.innerHTML = `<p class="no-matches">No matches found.</p>`;
      return;
    }

    const countLabel = matches.length === 1 ? "1 match" : `${matches.length} matches`;
    let table = `<p class="match-count">${countLabel}</p><table class="result-table"><thead><tr><th>#</th><th>Match</th>`;

    const groupCount = re.source
      ? (new RegExp(re.source + "|").exec("")!.length - 1)
      : 0;

    for (let g = 1; g <= groupCount; g++) {
      table += `<th>Group ${g}</th>`;
    }
    table += `<th>Index</th></tr></thead><tbody>`;

    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      table += `<tr><td>${i + 1}</td><td class="mono">${escapeHtml(match[0])}</td>`;
      for (let g = 1; g <= groupCount; g++) {
        table += `<td class="mono">${match[g] !== undefined ? escapeHtml(match[g]) : '<span class="dim">—</span>'}</td>`;
      }
      table += `<td class="mono">${match.index}</td></tr>`;
    }
    table += `</tbody></table>`;
    matchesEl.innerHTML = table;
  }

  patternInput.addEventListener("input", run);
  flagsInput.addEventListener("input", run);
  testInput.addEventListener("input", run);
}
