// next.config.ts
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Tell the plugin exactly where your request.ts file is located!
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Any other Next.js config options go here
};

export default withNextIntl(nextConfig);