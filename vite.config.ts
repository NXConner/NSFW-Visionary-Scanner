import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import * as path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isCapacitorBuild =
    process.env.CAPACITOR_BUILD === "1" ||
    process.env.CAPACITOR_BUILD === "true" ||
    process.env.VITE_PLATFORM === "capacitor" ||
    process.env.VITE_CAPACITOR === "1" ||
    process.env.VITE_CAPACITOR === "true";

  return {
    base: isCapacitorBuild ? "./" : "/",
    appType: "spa",
  server: {
    // Remote preview hardening:
    // - Bind to IPv4 (0.0.0.0) to avoid IPv6-only exposure flakiness in proxies.
    // - Allow non-local Host headers used by preview URLs.
    host: "0.0.0.0",
    port: Number(process.env.PORT) || 8080,
    strictPort: true,
    allowedHosts: true,
    cors: true,
    headers: {
      // Prevent intermediary/proxy caches from serving stale HTML/JS in remote previews.
      // (SW caching is handled separately; this helps even when SW is not involved.)
      "Cache-Control": "no-store",
    },
    // HMR: let Vite auto-detect the host from the browser URL
    // Do NOT hardcode host/clientPort - causes WebSocket failures when preview URL changes
    hmr: true,
  },
  preview: {
    host: "0.0.0.0",
    port: Number(process.env.PORT) || 4173,
    strictPort: true,
    allowedHosts: true,
    cors: true,
    headers: {
      "Cache-Control": "no-store",
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      // Never allow a service worker to take over remote IDE previews.
      // A registered SW can persist across sessions on the same preview origin and
      // later serve stale assets (classic "stuck on loading" symptom).
      devOptions: {
        enabled: false,
      },
      // We register the service worker ourselves so we can disable it on preview hosts.
      injectRegister: false,
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico"],
      manifest: {
        name: "MorphoScan - Health Monitor",
        short_name: "MorphoScan",
        description:
          "Medical-grade morphology scanner for health self-assessment. Track measurements, monitor progression, export reports. Works offline.",
        theme_color: "#0d9488",
        background_color: "#0a0a0a",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2,ttf,eot,webp}"],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/_/, /\/[^/?]+\.[^/]+$/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "gstatic-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "images-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
          {
            urlPattern: /\.(?:js|css)$/,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "static-resources",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
            },
          },
        ],
      },
      strategies: "generateSW",
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Production optimizations
    // WebKit/Safari stability: avoid 'esnext' in production builds.
    target: "es2019",
    minify: "esbuild",
    cssMinify: true,
    sourcemap: mode === "development",
    // Performance optimizations
    cssCodeSplit: true,
    emptyOutDir: true,
    reportCompressedSize: false,
    rollupOptions: {
      output: {
        // Manual chunks split heavy dependencies to reduce main bundle size.
        // Isolated by dependency tree to avoid cyclic cross-chunk imports.
        manualChunks: (id) => {
          if (id.includes("node_modules")) {
            const isThree =
              id.includes("/node_modules/three/") ||
              id.includes("\\node_modules\\three\\") ||
              id.includes("@react-three");
            if (isThree) return "vendor-3d";
            if (id.includes("@tensorflow") || id.includes("nsfwjs")) return "vendor-ml";
            if (id.includes("recharts") || id.includes("d3-")) return "vendor-charts";
            if (id.includes("framer-motion")) return "vendor-motion";
            if (id.includes("jspdf")) return "vendor-docs";
            if (id.includes("@radix-ui")) return "vendor-ui";
            if (id.includes("@stripe")) return "vendor-stripe";
            if (id.includes("@supabase")) return "vendor-supabase";
            return "vendor";
          }
        },
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: assetInfo => {
          const info = assetInfo.name?.split(".") || [];
          const extType = info[info.length - 1];
          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico|webp)$/i.test(assetInfo.name || "")) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name || "")) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
      },
    },
    // Bundle size warnings
    // Reduced from 1500 to 500 to catch large chunks early and encourage better code splitting
    chunkSizeWarningLimit: 500,
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@tanstack/react-query",
      "lucide-react",
      "date-fns",
    ],
    exclude: ["@vite/client", "@vite/env"],
  },
  // Environment variables
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    },
  };
});
