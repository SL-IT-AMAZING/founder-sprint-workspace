import { expect, test } from "@playwright/test";
import {
  MAX_PREVIEW_BYTES,
  UnsafeLinkPreviewUrlError,
  isBlockedHostname,
  isBlockedIp,
  parseHttpUrl,
  readLimitedText,
  resolveRedirectUrl,
  validateFetchTarget,
  type DnsResolver,
} from "../src/lib/link-preview-security";

const publicResolver: DnsResolver = async () => [{ address: "93.184.216.34", family: 4 }];
const privateResolver: DnsResolver = async () => [{ address: "10.0.0.5", family: 4 }];
const mixedResolver: DnsResolver = async () => [
  { address: "93.184.216.34", family: 4 },
  { address: "192.168.1.5", family: 4 },
];

test.describe("link preview URL security helpers", () => {
  test("parseHttpUrl only accepts HTTP(S) URLs", () => {
    expect(parseHttpUrl("https://example.com/path")?.href).toBe("https://example.com/path");
    expect(parseHttpUrl("http://example.com/path")?.href).toBe("http://example.com/path");
    expect(parseHttpUrl("file:///etc/passwd")).toBeNull();
    expect(parseHttpUrl("data:text/html,hello")).toBeNull();
    expect(parseHttpUrl("javascript:alert(1)")).toBeNull();
    expect(parseHttpUrl("not a url")).toBeNull();
  });

  test("blocks localhost hostnames", () => {
    expect(isBlockedHostname("localhost")).toBe(true);
    expect(isBlockedHostname("localhost.")).toBe(true);
    expect(isBlockedHostname("foo.localhost")).toBe(true);
    expect(isBlockedHostname("linkedin.com")).toBe(false);
    expect(isBlockedHostname("example.com")).toBe(false);
  });

  test("blocks non-public IPv4 ranges", () => {
    for (const address of [
      "0.0.0.0",
      "10.0.0.1",
      "100.64.0.1",
      "127.0.0.1",
      "169.254.169.254",
      "172.16.0.1",
      "172.31.255.255",
      "192.0.0.1",
      "192.0.2.1",
      "192.88.99.1",
      "192.168.1.1",
      "198.18.0.1",
      "198.51.100.1",
      "203.0.113.1",
      "224.0.0.1",
      "240.0.0.1",
      "255.255.255.255",
    ]) {
      expect(isBlockedIp(address), address).toBe(true);
    }

    expect(isBlockedIp("8.8.8.8")).toBe(false);
  });

  test("blocks non-public IPv6 ranges and IPv4-mapped IPv6", () => {
    for (const address of [
      "::",
      "::1",
      "100::1",
      "2001:db8::1",
      "fc00::1",
      "fd00::1",
      "fe80::1",
      "ff00::1",
      "::ffff:127.0.0.1",
      "::ffff:10.0.0.1",
    ]) {
      expect(isBlockedIp(address), address).toBe(true);
    }

    expect(isBlockedIp("2606:4700:4700::1111")).toBe(false);
  });

  test("validates DNS results before fetching", async () => {
    await expect(validateFetchTarget(new URL("https://example.com"), publicResolver)).resolves.toBeUndefined();
    await expect(validateFetchTarget(new URL("https://example.com"), privateResolver)).rejects.toThrow(UnsafeLinkPreviewUrlError);
    await expect(validateFetchTarget(new URL("https://example.com"), mixedResolver)).rejects.toThrow(UnsafeLinkPreviewUrlError);
    await expect(validateFetchTarget(new URL("http://127.0.0.1"), publicResolver)).rejects.toThrow(UnsafeLinkPreviewUrlError);
  });

  test("resolves redirect locations relative to the current URL", () => {
    const currentUrl = new URL("https://example.com/articles/page");

    expect(resolveRedirectUrl(currentUrl, "https://example.org/next")?.href).toBe("https://example.org/next");
    expect(resolveRedirectUrl(currentUrl, "/login")?.href).toBe("https://example.com/login");
    expect(resolveRedirectUrl(currentUrl, null)).toBeNull();
    expect(resolveRedirectUrl(currentUrl, "http://[::1")).toBeNull();
  });

  test("readLimitedText enforces a hard body size limit", async () => {
    await expect(readLimitedText(new Response("<html>ok</html>"), 1024)).resolves.toBe("<html>ok</html>");

    const oversizedBody = new Uint8Array(MAX_PREVIEW_BYTES + 1);
    oversizedBody.fill(97);
    await expect(readLimitedText(new Response(oversizedBody), MAX_PREVIEW_BYTES)).resolves.toBeNull();
  });
});
