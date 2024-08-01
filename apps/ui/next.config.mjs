/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  publicRuntimeConfig: {
    NEXT_PUBLIC_CHIEF_VERSION: process.env.NEXT_PUBLIC_CHIEF_VERSION,
  },
};

export default nextConfig;
