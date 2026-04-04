import { defineConfig } from "vite";
import fs from "fs";
import path from "path";

export default defineConfig({
  base: "/",
  build: {
    outDir: "docs",
    emptyOutDir: true,
  },
  plugins: [
    {
      name: "copy-cname",
      closeBundle() {
        fs.copyFileSync(
          path.resolve(__dirname, "CNAME"),
          path.resolve(__dirname, "docs/CNAME")
        );
      },
    },
  ],
});
