import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "UCme — UC Lost & Found",
    short_name: "UCme",
    description: "University of Cebu lost-and-found portal",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#F5F7FB",
    theme_color: "#21437D",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
