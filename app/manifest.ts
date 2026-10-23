import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return { name: "Tamanna Portal", short_name: "Tamanna", start_url: "/admin", display: "standalone", background_color: "#cadd69", theme_color: "#6eaf4d",
    icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }, { src: "/icon-512.png", sizes: "512x512", type: "image/png" }] };
}
