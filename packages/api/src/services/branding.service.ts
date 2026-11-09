import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@travio/database";

const BUCKET = "branding";

export interface TenantBranding {
  logoPath: string | null;
  /** Public URL of the logo, when there is one. */
  logoUrl: string | null;
  tagline: string | null;
  primaryColor: string | null;
  sidebarColor: string | null;
  agencyName: string | null;
}

export interface SaveBrandingInput {
  tagline: string | null;
  primaryColor: string | null;
  sidebarColor: string | null;
}

export const EMPTY_BRANDING: TenantBranding = {
  logoPath: null,
  logoUrl: null,
  tagline: null,
  primaryColor: null,
  sidebarColor: null,
  agencyName: null,
};

// An agency's branding (20261109160000), read and written under the
// caller's RLS: every member reads, only the owner writes.
export const brandingService = {
  async get(supabase: SupabaseClient<Database>, tenantId: string): Promise<TenantBranding> {
    const { data, error } = await supabase
      .from("tenant_branding")
      .select("*, tenant:tenants(name)")
      .eq("tenant_id", tenantId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return EMPTY_BRANDING;

    return {
      logoPath: data.logo_path,
      logoUrl: data.logo_path ? supabase.storage.from(BUCKET).getPublicUrl(data.logo_path).data.publicUrl : null,
      tagline: data.tagline,
      primaryColor: data.primary_color,
      sidebarColor: data.sidebar_color,
      agencyName: data.tenant?.name ?? null,
    };
  },

  async save(supabase: SupabaseClient<Database>, tenantId: string, input: SaveBrandingInput): Promise<void> {
    const { error } = await supabase.from("tenant_branding").upsert({
      tenant_id: tenantId,
      tagline: input.tagline,
      primary_color: input.primaryColor,
      sidebar_color: input.sidebarColor,
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
  },

  // Uploads the new logo first and only then points the agency at it, so
  // a failure leaves the current logo in place.
  async setLogo(
    supabase: SupabaseClient<Database>,
    tenantId: string,
    bytes: Uint8Array,
    image: { contentType: string; extension: string },
  ): Promise<void> {
    const current = await brandingService.get(supabase, tenantId);
    const path = `${tenantId}/logo-${crypto.randomUUID()}.${image.extension}`;

    const upload = await supabase.storage.from(BUCKET).upload(path, bytes, {
      contentType: image.contentType,
      cacheControl: "31536000",
    });
    if (upload.error) throw upload.error;

    const { error } = await supabase
      .from("tenant_branding")
      .upsert({ tenant_id: tenantId, logo_path: path, updated_at: new Date().toISOString() });
    if (error) {
      await supabase.storage.from(BUCKET).remove([path]);
      throw error;
    }

    if (current.logoPath) await supabase.storage.from(BUCKET).remove([current.logoPath]);
  },

  async removeLogo(supabase: SupabaseClient<Database>, tenantId: string): Promise<void> {
    const current = await brandingService.get(supabase, tenantId);
    if (!current.logoPath) return;

    const { error } = await supabase
      .from("tenant_branding")
      .update({ logo_path: null, updated_at: new Date().toISOString() })
      .eq("tenant_id", tenantId);
    if (error) throw error;

    await supabase.storage.from(BUCKET).remove([current.logoPath]);
  },
};
