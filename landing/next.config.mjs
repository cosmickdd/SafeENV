/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Three.js WebGPU / TSL APIs are experimental and not fully typed yet
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei'],
};

export default nextConfig;
