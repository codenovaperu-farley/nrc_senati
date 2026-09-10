import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // NOTA: "output: standalone" fue eliminado. Ese modo es para Docker/VPS
  // y en Vercel rompe la entrega de archivos estáticos (pantalla en blanco / 404).
  // Vercel detecta Next.js automáticamente y no necesita configuración especial.
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
