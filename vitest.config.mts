import { defineConfig, configDefaults } from "vitest/config";

export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, "lib"],
    typecheck: {
      exclude: [...(configDefaults.typecheck.exclude ?? []), "lib"],
    },
  },
});
