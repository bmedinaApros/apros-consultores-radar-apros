import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Radar APROS",
  description: "Detección semanal de oportunidades comerciales — uso interno de APROS Consultores Digitales",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-PE">
      <body>
        <a className="skip-link" href="#contenido">Saltar al contenido</a>
        {children}
      </body>
    </html>
  );
}
