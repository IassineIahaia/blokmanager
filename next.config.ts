import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // O grupo (admin) não aparece no URL; /admin leva ao painel.
      { source: '/admin', destination: '/dashboard', permanent: false },
    ]
  },
};

export default nextConfig;
