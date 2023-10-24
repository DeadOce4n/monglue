import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  splitting: false,
  sourcemap: true,
  clean: true,
  dts: true,
  cjsInterop: true,
  format: ["cjs", "esm"],
  skipNodeModulesBundle: true,
  target: "esnext",
  outDir: "lib",
});
