import { lookup as dnsLookup } from "node:dns/promises";
import { isIP } from "node:net";

export const MAX_PREVIEW_BYTES = 1024 * 1024;
export const MAX_PREVIEW_REDIRECTS = 3;

export class UnsafeLinkPreviewUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnsafeLinkPreviewUrlError";
  }
}

export type DnsResolver = (
  hostname: string,
  options: { all: true; verbatim: true }
) => Promise<Array<{ address: string; family: number }>>;

const lookup: DnsResolver = dnsLookup;

export function parseHttpUrl(input: string): URL | null {
  try {
    const url = new URL(input);
    return url.protocol === "http:" || url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

function normalizeHostname(hostname: string): string {
  let normalized = hostname.trim().toLowerCase();

  if (normalized.startsWith("[") && normalized.endsWith("]")) {
    normalized = normalized.slice(1, -1);
  }

  return normalized.endsWith(".") ? normalized.slice(0, -1) : normalized;
}

export function isBlockedHostname(hostname: string): boolean {
  const normalized = normalizeHostname(hostname);
  return normalized === "" || normalized === "localhost" || normalized.endsWith(".localhost");
}

function parseIpv4(address: string): number | null {
  const parts = address.split(".");
  if (parts.length !== 4) return null;

  let value = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const octet = Number(part);
    if (octet < 0 || octet > 255) return null;
    value = (value << 8) | octet;
  }

  return value >>> 0;
}

function isIpv4InRange(value: number, base: number, prefix: number): boolean {
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  return (value & mask) === (base & mask);
}

const BLOCKED_IPV4_RANGE_DEFINITIONS: Array<[string, number]> = [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.88.99.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
];

const BLOCKED_IPV4_RANGES: Array<[number, number]> = BLOCKED_IPV4_RANGE_DEFINITIONS.map(([base, prefix]) => [
  parseIpv4(base) ?? 0,
  prefix,
]);

function isBlockedIpv4(address: string): boolean {
  const value = parseIpv4(address);
  if (value === null) return false;

  return BLOCKED_IPV4_RANGES.some(([base, prefix]) => isIpv4InRange(value, base, prefix));
}

function parseIpv6(address: string): Uint8Array | null {
  let normalized = normalizeHostname(address);
  const zoneIndex = normalized.indexOf("%");
  if (zoneIndex >= 0) normalized = normalized.slice(0, zoneIndex);

  if (isIP(normalized) !== 6) return null;

  if (normalized.includes(".")) {
    const lastColon = normalized.lastIndexOf(":");
    const ipv4Part = normalized.slice(lastColon + 1);
    const ipv4Value = parseIpv4(ipv4Part);
    if (ipv4Value === null) return null;

    const high = ((ipv4Value >>> 16) & 0xffff).toString(16);
    const low = (ipv4Value & 0xffff).toString(16);
    normalized = `${normalized.slice(0, lastColon)}:${high}:${low}`;
  }

  const doubleColonParts = normalized.split("::");
  if (doubleColonParts.length > 2) return null;

  const left = doubleColonParts[0]
    ? doubleColonParts[0].split(":").filter((part) => part.length > 0)
    : [];
  const right = doubleColonParts[1]
    ? doubleColonParts[1].split(":").filter((part) => part.length > 0)
    : [];

  const missing = doubleColonParts.length === 2 ? 8 - left.length - right.length : 0;
  if (missing < 0) return null;

  const hextets = doubleColonParts.length === 2
    ? [...left, ...Array(missing).fill("0"), ...right]
    : left;

  if (hextets.length !== 8) return null;

  const bytes = new Uint8Array(16);
  for (let index = 0; index < hextets.length; index++) {
    const hextet = hextets[index];
    if (!/^[0-9a-f]{1,4}$/i.test(hextet)) return null;
    const value = Number.parseInt(hextet, 16);
    bytes[index * 2] = (value >>> 8) & 0xff;
    bytes[index * 2 + 1] = value & 0xff;
  }

  return bytes;
}

function mappedIpv4FromIpv6(bytes: Uint8Array): string | null {
  const isMapped = bytes.slice(0, 10).every((byte) => byte === 0)
    && bytes[10] === 0xff
    && bytes[11] === 0xff;

  if (!isMapped) return null;

  return `${bytes[12]}.${bytes[13]}.${bytes[14]}.${bytes[15]}`;
}

function isBlockedIpv6(address: string): boolean {
  const bytes = parseIpv6(address);
  if (!bytes) return false;

  const mappedIpv4 = mappedIpv4FromIpv6(bytes);
  if (mappedIpv4) return isBlockedIpv4(mappedIpv4);

  const allZero = bytes.every((byte) => byte === 0);
  if (allZero) return true;

  const loopback = bytes.slice(0, 15).every((byte) => byte === 0) && bytes[15] === 1;
  if (loopback) return true;

  const isDiscardPrefix = bytes[0] === 0x01 && bytes.slice(1, 8).every((byte) => byte === 0);
  const isDocumentation = bytes[0] === 0x20 && bytes[1] === 0x01 && bytes[2] === 0x0d && bytes[3] === 0xb8;
  const isUniqueLocal = (bytes[0] & 0xfe) === 0xfc;
  const isLinkLocal = bytes[0] === 0xfe && (bytes[1] & 0xc0) === 0x80;
  const isMulticast = bytes[0] === 0xff;

  return isDiscardPrefix || isDocumentation || isUniqueLocal || isLinkLocal || isMulticast;
}

export function isBlockedIp(address: string): boolean {
  const normalized = normalizeHostname(address);
  const family = isIP(normalized);

  if (family === 4) return isBlockedIpv4(normalized);
  if (family === 6) return isBlockedIpv6(normalized);
  return false;
}

export async function validateFetchTarget(url: URL, resolver: DnsResolver = lookup): Promise<void> {
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new UnsafeLinkPreviewUrlError("Only HTTP(S) URLs are allowed");
  }

  const hostname = normalizeHostname(url.hostname);
  if (isBlockedHostname(hostname)) {
    throw new UnsafeLinkPreviewUrlError("Blocked hostname");
  }

  const directIpFamily = isIP(hostname);
  if (directIpFamily !== 0) {
    if (isBlockedIp(hostname)) {
      throw new UnsafeLinkPreviewUrlError("Blocked IP address");
    }
    return;
  }

  const addresses = await resolver(hostname, { all: true, verbatim: true });
  if (addresses.length === 0) {
    throw new UnsafeLinkPreviewUrlError("Hostname did not resolve");
  }

  if (addresses.some(({ address }) => isBlockedIp(address))) {
    throw new UnsafeLinkPreviewUrlError("Hostname resolves to a blocked address");
  }
}

export function resolveRedirectUrl(currentUrl: URL, location: string | null): URL | null {
  if (!location) return null;
  try {
    return new URL(location, currentUrl);
  } catch {
    return null;
  }
}

export function isPreviewHtmlContentType(contentType: string | null): boolean {
  if (!contentType) return false;
  const mediaType = contentType.split(";", 1)[0]?.trim().toLowerCase();
  return mediaType === "text/html" || mediaType === "application/xhtml+xml";
}

export async function readLimitedText(
  response: Response,
  maxBytes: number = MAX_PREVIEW_BYTES
): Promise<string | null> {
  if (!response.body) return null;

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (!value) continue;

      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return new TextDecoder().decode(body);
}
