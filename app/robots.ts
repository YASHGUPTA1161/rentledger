import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Block dashboard — private pages, no SEO value
        disallow: ["/dashboard/", "/api/"],
      },
    ],
    sitemap: "https://www.rentledger.online/sitemap.xml",
  };
}
