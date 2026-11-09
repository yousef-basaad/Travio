import { describe, it, expect } from "vitest";
import { brandThemeCss, brandThemeVars, isHexColor, readableOn } from "./theme";

describe("brand theme", () => {
  it("accepts only #RRGGBB", () => {
    expect(isHexColor("#16A34A")).toBe(true);
    for (const bad of ["red", "#fff", "#12345g", "#123456;}", null, 5]) expect(isHexColor(bad)).toBe(false);
  });

  it("converts a color to the token format", () => {
    expect(brandThemeVars({ primaryColor: "#ff0000", sidebarColor: null })["--primary"]).toBe("0 100% 50%");
    expect(brandThemeVars({ primaryColor: "#808080", sidebarColor: null })["--primary"]).toBe("0 0% 50%");
  });

  it("keeps text readable on any color", () => {
    expect(readableOn("#0f172a")).toBe("white");
    expect(readableOn("#ffeb3b")).toBe("dark");
    expect(brandThemeVars({ primaryColor: "#ffeb3b", sidebarColor: null })["--primary-foreground"]).toBe("222 47% 11%");
  });

  it("moves sidebar hover towards the readable side", () => {
    const dark = brandThemeVars({ primaryColor: null, sidebarColor: "#102030" });
    expect(dark["--sidebar-foreground"]).toBe("210 40% 98%");
    expect(Number(dark["--sidebar-hover"]!.split(" ")[2]!.replace("%", ""))).toBeGreaterThan(13);
    const light = brandThemeVars({ primaryColor: null, sidebarColor: "#f0f0f0" });
    expect(Number(light["--sidebar-hover"]!.split(" ")[2]!.replace("%", ""))).toBeLessThan(94);
  });

  it("drops anything that isn't a valid color", () => {
    expect(brandThemeCss({ primaryColor: "#fff;}body{display:none}", sidebarColor: "red" })).toBe("");
    expect(brandThemeCss({ primaryColor: null, sidebarColor: null })).toBe("");
  });

  it("builds a stylesheet from numbers only", () => {
    expect(brandThemeCss({ primaryColor: "#ff0000", sidebarColor: null })).toBe(
      ":root{--primary:0 100% 50%;--primary-hover:0 100% 45%;--primary-foreground:222 47% 11%;--ring:0 100% 50%;--sidebar-active:0 100% 50%;--sidebar-active-foreground:222 47% 11%}",
    );
  });
});
