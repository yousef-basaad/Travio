import { describe, it, expect } from "vitest";
import { agencySiteService, toPublicAgencySite, DEFAULT_AGENCY_SITE } from "./agency-site.service";
import { createFakeSupabaseClient, findCallsByMethod } from "../test-utils/fake-supabase";

// Access rules are covered by supabase/tests/agency_sites.test.sql.
describe("agency site", () => {
  it("maps a public site", () => {
    expect(
      toPublicAgencySite(
        {
          name: "Alpha", slug: "alpha", logo_path: "t1/logo.png", hero_path: "t1/hero.png", template: "split", tagline: "", primary_color: "#16a34a", language: "en",
          headline: "Go", subheadline: null, services: ["flights", "casino"], about: "A", city: null, phone: "+966500000000", whatsapp: null, email: null,
        },
        (path) => `https://cdn/${path}`,
      ),
    ).toEqual({
      name: "Alpha", slug: "alpha", logoUrl: "https://cdn/t1/logo.png", heroUrl: "https://cdn/t1/hero.png", template: "split", tagline: null, primaryColor: "#16a34a", language: "en",
      headline: "Go", subheadline: null, services: ["flights"], about: "A", city: null, phone: "+966500000000", whatsapp: null, email: null,
    });
  });

  it("falls back to the classic template on an unknown value", () => {
    expect(toPublicAgencySite({ name: "A", headline: "Go", template: "neon" }, () => "")?.template).toBe("classic");
  });

  it("treats anything without a headline as no site", () => {
    expect(toPublicAgencySite(null, () => "")).toBeNull();
    expect(toPublicAgencySite({ name: "A", headline: "" }, () => "")).toBeNull();
    expect(toPublicAgencySite([], () => "")).toBeNull();
  });

  it("asks for the public site by slug", async () => {
    const { client, allCalls } = createFakeSupabaseClient({ "rpc:public_agency_site": [{ data: null, error: null }] });
    await expect(agencySiteService.getPublic(client, "alpha")).resolves.toBeNull();
    const [call] = findCallsByMethod(allCalls, "rpc:public_agency_site", "rpc");
    expect(call?.args).toEqual(["public_agency_site", { site_slug: "alpha" }]);
  });

  it("gives an agency with no site yet the defaults", async () => {
    const { client } = createFakeSupabaseClient({ tenants: [{ data: { slug: "alpha", site: null }, error: null }] });
    await expect(agencySiteService.getEditor(client, "t1")).resolves.toEqual({ slug: "alpha", site: DEFAULT_AGENCY_SITE, heroUrl: null });
  });

  it("surfaces a save error", async () => {
    const { client } = createFakeSupabaseClient({ agency_sites: [{ data: null, error: { code: "42501", message: "no" } }] });
    await expect(agencySiteService.save(client, "t1", DEFAULT_AGENCY_SITE)).rejects.toEqual({ code: "42501", message: "no" });
  });
});
