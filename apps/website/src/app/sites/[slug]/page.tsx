import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { agencySiteService, type PublicAgencySite } from "@travio/api";
import { createServerSupabaseClient } from "@travio/database/server";
import { AgencySitePage } from "@/features/agency-site/components/agency-site-page";

// Always read fresh, so unpublishing or deactivating takes effect at once.
export const dynamic = "force-dynamic";

async function load(params: Promise<{ slug: string }>): Promise<PublicAgencySite | null> {
  const { slug } = await params;
  let decoded: string;
  try {
    decoded = decodeURIComponent(slug);
  } catch {
    return null;
  }
  return agencySiteService.getPublic(await createServerSupabaseClient(), decoded);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const site = await load(params);
  if (!site) return {};
  const description = site.subheadline ?? site.tagline ?? undefined;
  return { title: site.name, description, openGraph: { title: site.name, description, type: "website" } };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const site = await load(params);
  if (!site) notFound();
  return <AgencySitePage site={site} />;
}
