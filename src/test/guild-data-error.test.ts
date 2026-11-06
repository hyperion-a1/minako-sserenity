import { describe, it, expect } from "vitest";
import { explainGuildDataError as e } from "@/lib/minako/guild-data-error";
describe("explainGuildDataError", () => {
  it("401 aponta para o token", () => expect(e("x (channels: HTTP 401).")).toMatch(/MINAKO_TOKEN/));
  it("403 aponta para convite/permissão", () => expect(e("x (roles: HTTP 403).")).toMatch(/não está neste servidor/));
  it("desconhecido mostra o texto original", () => expect(e("boom")).toMatch(/boom/));
});
