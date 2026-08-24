import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Invera Digital Agency",
    short_name: "Invera",
    description:
      "Design, engineering & growth — Invera Digital Agency builds SaaS products, websites, and internal tools for ambitious teams.",
    start_url: "/",
    display: "standalone",
    background_color: "#0D0D14",
    theme_color: "#7C3AED",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
