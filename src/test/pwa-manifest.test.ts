import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const manifest = JSON.parse(readFileSync("public/manifest.webmanifest", "utf8"));

describe("Minako home-screen installation", () => {
  it("opens the panel in standalone mode", () => {
    expect(manifest.start_url).toBe("/painel");
    expect(manifest.display).toBe("standalone");
  });

  it("keeps Discord callback inside the app scope", () => {
    const origin = "https://minako-sserenity.lovable.app";
    const scope = new URL(manifest.scope, origin);
    expect(new URL("/auth/callback", origin).href.startsWith(scope.href)).toBe(true);
  });

  it("ships square PNG icons with the advertised dimensions", () => {
    for (const icon of manifest.icons) {
      const png = readFileSync(`public${icon.src}`);
      expect(png.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
      const [width, height] = icon.sizes.split("x").map(Number);
      expect(png.readUInt32BE(16)).toBe(width);
      expect(png.readUInt32BE(20)).toBe(height);
    }
    expect(manifest.icons.some((icon: { purpose: string }) => icon.purpose === "maskable")).toBe(true);
  });
});