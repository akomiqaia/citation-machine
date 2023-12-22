import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

// https://vitejs.dev/config
export default defineConfig({
  resolve: {
    // Some libs that can run in both Web and Node.js, such as `axios`, we need to tell Vite to build them in Node.js.
    browserField: false,
    mainFields: ["module", "jsnext:main", "jsnext"],
  },
  plugins: [svelte()],
  build: {
    rollupOptions: {
      external: ["onnxruntime-node", "sharp", "pdf2json", "onnxruntime-web"],
    },
  },
});
