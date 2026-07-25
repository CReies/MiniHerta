import { defineConfig } from "astro/config";

export default defineConfig({
  base: process.env.ASTRO_BASE || "/",
  output: "static",
  site: process.env.ASTRO_SITE,
});
