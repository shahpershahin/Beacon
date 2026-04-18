/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['lh3.googleusercontent.com'],
  },
  // We handle API routing via utils/api.js instead of rewrites for better production control
};

export default nextConfig;
