import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";

const PAGES = ["", "/features", "/solutions", "/pricing", "/about", "/contact", "/signup"];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  return PAGES.map((path) => ({ url: `${base}${path}` }));
}
