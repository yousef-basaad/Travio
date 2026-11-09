import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@travio/database";

export const AGENCY_SERVICES = ["flights", "hotels", "visas", "packages", "transfers", "insurance"] as const;
export type AgencyService = (typeof AGENCY_SERVICES)[number];
export type SiteLanguage = "ar" | "en";
export const SITE_TEMPLATES = ["classic", "split", "minimal"] as const;
export type SiteTemplate = (typeof SITE_TEMPLATES)[number];

const BUCKET = "branding";

function toTemplate(value: unknown): SiteTemplate {
  return (SITE_TEMPLATES as readonly unknown[]).includes(value) ? (value as SiteTemplate) : "classic";
}

export interface AgencySiteContent {
  isPublished: boolean;
  language: SiteLanguage;
  template: SiteTemplate;
  headline: string | null;
  subheadline: string | null;
  about: string | null;
  city: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  services: AgencyService[];
  showServices: boolean;
  showAbout: boolean;
  showContact: boolean;
}

export interface AgencySiteEditor {
  /** The agency's public address segment. */
  slug: string;
  site: AgencySiteContent;
  heroUrl: string | null;
}

export interface PublicAgencySite {
  name: string;
  slug: string;
  logoUrl: string | null;
  heroUrl: string | null;
  template: SiteTemplate;
  tagline: string | null;
  primaryColor: string | null;
  language: SiteLanguage;
  headline: string;
  subheadline: string | null;
  services: AgencyService[];
  about: string | null;
  city: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
}

export const DEFAULT_AGENCY_SITE: AgencySiteContent = {
  isPublished: false,
  language: "ar",
  template: "classic",
  headline: null,
  subheadline: null,
  about: null,
  city: null,
  phone: null,
  whatsapp: null,
  email: null,
  services: [],
  showServices: true,
  showAbout: true,
  showContact: true,
};

function toServices(value: unknown): AgencyService[] {
  return Array.isArray(value) ? value.filter((item): item is AgencyService => (AGENCY_SERVICES as readonly unknown[]).includes(item)) : [];
}

function toText(value: unknown): string | null {
  return typeof value === "string" && value !== "" ? value : null;
}

// Maps public_agency_site's jsonb (20261109170000); null for anything
// that isn't a site with a headline.
export function toPublicAgencySite(data: unknown, publicUrl: (path: string) => string): PublicAgencySite | null {
  if (typeof data !== "object" || data === null || Array.isArray(data)) return null;
  const raw = data as Record<string, unknown>;
  const headline = toText(raw.headline);
  const name = toText(raw.name);
  if (!headline || !name) return null;
  const logoPath = toText(raw.logo_path);
  const heroPath = toText(raw.hero_path);
  return {
    name,
    slug: toText(raw.slug) ?? "",
    logoUrl: logoPath ? publicUrl(logoPath) : null,
    heroUrl: heroPath ? publicUrl(heroPath) : null,
    template: toTemplate(raw.template),
    tagline: toText(raw.tagline),
    primaryColor: toText(raw.primary_color),
    language: raw.language === "en" ? "en" : "ar",
    headline,
    subheadline: toText(raw.subheadline),
    services: toServices(raw.services),
    about: toText(raw.about),
    city: toText(raw.city),
    phone: toText(raw.phone),
    whatsapp: toText(raw.whatsapp),
    email: toText(raw.email),
  };
}

export const agencySiteService = {
  // The owner's editor. Runs under RLS; a site not saved yet reads as the defaults.
  async getEditor(supabase: SupabaseClient<Database>, tenantId: string): Promise<AgencySiteEditor | null> {
    const { data, error } = await supabase
      .from("tenants")
      .select("slug, site:agency_sites(*)")
      .eq("id", tenantId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;

    const row = data.site;
    return {
      slug: data.slug,
      heroUrl: row?.hero_path ? supabase.storage.from(BUCKET).getPublicUrl(row.hero_path).data.publicUrl : null,
      site: row
        ? {
            isPublished: row.is_published,
            language: row.language === "en" ? "en" : "ar",
            template: toTemplate(row.template),
            headline: row.headline,
            subheadline: row.subheadline,
            about: row.about,
            city: row.city,
            phone: row.phone,
            whatsapp: row.whatsapp,
            email: row.email,
            services: toServices(row.services),
            showServices: row.show_services,
            showAbout: row.show_about,
            showContact: row.show_contact,
          }
        : DEFAULT_AGENCY_SITE,
    };
  },

  async save(supabase: SupabaseClient<Database>, tenantId: string, site: AgencySiteContent): Promise<void> {
    const { error } = await supabase.from("agency_sites").upsert({
      tenant_id: tenantId,
      is_published: site.isPublished,
      language: site.language,
      template: site.template,
      headline: site.headline,
      subheadline: site.subheadline,
      about: site.about,
      city: site.city,
      phone: site.phone,
      whatsapp: site.whatsapp,
      email: site.email,
      services: site.services,
      show_services: site.showServices,
      show_about: site.showAbout,
      show_contact: site.showContact,
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
  },

  async currentHeroPath(supabase: SupabaseClient<Database>, tenantId: string): Promise<string | null> {
    const { data, error } = await supabase.from("agency_sites").select("hero_path").eq("tenant_id", tenantId).maybeSingle();
    if (error) throw error;
    return data?.hero_path ?? null;
  },

  // Uploads first and only then points the site at it, so a failure
  // leaves the current cover in place.
  async setHero(
    supabase: SupabaseClient<Database>,
    tenantId: string,
    bytes: Uint8Array,
    image: { contentType: string; extension: string },
  ): Promise<void> {
    const previous = await agencySiteService.currentHeroPath(supabase, tenantId);
    const path = `${tenantId}/hero-${crypto.randomUUID()}.${image.extension}`;

    const upload = await supabase.storage.from(BUCKET).upload(path, bytes, {
      contentType: image.contentType,
      cacheControl: "31536000",
    });
    if (upload.error) throw upload.error;

    const { error } = await supabase
      .from("agency_sites")
      .upsert({ tenant_id: tenantId, hero_path: path, updated_at: new Date().toISOString() });
    if (error) {
      await supabase.storage.from(BUCKET).remove([path]);
      throw error;
    }

    if (previous) await supabase.storage.from(BUCKET).remove([previous]);
  },

  async removeHero(supabase: SupabaseClient<Database>, tenantId: string): Promise<void> {
    const previous = await agencySiteService.currentHeroPath(supabase, tenantId);
    if (!previous) return;

    const { error } = await supabase
      .from("agency_sites")
      .update({ hero_path: null, updated_at: new Date().toISOString() })
      .eq("tenant_id", tenantId);
    if (error) throw error;

    await supabase.storage.from(BUCKET).remove([previous]);
  },

  // For the public page: null unless the site is published and the agency active.
  async getPublic(supabase: SupabaseClient<Database>, slug: string): Promise<PublicAgencySite | null> {
    const { data, error } = await supabase.rpc("public_agency_site", { site_slug: slug });
    if (error) throw error;
    return toPublicAgencySite(data, (path) => supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl);
  },
};
