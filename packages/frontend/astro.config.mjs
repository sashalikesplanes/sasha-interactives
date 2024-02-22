import { defineConfig } from 'astro/config';
import aws from "astro-sst";

// https://astro.build/config
export default defineConfig({
  output: "hybrid",
  adapter: aws(),
});
