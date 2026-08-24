import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kentara - Marketplace Benih Pertanian Unggul",
    short_name: "Kentara",
    description:
      "Platform jual beli benih pertanian unggul dan berkualitas tinggi untuk petani dan penghobi tanaman di seluruh Indonesia.",
    start_url: "/",
    display: "standalone",
    background_color: "#064e3b",
    theme_color: "#059669",
    orientation: "portrait",
    lang: "id",
    dir: "ltr",
    categories: ["shopping", "business", "lifestyle"],
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/icon-maskable-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-maskable-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
