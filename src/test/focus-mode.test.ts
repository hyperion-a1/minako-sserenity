import { beforeEach, describe, expect, it } from "vitest";

import { isFocusMode, openSection, registerSection, sectionKey, setFocusMode, useCollapsed } from "@/lib/minako/sections";

void useCollapsed;
const read = () => JSON.parse(localStorage.getItem("minako:collapsed") || "{}") as Record<string, true>;

describe("modo foco", () => {
  beforeEach(() => localStorage.clear());

  it("vem ligado por padrão", () => {
    expect(isFocusMode()).toBe(true);
  });

  it("abrir uma seção fecha as outras quando ligado", () => {
    setFocusMode(true);
    ["a", "b", "c"].forEach((s) => registerSection("/x", s));
    openSection("/x", "b");
    const c = read();
    expect(c[sectionKey("/x", "a")]).toBe(true);
    expect(c[sectionKey("/x", "b")]).toBeUndefined();
    expect(c[sectionKey("/x", "c")]).toBe(true);
  });

  it("desligado, abrir uma seção não fecha as outras", () => {
    setFocusMode(false);
    ["a", "b"].forEach((s) => registerSection("/y", s));
    openSection("/y", "a");
    expect(read()[sectionKey("/y", "b")]).toBeUndefined();
  });
});
