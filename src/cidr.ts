export interface CidrResult {
  input: string;
  ipAddress: string;
  prefix: number;
  networkAddress: string;
  broadcastAddress: string;
  subnetMask: string;
  wildcardMask: string;
  firstHost: string;
  lastHost: string;
  totalHosts: number;
  usableHosts: number;
  ipClass: string;
  ipType: string;
}

function ipToInt(ip: string): number {
  return ip
    .split(".")
    .reduce((acc, octet) => (acc << 8) | parseInt(octet, 10), 0) >>> 0;
}

function intToIp(n: number): string {
  return [
    (n >>> 24) & 0xff,
    (n >>> 16) & 0xff,
    (n >>> 8) & 0xff,
    n & 0xff,
  ].join(".");
}

function validateIp(ip: string): boolean {
  const parts = ip.split(".");
  if (parts.length !== 4) return false;
  return parts.every((p) => {
    const n = parseInt(p, 10);
    return !isNaN(n) && n >= 0 && n <= 255 && String(n) === p;
  });
}

function getIpClass(ip: string): string {
  const first = parseInt(ip.split(".")[0], 10);
  if (first >= 1 && first <= 126) return "A";
  if (first === 127) return "Loopback";
  if (first >= 128 && first <= 191) return "B";
  if (first >= 192 && first <= 223) return "C";
  if (first >= 224 && first <= 239) return "D (Multicast)";
  return "E (Reserved)";
}

function getIpType(ip: string): string {
  const n = ipToInt(ip);
  // 10.0.0.0/8
  if ((n >>> 24) === 10) return "Private";
  // 172.16.0.0/12
  if ((n >>> 20) === (172 << 4) + 1) return "Private";
  // 192.168.0.0/16
  if ((n >>> 16) === (192 << 8) + 168) return "Private";
  // 127.0.0.0/8
  if ((n >>> 24) === 127) return "Loopback";
  // 169.254.0.0/16
  if ((n >>> 16) === (169 << 8) + 254) return "Link-local";
  // 224.0.0.0/4
  if ((n >>> 28) === 14) return "Multicast";
  return "Public";
}

export function parseCidr(input: string): CidrResult {
  const trimmed = input.trim();
  const slashIndex = trimmed.lastIndexOf("/");

  let ip: string;
  let prefix: number;

  if (slashIndex === -1) {
    // bare IP, assume /32
    ip = trimmed;
    prefix = 32;
  } else {
    ip = trimmed.slice(0, slashIndex);
    const prefixStr = trimmed.slice(slashIndex + 1);
    prefix = parseInt(prefixStr, 10);
    if (isNaN(prefix) || prefix < 0 || prefix > 32) {
      throw new Error(`Invalid prefix length: ${prefixStr}. Must be 0–32.`);
    }
  }

  if (!validateIp(ip)) {
    throw new Error(`Invalid IP address: "${ip}"`);
  }

  const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
  const wildcard = (~mask) >>> 0;
  const ipInt = ipToInt(ip);
  const networkInt = (ipInt & mask) >>> 0;
  const broadcastInt = (networkInt | wildcard) >>> 0;

  const totalHosts = prefix === 32 ? 1 : prefix === 31 ? 2 : Math.pow(2, 32 - prefix);
  const usableHosts = prefix >= 31 ? totalHosts : totalHosts - 2;

  const firstHostInt = prefix >= 31 ? networkInt : (networkInt + 1) >>> 0;
  const lastHostInt = prefix >= 31 ? broadcastInt : (broadcastInt - 1) >>> 0;

  return {
    input: trimmed,
    ipAddress: ip,
    prefix,
    networkAddress: intToIp(networkInt),
    broadcastAddress: intToIp(broadcastInt),
    subnetMask: intToIp(mask),
    wildcardMask: intToIp(wildcard),
    firstHost: intToIp(firstHostInt),
    lastHost: intToIp(lastHostInt),
    totalHosts,
    usableHosts,
    ipClass: getIpClass(ip),
    ipType: getIpType(ip),
  };
}

function row(label: string, value: string, mono = true): string {
  return `<tr><th>${label}</th><td${mono ? ' class="mono"' : ""}>${value}</td></tr>`;
}

export function renderCidr(container: HTMLElement, result: CidrResult): void {
  container.innerHTML = `
    <table class="result-table">
      <tbody>
        ${row("IP Address", result.ipAddress)}
        ${row("Prefix Length", `/${result.prefix}`, false)}
        ${row("Subnet Mask", result.subnetMask)}
        ${row("Wildcard Mask", result.wildcardMask)}
        ${row("Network Address", result.networkAddress)}
        ${row("Broadcast Address", result.broadcastAddress)}
        ${row("First Usable Host", result.firstHost)}
        ${row("Last Usable Host", result.lastHost)}
        ${row("Total Addresses", result.totalHosts.toLocaleString(), false)}
        ${row("Usable Hosts", result.usableHosts.toLocaleString(), false)}
        ${row("IP Class", result.ipClass, false)}
        ${row("IP Type", result.ipType, false)}
      </tbody>
    </table>
  `;
  container.classList.remove("hidden");
}

export function initCidr(): void {
  const input = document.getElementById("cidr-input") as HTMLInputElement;
  const btn = document.getElementById("cidr-calc-btn") as HTMLButtonElement;
  const result = document.getElementById("cidr-result") as HTMLDivElement;

  function calculate(): void {
    const val = input.value.trim();
    if (!val) return;
    try {
      const parsed = parseCidr(val);
      result.classList.remove("error");
      renderCidr(result, parsed);
    } catch (e) {
      result.innerHTML = `<p class="error-text">${(e as Error).message}</p>`;
      result.classList.add("error");
      result.classList.remove("hidden");
    }
  }

  btn.addEventListener("click", calculate);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") calculate();
  });
}
