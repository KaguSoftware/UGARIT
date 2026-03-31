// next.config.ts
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
	images: {
		remotePatterns: [
			{
				protocol: "http",
				hostname: "127.0.0.1",
				port: "1337",
				pathname: "/**",
			},
			{
				protocol: "http",
				hostname: "localhost",
				port: "1337",
				pathname: "/**",
			},
		],
	},
	experimental: {
		turbopackFileSystemCacheForDev:
			process.env.DISABLE_TURBO_CACHE !== "true",
	},
};

export default withNextIntl(nextConfig);
