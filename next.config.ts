import type { NextConfig } from "next";

const config: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["pdfkit", "pptxgenjs"],
  // pdfkit lee sus métricas de fuentes (.afm) del disco; hay que incluirlas en la salida standalone
  // Nada de datos ni de código de desarrollo en la salida de producción (la carpeta data/ puede tener el padrón, de más de 1 GB).
  outputFileTracingExcludes: { "*": ["./data/**", "./docs/**", "./tests/**"] },
  outputFileTracingIncludes: { "/api/diagnostics/[id]/export": ["./assets/**/*", "./node_modules/pdfkit/js/data/**/*"] },
  poweredByHeader: false,
  // El indicador flotante de desarrollo tapaba el botón de colapsar del menú; los errores siguen mostrándose.
  devIndicators: false,
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
        ],
      },
    ];
  },
};

export default config;
