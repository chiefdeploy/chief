/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  env: {
    CHIEF_VERSION: process.env.CHIEF_VERSION,
  },
};

export default nextConfig;
