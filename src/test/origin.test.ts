import { describe, expect, it } from "vitest";
import { publicOrigin } from "@/lib/minako/origin.server";

const PROJECT_ID = "a1bec8e3-df32-4a3d-af41-606160d49e50";

function req(host: string) {
  return new Request("http://localhost/auth/login", { headers: { "x-forwarded-host": host } });
}

describe("publicOrigin", () => {
  it("usa o endereço publicado quando o acesso vem dele", () => {
    expect(publicOrigin(req("minako-sserenity.lovable.app"))).toBe("https://minako-sserenity.lovable.app");
  });

  it("usa o endereço do preview quando o acesso vem dele", () => {
    const preview = `id-preview--${PROJECT_ID}.lovable.app`;
    expect(publicOrigin(req(preview))).toBe(`https://${preview}`);
  });

  it("não entrega o endereço a um host desconhecido", () => {
    expect(publicOrigin(req("invasor.example.com"))).toBe("https://minako-sserenity.lovable.app");
  });
});
