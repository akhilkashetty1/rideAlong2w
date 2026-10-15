import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
  ...nextVitals,
  {
    // The form screens (src/components) predate this setup and are kept exactly as they were:
    // plain <img>, and state set inside effects. Changing either would change how the form behaves.
    rules: {
      "@next/next/no-img-element": "off",
      "react-hooks/set-state-in-effect": "off",
      // Applies to the old pages/ router; in app/layout.js a font <link> loads on every page.
      "@next/next/no-page-custom-font": "off",
    },
  },
  globalIgnores([".next/**", "out/**", "build/**"]),
]);
