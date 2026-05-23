/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: process.env.BASE_PATH || '',
  trailingSlash: true,
  images: { unoptimized: true },
};
export default nextConfig;
