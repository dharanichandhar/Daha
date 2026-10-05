import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import path from "node:path";

function ignoreExtensionSourceMaps() {
  return {
    name: "ignore-extension-source-maps",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathname = req.url ? new URL(req.url, "http://localhost").pathname : "";
        if (
          pathname === "/sourceMap/assets/css/quillbot-fonts.css.map" ||
          pathname === "/sourceMap/assets/css/gdocs-overrides.css.map"
        ) {
          res.statusCode = 204;
          res.end();
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [ignoreExtensionSourceMaps(), tailwindcss(), reactRouter()],
  resolve: {
    alias: {
      "~": path.resolve(import.meta.dirname, "app"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
});