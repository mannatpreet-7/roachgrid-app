import { build } from "vite";
process.env.VITE_STATIC_PREVIEW = "true";
await build({
  base: "./",
  build: { outDir: "ready-to-run", emptyOutDir: true },
});
console.log(
  "\nLive Server: open ready-to-run/index.html with Live Server. Uses hash routes so refresh works without server rewrites.",
);
