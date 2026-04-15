/** @type {import('next').NextConfig} */
const path = require("path");

const nextConfig = {
  reactStrictMode: false,
  transpilePackages: ["three", "@react-three/fiber", "@react-three/drei"],
  webpack(config) {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@/lib": path.resolve(__dirname, "./lib"),
      "@/components": path.resolve(__dirname, "./components"),
    };
    return config;
  },
};

module.exports = nextConfig;
