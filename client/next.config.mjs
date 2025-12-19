/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    const backendBaseUrl = process.env.NEXT_PUBLIC_API_URL 
      ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, '')
      : 'http://localhost:3001';
    
    return [
      {
        source: '/api/:path*',
        destination: `${backendBaseUrl}/api/:path*`,
      },
    ];
  },
}

export default nextConfig
